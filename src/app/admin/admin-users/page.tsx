"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "@/components/AdminShell";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

interface AdminUser {
  id: number;
  nickname: string;
  role: string;
  createdAt: string;
}

interface FormState {
  nickname: string;
  password: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<FormState>({ nickname: "", password: "", role: "moderator" });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const getToken = () => localStorage.getItem("dashcore_admin_token");

  const showFlash = (type: "success" | "error", msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/admin-users", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 403) {
        showFlash("error", "You don't have permission to manage admin users");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      showFlash("error", "Failed to load admin users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ nickname: "", password: "", role: "moderator" });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setForm({ nickname: user.nickname, password: "", role: user.role === "super" ? "admin" : user.role });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.nickname.trim()) { showFlash("error", "Nickname is required"); return; }
    if (!editingUser && !form.password) { showFlash("error", "Password is required"); return; }

    setSubmitting(true);
    try {
      const method = editingUser ? "PUT" : "POST";
      const body = editingUser
        ? { id: editingUser.id, nickname: form.nickname.trim(), role: form.role, ...(form.password ? { password: form.password } : {}) }
        : { nickname: form.nickname.trim(), password: form.password, role: form.role };

      const res = await fetch("/api/admin/admin-users", {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showFlash("error", data.error || "Failed"); return; }
      showFlash("success", editingUser ? "User updated" : "User created");
      setShowModal(false);
      fetchUsers();
    } catch {
      showFlash("error", "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Delete admin "${user.nickname}"? This cannot be undone.`)) return;
    setDeleting(user.id);
    try {
      const res = await fetch("/api/admin/admin-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) { showFlash("error", data.error || "Failed"); return; }
      showFlash("success", `"${user.nickname}" deleted`);
      fetchUsers();
    } catch {
      showFlash("error", "Request failed");
    } finally {
      setDeleting(null);
    }
  };

  const roleLabel = (role: string) => {
    if (role === "moderator") return "Moderator";
    return "Administrator";
  };

  const roleBadge = (role: string) => {
    if (role === "moderator") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
          <Shield className="h-3 w-3" />
          Moderator
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#7c3aed]/10 text-[#7c3aed]">
        <ShieldCheck className="h-3 w-3" />
        Administrator
      </span>
    );
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {flash && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            flash.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {flash.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {flash.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Admin Users</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Manage administrator and moderator accounts.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Admin
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Nickname</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>
        {users.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#94a3b8] text-sm">No admin users found.</div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="px-6 py-3.5 border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1 text-xs text-[#94a3b8] font-mono">{user.id}</div>
                <div className="col-span-4 text-sm font-medium text-[#0f172a]">{user.nickname}</div>
                <div className="col-span-3">{roleBadge(user.role)}</div>
                <div className="col-span-2 text-xs text-[#64748b]">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(user)}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-[#7c3aed] hover:bg-[#7c3aed]/5 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    disabled={deleting === user.id}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Role Permissions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-[#7c3aed]/20 bg-[#7c3aed]/5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-[#7c3aed]" />
              <span className="text-sm font-semibold text-[#7c3aed]">Administrator</span>
            </div>
            <p className="text-xs text-[#64748b]">Full access to all features: products, orders, customers, CMS instances, settings, pages, API keys, payments, email templates, slider, SEO, and admin user management.</p>
          </div>
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-amber-700" />
              <span className="text-sm font-semibold text-amber-700">Moderator</span>
            </div>
            <p className="text-xs text-[#64748b]">Limited access: can view dashboard, manage orders (confirm payments), view customers, and manage CMS instances. Cannot access settings, products, pages, or admin management.</p>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-semibold text-[#0f172a]">
                {editingUser ? "Edit Admin User" : "Create Admin User"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-[#f1f5f9] transition-colors"
              >
                <X className="h-5 w-5 text-[#64748b]" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Nickname</label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] text-[#0f172a]"
                  placeholder="Enter nickname"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Password {editingUser && <span className="text-[#94a3b8] font-normal">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] text-[#0f172a]"
                    placeholder={editingUser ? "New password (optional)" : "Enter password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Role</label>
                <div className="flex gap-3">
                  <label
                    className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      form.role === "moderator"
                        ? "border-amber-400 bg-amber-50"
                        : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="moderator"
                      checked={form.role === "moderator"}
                      onChange={() => setForm({ ...form, role: "moderator" })}
                      className="sr-only"
                    />
                    <Shield className={`h-4 w-4 ${form.role === "moderator" ? "text-amber-600" : "text-[#94a3b8]"}`} />
                    <div>
                      <p className="text-sm font-medium">{roleLabel("moderator")}</p>
                      <p className="text-[11px] text-[#94a3b8]">Limited access</p>
                    </div>
                  </label>
                  <label
                    className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      form.role === "admin"
                        ? "border-[#7c3aed] bg-[#7c3aed]/5"
                        : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={form.role === "admin"}
                      onChange={() => setForm({ ...form, role: "admin" })}
                      className="sr-only"
                    />
                    <ShieldCheck className={`h-4 w-4 ${form.role === "admin" ? "text-[#7c3aed]" : "text-[#94a3b8]"}`} />
                    <div>
                      <p className="text-sm font-medium">{roleLabel("admin")}</p>
                      <p className="text-[11px] text-[#94a3b8]">Full access</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] rounded-b-xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingUser ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
