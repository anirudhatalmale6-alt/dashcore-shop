"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowRight, Star, Zap, Crown, Shield, Loader2, CheckCircle2, Lock } from "lucide-react";

interface Choice {
  label: string;
  priceAdd: number;
}

interface ProductOption {
  id: number;
  name: string;
  choices: Choice[];
  required: boolean;
}

interface PricingTier {
  id: number;
  name: string;
  price: number;
  period: string;
  features: string[];
  active: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  features: string[];
  badge: string;
  badgeColor: string;
  featured: boolean;
  tiers: PricingTier[];
  options: ProductOption[];
}

function periodLabel(period: string): string {
  switch (period) {
    case "monthly": return "1 month";
    case "quarterly": return "3 months";
    case "semiannual": return "6 months";
    case "yearly": return "1 year";
    case "lifetime": return "lifetime";
    default: return period;
  }
}

const badgeIcons: Record<string, typeof Zap> = {
  teal: Zap,
  purple: Star,
  gold: Crown,
  blue: Shield,
  red: Zap,
};

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

function ProductRow({ product }: { product: Product }) {
  const activeTiers = product.tiers.filter((t) => t.active);
  const [selectedTier, setSelectedTier] = useState(activeTiers[0]?.id || 0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    product.options.forEach((opt) => {
      const choices = parseChoices(opt.choices);
      if (choices.length > 0) init[opt.name] = 0;
    });
    return init;
  });

  const tier = activeTiers.find((t) => t.id === selectedTier) || activeTiers[0];
  if (!tier) return null;

  const basePrice = tier.price;
  const optionsAdd = product.options.reduce((sum, opt) => {
    const choices = parseChoices(opt.choices);
    const idx = selectedOptions[opt.name] || 0;
    return sum + (choices[idx]?.priceAdd || 0);
  }, 0);
  const totalPrice = basePrice + optionsAdd;

  const features = parseFeatures(tier.features).length > 0
    ? parseFeatures(tier.features)
    : parseFeatures(product.features);

  const BadgeIcon = badgeIcons[product.badgeColor] || Star;

  const checkoutParams = new URLSearchParams();
  checkoutParams.set("tier", String(tier.id));
  product.options.forEach((opt) => {
    const choices = parseChoices(opt.choices);
    const idx = selectedOptions[opt.name] || 0;
    if (choices[idx]) {
      checkoutParams.set(`opt_${opt.name}`, choices[idx].label);
      if (choices[idx].priceAdd) checkoutParams.set(`optprice_${opt.name}`, String(choices[idx].priceAdd));
      if ((choices[idx] as Choice & { oneTime?: boolean }).oneTime) checkoutParams.set(`optonce_${opt.name}`, "1");
    }
  });

  return (
    <div className={`feature-card !p-0 overflow-hidden ${product.featured ? "!border-[#6366f1]" : ""}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left - Product Info */}
        <div className="p-7 sm:p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            {product.badge && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                product.badgeColor === "teal" ? "bg-teal-50 text-teal-700 border border-teal-200" :
                product.badgeColor === "gold" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                product.badgeColor === "blue" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                product.badgeColor === "red" ? "bg-red-50 text-red-700 border border-red-200" :
                "bg-purple-50 text-purple-700 border border-purple-200"
              }`}>
                <BadgeIcon className="h-3 w-3" />
                {product.badge}
              </span>
            )}
            {product.featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#6366f1] text-white">
                Popular
              </span>
            )}
          </div>

          <h3 className="text-2xl font-extrabold text-[#0f172a] mb-1" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-[#64748b] mb-5 leading-relaxed">{product.description}</p>
          )}

          <ul className="flex-1 space-y-2.5">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#111827]">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#10b981]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right - Options & Pricing */}
        <div className="bg-[#f8fafc] border-t lg:border-t-0 lg:border-l border-[#e5e7eb] p-7 sm:p-8 flex flex-col">
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-extrabold text-[#6366f1]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              ${totalPrice}
            </span>
            {tier.period !== "lifetime" && (
              <span className="text-sm text-[#94a3b8] ml-1">/ {periodLabel(tier.period)}</span>
            )}
          </div>

          {activeTiers.length > 1 && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#0f172a] mb-1.5 uppercase tracking-wider">Duration</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(Number(e.target.value))}
                className="input-field text-sm cursor-pointer"
              >
                {activeTiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} - ${t.price}/{periodLabel(t.period)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {product.options.map((opt) => {
            const choices = parseChoices(opt.choices);
            if (choices.length === 0) return null;
            return (
              <div key={opt.id} className="mb-4">
                <label className="block text-xs font-semibold text-[#0f172a] mb-1.5 uppercase tracking-wider">{opt.name}</label>
                <select
                  value={selectedOptions[opt.name] || 0}
                  onChange={(e) => setSelectedOptions((prev) => ({ ...prev, [opt.name]: Number(e.target.value) }))}
                  className="input-field text-sm cursor-pointer"
                >
                  {choices.map((c, i) => (
                    <option key={i} value={i}>
                      {c.label}{c.priceAdd > 0 ? ` (+$${c.priceAdd}${(c as Choice & { oneTime?: boolean }).oneTime ? " one-time" : ""})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          <div className="mt-auto pt-4">
            <Link
              href={`/checkout?${checkoutParams.toString()}`}
              className="btn-glow w-full flex items-center justify-center gap-2 text-center"
            >
              Select Plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PageSettings {
  pricingPageTitle: string;
  pricingPageSubtitle: string;
  hidePricingForGuests: boolean;
}

export default function PricingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<PageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("customer_token"));
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .catch(() => {});
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pricingHidden = settings?.hidePricingForGuests && !isLoggedIn;

  return (
    <div>
      <section className="hero-section !py-0 !pt-[160px] !pb-[60px]">
        <div className="floating-shape shape-1" />
        <div className="floating-shape shape-2" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/15 px-4 py-1.5 mb-5">
            <span className="h-2 w-2 rounded-full bg-[#10b981] pulse-dot" />
            <span className="text-xs font-semibold text-[#6366f1] tracking-wide uppercase">
              License Renewal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0f172a]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            {(settings?.pricingPageTitle || "Choose Your License Plan").split(" ").slice(0, -2).join(" ")}{" "}
            <span className="hero-title-gradient">
              {(settings?.pricingPageTitle || "Choose Your License Plan").split(" ").slice(-2).join(" ")}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#64748b] leading-relaxed">
            {settings?.pricingPageSubtitle || "Renew your DashCore platform engine license. Choose the plan that fits your needs."}
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 pt-8">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          {pricingHidden ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#6366f1]/10 mb-5">
                <Lock className="h-7 w-7 text-[#6366f1]" />
              </div>
              <h2 className="text-xl font-bold text-[#0f172a] mb-2">Sign in to view pricing</h2>
              <p className="text-[#64748b] mb-6 max-w-md mx-auto">
                Create an account or sign in to view our plans and pricing.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/login" className="btn-primary text-sm">Sign In</Link>
                <Link href="/register" className="btn-outline text-sm">Create Account</Link>
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#6366f1]" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#64748b]">No products available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {products.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center space-y-1.5">
            <p className="text-sm text-[#64748b]">
              All licenses include full platform access, SSL encryption, and 30-day money-back guarantee.
            </p>
            <p className="text-sm text-[#64748b]">
              Need a custom arrangement?{" "}
              <Link href="/contact" className="text-[#6366f1] hover:underline underline-offset-4 font-semibold">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
