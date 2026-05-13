import Link from "next/link";
import { Check, ArrowRight, Star, Zap, Crown } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function periodLabel(period: string): string {
  switch (period) {
    case "monthly": return "1 month";
    case "quarterly": return "3 months";
    case "semiannual": return "6 months";
    case "yearly": return "1 year";
    default: return period;
  }
}

const tierStyles = [
  { badge: "badge-teal", badgeIcon: Zap, badgeText: "STARTER", accent: "text-[#06b6d4]" },
  { badge: "badge-purple", badgeIcon: Star, badgeText: "POPULAR", accent: "text-[#7c3aed]" },
  { badge: "badge-gold", badgeIcon: Crown, badgeText: "BEST VALUE", accent: "text-[#d97706]" },
];

export default async function PricingPage() {
  const tiers = await prisma.pricingTier.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      {/* Hero - Light */}
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
              License Duration
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#64748b] leading-relaxed">
            Renew your DashCore platform engine license. Longer durations save more.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 sm:pb-24 -mt-8 relative z-10">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {tiers.map((tier, index) => {
              const isFeatured = index === 2;
              const style = tierStyles[index] || tierStyles[0];
              const features: string[] = (() => {
                try {
                  const raw = tier.features;
                  if (typeof raw === "string") return JSON.parse(raw);
                  if (Array.isArray(raw)) return raw;
                  return [];
                } catch { return []; }
              })();

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col ${
                    isFeatured ? "card-featured" : "card"
                  } p-7 sm:p-8`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className={style.badge}>
                      {style.badgeText}
                    </span>
                    <style.badgeIcon className={`h-5 w-5 ${style.accent} opacity-40`} />
                  </div>

                  <h3 className="text-xl font-extrabold text-[#0f172a]">
                    {tier.name}
                  </h3>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    {periodLabel(tier.period)} license
                  </p>

                  <div className="flex items-baseline gap-1 mt-4 mb-6">
                    <span className="text-4xl font-extrabold text-[#0f172a]">
                      ${Number(tier.price)}
                    </span>
                    <span className="text-sm text-[#94a3b8]">
                      /{periodLabel(tier.period)}
                    </span>
                  </div>

                  <div className="border-t border-[#e2e8f0] mb-5" />

                  <ul className="flex-1 space-y-2.5">
                    {features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-[#475569]">
                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-[#06b6d4]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7">
                    <Link
                      href={`/checkout?tier=${tier.id}`}
                      className={`flex items-center justify-center gap-2 w-full rounded-xl py-3.5 px-6 font-bold text-sm transition-all ${
                        isFeatured
                          ? "btn-glow"
                          : "btn-primary"
                      }`}
                    >
                      Select Plan
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

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
