"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import {
  Users, Loader2, Search, CheckCircle, XCircle, AlertCircle,
  Ban, ShieldCheck, ShieldOff, Eye, ChevronLeft, ChevronRight,
  Clock, Globe, Package, X, RefreshCw,
} from "lucide-react";

interface CustomerSummary {
  id: number;
  email: string;
  name: string;
  active: boolean;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  lastLogin: string | null;
  orderCount: number;
  _count: { loginLogs: number };
}

interface LoginLog {
  id: number;
  ip: string;
  userAgent: string;
  createdAt: string;
}

interface OrderSummary {
  id: number;
  orderId: string;
  tierName: string;
  tierPrice: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  confirmedAt: string | null;
}

interface CustomerDetail {
  id: number;
  email: string;
  name: string;
  active: boolean;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  lastLogin: string | null;
  loginLogs: LoginLog[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ active, banned }: { active: boolean; banned: boolean }) {
  if (banned) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"><Ban className="h-3 w-3" /> Banned</span>;
  if (!active) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200"><XCircle className="h-3 w-3" /> Inactive</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="h-3 w-3" /> Active</span>;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [detailCustomer, setDetailCustomer] = useState<CustomerDetail | null>(null);
  const [detailOrders, setDetailOrders] = useState<OrderSummary[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "orders" | "logins">("info");
  const [banReason, setBanReason] = useState("");
  const [showBanInput, setShowBanInput] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("dashcore_admin_token");
    if (!t) { router.push("/admin"); return; }
    setToken(t);
  }, [router]);

  const flash = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as Record<string, string>) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) { router.push("/admin"); throw new Error("Session expired"); }
    return res;
  }, [token, router]);

  const loadCustomers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { flash("error", "Failed to load customers"); }
    finally { setLoading(false); }
  }, [token, page, search, apiFetch]);

  useEffect(() => { if (token) loadCustomers(); }, [token, loadCustomers]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailTab("info");
    setShowBanInput(false);
    try {
      const res = await apiFetch(`/api/admin/customers?id=${id}`);
      const data = await res.json();
      setDetailCustomer(data.customer);
      setDetailOrders(data.orders || []);
    } catch { flash("error", "Failed to load customer"); }
    finally { setDetailLoading(false); }
  };

  const doAction = async (customerId: number, action: string, reason?: string) => {
    try {
      const res = await apiFetch("/api/admin/customers", {
        method: "PATCH",
        body: JSON.stringify({ customerId, action, banReason: reason }),
      });
      if (res.ok) {
        flash("success", `Customer ${action}d successfully`);
        loadCustomers();
        if (detailCustomer?.id === customerId) openDetail(customerId);
        setShowBanInput(false);
        setBanReason("");
      } else {
        const data = await res.json();
        flash("error", data.error || "Failed");
      }
    } catch { flash("error", "Action failed"); }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Customers</h1>
          <p className="text-sm text-[#64748b] mt-0.5">{total} registered customer{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or email..."
              className="input-field !pl-10 w-64 text-sm py-2"
            />
          </div>
          <button onClick={loadCustomers} disabled={loading} className="bg-white border border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a] px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-5 p-3 rounded-lg flex items-center gap-2.5 text-sm ${
          message.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0]">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" /></div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="h-12 w-12 text-[#cbd5e1] mx-auto mb-3" />
            <p className="text-[#94a3b8]">{search ? "No customers match your search" : "No registered customers yet"}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9]">
                    <th className="text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider px-5 py-3">Customer</th>
                    <th className="text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider px-5 py-3">Orders</th>
                    <th className="text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider px-5 py-3">Logins</th>
                    <th className="text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider px-5 py-3">Last Login</th>
                    <th className="text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider px-5 py-3">Joined</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => openDetail(c.id)}>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-[#94a3b8]">{c.email}</p>
                      </td>
                      <td className="px-5 py-3"><StatusBadge active={c.active} banned={c.banned} /></td>
                      <td className="px-5 py-3 text-sm text-[#64748b]">{c.orderCount}</td>
                      <td className="px-5 py-3 text-sm text-[#64748b]">{c._count.loginLogs}</td>
                      <td className="px-5 py-3 text-xs text-[#94a3b8]">{c.lastLogin ? formatDate(c.lastLogin) : "Never"}</td>
                      <td className="px-5 py-3 text-xs text-[#94a3b8]">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); openDetail(c.id); }} className="text-xs px-2.5 py-1 rounded-md bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-all">
                          <Eye className="h-3.5 w-3.5 inline mr-1" />View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#f1f5f9]">
                <p className="text-xs text-[#94a3b8]">Page {page} of {pages} ({total} total)</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] disabled:opacity-40 transition-all"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages} className="p-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] disabled:opacity-40 transition-all"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Detail Modal */}
      {(detailCustomer || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setDetailCustomer(null); setDetailOrders([]); }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl border border-[#e2e8f0] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" /></div>
            ) : detailCustomer && (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                  <div>
                    <h2 className="text-sm font-bold">{detailCustomer.name}</h2>
                    <p className="text-xs text-[#94a3b8]">{detailCustomer.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge active={detailCustomer.active} banned={detailCustomer.banned} />
                    <button onClick={() => { setDetailCustomer(null); setDetailOrders([]); }} className="p-1 rounded-lg hover:bg-[#f1f5f9] transition-all">
                      <X className="h-4 w-4 text-[#64748b]" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center gap-2 flex-wrap">
                  {detailCustomer.banned ? (
                    <button onClick={() => doAction(detailCustomer.id, "unban")} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all font-medium flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Unban
                    </button>
                  ) : (
                    <>
                      {!showBanInput ? (
                        <button onClick={() => setShowBanInput(true)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all font-medium flex items-center gap-1">
                          <Ban className="h-3.5 w-3.5" /> Ban
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input type="text" value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Ban reason (optional)" className="input-field text-xs py-1.5 w-48" />
                          <button onClick={() => doAction(detailCustomer.id, "ban", banReason)} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all font-medium">Confirm Ban</button>
                          <button onClick={() => { setShowBanInput(false); setBanReason(""); }} className="text-xs text-[#64748b] hover:text-[#0f172a]">Cancel</button>
                        </div>
                      )}
                    </>
                  )}
                  {detailCustomer.active ? (
                    <button onClick={() => doAction(detailCustomer.id, "deactivate")} className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all font-medium flex items-center gap-1">
                      <ShieldOff className="h-3.5 w-3.5" /> Deactivate
                    </button>
                  ) : (
                    <button onClick={() => doAction(detailCustomer.id, "activate")} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all font-medium flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Activate
                    </button>
                  )}
                </div>

                {detailCustomer.banReason && (
                  <div className="mx-6 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                    <strong>Ban reason:</strong> {detailCustomer.banReason}
                  </div>
                )}

                {/* Tabs */}
                <div className="px-6 pt-3 border-b border-[#e2e8f0] flex gap-4">
                  {(["info", "orders", "logins"] as const).map((t) => (
                    <button key={t} onClick={() => setDetailTab(t)} className={`pb-2.5 text-xs font-medium border-b-2 transition-all ${detailTab === t ? "border-[#7c3aed] text-[#7c3aed]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"}`}>
                      {t === "info" ? "Info" : t === "orders" ? `Orders (${detailOrders.length})` : `Login History (${detailCustomer.loginLogs.length})`}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {detailTab === "info" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Name</p>
                        <p className="text-sm font-medium">{detailCustomer.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Email</p>
                        <p className="text-sm">{detailCustomer.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Registered</p>
                        <p className="text-sm">{formatDate(detailCustomer.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Last Login</p>
                        <p className="text-sm">{detailCustomer.lastLogin ? formatDate(detailCustomer.lastLogin) : "Never"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Total Orders</p>
                        <p className="text-sm font-semibold">{detailOrders.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Total Logins</p>
                        <p className="text-sm font-semibold">{detailCustomer.loginLogs.length}</p>
                      </div>
                    </div>
                  )}

                  {detailTab === "orders" && (
                    detailOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-10 w-10 text-[#cbd5e1] mx-auto mb-2" />
                        <p className="text-sm text-[#94a3b8]">No orders</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#e2e8f0]">
                              <th className="text-left py-2 px-3 text-xs font-medium text-[#94a3b8] uppercase">Order ID</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-[#94a3b8] uppercase">Plan</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-[#94a3b8] uppercase">Total</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-[#94a3b8] uppercase">Status</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-[#94a3b8] uppercase">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailOrders.map((o) => (
                              <tr key={o.id} className="border-b border-[#f1f5f9]">
                                <td className="py-2.5 px-3 font-mono">{o.orderId}</td>
                                <td className="py-2.5 px-3">{o.tierName}</td>
                                <td className="py-2.5 px-3 font-semibold">${Number(o.totalPrice) || Number(o.tierPrice)}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                                    o.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    o.paymentStatus === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    o.paymentStatus === "refunded" ? "bg-gray-50 text-gray-600 border-gray-200" :
                                    "bg-red-50 text-red-700 border-red-200"
                                  }`}>
                                    {o.paymentStatus.charAt(0).toUpperCase() + o.paymentStatus.slice(1)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-[#64748b]">{new Date(o.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}

                  {detailTab === "logins" && (
                    detailCustomer.loginLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-10 w-10 text-[#cbd5e1] mx-auto mb-2" />
                        <p className="text-sm text-[#94a3b8]">No login history</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#e2e8f0]">
                              <th className="text-left py-2 px-3 text-xs font-medium text-[#94a3b8] uppercase">Date</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-[#94a3b8] uppercase">IP Address</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-[#94a3b8] uppercase">User Agent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailCustomer.loginLogs.map((log) => (
                              <tr key={log.id} className="border-b border-[#f1f5f9]">
                                <td className="py-2.5 px-3 text-[#64748b] whitespace-nowrap">{formatDate(log.createdAt)}</td>
                                <td className="py-2.5 px-3 font-mono text-xs flex items-center gap-1.5">
                                  <Globe className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                                  {log.ip}
                                </td>
                                <td className="py-2.5 px-3 text-xs text-[#94a3b8] max-w-[300px] truncate">{log.userAgent || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
