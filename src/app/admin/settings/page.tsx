"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface SettingsData {
  id: number;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  telegramUrl: string;
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  multisafepayEnabled: boolean;
  multisafepayApiKey: string;
  cryptoEnabled: boolean;
  btcAddress: string;
  usdtAddress: string;
  usdcAddress: string;
  ethAddress: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  confirmEmailSubject: string;
  confirmEmailBody: string;
  vatRate: number;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
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

  const loadSettings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/settings");
      setSettings(await res.json());
    } catch { flash("error", "Failed to load settings"); }
    finally { setLoading(false); }
  }, [token, apiFetch]);

  useEffect(() => { if (token) loadSettings(); }, [token, loadSettings]);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { id, ...payload } = settings;
      void id;
      const res = await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify(payload) });
      if (res.ok) { flash("success", "Settings saved"); loadSettings(); }
      else { const data = await res.json(); flash("error", data.error || "Failed"); }
    } catch { flash("error", "Failed to save settings"); }
    finally { setSaving(false); }
  };

  const s = settings;
  const set = (field: string, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Settings</h1>
        <button onClick={saveSettings} disabled={saving || loading} className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Settings"}
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

      {loading || !s ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" /></div>
      ) : (
        <div className="space-y-5">
          {/* General */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <h2 className="text-sm font-semibold mb-4">General</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Site Name</label>
                <input type="text" value={s.siteName} onChange={(e) => set("siteName", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Contact Email</label>
                <input type="email" value={s.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Telegram URL</label>
                <input type="url" value={s.telegramUrl} onChange={(e) => set("telegramUrl", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">VAT Rate (%)</label>
                <input type="number" step="0.01" value={s.vatRate} onChange={(e) => set("vatRate", parseFloat(e.target.value) || 0)} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Site Description</label>
                <textarea value={s.siteDescription} onChange={(e) => set("siteDescription", e.target.value)} rows={2} className="input-field resize-y" />
              </div>
            </div>
          </div>

          {/* Stripe */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Stripe</h2>
              <label className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                <input type="checkbox" checked={s.stripeEnabled} onChange={(e) => set("stripeEnabled", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed] focus:ring-[#7c3aed]" />
                Enabled
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Public Key</label>
                <input type="text" value={s.stripePublicKey} onChange={(e) => set("stripePublicKey", e.target.value)} placeholder="pk_..." className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Secret Key</label>
                <input type="password" value={s.stripeSecretKey} onChange={(e) => set("stripeSecretKey", e.target.value)} placeholder="sk_..." className="input-field font-mono text-xs" />
              </div>
            </div>
          </div>

          {/* MultiSafepay */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">MultiSafepay</h2>
              <label className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                <input type="checkbox" checked={s.multisafepayEnabled} onChange={(e) => set("multisafepayEnabled", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed] focus:ring-[#7c3aed]" />
                Enabled
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">API Key</label>
              <input type="password" value={s.multisafepayApiKey} onChange={(e) => set("multisafepayApiKey", e.target.value)} placeholder="Enter API key" className="input-field font-mono text-xs" />
            </div>
          </div>

          {/* Crypto */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Cryptocurrency</h2>
              <label className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                <input type="checkbox" checked={s.cryptoEnabled} onChange={(e) => set("cryptoEnabled", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed] focus:ring-[#7c3aed]" />
                Enabled
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">BTC Address</label>
                <input type="text" value={s.btcAddress} onChange={(e) => set("btcAddress", e.target.value)} placeholder="bc1q..." className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">USDT (TRC-20)</label>
                <input type="text" value={s.usdtAddress} onChange={(e) => set("usdtAddress", e.target.value)} placeholder="T..." className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">USDC (ERC-20)</label>
                <input type="text" value={s.usdcAddress} onChange={(e) => set("usdcAddress", e.target.value)} placeholder="0x..." className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ETH Address</label>
                <input type="text" value={s.ethAddress} onChange={(e) => set("ethAddress", e.target.value)} placeholder="0x..." className="input-field font-mono text-xs" />
              </div>
            </div>
          </div>

          {/* SMTP */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <h2 className="text-sm font-semibold mb-4">Email / SMTP</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">SMTP Host</label>
                <input type="text" value={s.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} placeholder="smtp.example.com" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">SMTP Port</label>
                <input type="number" value={s.smtpPort} onChange={(e) => set("smtpPort", parseInt(e.target.value) || 587)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">SMTP User</label>
                <input type="text" value={s.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">SMTP Password</label>
                <input type="password" value={s.smtpPass} onChange={(e) => set("smtpPass", e.target.value)} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">From Address</label>
                <input type="email" value={s.smtpFrom} onChange={(e) => set("smtpFrom", e.target.value)} placeholder="noreply@dashcore.eu" className="input-field" />
              </div>
            </div>
          </div>

          {/* Email Template */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <h2 className="text-sm font-semibold mb-4">Confirmation Email Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Subject</label>
                <input type="text" value={s.confirmEmailSubject} onChange={(e) => set("confirmEmailSubject", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Body (HTML)</label>
                <textarea value={s.confirmEmailBody} onChange={(e) => set("confirmEmailBody", e.target.value)} rows={5} placeholder="<p>Thank you for your order...</p>" className="input-field resize-y font-mono text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
