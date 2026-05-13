"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";

/* ── Types ──────────────────────────────────────── */
type AdminTab = "orders" | "product" | "settings";

interface Order {
  id: number;
  customerEmail: string;
  customerName: string;
  tierName: string;
  tierPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentId: string | null;
  cryptoCurrency: string | null;
  cryptoTxHash: string | null;
  notes: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

interface PricingTier {
  id?: number;
  name: string;
  price: number;
  period: string;
  features: string | string[];
  sortOrder: number;
  active: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  features: string | string[];
  tiers: PricingTier[];
}

interface SiteSettingsData {
  id: number;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  telegramUrl: string;
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  multisafepayEnabled: boolean;
  multisafepayApiKey: string;
  cryptoEnabled: boolean;
  btcAddress: string;
  usdtAddress: string;
  usdcAddress: string;
  ethAddress: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  confirmEmailSubject: string;
  confirmEmailBody: string;
  vatRate: number;
}

/* ── Status badge component ─────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:
      "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    paid: "bg-green-500/10 text-green-400 border-green-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    refunded:
      "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3 w-3" />,
    paid: <CheckCircle className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    refunded: <RefreshCw className="h-3 w-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        styles[status] || styles.pending
      }`}
    >
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ── Main Dashboard Component ───────────────────── */
export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [adminNickname, setAdminNickname] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [loading, setLoading] = useState(true);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(1);
  const [orderFilter, setOrderFilter] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Product state
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productSaving, setProductSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Global
  const [message, setMessage] = useState({ type: "", text: "" });

  /* ── Auth check ─────────────────────────────────── */
  useEffect(() => {
    const storedToken = localStorage.getItem("dashcore_admin_token");
    const storedNickname = localStorage.getItem("dashcore_admin_nickname");
    if (!storedToken) {
      router.push("/admin");
      return;
    }
    setToken(storedToken);
    setAdminNickname(storedNickname || "Admin");
    setLoading(false);
  }, [router]);

