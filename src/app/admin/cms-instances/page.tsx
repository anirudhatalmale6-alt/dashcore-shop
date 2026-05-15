"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "@/components/AdminShell";
import {
  Server, Loader2, Plus, Eye, Trash2, RefreshCw, X,
  CheckCircle, XCircle, Clock, Globe, Users, Shield,
  ChevronLeft, ChevronRight, Search, Copy, Edit3,
} from "lucide-react";

interface CmsInstance {
  id: number;
  name: string;
  dns: string;
  subdomain: string | null;
  unique_id: string;
  active: number;
  subscription_plan: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  support_plan_id: number | null;
  created_at: string;
  updated_at: string;
  user_count: number;
}

interface CmsDetail {
  id: number;
  name: string;
  dns: string;
  subdomain: string | null;
  admin_login_path: string | null;
  reseller_login_path: string | null;
  unique_id: string;
  active: number;
  subscription_plan: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  support_plan_id: number | null;
  support_plan_name: string | null;
  created_at: string;
  updated_at: string;
  users: CmsUser[];
}

interface CmsUser {
  id: number;
  username: string;
  email: string;
  role: string;
  enable_login: number;
  created_at: string;
}

interface LicenseInfo {
  cms_id: number;
  name: string;
  plan: string;
  start_date: string | null;
  end_date: string | null;
  days_remaining: number;
  is_expired: boolean;
  is_active: boolean;
  unique_id: string;
}

