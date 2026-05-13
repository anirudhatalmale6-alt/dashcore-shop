"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { Plus, Trash2, Save, Loader2, CheckCircle, AlertCircle, FileText, Eye, EyeOff, ExternalLink } from "lucide-react";

interface CmsPage {
  id?: number;
  title: string;
  slug: string;
  content: string;
  active: boolean;
  showInNav: boolean;
  sortOrder: number;
}

export default function AdminPagesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

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

  const loadPages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/pages");
      setPages(await res.json());
    } catch { flash("error", "Failed to load pages"); }
    finally { setLoading(false); }
  }, [token, apiFetch]);

  useEffect(() => { if (token) loadPages(); }, [token, loadPages]);

  const openNew = () => {
    setEditing({ title: "", slug: "", content: "", active: true, showInNav: false, sortOrder: 0 });
  };

  const savePage = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim()) { flash("error", "Title and slug are required"); return; }
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const body = editing.id ? { ...editing } : { ...editing };
      const res = await apiFetch("/api/admin/pages", { method, body: JSON.stringify(body) });
      if (res.ok) {
        flash("success", editing.id ? "Page updated" : "Page created");
        setEditing(null);
        loadPages();
      } else {
        const data = await res.json();
        flash("error", data.error || "Failed");
      }
    } catch { flash("error", "Failed to save page"); }
    finally { setSaving(false); }
  };

  const deletePage = async (id: number) => {
    if (!confirm("Delete this page?")) return;
    try {
      await apiFetch("/api/admin/pages", { method: "DELETE", body: JSON.stringify({ id }) });
      flash("success", "Page deleted");
      if (editing?.id === id) setEditing(null);
      loadPages();
    } catch { flash("error", "Failed to delete"); }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Pages</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Create and manage custom pages</p>
        </div>
        <button onClick={openNew} className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Page
        </button>
      </div>

      {message.text && (
        <div className={`mb-5 p-3 rounded-lg flex items-center gap-2.5 text-sm ${
          message.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {editing && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 mb-5">
          <h2 className="text-sm font-semibold mb-4">{editing.id ? "Edit Page" : "New Page"}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title</label>
                <input type="text" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Page Title" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Slug (URL path)</label>
                <div className="flex items-center">
                  <span className="text-xs text-[#94a3b8] mr-1">/page/</span>
                  <input type="text" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="terms-of-service" className="input-field flex-1" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Content (HTML)</label>
              <textarea
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                rows={10}
                placeholder="<h2>Page Title</h2><p>Your content here...</p>"
                className="input-field resize-y font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="rounded border-[#cbd5e1] text-[#7c3aed]" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                <input type="checkbox" checked={editing.showInNav} onChange={(e) => setEditing({ ...editing, showInNav: e.target.checked })} className="rounded border-[#cbd5e1] text-[#7c3aed]" />
                Show in Navigation
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#64748b]">Sort:</label>
                <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} className="input-field w-20 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={savePage} disabled={saving} className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : editing.id ? "Update Page" : "Create Page"}
              </button>
              <button onClick={() => setEditing(null)} className="bg-white border border-[#e2e8f0] text-[#64748b] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f8fafc] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" /></div>
      ) : pages.length === 0 && !editing ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center">
          <FileText className="h-12 w-12 text-[#cbd5e1] mx-auto mb-3" />
          <p className="text-[#94a3b8] mb-3">No pages yet</p>
          <button onClick={openNew} className="text-sm text-[#7c3aed] font-semibold hover:underline">Create your first page</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          {pages.map((page, i) => (
            <div key={page.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-[#f8fafc] transition-all ${i > 0 ? "border-t border-[#e2e8f0]" : ""}`}>
              <FileText className="h-4 w-4 text-[#94a3b8] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{page.title}</span>
                  {!page.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Hidden</span>}
                  {page.showInNav && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">In Nav</span>}
                </div>
                <p className="text-xs text-[#94a3b8]">/page/{page.slug}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setEditing(page)} className="text-xs px-2.5 py-1 rounded-md bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-all">Edit</button>
                <button onClick={() => page.id && deletePage(page.id)} className="p-1.5 rounded hover:bg-red-50 transition-all">
                  <Trash2 className="h-3.5 w-3.5 text-[#94a3b8] hover:text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
