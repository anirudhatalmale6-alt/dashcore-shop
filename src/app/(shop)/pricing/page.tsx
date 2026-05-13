"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowRight, Star, Zap, Crown, Shield, Loader2 } from "lucide-react";

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

const badgeClasses: Record<string, string> = {
  teal: "bg-teal-50 text-teal-700 border border-teal-200",
  purple: "bg-purple-50 text-purple-700 border border-purple-200",
  gold: "bg-amber-50 text-amber-700 border border-amber-200",
  blue: "bg-blue-50 text-blue-700 border border-blue-200",
  red: "bg-red-50 text-red-700 border border-red-200",
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

function ProductCard({ product }: { product: Product }) {
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
  const badgeCls = badgeClasses[product.badgeColor] || badgeClasses.purple;

  const checkoutParams = new URLSearchParams();
  checkoutParams.set("tier", String(tier.id));
  product.options.forEach((opt) => {
    const choices = parseChoices(opt.choices);
    const idx = selectedOptions[opt.name] || 0;
    if (choices[idx]) checkoutParams.set(`opt_${opt.name}`, choices[idx].label);
  });

  return (
    <div className={`relative flex flex-col ${product.featured ? "card-featured" : "card"} p-7 sm:p-8`}>
      {product.badge && (
        <div className="flex items-center justify-between mb-5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeCls}`}>
            {product.badge}
          </span>
          <BadgeIcon className={`h-5 w-5 opacity-40 ${
            product.badgeColor === "teal" ? "text-teal-500" :
            product.badgeColor === "gold" ? "text-amber-500" :
            product.badgeColor === "blue" ? "text-blue-500" :
            "text-purple-500"
          }`} />
        </div>
      )}

      <h3 className="text-xl font-extrabold text-[#0f172a]">{product.name}</h3>
      {product.description && (
        <p className="text-xs text-[#64748b] mt-0.5">{product.description}</p>
      )}

      <div className="flex items-baseline gap-1 mt-4 mb-4">
        <span className="text-4xl font-extrabold text-[#0f172a]">${totalPrice}</span>
        {tier.period !== "lifetime" && (
          <span className="text-sm text-[#94a3b8]">/{periodLabel(tier.period)}</span>
        )}
      </div>

      {/* Duration selector */}
      {activeTiers.length > 1 && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-[#64748b] mb-1.5">Duration</label>
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

      {/* Configurable options */}
      {product.options.map((opt) => {
        const choices = parseChoices(opt.choices);
        if (choices.length === 0) return null;
        return (
          <div key={opt.id} className="mb-3">
            <label className="block text-xs font-medium text-[#64748b] mb-1.5">{opt.name}</label>
            <select
              value={selectedOptions[opt.name] || 0}
              onChange={(e) => setSelectedOptions((prev) => ({ ...prev, [opt.name]: Number(e.target.value) }))}
              className="input-field text-sm cursor-pointer"
            >
              {choices.map((c, i) => (
                <option key={i} value={i}>
                  {c.label}{c.priceAdd > 0 ? ` (+$${c.priceAdd})` : ""}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      <div className="border-t border-[#e2e8f0] mb-5 mt-2" />

      <ul className="flex-1 space-y-2.5">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-[#475569]">
            <Check className="h-4 w-4 shrink-0 mt-0.5 text-[#06b6d4]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7">
        <Link
          href={`/checkout?${checkoutParams.toString()}`}
          className={`flex items-center justify-center gap-2 w-full rounded-xl py-3.5 px-6 font-bold text-sm transition-all ${
            product.featured ? "btn-glow" : "btn-primary"
          }`}
        >
          Select Plan
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="hero-light relative pt-28 pb-14 sm:pt-36 sm:pb-18">
        <div className="hero-pattern" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/8 border border-[#7c3aed]/15 px-4 py-1.5 mb-5">
            <span className="h-2 w-2 rounded-full bg-[#06b6d4] pulse-dot" />
            <span className="text-xs font-semibold text-[#7c3aed] tracking-wide uppercase">
              License Renewal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0f172a]">
            Choose Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]">
              License Plan
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#64748b] leading-relaxed">
            Renew your DashCore platform engine license. Choose the plan that fits your needs.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 -mt-8 relative z-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#64748b]">No products available yet. Check back soon!</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-5 lg:gap-6 ${
              products.length === 1 ? "max-w-md mx-auto" :
              products.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" :
              products.length === 3 ? "md:grid-cols-3 max-w-5xl mx-auto" :
              "md:grid-cols-2 lg:grid-cols-3"
            }`}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center space-y-1.5">
            <p className="text-sm text-[#64748b]">
              All licenses include full platform access, SSL encryption, and 30-day money-back guarantee.
            </p>
            <p className="text-sm text-[#64748b]">
              Need a custom arrangement?{" "}
              <Link href="/contact" className="text-[#7c3aed] hover:underline underline-offset-4 font-semibold">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
