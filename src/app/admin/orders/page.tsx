"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import {
  ShoppingCart,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Order {
  id: number;
  orderId: string;
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
  selectedOptions: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
      {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function OrderDetailModal({ order, onClose, onStatusChange }: {
  order: Order;
  onClose: () => void;
  onStatusChange: (orderId: number, status: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-2xl border border-[#e2e8f0] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#7c3aed]" />
            <h2 className="text-sm font-bold">Order {order.orderId}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#f1f5f9] transition-all">
            <X className="h-4 w-4 text-[#64748b]" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status & Actions */}
          <div className="flex items-center justify-between">
            <StatusBadge status={order.paymentStatus} />
            <div className="flex items-center gap-1.5">
              {order.paymentStatus === "pending" && (
                <>
                  <button onClick={() => onStatusChange(order.id, "paid")} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all font-medium">Confirm Paid</button>
                  <button onClick={() => onStatusChange(order.id, "failed")} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all font-medium">Reject</button>
                </>
              )}
              {order.paymentStatus === "paid" && (
                <button onClick={() => onStatusChange(order.id, "refunded")} className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all font-medium">Refund</button>
              )}
            </div>
          </div>

          {/* Invoice-style layout */}
          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="bg-[#f8fafc] px-5 py-3 border-b border-[#e2e8f0]">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Customer Details</p>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Name</p>
                <p className="text-sm font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Email</p>
                <a href={`mailto:${order.customerEmail}`} className="text-sm text-[#7c3aed] hover:underline">{order.customerEmail}</a>
              </div>
            </div>
          </div>

          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="bg-[#f8fafc] px-5 py-3 border-b border-[#e2e8f0]">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Order Details</p>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Plan</p>
                  <p className="text-sm font-medium">{order.tierName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Price</p>
                  <p className="text-sm font-bold text-[#0f172a]">${order.tierPrice}</p>
                </div>
              </div>

              {order.selectedOptions && Object.keys(order.selectedOptions).length > 0 && (
                <div className="border-t border-[#e2e8f0] pt-3 mt-3">
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-2">Selected Options</p>
                  <div className="space-y-1">
                    {Object.entries(order.selectedOptions).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-[#64748b]">{key}</span>
                        <span className="font-medium">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="bg-[#f8fafc] px-5 py-3 border-b border-[#e2e8f0]">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Payment Information</p>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Method</p>
                <p className="text-sm font-medium capitalize">{order.paymentMethod}</p>
              </div>
              {order.cryptoCurrency && (
                <div>
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Cryptocurrency</p>
                  <p className="text-sm font-medium uppercase">{order.cryptoCurrency}</p>
                </div>
              )}
              {order.paymentId && (
                <div className="col-span-2">
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Payment ID</p>
                  <p className="text-xs font-mono text-[#64748b] break-all">{order.paymentId}</p>
                </div>
              )}
              {order.cryptoTxHash && (
                <div className="col-span-2">
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Transaction Hash</p>
                  <p className="text-xs font-mono text-[#64748b] break-all">{order.cryptoTxHash}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="bg-[#f8fafc] px-5 py-3 border-b border-[#e2e8f0]">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Timeline</p>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Created</p>
                <p className="text-sm">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Last Updated</p>
                <p className="text-sm">{formatDate(order.updatedAt)}</p>
              </div>
              {order.confirmedAt && (
                <div>
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-0.5">Confirmed</p>
                  <p className="text-sm">{formatDate(order.confirmedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
              <div className="bg-[#f8fafc] px-5 py-3 border-b border-[#e2e8f0]">
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Notes</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-[#475569] whitespace-pre-wrap">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

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
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) { router.push("/admin"); throw new Error("Session expired"); }
    return res;
  }, [token, router]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter) params.set("status", filter);
      const res = await apiFetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { flash("error", "Failed to load orders"); }
    finally { setLoading(false); }
  }, [token, page, filter, apiFetch]);

  useEffect(() => { if (token) loadOrders(); }, [token, loadOrders]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const res = await apiFetch("/api/admin/orders", { method: "PATCH", body: JSON.stringify({ orderId, status }) });
      if (res.ok) {
        flash("success", `Order marked as ${status}`);
        loadOrders();
        if (detailOrder && detailOrder.id === orderId) {
          setDetailOrder({ ...detailOrder, paymentStatus: status });
        }
      } else {
        const data = await res.json();
        flash("error", data.error || "Failed");
      }
    } catch { flash("error", "Failed to update order"); }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Orders</h1>
          <p className="text-sm text-[#64748b] mt-0.5">{total} order{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="input-field w-auto text-sm py-2">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button onClick={loadOrders} disabled={loading} className="bg-white border border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a] px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all">
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
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-[#cbd5e1] mx-auto mb-3" />
            <p className="text-[#94a3b8]">No orders found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9]">
                    {["ID", "Customer", "Plan", "Price", "Method", "Status", "Date", ""].map((h, i) => (
                      <th key={h || 'actions'} className={`text-${i === 7 ? "right" : "left"} text-xs font-medium text-[#94a3b8] uppercase tracking-wider px-5 py-3`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors cursor-pointer"
                      onClick={() => setDetailOrder(order)}
                    >
                      <td className="px-5 py-3 text-sm font-mono text-[#64748b]">{order.orderId}</td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-[#94a3b8]">{order.customerEmail}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-[#64748b]">{order.tierName}</td>
                      <td className="px-5 py-3 text-sm font-semibold">${order.tierPrice}</td>
                      <td className="px-5 py-3 text-sm text-[#64748b] capitalize">
                        {order.paymentMethod}
                        {order.cryptoCurrency && <span className="text-xs ml-1 text-[#94a3b8]">({order.cryptoCurrency.toUpperCase()})</span>}
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={order.paymentStatus} /></td>
                      <td className="px-5 py-3 text-xs text-[#94a3b8]">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDetailOrder(order); }}
                          className="text-xs px-2.5 py-1 rounded-md bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-all"
                        >
                          <FileText className="h-3.5 w-3.5 inline mr-1" />View
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
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] disabled:opacity-40 transition-all">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages} className="p-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] disabled:opacity-40 transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onStatusChange={updateStatus}
        />
      )}
    </AdminShell>
  );
}
