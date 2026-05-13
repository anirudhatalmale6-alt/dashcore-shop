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
} from "lucide-react";

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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-green-50 text-green-700 border-green-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    refunded: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3 w-3" />,
    paid: <CheckCircle className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    refunded: <RefreshCw className="h-3 w-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [adminNickname, setAdminNickname] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(1);
  const [orderFilter, setOrderFilter] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productSaving, setProductSaving] = useState(false);

  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const storedToken = localStorage.getItem("dashcore_admin_token");
    const storedNickname = localStorage.getItem("dashcore_admin_nickname");
    if (!storedToken) { router.push("/admin"); return; }
    setToken(storedToken);
    setAdminNickname(storedNickname || "Admin");
    setLoading(false);
  }, [router]);

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem("dashcore_admin_token");
      localStorage.removeItem("dashcore_admin_nickname");
      router.push("/admin");
      throw new Error("Session expired");
    }
    return res;
  }, [token, router]);

  const flash = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams({ page: String(ordersPage), limit: "20" });
      if (orderFilter) params.set("status", orderFilter);
      const res = await apiFetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setOrdersTotal(data.total || 0);
      setOrdersPages(data.pages || 1);
    } catch { flash("error", "Failed to load orders"); }
    finally { setOrdersLoading(false); }
  }, [token, ordersPage, orderFilter, apiFetch]);

  useEffect(() => { if (token && activeTab === "orders") loadOrders(); }, [token, activeTab, loadOrders]);

  const loadProduct = useCallback(async () => {
    if (!token) return;
    setProductLoading(true);
    try {
      const res = await apiFetch("/api/admin/product");
      const data = await res.json();
      if (typeof data.features === "string") { try { data.features = JSON.parse(data.features); } catch { data.features = []; } }
      if (data.tiers) {
        data.tiers = data.tiers.map((t: PricingTier) => ({
          ...t,
          features: typeof t.features === "string" ? (() => { try { return JSON.parse(t.features as string); } catch { return []; } })() : t.features,
        }));
      }
      setProduct(data);
    } catch { flash("error", "Failed to load product"); }
    finally { setProductLoading(false); }
  }, [token, apiFetch]);

  useEffect(() => { if (token && activeTab === "product") loadProduct(); }, [token, activeTab, loadProduct]);

  const loadSettings = useCallback(async () => {
    if (!token) return;
    setSettingsLoading(true);
    try {
      const res = await apiFetch("/api/admin/settings");
      const data = await res.json();
      setSettings(data);
    } catch { flash("error", "Failed to load settings"); }
    finally { setSettingsLoading(false); }
  }, [token, apiFetch]);

  useEffect(() => { if (token && activeTab === "settings") loadSettings(); }, [token, activeTab, loadSettings]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await apiFetch("/api/admin/orders", { method: "PATCH", body: JSON.stringify({ orderId, status }) });
      if (res.ok) { flash("success", `Order #${orderId} marked as ${status}`); loadOrders(); }
      else { const data = await res.json(); flash("error", data.error || "Failed to update order"); }
    } catch { flash("error", "Failed to update order"); }
  };

  const saveProduct = async () => {
    if (!product) return;
    setProductSaving(true);
    try {
      const payload = {
        name: product.name,
        description: product.description,
        features: product.features,
        tiers: product.tiers.map((t) => ({ id: t.id, name: t.name, price: t.price, period: t.period, features: t.features, sortOrder: t.sortOrder, active: t.active })),
      };
      const res = await apiFetch("/api/admin/product", { method: "PUT", body: JSON.stringify(payload) });
      if (res.ok) { flash("success", "Product updated successfully"); loadProduct(); }
      else { const data = await res.json(); flash("error", data.error || "Failed to save product"); }
    } catch { flash("error", "Failed to save product"); }
    finally { setProductSaving(false); }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    try {
      const { id, ...payload } = settings;
      void id;
      const res = await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify(payload) });
      if (res.ok) { flash("success", "Settings saved"); loadSettings(); }
      else { const data = await res.json(); flash("error", data.error || "Failed to save settings"); }
    } catch { flash("error", "Failed to save settings"); }
    finally { setSettingsSaving(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("dashcore_admin_token");
    localStorage.removeItem("dashcore_admin_nickname");
    router.push("/admin");
  };

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
      tiers: [...product.tiers, { name: "New Tier", price: 0, period: "monthly", features: [], sortOrder: product.tiers.length + 1, active: true }],
    });
  };

  const removeTier = (index: number) => {
    if (!product) return;
    setProduct({ ...product, tiers: product.tiers.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#6d28d9]" />
      </div>
    );
  }

  const totalRevenue = orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.tierPrice, 0);
  const pendingCount = orders.filter((o) => o.paymentStatus === "pending").length;

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: "orders", label: "Orders", icon: <ShoppingCart className="h-4 w-4" /> },
    { key: "product", label: "Product", icon: <Package className="h-4 w-4" /> },
    { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold font-[var(--font-display)]">Admin Dashboard</h1>
            <p className="text-sm text-[#8c8579] mt-0.5">Logged in as {adminNickname}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-outline flex items-center gap-2 text-sm px-4 py-2"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>

        {/* Flash */}
        {message.text && (
          <div className={`mb-5 p-3 rounded-lg flex items-center gap-2.5 ${
            message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {message.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6d28d9]/8">
              <ShoppingCart className="h-5 w-5 text-[#6d28d9]" />
            </div>
            <div>
              <p className="text-xs text-[#8c8579] uppercase tracking-wider font-medium">Total Orders</p>
              <p className="text-lg font-bold font-[var(--font-display)]">{ordersTotal}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-[#8c8579] uppercase tracking-wider font-medium">Revenue</p>
              <p className="text-lg font-bold font-[var(--font-display)]">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-[#8c8579] uppercase tracking-wider font-medium">Pending</p>
              <p className="text-lg font-bold font-[var(--font-display)]">{pendingCount}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#e8e5df]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-[1px] font-[var(--font-display)] ${
                activeTab === tab.key
                  ? "border-[#6d28d9] text-[#6d28d9]"
                  : "border-transparent text-[#8c8579] hover:text-[#1a1625]"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <select
                value={orderFilter}
                onChange={(e) => { setOrderFilter(e.target.value); setOrdersPage(1); }}
                className="input-field w-auto"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <button onClick={loadOrders} disabled={ordersLoading} className="btn-outline flex items-center gap-2 text-sm px-4 py-2">
                <RefreshCw className={`h-4 w-4 ${ordersLoading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#6d28d9]" /></div>
            ) : orders.length === 0 ? (
              <div className="card-elevated p-10 text-center">
                <ShoppingCart className="h-10 w-10 text-[#d4d0c8] mx-auto mb-3" />
                <p className="text-[#8c8579]">No orders found</p>
              </div>
            ) : (
              <div className="card-elevated overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#e8e5df]">
                        {["ID", "Customer", "Plan", "Price", "Method", "Status", "Date", "Actions"].map((h, i) => (
                          <th key={h} className={`text-${i === 7 ? "right" : "left"} text-xs font-medium text-[#8c8579] uppercase tracking-wider px-4 py-3`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-[#f3f1ee] hover:bg-[#faf9f7] transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-[#5a5550]">#{order.id}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium">{order.customerName}</p>
                            <p className="text-xs text-[#8c8579]">{order.customerEmail}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#5a5550]">{order.tierName}</td>
                          <td className="px-4 py-3 text-sm font-medium">${order.tierPrice}</td>
                          <td className="px-4 py-3 text-sm text-[#8c8579] capitalize">
                            {order.paymentMethod}
                            {order.cryptoCurrency && <span className="text-xs ml-1">({order.cryptoCurrency.toUpperCase()})</span>}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
                          <td className="px-4 py-3 text-xs text-[#8c8579]">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {order.paymentStatus === "pending" && (
                                <>
                                  <button onClick={() => updateOrderStatus(order.id, "paid")} className="text-xs px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all">Confirm</button>
                                  <button onClick={() => updateOrderStatus(order.id, "failed")} className="text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all">Reject</button>
                                </>
                              )}
                              {order.paymentStatus === "paid" && (
                                <button onClick={() => updateOrderStatus(order.id, "refunded")} className="text-xs px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all">Refund</button>
                              )}
                              {order.paymentStatus === "failed" && (
                                <button onClick={() => updateOrderStatus(order.id, "pending")} className="text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all">Reset</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {ordersPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[#e8e5df]">
                    <p className="text-xs text-[#8c8579]">Page {ordersPage} of {ordersPages} ({ordersTotal} total)</p>
                    <div className="flex gap-2">
                      <button onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))} disabled={ordersPage <= 1} className="text-xs px-3 py-1.5 rounded-md border border-[#e8e5df] text-[#8c8579] hover:text-[#1a1625] disabled:opacity-30 transition-all">Previous</button>
                      <button onClick={() => setOrdersPage(Math.min(ordersPages, ordersPage + 1))} disabled={ordersPage >= ordersPages} className="text-xs px-3 py-1.5 rounded-md border border-[#e8e5df] text-[#8c8579] hover:text-[#1a1625] disabled:opacity-30 transition-all">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PRODUCT TAB */}
        {activeTab === "product" && (
          <div>
            {productLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#6d28d9]" /></div>
            ) : !product ? (
              <div className="card-elevated p-10 text-center">
                <Package className="h-10 w-10 text-[#d4d0c8] mx-auto mb-3" />
                <p className="text-[#8c8579]">Product not found</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="card-elevated p-6">
                  <h3 className="text-sm font-semibold font-[var(--font-display)] mb-4">Product Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Product Name</label>
                      <input type="text" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Description</label>
                      <textarea value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} rows={3} className="input-field resize-y" />
                    </div>
                  </div>
                </div>

                <div className="card-elevated p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold font-[var(--font-display)]">Pricing Tiers</h3>
                    <button onClick={addTier} className="btn-outline flex items-center gap-1.5 text-xs px-3 py-1.5">
                      <Plus className="h-3.5 w-3.5" /> Add Tier
                    </button>
                  </div>
                  <div className="space-y-4">
                    {product.tiers.map((tier, index) => (
                      <div key={tier.id || `new-${index}`} className="p-4 rounded-lg bg-[#faf9f7] border border-[#e8e5df]">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold font-[var(--font-display)]">
                            {tier.name || "Unnamed"}
                            {!tier.id && <span className="ml-2 text-xs text-[#6d28d9]">(New)</span>}
                          </h4>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-xs text-[#8c8579] cursor-pointer">
                              <input type="checkbox" checked={tier.active} onChange={(e) => updateTier(index, "active", e.target.checked)} className="rounded border-[#d4d0c8] text-[#6d28d9] focus:ring-[#6d28d9]" />
                              Active
                            </label>
                            <button onClick={() => removeTier(index)} className="text-[#8c8579] hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-[#8c8579] mb-1">Name</label>
                            <input type="text" value={tier.name} onChange={(e) => updateTier(index, "name", e.target.value)} className="input-field" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#8c8579] mb-1">Price ($)</label>
                            <input type="number" step="0.01" value={tier.price} onChange={(e) => updateTier(index, "price", parseFloat(e.target.value) || 0)} className="input-field" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#8c8579] mb-1">Billing Period</label>
                            <select value={tier.period} onChange={(e) => updateTier(index, "period", e.target.value)} className="input-field appearance-none cursor-pointer">
                              <option value="monthly">Monthly (1 mo)</option>
                              <option value="quarterly">Quarterly (3 mo)</option>
                              <option value="semiannual">Semi-Annual (6 mo)</option>
                              <option value="yearly">Yearly</option>
                              <option value="lifetime">Lifetime</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-[#8c8579] mb-1">Features (one per line)</label>
                          <textarea
                            value={Array.isArray(tier.features) ? (tier.features as string[]).join("\n") : ""}
                            onChange={(e) => updateTier(index, "features", e.target.value.split("\n").filter((f) => f.trim()))}
                            rows={3}
                            placeholder="Enter each feature on a new line"
                            className="input-field resize-y"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={saveProduct} disabled={productSaving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    {productSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {productSaving ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div>
            {settingsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#6d28d9]" /></div>
            ) : !settings ? (
              <div className="card-elevated p-10 text-center">
                <Settings className="h-10 w-10 text-[#d4d0c8] mx-auto mb-3" />
                <p className="text-[#8c8579]">Settings not found</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* General */}
                <div className="card-elevated p-6">
                  <h3 className="text-sm font-semibold font-[var(--font-display)] mb-4">General</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Site Name</label>
                      <input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Contact Email</label>
                      <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Telegram URL</label>
                      <input type="url" value={settings.telegramUrl} onChange={(e) => setSettings({ ...settings, telegramUrl: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">VAT Rate (%)</label>
                      <input type="number" step="0.01" value={settings.vatRate} onChange={(e) => setSettings({ ...settings, vatRate: parseFloat(e.target.value) || 0 })} className="input-field" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Site Description</label>
                      <textarea value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} rows={2} className="input-field resize-y" />
                    </div>
                  </div>
                </div>

                {/* Stripe */}
                <div className="card-elevated p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold font-[var(--font-display)]">Stripe</h3>
                    <label className="flex items-center gap-2 text-sm text-[#8c8579] cursor-pointer">
                      <input type="checkbox" checked={settings.stripeEnabled} onChange={(e) => setSettings({ ...settings, stripeEnabled: e.target.checked })} className="rounded border-[#d4d0c8] text-[#6d28d9] focus:ring-[#6d28d9]" />
                      Enabled
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Public Key</label>
                      <input type="text" value={settings.stripePublicKey} onChange={(e) => setSettings({ ...settings, stripePublicKey: e.target.value })} placeholder="pk_..." className="input-field font-mono text-xs" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Secret Key</label>
                      <input type="password" value={settings.stripeSecretKey} onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })} placeholder="sk_..." className="input-field font-mono text-xs" />
                    </div>
                  </div>
                </div>

                {/* MultiSafepay */}
                <div className="card-elevated p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold font-[var(--font-display)]">MultiSafepay</h3>
                    <label className="flex items-center gap-2 text-sm text-[#8c8579] cursor-pointer">
                      <input type="checkbox" checked={settings.multisafepayEnabled} onChange={(e) => setSettings({ ...settings, multisafepayEnabled: e.target.checked })} className="rounded border-[#d4d0c8] text-[#6d28d9] focus:ring-[#6d28d9]" />
                      Enabled
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1625] mb-1.5">API Key</label>
                    <input type="password" value={settings.multisafepayApiKey} onChange={(e) => setSettings({ ...settings, multisafepayApiKey: e.target.value })} placeholder="Enter API key" className="input-field font-mono text-xs" />
                  </div>
                </div>

                {/* Crypto */}
                <div className="card-elevated p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold font-[var(--font-display)]">Cryptocurrency</h3>
                    <label className="flex items-center gap-2 text-sm text-[#8c8579] cursor-pointer">
                      <input type="checkbox" checked={settings.cryptoEnabled} onChange={(e) => setSettings({ ...settings, cryptoEnabled: e.target.checked })} className="rounded border-[#d4d0c8] text-[#6d28d9] focus:ring-[#6d28d9]" />
                      Enabled
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">BTC Address</label>
                      <input type="text" value={settings.btcAddress} onChange={(e) => setSettings({ ...settings, btcAddress: e.target.value })} placeholder="bc1q..." className="input-field font-mono text-xs" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">USDT (TRC-20)</label>
                      <input type="text" value={settings.usdtAddress} onChange={(e) => setSettings({ ...settings, usdtAddress: e.target.value })} placeholder="T..." className="input-field font-mono text-xs" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">USDC (ERC-20)</label>
                      <input type="text" value={settings.usdcAddress} onChange={(e) => setSettings({ ...settings, usdcAddress: e.target.value })} placeholder="0x..." className="input-field font-mono text-xs" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">ETH Address</label>
                      <input type="text" value={settings.ethAddress} onChange={(e) => setSettings({ ...settings, ethAddress: e.target.value })} placeholder="0x..." className="input-field font-mono text-xs" />
                    </div>
                  </div>
                </div>

                {/* SMTP */}
                <div className="card-elevated p-6">
                  <h3 className="text-sm font-semibold font-[var(--font-display)] mb-4">Email / SMTP</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">SMTP Host</label>
                      <input type="text" value={settings.smtpHost} onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })} placeholder="smtp.example.com" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">SMTP Port</label>
                      <input type="number" value={settings.smtpPort} onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">SMTP User</label>
                      <input type="text" value={settings.smtpUser} onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">SMTP Password</label>
                      <input type="password" value={settings.smtpPass} onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })} className="input-field" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">From Address</label>
                      <input type="email" value={settings.smtpFrom} onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })} placeholder="noreply@dashcore.eu" className="input-field" />
                    </div>
                  </div>
                </div>

                {/* Email template */}
                <div className="card-elevated p-6">
                  <h3 className="text-sm font-semibold font-[var(--font-display)] mb-4">Confirmation Email</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Subject</label>
                      <input type="text" value={settings.confirmEmailSubject} onChange={(e) => setSettings({ ...settings, confirmEmailSubject: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Body (HTML)</label>
                      <textarea value={settings.confirmEmailBody} onChange={(e) => setSettings({ ...settings, confirmEmailBody: e.target.value })} rows={5} placeholder="<p>Thank you for your order...</p>" className="input-field resize-y font-mono text-xs" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={saveSettings} disabled={settingsSaving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