  /* ── API helper ─────────────────────────────────── */
  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        localStorage.removeItem("dashcore_admin_token");
        localStorage.removeItem("dashcore_admin_nickname");
        router.push("/admin");
        throw new Error("Session expired");
      }
      return res;
    },
    [token, router]
  );

  /* ── Flash message ──────────────────────────────── */
  const flash = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  /* ── Load Orders ────────────────────────────────── */
  const loadOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(ordersPage),
        limit: "20",
      });
      if (orderFilter) params.set("status", orderFilter);
      const res = await apiFetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setOrdersTotal(data.total || 0);
      setOrdersPages(data.pages || 1);
    } catch {
      flash("error", "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, [token, ordersPage, orderFilter, apiFetch]);

  useEffect(() => {
    if (token && activeTab === "orders") loadOrders();
  }, [token, activeTab, loadOrders]);

  /* ── Load Product ───────────────────────────────── */
  const loadProduct = useCallback(async () => {
    if (!token) return;
    setProductLoading(true);
    try {
      const res = await apiFetch("/api/admin/product");
      const data = await res.json();
      // Parse features if they're JSON strings
      if (typeof data.features === "string") {
        try {
          data.features = JSON.parse(data.features);
        } catch {
          data.features = [];
        }
      }
      if (data.tiers) {
        data.tiers = data.tiers.map((t: PricingTier) => ({
          ...t,
          features:
            typeof t.features === "string"
              ? (() => {
                  try {
                    return JSON.parse(t.features as string);
                  } catch {
                    return [];
                  }
                })()
              : t.features,
        }));
      }
      setProduct(data);
    } catch {
      flash("error", "Failed to load product");
    } finally {
      setProductLoading(false);
    }
  }, [token, apiFetch]);

  useEffect(() => {
    if (token && activeTab === "product") loadProduct();
  }, [token, activeTab, loadProduct]);

  /* ── Load Settings ──────────────────────────────── */
  const loadSettings = useCallback(async () => {
    if (!token) return;
    setSettingsLoading(true);
    try {
      const res = await apiFetch("/api/admin/settings");
      const data = await res.json();
      setSettings(data);
    } catch {
      flash("error", "Failed to load settings");
    } finally {
      setSettingsLoading(false);
    }
  }, [token, apiFetch]);

  useEffect(() => {
    if (token && activeTab === "settings") loadSettings();
  }, [token, activeTab, loadSettings]);

  /* ── Order Actions ──────────────────────────────── */
  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await apiFetch("/api/admin/orders", {
        method: "PATCH",
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        flash("success", `Order #${orderId} marked as ${status}`);
        loadOrders();
      } else {
        const data = await res.json();
        flash("error", data.error || "Failed to update order");
      }
    } catch {
      flash("error", "Failed to update order");
    }
  };

  /* ── Save Product ───────────────────────────────── */
  const saveProduct = async () => {
    if (!product) return;
    setProductSaving(true);
    try {
      const payload = {
        name: product.name,
        description: product.description,
        features: product.features,
        tiers: product.tiers.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          period: t.period,
          features: t.features,
          sortOrder: t.sortOrder,
          active: t.active,
        })),
      };
      const res = await apiFetch("/api/admin/product", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        flash("success", "Product updated successfully");
        loadProduct();
      } else {
        const data = await res.json();
        flash("error", data.error || "Failed to save product");
      }
    } catch {
      flash("error", "Failed to save product");
    } finally {
      setProductSaving(false);
    }
  };

  /* ── Save Settings ──────────────────────────────── */
  const saveSettings = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    try {
      const { id, ...payload } = settings;
      const res = await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        flash("success", "Settings saved successfully");
        loadSettings();
      } else {
        const data = await res.json();
        flash("error", data.error || "Failed to save settings");
      }
    } catch {
      flash("error", "Failed to save settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  /* ── Logout ─────────────────────────────────────── */
  const handleLogout = () => {
    localStorage.removeItem("dashcore_admin_token");
    localStorage.removeItem("dashcore_admin_nickname");
    router.push("/admin");
  };

  /* ── Tier helpers ───────────────────────────────── */
  const updateTier = (index: number, field: string, value: unknown) => {
    if (!product) return;
    const tiers = [...product.tiers];
    (tiers[index] as unknown as Record<string, unknown>)[field] = value;
    setProduct({ ...product, tiers });
  };

  const addTier = () => {
    if (!product) return;
    setProduct({
      ...product,
      tiers: [
        ...product.tiers,
        {
          name: "New Tier",
          price: 0,
          period: "monthly",
          features: [],
          sortOrder: product.tiers.length + 1,
          active: true,
        },
      ],
    });
  };

  const removeTier = (index: number) => {
    if (!product) return;
    const tiers = product.tiers.filter((_, i) => i !== index);
    setProduct({ ...product, tiers });
  };

  /* ── Loading state ──────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#9b8cc4]" />
      </div>
    );
  }

  /* ── Stats from orders ──────────────────────────── */
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.tierPrice, 0);
  const pendingCount = orders.filter(
    (o) => o.paymentStatus === "pending"
  ).length;

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: "orders", label: "Orders", icon: <ShoppingCart className="h-4 w-4" /> },
    { key: "product", label: "Product", icon: <Package className="h-4 w-4" /> },
    { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="bg-grid min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Logged in as {adminNickname}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-xl border border-[rgba(124,104,166,0.15)] hover:border-[rgba(124,104,166,0.3)]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Flash message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(124,104,166,0.12)]">
              <ShoppingCart className="h-5 w-5 text-[#9b8cc4]" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Total Orders
              </p>
              <p className="text-xl font-bold text-white">{ordersTotal}</p>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(124,104,166,0.12)]">
              <DollarSign className="h-5 w-5 text-[#9b8cc4]" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Revenue (Paid)
              </p>
              <p className="text-xl font-bold text-white">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(124,104,166,0.12)]">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Pending
              </p>
              <p className="text-xl font-bold text-white">{pendingCount}</p>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-8 border-b border-[rgba(124,104,166,0.1)] pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
                activeTab === tab.key
                  ? "border-[#7c68a6] text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* ORDERS TAB                                 */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <div>
            {/* Filter + Refresh */}
            <div className="flex items-center gap-3 mb-6">
              <select
                value={orderFilter}
                onChange={(e) => {
                  setOrderFilter(e.target.value);
                  setOrdersPage(1);
                }}
                className="rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-2.5 text-sm text-white focus:border-[#7c68a6] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <button
                onClick={loadOrders}
                disabled={ordersLoading}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl border border-[rgba(124,104,166,0.15)] hover:border-[rgba(124,104,166,0.3)] transition-all"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    ordersLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>

            {/* Orders table */}
            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#9b8cc4]" />
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <ShoppingCart className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500">No orders found</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(124,104,166,0.1)]">
                        <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-4">
                          ID
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-4">
                          Customer
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-4">
                          Plan
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-4">
                          Price
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-4">
                          Method
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-4">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-4">
                          Date
                        </th>
                        <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-4">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-[rgba(124,104,166,0.05)] hover:bg-[rgba(124,104,166,0.04)] transition-colors"
                        >
                          <td className="px-5 py-4 text-sm font-mono text-zinc-300">
                            #{order.id}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-white">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {order.customerEmail}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-zinc-300">
                            {order.tierName}
                          </td>
                          <td className="px-5 py-4 text-sm text-white font-medium">
                            ${order.tierPrice}
                          </td>
                          <td className="px-5 py-4 text-sm text-zinc-400">
                            <span className="capitalize">
                              {order.paymentMethod}
                            </span>
                            {order.cryptoCurrency && (
                              <span className="text-xs text-zinc-500 ml-1">
                                ({order.cryptoCurrency.toUpperCase()})
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={order.paymentStatus} />
                          </td>
                          <td className="px-5 py-4 text-xs text-zinc-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {order.paymentStatus === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "paid")
                                    }
                                    className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all"
                                    title="Confirm payment"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "failed")
                                    }
                                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                    title="Mark as failed"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {order.paymentStatus === "paid" && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "refunded")
                                  }
                                  className="text-xs px-3 py-1.5 rounded-lg bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 hover:bg-zinc-500/20 transition-all"
                                  title="Mark as refunded"
                                >
                                  Refund
                                </button>
                              )}
                              {order.paymentStatus === "failed" && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "pending")
                                  }
                                  className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all"
                                  title="Reset to pending"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {ordersPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-[rgba(124,104,166,0.1)]">
                    <p className="text-xs text-zinc-500">
                      Page {ordersPage} of {ordersPages} ({ordersTotal} total)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setOrdersPage(Math.max(1, ordersPage - 1))
                        }
                        disabled={ordersPage <= 1}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(124,104,166,0.15)] text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setOrdersPage(
                            Math.min(ordersPages, ordersPage + 1)
                          )
                        }
                        disabled={ordersPage >= ordersPages}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(124,104,166,0.15)] text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* PRODUCT TAB                                */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === "product" && (
          <div>
            {productLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#9b8cc4]" />
              </div>
            ) : !product ? (
              <div className="glass-card p-10 text-center">
                <Package className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500">Product not found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Product Info */}
                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold text-white mb-5">
                    Product Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) =>
                          setProduct({ ...product, name: e.target.value })
                        }
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={product.description}
                        onChange={(e) =>
                          setProduct({
                            ...product,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Tiers */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-white">
                      Pricing Tiers
                    </h3>
                    <button
                      onClick={addTier}
                      className="flex items-center gap-2 text-xs text-[#9b8cc4] hover:text-white px-3 py-2 rounded-lg border border-[rgba(124,104,166,0.2)] hover:border-[rgba(124,104,166,0.4)] transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Tier
                    </button>
                  </div>

                  <div className="space-y-5">
                    {product.tiers.map((tier, index) => (
                      <div
                        key={tier.id || `new-${index}`}
                        className="p-5 rounded-xl bg-[rgba(124,104,166,0.04)] border border-[rgba(124,104,166,0.1)]"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-white">
                            {tier.name || "Unnamed Tier"}
                            {!tier.id && (
                              <span className="ml-2 text-xs text-[#9b8cc4]">
                                (New)
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tier.active}
                                onChange={(e) =>
                                  updateTier(
                                    index,
                                    "active",
                                    e.target.checked
                                  )
                                }
                                className="rounded border-[rgba(124,104,166,0.3)] bg-[rgba(124,104,166,0.06)] text-[#7c68a6] focus:ring-[#7c68a6]"
                              />
                              Active
                            </label>
                            <button
                              onClick={() => removeTier(index)}
                              className="text-zinc-500 hover:text-red-400 transition-colors"
                              title="Remove tier"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">
                              Name
                            </label>
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) =>
                                updateTier(index, "name", e.target.value)
                              }
                              className="w-full rounded-lg bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-3 py-2 text-sm text-white focus:border-[#7c68a6] focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">
                              Price ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={tier.price}
                              onChange={(e) =>
                                updateTier(
                                  index,
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full rounded-lg bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-3 py-2 text-sm text-white focus:border-[#7c68a6] focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">
                              Billing Period
                            </label>
                            <select
                              value={tier.period}
                              onChange={(e) =>
                                updateTier(index, "period", e.target.value)
                              }
                              className="w-full rounded-lg bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-3 py-2 text-sm text-white focus:border-[#7c68a6] focus:outline-none appearance-none cursor-pointer transition-all"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                              <option value="lifetime">Lifetime</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">
                            Features (one per line)
                          </label>
                          <textarea
                            value={
                              Array.isArray(tier.features)
                                ? (tier.features as string[]).join("\n")
                                : ""
                            }
                            onChange={(e) =>
                              updateTier(
                                index,
                                "features",
                                e.target.value
                                  .split("\n")
                                  .filter((f) => f.trim())
                              )
                            }
                            rows={4}
                            placeholder="Enter each feature on a new line"
                            className="w-full rounded-lg bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none transition-all resize-y"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end">
                  <button
                    onClick={saveProduct}
                    disabled={productSaving}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {productSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {productSaving ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SETTINGS TAB                               */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div>
            {settingsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#9b8cc4]" />
              </div>
            ) : !settings ? (
              <div className="glass-card p-10 text-center">
                <Settings className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500">Settings not found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* General Settings */}
                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold text-white mb-5">
                    General
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            siteName: e.target.value,
                          })
                        }
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contactEmail: e.target.value,
                          })
                        }
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Telegram URL
                      </label>
                      <input
                        type="url"
                        value={settings.telegramUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            telegramUrl: e.target.value,
                          })
                        }
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        VAT Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.vatRate}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            vatRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Site Description
                      </label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            siteDescription: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment: Stripe */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-white">
                      Stripe
                    </h3>
                    <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.stripeEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            stripeEnabled: e.target.checked,
                          })
                        }
                        className="rounded border-[rgba(124,104,166,0.3)] bg-[rgba(124,104,166,0.06)] text-[#7c68a6] focus:ring-[#7c68a6]"
                      />
                      Enabled
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Public Key
                      </label>
                      <input
                        type="text"
                        value={settings.stripePublicKey}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            stripePublicKey: e.target.value,
                          })
                        }
                        placeholder="pk_..."
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Secret Key
                      </label>
                      <input
                        type="password"
                        value={settings.stripeSecretKey}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            stripeSecretKey: e.target.value,
                          })
                        }
                        placeholder="sk_..."
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment: MultiSafepay */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-white">
                      MultiSafepay
                    </h3>
                    <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.multisafepayEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            multisafepayEnabled: e.target.checked,
                          })
                        }
                        className="rounded border-[rgba(124,104,166,0.3)] bg-[rgba(124,104,166,0.06)] text-[#7c68a6] focus:ring-[#7c68a6]"
                      />
                      Enabled
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={settings.multisafepayApiKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          multisafepayApiKey: e.target.value,
                        })
                      }
                      placeholder="Enter API key"
                      className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Payment: Crypto */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-white">
                      Cryptocurrency
                    </h3>
                    <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.cryptoEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            cryptoEnabled: e.target.checked,
                          })
                        }
                        className="rounded border-[rgba(124,104,166,0.3)] bg-[rgba(124,104,166,0.06)] text-[#7c68a6] focus:ring-[#7c68a6]"
                      />
                      Enabled
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        BTC Address
                      </label>
                      <input
                        type="text"
                        value={settings.btcAddress}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            btcAddress: e.target.value,
                          })
                        }
                        placeholder="bc1q..."
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        USDT Address (TRC-20)
                      </label>
                      <input
                        type="text"
                        value={settings.usdtAddress}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            usdtAddress: e.target.value,
                          })
                        }
                        placeholder="T..."
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        USDC Address (ERC-20)
                      </label>
                      <input
                        type="text"
                        value={settings.usdcAddress}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            usdcAddress: e.target.value,
                          })
                        }
                        placeholder="0x..."
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        ETH Address
                      </label>
                      <input
                        type="text"
                        value={settings.ethAddress}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            ethAddress: e.target.value,
                          })
                        }
                        placeholder="0x..."
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* SMTP Settings */}
                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold text-white mb-5">
                    Email / SMTP
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={settings.smtpHost}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtpHost: e.target.value,
                          })
                        }
                        placeholder="smtp.example.com"
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        value={settings.smtpPort}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtpPort: parseInt(e.target.value) || 587,
                          })
                        }
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        SMTP User
                      </label>
                      <input
                        type="text"
                        value={settings.smtpUser}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtpUser: e.target.value,
                          })
                        }
                        placeholder="user@example.com"
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        SMTP Password
                      </label>
                      <input
                        type="password"
                        value={settings.smtpPass}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtpPass: e.target.value,
                          })
                        }
                        placeholder="Enter password"
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        From Address
                      </label>
                      <input
                        type="email"
                        value={settings.smtpFrom}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtpFrom: e.target.value,
                          })
                        }
                        placeholder="noreply@dashcore.eu"
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Templates */}
                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold text-white mb-5">
                    Confirmation Email Template
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={settings.confirmEmailSubject}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            confirmEmailSubject: e.target.value,
                          })
                        }
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Body (HTML)
                      </label>
                      <textarea
                        value={settings.confirmEmailBody}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            confirmEmailBody: e.target.value,
                          })
                        }
                        rows={6}
                        placeholder="<p>Thank you for your order...</p>"
                        className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all resize-y font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={settingsSaving}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {settingsSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {settingsSaving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
