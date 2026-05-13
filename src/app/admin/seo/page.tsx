"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface SeoData {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImageUrl: string;
}

export default function AdminSeoPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [seo, setSeo] = useState<SeoData>({ metaTitle: "", metaDescription: "", metaKeywords: "", ogImageUrl: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const loadSeo = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/settings");
      const data = await res.json();
      setSeo({
        metaTitle: data.metaTitle || "",
        metaDescription: data.metaDescription || "",
        metaKeywords: data.metaKeywords || "",
        ogImageUrl: data.ogImageUrl || "",
      });
    } catch { flash("error", "Failed to load SEO settings"); }
    finally { setLoading(false); }
  }, [token, apiFetch]);

  useEffect(() => { if (token) loadSeo(); }, [token, loadSeo]);

  const saveSeo = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify(seo) });
      if (res.ok) { flash("success", "SEO settings saved"); }
      else { const data = await res.json(); flash("error", data.error || "Failed"); }
    } catch { flash("error", "Failed to save SEO settings"); }
    finally { setSaving(false); }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">SEO Settings</h1>
        <button onClick={saveSeo} disabled={saving || loading} className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save SEO"}
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

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" /></div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <h2 className="text-sm font-semibold mb-4">Search Engine Optimization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Title</label>
                <input type="text" value={seo.metaTitle} onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })} placeholder="DashCore | IPTV Platform Engine" className="input-field" />
                <p className="text-xs text-[#94a3b8] mt-1">Browser tab title and search engine title (max 60 characters)</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Description</label>
                <textarea value={seo.metaDescription} onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })} rows={3} placeholder="Renew your DashCore IPTV platform engine license..." className="input-field resize-y" />
                <p className="text-xs text-[#94a3b8] mt-1">Shown in search results (max 160 characters recommended) - {seo.metaDescription.length}/160</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Keywords</label>
                <input type="text" value={seo.metaKeywords} onChange={(e) => setSeo({ ...seo, metaKeywords: e.target.value })} placeholder="IPTV, streaming, platform engine, license, DashCore" className="input-field" />
                <p className="text-xs text-[#94a3b8] mt-1">Comma-separated keywords for search engines</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <h2 className="text-sm font-semibold mb-4">Social Media</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5">Open Graph Image URL</label>
              <input type="url" value={seo.ogImageUrl} onChange={(e) => setSeo({ ...seo, ogImageUrl: e.target.value })} placeholder="https://dashcore.eu/og-image.png" className="input-field" />
              <p className="text-xs text-[#94a3b8] mt-1">Preview image when shared on social media (1200x630px recommended)</p>
            </div>
            {seo.ogImageUrl && (
              <div className="mt-4 p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                <p className="text-xs text-[#94a3b8] mb-2">Preview:</p>
                <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden max-w-sm">
                  <div className="h-40 bg-[#f1f5f9] flex items-center justify-center text-xs text-[#94a3b8]">
                    Image preview: {seo.ogImageUrl.substring(0, 50)}...
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-[#94a3b8] uppercase">dashcore.eu</p>
                    <p className="text-sm font-semibold">{seo.metaTitle || "DashCore"}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{seo.metaDescription ? seo.metaDescription.substring(0, 100) + "..." : "No description set"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
