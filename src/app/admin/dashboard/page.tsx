"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import {
  ShoppingCart,
  DollarSign,
  Clock,
  Loader2,
  RefreshCw,
  TrendingUp,
  Eye,
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
  cryptoCurrency: string | null;
  createdAt: string;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-400",
    paid: "bg-emerald-400",
    failed: "bg-red-400",
    refunded: "bg-gray-400",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[status] || colors.pending}`} />;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("dashcore_admin_token");
    if (!t) { router.push("/admin"); return; }
    setToken(t);
  }, [router]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token, router]);

  useEffect(() => { if (token) loadOrders(); }, [token, loadOrders]);

  const revenue = orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.tierPrice, 0);
  const pending = orders.filter((o) => o.paymentStatus === "pending").length;

  return (
    <AdminShell>
      <h1 className="text-xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: total, icon: ShoppingCart, color: "text-[#7c3aed]", bg: "bg-[#7c3aed]/8" },
          { label: "Revenue", value: `$${revenue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Conversion", value: total > 0 ? `${Math.round((orders.filter(o => o.paymentStatus === "paid").length / total) * 100)}%` : "0%", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-[#94a3b8] font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0]">
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Orders</h2>
          <button onClick={loadOrders} disabled={loading} className="text-xs text-[#64748b] hover:text-[#0f172a] flex items-center gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" /></div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-[#94a3b8] text-sm">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f1f5f9]">
                  {["#", "Customer", "Plan", "Amount", "Method", "Status", "Date", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors">
                    <td className="px-5 py-3 text-sm font-mono text-[#64748b]">{order.orderId}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-[#94a3b8]">{order.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#64748b]">{order.tierName}</td>
                    <td className="px-5 py-3 text-sm font-semibold">${order.tierPrice}</td>
                    <td className="px-5 py-3 text-sm text-[#64748b] capitalize">{order.paymentMethod}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize">
                        <StatusDot status={order.paymentStatus} />
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#94a3b8]">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => router.push(`/admin/orders?view=${order.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9] transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
