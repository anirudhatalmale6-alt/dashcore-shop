"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import Image from "next/image";
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Globe,
  Share2,
  ImageIcon,
} from "lucide-react";

interface SeoData {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  faviconUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string;
}

function ImageUploader({
  label,
  hint,
  value,
  onChange,
  token,
  accept,
  previewSize,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  token: string;
  accept?: string;
  previewSize?: { w: number; h: number };
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const pw = previewSize?.w || 200;
  const ph = previewSize?.h || 200;

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <p className="text-xs text-[#94a3b8] mb-2">{hint}</p>

      {value ? (
        <div className="flex items-start gap-3">
          <div
            className="border border-[#e2e8f0] rounded-lg overflow-hidden bg-[#f8fafc] flex items-center justify-center"
            style={{ width: pw, height: ph }}
          >
            <Image
              src={value}
              alt={label}
              width={pw}
              height={ph}
              className="object-contain"
              style={{ maxWidth: pw, maxHeight: ph }}
              unoptimized
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-[#7c3aed] hover:underline font-medium"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-red-500 hover:underline font-medium flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[#cbd5e1] hover:border-[#7c3aed] hover:bg-[#7c3aed]/3 transition-all text-sm text-[#64748b] hover:text-[#7c3aed]"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={accept || "image/*"}
        className="hidden"
        onChange={handleUpload}
      />

      {error && (
        <p className="text-xs text-red-500 mt-1.5">{error}</p>
      )}

      {value && (
        <p className="text-xs text-[#94a3b8] mt-1.5 truncate max-w-xs">
          {value}
        </p>
      )}
    </div>
  );
}

export default function AdminSeoPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [seo, setSeo] = useState<SeoData>({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    faviconUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImageUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const t = localStorage.getItem("dashcore_admin_token");
    if (!t) {
      router.push("/admin");
      return;
    }
    setToken(t);
  }, [router]);

  const flash = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        router.push("/admin");
        throw new Error("Session expired");
      }
      return res;
    },
    [token, router]
  );

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
        faviconUrl: data.faviconUrl || "",
        ogTitle: data.ogTitle || "",
        ogDescription: data.ogDescription || "",
        ogImageUrl: data.ogImageUrl || "",
        twitterTitle: data.twitterTitle || "",
        twitterDescription: data.twitterDescription || "",
        twitterImageUrl: data.twitterImageUrl || "",
      });
    } catch {
      flash("error", "Failed to load SEO settings");
    } finally {
      setLoading(false);
    }
  }, [token, apiFetch]);

  useEffect(() => {
    if (token) loadSeo();
  }, [token, loadSeo]);

  const saveSeo = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(seo),
      });
      if (res.ok) {
        flash("success", "SEO settings saved");
      } else {
        const data = await res.json();
        flash("error", data.error || "Failed");
      }
    } catch {
      flash("error", "Failed to save SEO settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">SEO Settings</h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            Search engine, social media, and branding settings
          </p>
        </div>
        <button
          onClick={saveSeo}
          disabled={saving || loading}
          className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save SEO"}
        </button>
      </div>

      {message.text && (
        <div
          className={`mb-5 p-3 rounded-lg flex items-center gap-2.5 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Favicon */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-4 w-4 text-[#7c3aed]" />
              <h2 className="text-sm font-semibold">Favicon</h2>
            </div>
            {token && (
              <ImageUploader
                label="Site Favicon"
                hint="Upload your favicon (ICO, PNG, or SVG). Recommended: 32x32 or 64x64 pixels."
                value={seo.faviconUrl}
                onChange={(url) => setSeo({ ...seo, faviconUrl: url })}
                token={token}
                accept=".ico,.png,.svg,.webp,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/webp"
                previewSize={{ w: 64, h: 64 }}
              />
            )}
          </div>

          {/* General SEO */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-[#7c3aed]" />
              <h2 className="text-sm font-semibold">
                Search Engine Optimization
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={seo.metaTitle}
                  onChange={(e) =>
                    setSeo({ ...seo, metaTitle: e.target.value })
                  }
                  placeholder="DashCore | IPTV Platform Engine"
                  className="input-field"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Browser tab title and search engine title ({seo.metaTitle.length}/60 characters)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Meta Description
                </label>
                <textarea
                  value={seo.metaDescription}
                  onChange={(e) =>
                    setSeo({ ...seo, metaDescription: e.target.value })
                  }
                  rows={3}
                  placeholder="Renew your DashCore IPTV platform engine license..."
                  className="input-field resize-y"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Shown in search results ({seo.metaDescription.length}/160 characters recommended)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  value={seo.metaKeywords}
                  onChange={(e) =>
                    setSeo({ ...seo, metaKeywords: e.target.value })
                  }
                  placeholder="IPTV, streaming, platform engine, license, DashCore"
                  className="input-field"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Comma-separated keywords for search engines
                </p>
              </div>
            </div>
          </div>

          {/* Facebook / Open Graph */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-4 w-4 text-[#1877f2]" />
              <h2 className="text-sm font-semibold">
                Facebook / Open Graph
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  OG Title
                </label>
                <input
                  type="text"
                  value={seo.ogTitle}
                  onChange={(e) =>
                    setSeo({ ...seo, ogTitle: e.target.value })
                  }
                  placeholder="DashCore - IPTV Platform Engine"
                  className="input-field"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Title shown when shared on Facebook and other platforms
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  OG Description
                </label>
                <textarea
                  value={seo.ogDescription}
                  onChange={(e) =>
                    setSeo({ ...seo, ogDescription: e.target.value })
                  }
                  rows={2}
                  placeholder="Renew your DashCore IPTV platform engine license..."
                  className="input-field resize-y"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Description shown when shared on Facebook
                </p>
              </div>
              {token && (
                <ImageUploader
                  label="OG Image"
                  hint="Upload the image shown when shared on Facebook. Recommended: 1200x630 pixels (PNG or JPG)."
                  value={seo.ogImageUrl}
                  onChange={(url) => setSeo({ ...seo, ogImageUrl: url })}
                  token={token}
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  previewSize={{ w: 300, h: 157 }}
                />
              )}

              {(seo.ogTitle || seo.ogDescription || seo.ogImageUrl) && (
                <div className="mt-2 p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                  <p className="text-xs text-[#94a3b8] mb-2 font-medium">
                    Facebook Preview:
                  </p>
                  <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden max-w-sm">
                    {seo.ogImageUrl ? (
                      <div className="h-40 bg-[#f1f5f9] flex items-center justify-center overflow-hidden">
                        <Image
                          src={seo.ogImageUrl}
                          alt="OG preview"
                          width={400}
                          height={210}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-[#f1f5f9] flex items-center justify-center text-xs text-[#94a3b8]">
                        No image uploaded
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs text-[#94a3b8] uppercase">
                        dashcore.eu
                      </p>
                      <p className="text-sm font-semibold">
                        {seo.ogTitle || seo.metaTitle || "DashCore"}
                      </p>
                      <p className="text-xs text-[#64748b] mt-0.5 line-clamp-2">
                        {seo.ogDescription ||
                          seo.metaDescription ||
                          "No description set"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Twitter Card */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-4 w-4 text-[#0f172a]" />
              <h2 className="text-sm font-semibold">Twitter Card</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Twitter Title
                </label>
                <input
                  type="text"
                  value={seo.twitterTitle}
                  onChange={(e) =>
                    setSeo({ ...seo, twitterTitle: e.target.value })
                  }
                  placeholder="DashCore - IPTV Platform Engine"
                  className="input-field"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Title shown in Twitter card when link is shared
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Twitter Description
                </label>
                <textarea
                  value={seo.twitterDescription}
                  onChange={(e) =>
                    setSeo({ ...seo, twitterDescription: e.target.value })
                  }
                  rows={2}
                  placeholder="Renew your DashCore IPTV platform engine license..."
                  className="input-field resize-y"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Description shown in Twitter card
                </p>
              </div>
              {token && (
                <ImageUploader
                  label="Twitter Card Image"
                  hint="Upload the image shown in Twitter cards. Recommended: 1200x600 pixels (PNG or JPG)."
                  value={seo.twitterImageUrl}
                  onChange={(url) =>
                    setSeo({ ...seo, twitterImageUrl: url })
                  }
                  token={token}
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  previewSize={{ w: 300, h: 150 }}
                />
              )}

              {(seo.twitterTitle ||
                seo.twitterDescription ||
                seo.twitterImageUrl) && (
                <div className="mt-2 p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                  <p className="text-xs text-[#94a3b8] mb-2 font-medium">
                    Twitter Preview:
                  </p>
                  <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden max-w-sm">
                    {seo.twitterImageUrl ? (
                      <div className="h-40 bg-[#f1f5f9] flex items-center justify-center overflow-hidden">
                        <Image
                          src={seo.twitterImageUrl}
                          alt="Twitter preview"
                          width={400}
                          height={200}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-[#f1f5f9] flex items-center justify-center text-xs text-[#94a3b8]">
                        No image uploaded
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-semibold">
                        {seo.twitterTitle || seo.metaTitle || "DashCore"}
                      </p>
                      <p className="text-xs text-[#64748b] mt-0.5 line-clamp-2">
                        {seo.twitterDescription ||
                          seo.metaDescription ||
                          "No description set"}
                      </p>
                      <p className="text-xs text-[#94a3b8] mt-1">
                        dashcore.eu
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
