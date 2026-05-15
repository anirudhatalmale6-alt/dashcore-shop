"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Package, User, KeyRound, Trash2, LogOut,
  Loader2, CheckCircle, Clock, XCircle, RefreshCw, Eye, AlertTriangle,
} from "lucide-react";

interface OrderItem {
  id: number;
  orderId: string;
  tierName: string;
  tierPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  cryptoCurrency: string | null;
  selectedOptions: Record<string, string> | null;
  createdAt: string;
  confirmedAt: string | null;
}

interface Profile {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  lastLogin: string | null;
}

const statusStyles: Record<string, { cls: string; icon: typeof Clock }> = {
  pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  paid: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  failed: { cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  refunded: { cls: "bg-gray-50 text-gray-600 border-gray-200", icon: RefreshCw },
};

type Tab = "dashboard" | "orders" | "profile" | "password" | "delete";

export default function AccountPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewOrder, setViewOrder] = useState<OrderItem | null>(null);

  // Profile edit
  const [editName, setEditName] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password change
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("customer_token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("/api/customer/profile", { headers: authHeaders() }).then((r) => r.json()),
      fetch("/api/customer/orders", { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([prof, ords]) => {
        if (prof.error) {
          localStorage.removeItem("customer_token");
          localStorage.removeItem("customer_name");
          localStorage.removeItem("customer_email");
          window.dispatchEvent(new Event("customer-auth-change"));
          router.push("/login");
          return;
        }
        setProfile(prof);
        setEditName(prof.name);
        setOrders(Array.isArray(ords) ? ords : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, router, authHeaders]);

  const logout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_name");
    localStorage.removeItem("customer_email");
    window.dispatchEvent(new Event("customer-auth-change"));
    router.push("/login");
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name: editName }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((p) => p ? { ...p, name: data.name } : p);
        localStorage.setItem("customer_name", data.name);
        window.dispatchEvent(new Event("customer-auth-change"));
        setProfileMsg("Profile updated successfully.");
      } else {
        setProfileMsg("Failed to update profile.");
      }
    } catch {
      setProfileMsg("Network error.");
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    setPwdError("");
    setPwdMsg("");
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match."); return; }
    if (newPwd.length < 6) { setPwdError("New password must be at least 6 characters."); return; }
    setPwdSaving(true);
    try {
      const res = await fetch("/api/customer/password", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg("Password changed successfully.");
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
      } else {
        setPwdError(data.error || "Failed to change password.");
      }
    } catch {
      setPwdError("Network error.");
    } finally {
      setPwdSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await fetch("/api/customer/profile", { method: "DELETE", headers: authHeaders() });
      localStorage.removeItem("customer_token");
      localStorage.removeItem("customer_name");
      localStorage.removeItem("customer_email");
      window.dispatchEvent(new Event("customer-auth-change"));
      router.push("/");
    } catch {
      setDeleting(false);
    }
  };

  if (!token || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "orders", label: "Orders", icon: Package },
    { key: "profile", label: "Profile", icon: User },
    { key: "password", label: "Password", icon: KeyRound },
    { key: "delete", label: "Delete Account", icon: Trash2 },
  ];

  const confirmed = orders.filter((o) => o.paymentStatus === "paid");
  const pending = orders.filter((o) => o.paymentStatus === "pending");

  return (
    <div>
      <section className="hero-light relative pt-28 pb-10 sm:pt-36 sm:pb-14">
        <div className="hero-pattern" />
        <div className="relative z-10 mx-auto max-w-6xl px-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Welcome, {profile?.name}
              </h1>
              <p className="mt-1 text-sm text-[#64748b]">{profile?.email}</p>
            </div>
            <button onClick={logout} className="btn-outline !py-2 !px-4 text-sm flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 relative z-10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col md:flex-row gap-6 -mt-2">
            {/* Sidebar */}
            <div className="md:w-56 shrink-0">
              <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => { setTab(t.key); setViewOrder(null); }}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-[#6366f1]/10 text-[#6366f1] border-l-3 border-[#6366f1]"
                          : t.key === "delete"
                            ? "text-red-500 hover:bg-red-50"
                            : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {tab === "dashboard" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                      <p className="text-xs text-[#94a3b8] uppercase tracking-wider">Total Orders</p>
                      <p className="text-3xl font-extrabold text-[#0f172a] mt-1" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {orders.length}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                      <p className="text-xs text-[#94a3b8] uppercase tracking-wider">Active Licenses</p>
                      <p className="text-3xl font-extrabold text-emerald-600 mt-1" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {confirmed.length}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                      <p className="text-xs text-[#94a3b8] uppercase tracking-wider">Pending</p>
                      <p className="text-3xl font-extrabold text-amber-600 mt-1" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {pending.length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-[#0f172a] mb-4">Recent Orders</h2>
                    {orders.length === 0 ? (
                      <p className="text-sm text-[#94a3b8]">No orders yet. <Link href="/pricing" className="text-[#6366f1] hover:underline">Browse plans</Link></p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#e2e8f0]">
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#94a3b8] uppercase">Order ID</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#94a3b8] uppercase">Plan</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#94a3b8] uppercase">Amount</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#94a3b8] uppercase">Status</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#94a3b8] uppercase">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 5).map((o) => {
                              const st = statusStyles[o.paymentStatus] || statusStyles.pending;
                              const StIcon = st.icon;
                              return (
                                <tr key={o.id} className="border-b border-[#f1f5f9]">
                                  <td className="py-3 px-3 font-mono font-medium">{o.orderId}</td>
                                  <td className="py-3 px-3">{o.tierName}</td>
                                  <td className="py-3 px-3 font-semibold">${o.tierPrice}</td>
                                  <td className="py-3 px-3">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
                                      <StIcon className="h-3 w-3" />
                                      {o.paymentStatus.charAt(0).toUpperCase() + o.paymentStatus.slice(1)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-[#64748b]">
                                    {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {orders.length > 5 && (
                      <button onClick={() => setTab("orders")} className="mt-3 text-sm text-[#6366f1] hover:underline font-medium">
                        View all orders
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-[#0f172a] mb-3">Account Info</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-[#94a3b8] mb-0.5">Member Since</p>
                        <p className="font-medium">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#94a3b8] mb-0.5">Last Login</p>
                        <p className="font-medium">{profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "First login"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "orders" && !viewOrder && (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#e2e8f0]">
                    <h2 className="text-lg font-bold text-[#0f172a]">All Orders</h2>
                  </div>
                  {orders.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[#94a3b8]">
                      No orders yet. <Link href="/pricing" className="text-[#6366f1] hover:underline">Browse plans</Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-[#94a3b8] uppercase">Order ID</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-[#94a3b8] uppercase">Plan</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-[#94a3b8] uppercase">Amount</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-[#94a3b8] uppercase">Payment</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-[#94a3b8] uppercase">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-[#94a3b8] uppercase">Date</th>
                            <th className="py-3 px-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((o) => {
                            const st = statusStyles[o.paymentStatus] || statusStyles.pending;
                            const StIcon = st.icon;
                            return (
                              <tr key={o.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                                <td className="py-3 px-4 font-mono font-medium">{o.orderId}</td>
                                <td className="py-3 px-4">{o.tierName}</td>
                                <td className="py-3 px-4 font-semibold">${o.tierPrice}</td>
                                <td className="py-3 px-4 capitalize">{o.paymentMethod}{o.cryptoCurrency ? ` (${o.cryptoCurrency.toUpperCase()})` : ""}</td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
                                    <StIcon className="h-3 w-3" />
                                    {o.paymentStatus.charAt(0).toUpperCase() + o.paymentStatus.slice(1)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[#64748b]">
                                  {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </td>
                                <td className="py-3 px-4">
                                  <button onClick={() => setViewOrder(o)} className="text-[#6366f1] hover:text-[#4f46e5]">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === "orders" && viewOrder && (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#94a3b8] uppercase tracking-wider">Order</p>
                      <p className="text-2xl font-bold font-mono">{viewOrder.orderId}</p>
                    </div>
                    {(() => {
                      const st = statusStyles[viewOrder.paymentStatus] || statusStyles.pending;
                      const StIcon = st.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${st.cls}`}>
                          <StIcon className="h-3.5 w-3.5" />
                          {viewOrder.paymentStatus.charAt(0).toUpperCase() + viewOrder.paymentStatus.slice(1)}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#94a3b8] mb-0.5">Plan</p>
                        <p className="text-sm font-medium">{viewOrder.tierName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#94a3b8] mb-0.5">Amount</p>
                        <p className="text-sm font-bold">${viewOrder.tierPrice}</p>
                      </div>
                    </div>
                    <div className="border-t border-[#e2e8f0] pt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#94a3b8] mb-0.5">Payment Method</p>
                        <p className="text-sm capitalize">{viewOrder.paymentMethod}{viewOrder.cryptoCurrency ? ` (${viewOrder.cryptoCurrency.toUpperCase()})` : ""}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#94a3b8] mb-0.5">Date</p>
                        <p className="text-sm">{new Date(viewOrder.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                    </div>
                    {viewOrder.selectedOptions && Object.keys(viewOrder.selectedOptions).length > 0 && (
                      <div className="border-t border-[#e2e8f0] pt-4">
                        <p className="text-xs text-[#94a3b8] mb-2">Options</p>
                        {Object.entries(viewOrder.selectedOptions).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm">
                            <span className="text-[#64748b]">{k}</span>
                            <span className="font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {viewOrder.confirmedAt && (
                      <div className="border-t border-[#e2e8f0] pt-4">
                        <p className="text-xs text-[#94a3b8] mb-0.5">Confirmed</p>
                        <p className="text-sm">{new Date(viewOrder.confirmedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-[#f8fafc] border-t border-[#e2e8f0] px-6 py-4">
                    <button onClick={() => setViewOrder(null)} className="text-sm text-[#6366f1] hover:underline font-medium">
                      Back to all orders
                    </button>
                  </div>
                </div>
              )}

              {tab === "profile" && (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-[#0f172a] mb-5">Edit Profile</h2>
                  {profileMsg && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{profileMsg}</div>
                  )}
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email</label>
                      <input type="email" value={profile?.email || ""} disabled className="input-field !bg-[#f8fafc] !text-[#94a3b8] cursor-not-allowed" />
                      <p className="text-xs text-[#94a3b8] mt-1">Email cannot be changed.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <button
                      onClick={saveProfile}
                      disabled={profileSaving}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {tab === "password" && (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-[#0f172a] mb-5">Change Password</h2>
                  {pwdMsg && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{pwdMsg}</div>
                  )}
                  {pwdError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{pwdError}</div>
                  )}
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Current Password</label>
                      <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">New Password</label>
                      <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="input-field" placeholder="Min. 6 characters" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Confirm New Password</label>
                      <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="input-field" />
                    </div>
                    <button
                      onClick={changePassword}
                      disabled={pwdSaving}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {pwdSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                      {pwdSaving ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </div>
              )}

              {tab === "delete" && (
                <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-5">
                    <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-lg font-bold text-red-700">Delete Account</h2>
                      <p className="text-sm text-[#64748b] mt-1">
                        This action is permanent and cannot be undone. All your account data will be deleted.
                        Your existing orders will remain in the system for record-keeping.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                        Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        className="input-field !border-red-200 focus:!border-red-400 focus:!shadow-none"
                        placeholder="DELETE"
                      />
                    </div>
                    <button
                      onClick={deleteAccount}
                      disabled={deleteConfirm !== "DELETE" || deleting}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors disabled:opacity-40 flex items-center gap-2"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {deleting ? "Deleting..." : "Permanently Delete Account"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
