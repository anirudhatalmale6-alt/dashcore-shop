"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface PaymentSettings {
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
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
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
      const data = await res.json();
      setSettings({
        stripeEnabled: data.stripeEnabled || false,
        stripePublicKey: data.stripePublicKey || "",
        stripeSecretKey: data.stripeSecretKey || "",
        multisafepayEnabled: data.multisafepayEnabled || false,
        multisafepayApiKey: data.multisafepayApiKey || "",
        cryptoEnabled: data.cryptoEnabled || false,
        btcAddress: data.btcAddress || "",
        usdtAddress: data.usdtAddress || "",
        usdcAddress: data.usdcAddress || "",
        ethAddress: data.ethAddress || "",
      });
    } catch { flash("error", "Failed to load payment settings"); }
    finally { setLoading(false); }
  }, [token, apiFetch]);

  useEffect(() => { if (token) loadSettings(); }, [token, loadSettings]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify(settings) });
      if (res.ok) flash("success", "Payment settings saved");
      else { const d = await res.json(); flash("error", d.error || "Failed"); }
    } catch { flash("error", "Failed to save"); }
    finally { setSaving(false); }
  };

  const set = (field: string, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Payment Settings</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Configure payment gateways and crypto wallets</p>
        </div>
        <button onClick={save} disabled={saving || loading} className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Payments"}
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

      {loading || !settings ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" /></div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Stripe</h2>
              <label className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                <input type="checkbox" checked={settings.stripeEnabled} onChange={(e) => set("stripeEnabled", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed]" />
                Enabled
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Public Key</label>
                <input type="text" value={settings.stripePublicKey} onChange={(e) => set("stripePublicKey", e.target.value)} placeholder="pk_..." className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Secret Key</label>
                <input type="password" value={settings.stripeSecretKey} onChange={(e) => set("stripeSecretKey", e.target.value)} placeholder="sk_..." className="input-field font-mono text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">MultiSafepay</h2>
              <label className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                <input type="checkbox" checked={settings.multisafepayEnabled} onChange={(e) => set("multisafepayEnabled", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed]" />
                Enabled
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">API Key</label>
              <input type="password" value={settings.multisafepayApiKey} onChange={(e) => set("multisafepayApiKey", e.target.value)} placeholder="Enter API key" className="input-field font-mono text-xs" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Cryptocurrency</h2>
              <label className="flex items-center gap-2 text-sm text-[#64748b] cursor-pointer">
                <input type="checkbox" checked={settings.cryptoEnabled} onChange={(e) => set("cryptoEnabled", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed]" />
                Enabled
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">BTC Address</label>
                <input type="text" value={settings.btcAddress} onChange={(e) => set("btcAddress", e.target.value)} placeholder="bc1q..." className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">USDT (TRC-20)</label>
                <input type="text" value={settings.usdtAddress} onChange={(e) => set("usdtAddress", e.target.value)} placeholder="T..." className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">USDC (ERC-20)</label>
                <input type="text" value={settings.usdcAddress} onChange={(e) => set("usdcAddress", e.target.value)} placeholder="0x..." className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ETH Address</label>
                <input type="text" value={settings.ethAddress} onChange={(e) => set("ethAddress", e.target.value)} placeholder="0x..." className="input-field font-mono text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
