"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Package,
  CheckCircle,
  AlertCircle,
  GripVertical,
} from "lucide-react";

interface PricingTier {
  id?: number;
  name: string;
  price: number;
  period: string;
  features: string[];
  sortOrder: number;
  active: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  features: string[];
  tiers: PricingTier[];
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
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
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) { router.push("/admin"); throw new Error("Session expired"); }
    return res;
  }, [token, router]);

  const loadProduct = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/product");
      const data = await res.json();
      if (typeof data.features === "string") { try { data.features = JSON.parse(data.features); } catch { data.features = []; } }
      if (data.tiers) {
        data.tiers = data.tiers.map((t: PricingTier & { features: string | string[] }) => ({
          ...t,
          features: typeof t.features === "string" ? (() => { try { return JSON.parse(t.features as string); } catch { return []; } })() : (t.features || []),
        }));
      }
      setProduct(data);
    } catch { flash("error", "Failed to load product"); }
    finally { setLoading(false); }
  }, [token, apiFetch]);

  useEffect(() => { if (token) loadProduct(); }, [token, loadProduct]);

  const saveProduct = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const payload = {
        name: product.name,
        description: product.description,
        features: product.features,
        tiers: product.tiers.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          period: t.period,
          features: t.features,
          sortOrder: t.sortOrder,
          active: t.active,
        })),
      };
      const res = await apiFetch("/api/admin/product", { method: "PUT", body: JSON.stringify(payload) });
      if (res.ok) { flash("success", "Product saved successfully"); loadProduct(); }
      else { const data = await res.json(); flash("error", data.error || "Failed to save"); }
    } catch { flash("error", "Failed to save product"); }
    finally { setSaving(false); }
  };

  const updateTier = (index: number, field: string, value: unknown) => {
    if (!product) return;
    const tiers = [...product.tiers];
    (tiers[index] as unknown as Record<string, unknown>)[field] = value;
    setProduct({ ...product, tiers });
  };

  const addTier = () => {
    if (!product) return;
    setProduct({
      ...product,
      tiers: [...product.tiers, {
        name: "New Plan",
        price: 0,
        period: "monthly",
        features: [],
        sortOrder: product.tiers.length + 1,
        active: true,
      }],
    });
  };

  const removeTier = (index: number) => {
    if (!product) return;
    setProduct({ ...product, tiers: product.tiers.filter((_, i) => i !== index) });
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Products</h1>
        <button onClick={saveProduct} disabled={saving || loading} className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save All"}
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
      ) : !product ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center">
          <Package className="h-12 w-12 text-[#cbd5e1] mx-auto mb-3" />
          <p className="text-[#94a3b8]">No product found</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Product Info */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <h2 className="text-sm font-semibold mb-4">Product Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Product Name</label>
                <input type="text" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input type="text" value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold">Pricing Plans ({product.tiers.length})</h2>
              <button onClick={addTier} className="bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#f1f5f9] transition-all flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Plan
              </button>
            </div>

            {product.tiers.length === 0 ? (
              <div className="py-8 text-center text-[#94a3b8] text-sm border border-dashed border-[#e2e8f0] rounded-lg">
                No plans yet. Click &quot;Add Plan&quot; to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {product.tiers.map((tier, index) => (
                  <div key={tier.id || `new-${index}`} className="border border-[#e2e8f0] rounded-xl p-5 bg-[#f8fafc]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-[#cbd5e1]" />
                        <h3 className="text-sm font-semibold">
                          {tier.name || "Unnamed"}
                          {!tier.id && <span className="ml-2 text-xs text-[#7c3aed] bg-[#7c3aed]/8 px-2 py-0.5 rounded-full">New</span>}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-[#64748b] cursor-pointer">
                          <input type="checkbox" checked={tier.active} onChange={(e) => updateTier(index, "active", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed] focus:ring-[#7c3aed]" />
                          Active
                        </label>
                        <button onClick={() => removeTier(index)} className="text-[#94a3b8] hover:text-red-500 transition-colors p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-[#64748b] mb-1">Plan Name</label>
                        <input type="text" value={tier.name} onChange={(e) => updateTier(index, "name", e.target.value)} className="input-field" placeholder="e.g. Basic HD" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#64748b] mb-1">Price ($)</label>
                        <input type="number" step="0.01" value={tier.price} onChange={(e) => updateTier(index, "price", parseFloat(e.target.value) || 0)} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#64748b] mb-1">Billing Period</label>
                        <select value={tier.period} onChange={(e) => updateTier(index, "period", e.target.value)} className="input-field cursor-pointer">
                          <option value="monthly">Monthly (1 mo)</option>
                          <option value="quarterly">Quarterly (3 mo)</option>
                          <option value="semiannual">Semi-Annual (6 mo)</option>
                          <option value="yearly">Yearly (12 mo)</option>
                          <option value="lifetime">Lifetime</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#64748b] mb-1">Sort Order</label>
                        <input type="number" value={tier.sortOrder} onChange={(e) => updateTier(index, "sortOrder", parseInt(e.target.value) || 0)} className="input-field" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#64748b] mb-1">Features (one per line)</label>
                      <textarea
                        value={Array.isArray(tier.features) ? tier.features.join("\n") : ""}
                        onChange={(e) => updateTier(index, "features", e.target.value.split("\n").filter((f) => f.trim()))}
                        rows={3}
                        placeholder="Full platform engine access&#10;All streaming protocols&#10;24/7 Support"
                        className="input-field resize-y font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