function formatDate(d: string | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ active }: { active: number }) {
  return active ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <CheckCircle className="h-3 w-3" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      <XCircle className="h-3 w-3" /> Inactive
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    monthly: "bg-blue-50 text-blue-700",
    quarterly: "bg-purple-50 text-purple-700",
    half_year: "bg-indigo-50 text-indigo-700",
    yearly: "bg-amber-50 text-amber-700",
    lifetime: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[plan] || "bg-gray-100 text-gray-700"}`}>
      {plan.replace("_", " ")}
    </span>
  );
}

export default function CmsInstancesPage() {
  const [instances, setInstances] = useState<CmsInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<CmsDetail | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "users" | "license" | "dns">("info");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ name: "", dns: "", subdomain: "", subscription_plan: "monthly", admin_username: "admin", admin_email: "", admin_password: "" });

  const headers = useCallback(() => {
    const token = localStorage.getItem("dashcore_admin_token");
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }, []);

  const proxy = useCallback(async (path: string, method = "GET", body?: unknown) => {
    const opts: RequestInit = { method, headers: headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api/admin/cms-proxy?path=${encodeURIComponent(path)}`, opts);
    return res.json();
  }, [headers]);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    try {
      const data = await proxy("/api/v1/cms");
      if (data.success) setInstances(data.data || []);
    } finally {
      setLoading(false);
    }
  }, [proxy]);

  useEffect(() => { fetchInstances(); }, [fetchInstances]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    setLicense(null);
    setActiveTab("info");
    try {
      const [cmsRes, licRes] = await Promise.all([
        proxy(`/api/v1/cms/${id}`),
        proxy(`/api/v1/license/${id}`),
      ]);
      if (cmsRes.success) setDetail(cmsRes.data);
      if (licRes.success) setLicense(licRes.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.dns.trim() || !form.admin_email.trim()) return;
    setCreating(true);
    try {
      const res = await proxy("/api/v1/cms", "POST", form);
      if (res.success || res.data) {
        setShowCreate(false);
        setForm({ name: "", dns: "", subdomain: "", subscription_plan: "monthly", admin_username: "admin", admin_email: "", admin_password: "" });
        fetchInstances();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Deactivate this CMS instance?")) return;
    await proxy(`/api/v1/cms/${id}`, "DELETE");
    fetchInstances();
    setDetail(null);
  };

  const handleToggleActive = async (id: number, currentActive: number) => {
    await proxy(`/api/v1/cms/${id}`, "PATCH", { active: currentActive ? 0 : 1 });
    fetchInstances();
    if (detail?.id === id) openDetail(id);
  };

  const copyId = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const filtered = instances.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.dns.toLowerCase().includes(search.toLowerCase()) ||
    i.unique_id.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = instances.filter((i) => i.active).length;
  const inactiveCount = instances.filter((i) => !i.active).length;

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-[#7c3aed]" />
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">CMS Instances</h1>
            <p className="text-sm text-[#64748b]">Manage CMS instances via backend.dashcore.eu</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Instance
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
          <p className="text-sm text-[#64748b]">Total Instances</p>
          <p className="text-2xl font-bold text-[#0f172a]">{instances.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
          <p className="text-sm text-[#64748b]">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
          <p className="text-sm text-[#64748b]">Inactive</p>
          <p className="text-2xl font-bold text-red-500">{inactiveCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, DNS, or unique ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] text-sm focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-[#7c3aed] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#94a3b8]">
            <Server className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>{search ? "No matching instances" : "No CMS instances yet"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Instance</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Unique ID</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">DNS</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Plan</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Expires</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Users</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Status</th>
                <th className="px-4 py-3 text-right text-[#64748b] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst) => (
                <tr key={inst.id} className="border-b border-[#f1f5f9] hover:bg-[#fafbfc] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#0f172a]">{inst.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-[#f1f5f9] px-2 py-1 rounded text-[#6366f1]">{inst.unique_id}</code>
                  </td>
                  <td className="px-4 py-3 text-[#64748b]">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {inst.dns}
                    </span>
                  </td>
                  <td className="px-4 py-3"><PlanBadge plan={inst.subscription_plan} /></td>
                  <td className="px-4 py-3 text-[#64748b]">{formatDate(inst.subscription_end_date)}</td>
                  <td className="px-4 py-3 text-[#64748b]">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {inst.user_count}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge active={inst.active} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openDetail(inst.id)}
                        className="p-1.5 text-[#94a3b8] hover:text-[#7c3aed] hover:bg-[#7c3aed]/5 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(inst.id, inst.active)}
                        className="p-1.5 text-[#94a3b8] hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                        title={inst.active ? "Deactivate" : "Activate"}
                      >
                        {inst.active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeactivate(inst.id)}
                        className="p-1.5 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 text-[#7c3aed] animate-spin" />
              </div>
            ) : detail && (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                  <div>
                    <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                      <Server className="h-5 w-5 text-[#7c3aed]" />
                      {detail.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-[#f1f5f9] px-2 py-0.5 rounded text-[#6366f1]">{detail.unique_id}</code>
                      <button onClick={() => copyId(detail.unique_id)} className="text-[#94a3b8] hover:text-[#7c3aed]">
                        <Copy className="h-3 w-3" />
                      </button>
                      {copied && <span className="text-[10px] text-emerald-500">Copied!</span>}
                    </div>
                  </div>
                  <button onClick={() => { setDetail(null); setLicense(null); }} className="p-1.5 hover:bg-[#f1f5f9] rounded-lg">
                    <X className="h-5 w-5 text-[#94a3b8]" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#e2e8f0] px-6">
                  {(["info", "users", "license", "dns"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                        activeTab === tab
                          ? "border-[#7c3aed] text-[#7c3aed]"
                          : "border-transparent text-[#64748b] hover:text-[#0f172a]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {activeTab === "info" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Status</p>
                          <StatusBadge active={detail.active} />
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Plan</p>
                          <PlanBadge plan={detail.subscription_plan} />
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">DNS</p>
                          <p className="text-sm text-[#0f172a]">{detail.dns}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Subdomain</p>
                          <p className="text-sm text-[#0f172a]">{detail.subdomain || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Admin Login Path</p>
                          <p className="text-sm text-[#0f172a]">{detail.admin_login_path || "Default"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Reseller Login Path</p>
                          <p className="text-sm text-[#0f172a]">{detail.reseller_login_path || "Default"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Support Plan</p>
                          <p className="text-sm text-[#0f172a]">{detail.support_plan_name || "None"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Created</p>
                          <p className="text-sm text-[#0f172a]">{formatDate(detail.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "users" && (
                    <div>
                      {detail.users.length === 0 ? (
                        <p className="text-center text-[#94a3b8] py-8">No users</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-[#f8fafc]">
                            <tr>
                              <th className="px-3 py-2 text-left text-[#64748b] font-medium">Username</th>
                              <th className="px-3 py-2 text-left text-[#64748b] font-medium">Email</th>
                              <th className="px-3 py-2 text-left text-[#64748b] font-medium">Role</th>
                              <th className="px-3 py-2 text-left text-[#64748b] font-medium">Login</th>
                              <th className="px-3 py-2 text-left text-[#64748b] font-medium">Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.users.map((u) => (
                              <tr key={u.id} className="border-t border-[#f1f5f9]">
                                <td className="px-3 py-2 font-medium text-[#0f172a]">{u.username}</td>
                                <td className="px-3 py-2 text-[#64748b]">{u.email}</td>
                                <td className="px-3 py-2">
                                  <span className="text-xs bg-[#7c3aed]/8 text-[#7c3aed] px-2 py-0.5 rounded-full font-medium">{u.role}</span>
                                </td>
                                <td className="px-3 py-2">
                                  {u.enable_login ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-400" />
                                  )}
                                </td>
                                <td className="px-3 py-2 text-[#64748b]">{formatDate(u.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {activeTab === "license" && license && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Plan</p>
                          <PlanBadge plan={license.plan} />
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Status</p>
                          {license.is_expired ? (
                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Start Date</p>
                          <p className="text-sm text-[#0f172a]">{formatDate(license.start_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">End Date</p>
                          <p className="text-sm text-[#0f172a]">{formatDate(license.end_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Days Remaining</p>
                          <p className={`text-lg font-bold ${license.days_remaining <= 7 ? "text-red-500" : license.days_remaining <= 30 ? "text-amber-500" : "text-emerald-600"}`}>
                            {license.days_remaining > 0 ? license.days_remaining : 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "dns" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">DNS / Domain</p>
                          <p className="text-sm text-[#0f172a] flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5 text-[#6366f1]" />
                            {detail.dns}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94a3b8] mb-0.5">Subdomain</p>
                          <p className="text-sm text-[#0f172a]">{detail.subdomain || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#7c3aed]" />
                Create CMS Instance
              </h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-[#f1f5f9] rounded-lg">
                <X className="h-5 w-5 text-[#94a3b8]" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. MyIPTV"
                  className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] text-sm focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">DNS / Domain</label>
                  <input
                    value={form.dns}
                    onChange={(e) => setForm({ ...form, dns: e.target.value })}
                    placeholder="e.g. client.example.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] text-sm focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Subdomain</label>
                  <input
                    value={form.subdomain}
                    onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
                    placeholder="e.g. client"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] text-sm focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Subscription Plan</label>
                <select
                  value={form.subscription_plan}
                  onChange={(e) => setForm({ ...form, subscription_plan: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] text-sm focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half_year">Half Year</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Admin Username</label>
                  <input
                    value={form.admin_username}
                    onChange={(e) => setForm({ ...form, admin_username: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] text-sm focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={form.admin_email}
                    onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                    placeholder="admin@example.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] text-sm focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Admin Password</label>
                <input
                  type="password"
                  value={form.admin_password}
                  onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                  className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] text-sm focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm text-[#64748b] hover:bg-[#f1f5f9] rounded-lg">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.name.trim() || !form.dns.trim()}
                className="px-4 py-2.5 bg-[#7c3aed] text-white text-sm font-medium rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 flex items-center gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
