"use client";

import { useState } from "react";
import { Search, CheckCircle, Clock, XCircle, RefreshCw, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface OrderInfo {
  id: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  tierName: string;
  tierPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  cryptoCurrency: string | null;
  selectedOptions: Record<string, string> | null;
  createdAt: string;
  confirmedAt: string | null;
}

const statusStyles: Record<string, { cls: string; icon: typeof Clock }> = {
  pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  paid: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  failed: { cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  refunded: { cls: "bg-gray-50 text-gray-600 border-gray-200", icon: RefreshCw },
};

export default function OrderLookupPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderInfo | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) { setError("Please fill in both fields."); return; }
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch("/api/order-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim().replace("#", ""), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Order not found."); return; }
      setOrder(data);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const status = order ? statusStyles[order.paymentStatus] || statusStyles.pending : null;
  const StatusIcon = status?.icon || Clock;

  return (
    <div>
      <section className="hero-light relative pt-28 pb-14 sm:pt-36 sm:pb-18">
        <div className="hero-pattern" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a]">
            Order Lookup
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#64748b]">
            Enter your order ID and email address to check your order status.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 -mt-4 relative z-10">
        <div className="mx-auto max-w-xl px-5">
          {!order ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7 shadow-sm">
              {error && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Order ID</label>
                  <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="AB1C2-0526" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="input-field" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {loading ? "Looking up..." : "Find Order"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-[#94a3b8] uppercase tracking-wider">Order</p>
                    <p className="text-2xl font-bold font-mono">{order.orderId}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${status?.cls}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#94a3b8] mb-0.5">Customer</p>
                      <p className="text-sm font-medium">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#94a3b8] mb-0.5">Email</p>
                      <p className="text-sm">{order.customerEmail}</p>
                    </div>
                  </div>

                  <div className="border-t border-[#e2e8f0] pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#94a3b8] mb-0.5">Plan</p>
                      <p className="text-sm font-medium">{order.tierName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#94a3b8] mb-0.5">Amount</p>
                      <p className="text-sm font-bold">${order.tierPrice}</p>
                    </div>
                  </div>

                  <div className="border-t border-[#e2e8f0] pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#94a3b8] mb-0.5">Payment Method</p>
                      <p className="text-sm capitalize">{order.paymentMethod}{order.cryptoCurrency ? ` (${order.cryptoCurrency.toUpperCase()})` : ""}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#94a3b8] mb-0.5">Date</p>
                      <p className="text-sm">{new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                  </div>

                  {order.selectedOptions && Object.keys(order.selectedOptions).length > 0 && (
                    <div className="border-t border-[#e2e8f0] pt-4">
                      <p className="text-xs text-[#94a3b8] mb-2">Options</p>
                      {Object.entries(order.selectedOptions).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-[#64748b]">{k}</span>
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {order.confirmedAt && (
                    <div className="border-t border-[#e2e8f0] pt-4">
                      <p className="text-xs text-[#94a3b8] mb-0.5">Confirmed</p>
                      <p className="text-sm">{new Date(order.confirmedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#f8fafc] border-t border-[#e2e8f0] px-7 py-4 flex gap-3">
                <button onClick={() => setOrder(null)} className="btn-outline text-sm flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Look up another
                </button>
                <Link href="/" className="text-sm text-[#64748b] hover:text-[#0f172a] flex items-center gap-1 ml-auto">Back to Home</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
