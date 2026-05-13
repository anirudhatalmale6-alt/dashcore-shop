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
  ChevronDown,
  ChevronUp,
  Settings2,
  List,
  Eye,
  EyeOff,
  Star,
  X,
} from "lucide-react";

interface Choice {
  label: string;
  priceAdd: number;
}

interface ProductOption {
  id?: number;
  name: string;
  choices: Choice[];
  required: boolean;
  sortOrder: number;
}

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
  id?: number;
  name: string;
  description: string;
  features: string[];
  badge: string;
  badgeColor: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  tiers: PricingTier[];
  options: ProductOption[];
}

const BADGE_COLORS = [
  { value: "teal", label: "Teal", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "purple", label: "Purple", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "gold", label: "Gold", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "blue", label: "Blue", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "red", label: "Red", cls: "bg-red-50 text-red-700 border-red-200" },
];

function parseFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

function parseChoices(raw: unknown): Choice[] {
  if (Array.isArray(raw)) return raw as Choice[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Record<number, string>>({});

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

  const loadProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/product");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setProducts(list.map((p: Product) => ({
        ...p,
        features: parseFeatures(p.features),
        tiers: (p.tiers || []).map((t: PricingTier) => ({
          ...t,
          features: parseFeatures(t.features),
        })),
        options: (p.options || []).map((o: ProductOption) => ({
          ...o,
          choices: parseChoices(o.choices),
        })),
      })));
    } catch { flash("error", "Failed to load products"); }
    finally { setLoading(false); }
  }, [token, apiFetch]);

  useEffect(() => { if (token) loadProducts(); }, [token, loadProducts]);

  const addProduct = async () => {
    try {
      const res = await apiFetch("/api/admin/product", {
        method: "POST",
        body: JSON.stringify({ name: "New Product", sortOrder: products.length }),
      });
      if (res.ok) {
        const p = await res.json();
        flash("success", "Product created");
        await loadProducts();
        setExpanded(p.id);
        setActiveTab((prev) => ({ ...prev, [p.id]: "info" }));
      }
    } catch { flash("error", "Failed to create product"); }
  };

  const saveProduct = async (product: Product) => {
    if (!product.id) return;
    setSaving(product.id);
    try {
      const res = await apiFetch("/api/admin/product", {
        method: "PUT",
        body: JSON.stringify({
          id: product.id,
          name: product.name,
          description: product.description,
          features: product.features,
          badge: product.badge,
          badgeColor: product.badgeColor,
          featured: product.featured,
          active: product.active,
          sortOrder: product.sortOrder,
          tiers: product.tiers,
          options: product.options,
        }),
      });
      if (res.ok) {
        flash("success", `"${product.name}" saved`);
        loadProducts();
      } else {
        const data = await res.json();
        flash("error", data.error || "Failed to save");
      }
    } catch { flash("error", "Failed to save product"); }
    finally { setSaving(null); }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product and all its pricing tiers?")) return;
    try {
      const res = await apiFetch("/api/admin/product", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        flash("success", "Product deleted");
        setExpanded(null);
        loadProducts();
      }
    } catch { flash("error", "Failed to delete"); }
  };

  const updateProduct = (index: number, field: string, value: unknown) => {
    setProducts((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const updateTier = (pIndex: number, tIndex: number, field: string, value: unknown) => {
    setProducts((prev) => prev.map((p, i) => {
      if (i !== pIndex) return p;
      const tiers = [...p.tiers];
      (tiers[tIndex] as unknown as Record<string, unknown>)[field] = value;
      return { ...p, tiers };
    }));
  };

  const addTier = (pIndex: number) => {
    setProducts((prev) => prev.map((p, i) => {
      if (i !== pIndex) return p;
      return {
        ...p,
        tiers: [...p.tiers, {
          name: "New Plan",
          price: 0,
          period: "monthly",
          features: [],
          sortOrder: p.tiers.length,
          active: true,
        }],
      };
    }));
  };

  const removeTier = (pIndex: number, tIndex: number) => {
    setProducts((prev) => prev.map((p, i) => {
      if (i !== pIndex) return p;
      return { ...p, tiers: p.tiers.filter((_, j) => j !== tIndex) };
    }));
  };

  const updateOption = (pIndex: number, oIndex: number, field: string, value: unknown) => {
    setProducts((prev) => prev.map((p, i) => {
      if (i !== pIndex) return p;
      const options = [...p.options];
      (options[oIndex] as unknown as Record<string, unknown>)[field] = value;
      return { ...p, options };
    }));
  };

  const addOption = (pIndex: number) => {
    setProducts((prev) => prev.map((p, i) => {
      if (i !== pIndex) return p;
      return {
        ...p,
        options: [...p.options, {
          name: "New Option",
          choices: [{ label: "Default", priceAdd: 0 }],
          required: true,
          sortOrder: p.options.length,
        }],
      };
    }));
  };

  const removeOption = (pIndex: number, oIndex: number) => {
    setProducts((prev) => prev.map((p, i) => {
      if (i !== pIndex) return p;
      return { ...p, options: p.options.filter((_, j) => j !== oIndex) };
    }));
  };

  const addChoice = (pIndex: number, oIndex: number) => {
    setProducts((prev) => prev.map((p, i) => {
      if (i !== pIndex) return p;
      const options = [...p.options];
      options[oIndex] = {
        ...options[oIndex],
        choices: [...options[oIndex].choices, { label: "", priceAdd: 0 }],
      };
      return { ...p, options };
    }));
  };

  const updateChoice = (pIndex: number, oIndex: number, cIndex: number, field: string, value: unknown) => {
    setProducts((prev) => prev.map((p, i) => {
      if (i !== pIndex) return p;
      const options = [...p.options];
      const choices = [...options[oIndex].choices];
      (choices[cIndex] as unknown as Record<string, unknown>)[field] = value;
      options[oIndex] = { ...options[oIndex], choices };
      return { ...p, options };
    }));
  };

  const removeChoice = (pIndex: number, oIndex: number, cIndex: number) => {
    setProducts((prev) => prev.map((p, i) => {
      if (i !== pIndex) return p;
      const options = [...p.options];
      options[oIndex] = {
        ...options[oIndex],
        choices: options[oIndex].choices.filter((_, j) => j !== cIndex),
      };
      return { ...p, options };
    }));
  };

  const getTab = (productId: number) => activeTab[productId] || "info";

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Products</h1>
          <p className="text-sm text-[#64748b] mt-0.5">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={addProduct} className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Product
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
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center">
          <Package className="h-12 w-12 text-[#cbd5e1] mx-auto mb-3" />
          <p className="text-[#94a3b8] mb-3">No products yet</p>
          <button onClick={addProduct} className="text-sm text-[#7c3aed] font-semibold hover:underline">Create your first product</button>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, pIndex) => {
            const isExpanded = expanded === (product.id || pIndex);
            const isSaving = saving === product.id;
            const tab = getTab(product.id || 0);

            return (
              <div key={product.id || `new-${pIndex}`} className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
                {/* Product header */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#f8fafc] transition-all"
                  onClick={() => setExpanded(isExpanded ? null : (product.id || pIndex))}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{product.name || "Unnamed"}</h3>
                      {product.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                          BADGE_COLORS.find((b) => b.value === product.badgeColor)?.cls || "bg-purple-50 text-purple-700 border-purple-200"
                        }`}>{product.badge}</span>
                      )}
                      {product.featured && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                      {!product.active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Hidden</span>
                      )}
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      {product.tiers.length} plan{product.tiers.length !== 1 ? "s" : ""} · {product.options.length} option{product.options.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-[#94a3b8]" /> : <ChevronDown className="h-4 w-4 text-[#94a3b8]" />}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[#e2e8f0]">
                    {/* Tabs */}
                    <div className="flex border-b border-[#e2e8f0] px-5">
                      {[
                        { key: "info", label: "Product Info", icon: Package },
                        { key: "plans", label: `Plans (${product.tiers.length})`, icon: List },
                        { key: "options", label: `Options (${product.options.length})`, icon: Settings2 },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setActiveTab((prev) => ({ ...prev, [product.id || 0]: t.key }))}
                          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
                            tab === t.key
                              ? "border-[#7c3aed] text-[#7c3aed]"
                              : "border-transparent text-[#64748b] hover:text-[#0f172a]"
                          }`}
                        >
                          <t.icon className="h-3.5 w-3.5" />
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-5">
                      {/* Product Info Tab */}
                      {tab === "info" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-[#64748b] mb-1">Product Name</label>
                              <input type="text" value={product.name} onChange={(e) => updateProduct(pIndex, "name", e.target.value)} className="input-field" />
                            </div>
                            <div>
                              <label className="block text-xs text-[#64748b] mb-1">Description</label>
                              <input type="text" value={product.description} onChange={(e) => updateProduct(pIndex, "description", e.target.value)} className="input-field" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs text-[#64748b] mb-1">Badge Text</label>
                              <input type="text" value={product.badge} onChange={(e) => updateProduct(pIndex, "badge", e.target.value)} placeholder="e.g. POPULAR" className="input-field" />
                            </div>
                            <div>
                              <label className="block text-xs text-[#64748b] mb-1">Badge Color</label>
                              <select value={product.badgeColor} onChange={(e) => updateProduct(pIndex, "badgeColor", e.target.value)} className="input-field cursor-pointer">
                                {BADGE_COLORS.map((c) => (
                                  <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[#64748b] mb-1">Sort Order</label>
                              <input type="number" value={product.sortOrder} onChange={(e) => updateProduct(pIndex, "sortOrder", parseInt(e.target.value) || 0)} className="input-field" />
                            </div>
                            <div className="flex items-end gap-4">
                              <label className="flex items-center gap-2 text-xs text-[#64748b] cursor-pointer">
                                <input type="checkbox" checked={product.featured} onChange={(e) => updateProduct(pIndex, "featured", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed]" />
                                Featured
                              </label>
                              <label className="flex items-center gap-2 text-xs text-[#64748b] cursor-pointer">
                                <input type="checkbox" checked={product.active} onChange={(e) => updateProduct(pIndex, "active", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed]" />
                                Active
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-[#64748b] mb-1">Features (one per line)</label>
                            <textarea
                              value={product.features.join("\n")}
                              onChange={(e) => updateProduct(pIndex, "features", e.target.value.split("\n").filter((f) => f.trim()))}
                              rows={4}
                              placeholder="Full platform access&#10;All streaming protocols&#10;24/7 Support"
                              className="input-field resize-y font-mono text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Plans Tab */}
                      {tab === "plans" && (
                        <div>
                          <div className="flex justify-end mb-3">
                            <button onClick={() => addTier(pIndex)} className="bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#f1f5f9] transition-all flex items-center gap-1.5">
                              <Plus className="h-3.5 w-3.5" /> Add Plan
                            </button>
                          </div>

                          {product.tiers.length === 0 ? (
                            <div className="py-8 text-center text-[#94a3b8] text-sm border border-dashed border-[#e2e8f0] rounded-lg">
                              No plans yet. Add a plan to set pricing.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {product.tiers.map((tier, tIndex) => (
                                <div key={tier.id || `new-${tIndex}`} className="border border-[#e2e8f0] rounded-lg p-4 bg-[#f8fafc]">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-semibold">{tier.name || "Unnamed"}</h4>
                                      {!tier.id && <span className="text-[10px] text-[#7c3aed] bg-[#7c3aed]/8 px-1.5 py-0.5 rounded-full">New</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="flex items-center gap-1 text-[10px] text-[#64748b] cursor-pointer">
                                        <input type="checkbox" checked={tier.active} onChange={(e) => updateTier(pIndex, tIndex, "active", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed] h-3 w-3" />
                                        {tier.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                      </label>
                                      <button onClick={() => removeTier(pIndex, tIndex)} className="text-[#94a3b8] hover:text-red-500 transition-colors p-0.5">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-2">
                                    <div>
                                      <label className="block text-[10px] text-[#94a3b8] mb-0.5">Plan Name</label>
                                      <input type="text" value={tier.name} onChange={(e) => updateTier(pIndex, tIndex, "name", e.target.value)} className="input-field text-sm" />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-[#94a3b8] mb-0.5">Price ($)</label>
                                      <input type="number" step="0.01" value={tier.price} onChange={(e) => updateTier(pIndex, tIndex, "price", parseFloat(e.target.value) || 0)} className="input-field text-sm" />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-[#94a3b8] mb-0.5">Billing Period</label>
                                      <select value={tier.period} onChange={(e) => updateTier(pIndex, tIndex, "period", e.target.value)} className="input-field text-sm cursor-pointer">
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly (3 mo)</option>
                                        <option value="semiannual">Semi-Annual (6 mo)</option>
                                        <option value="yearly">Yearly (12 mo)</option>
                                        <option value="lifetime">Lifetime</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-[#94a3b8] mb-0.5">Sort Order</label>
                                      <input type="number" value={tier.sortOrder} onChange={(e) => updateTier(pIndex, tIndex, "sortOrder", parseInt(e.target.value) || 0)} className="input-field text-sm" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-[#94a3b8] mb-0.5">Features (one per line)</label>
                                    <textarea
                                      value={Array.isArray(tier.features) ? tier.features.join("\n") : ""}
                                      onChange={(e) => updateTier(pIndex, tIndex, "features", e.target.value.split("\n").filter((f) => f.trim()))}
                                      rows={2}
                                      placeholder="Feature 1&#10;Feature 2"
                                      className="input-field resize-y font-mono text-xs"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Options Tab */}
                      {tab === "options" && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-[#64748b]">Add configurable options like Connections, Player Type, etc. Each choice can add to the base price.</p>
                            <button onClick={() => addOption(pIndex)} className="bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#f1f5f9] transition-all flex items-center gap-1.5 shrink-0 ml-4">
                              <Plus className="h-3.5 w-3.5" /> Add Option
                            </button>
                          </div>

                          {product.options.length === 0 ? (
                            <div className="py-8 text-center text-[#94a3b8] text-sm border border-dashed border-[#e2e8f0] rounded-lg">
                              No configurable options yet. Add options customers can choose during checkout.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {product.options.map((opt, oIndex) => (
                                <div key={opt.id || `new-opt-${oIndex}`} className="border border-[#e2e8f0] rounded-lg p-4 bg-[#f8fafc]">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div>
                                        <label className="block text-[10px] text-[#94a3b8] mb-0.5">Option Name</label>
                                        <input type="text" value={opt.name} onChange={(e) => updateOption(pIndex, oIndex, "name", e.target.value)} placeholder="e.g. Connections" className="input-field text-sm w-48" />
                                      </div>
                                      <label className="flex items-center gap-1 text-[10px] text-[#64748b] cursor-pointer mt-4">
                                        <input type="checkbox" checked={opt.required} onChange={(e) => updateOption(pIndex, oIndex, "required", e.target.checked)} className="rounded border-[#cbd5e1] text-[#7c3aed] h-3 w-3" />
                                        Required
                                      </label>
                                    </div>
                                    <button onClick={() => removeOption(pIndex, oIndex)} className="text-[#94a3b8] hover:text-red-500 transition-colors p-1">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    <p className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wider">Choices</p>
                                    {opt.choices.map((choice, cIndex) => (
                                      <div key={cIndex} className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={choice.label}
                                          onChange={(e) => updateChoice(pIndex, oIndex, cIndex, "label", e.target.value)}
                                          placeholder="Choice label"
                                          className="input-field text-xs flex-1"
                                        />
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-[#94a3b8]">+$</span>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={choice.priceAdd}
                                            onChange={(e) => updateChoice(pIndex, oIndex, cIndex, "priceAdd", parseFloat(e.target.value) || 0)}
                                            className="input-field text-xs w-20"
                                          />
                                        </div>
                                        <button onClick={() => removeChoice(pIndex, oIndex, cIndex)} className="text-[#94a3b8] hover:text-red-500 p-0.5">
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                    <button onClick={() => addChoice(pIndex, oIndex)} className="text-xs text-[#7c3aed] hover:underline font-medium flex items-center gap-1">
                                      <Plus className="h-3 w-3" /> Add Choice
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer actions */}
                    <div className="flex items-center justify-between px-5 py-3 bg-[#f8fafc] border-t border-[#e2e8f0]">
                      <button
                        onClick={() => product.id && deleteProduct(product.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete Product
                      </button>
                      <button
                        onClick={() => saveProduct(product)}
                        disabled={isSaving}
                        className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {isSaving ? "Saving..." : "Save Product"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
