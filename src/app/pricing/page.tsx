import Link from "next/link";
import { Check, ArrowRight, Star, Zap } from "lucide-react";
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

export default async function PricingPage() {
  const tiers = await prisma.pricingTier.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient relative pt-28 pb-12 sm:pt-36 sm:pb-16">
        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#6d28d9]/8 border border-[#6d28d9]/15 px-4 py-1.5 mb-5">
            <Zap className="h-3.5 w-3.5 text-[#6d28d9]" />
            <span className="text-xs font-semibold text-[#6d28d9] tracking-wide uppercase font-[var(--font-display)]">
              License Renewal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-[var(--font-display)]">
            Choose Your <span className="text-[#6d28d9]">License Duration</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#8c8579] leading-relaxed">
            Renew your DashCore platform engine license. Longer durations save more.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 sm:pb-24 -mt-2">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {tiers.map((tier, index) => {
              const isBest = index === 2;
              const features: string[] = (() => {
                try {
                  const raw = tier.features;
                  if (typeof raw === "string") return JSON.parse(raw);
                  if (Array.isArray(raw)) return raw;
                  return [];
                } catch {
                  return [];
                }
              })();

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl p-7 sm:p-8 transition-all ${
                    isBest
                      ? "bg-[#1a1625] text-white ring-2 ring-[#6d28d9] shadow-xl shadow-[#6d28d9]/10 scale-[1.02] md:scale-105"
                      : "card-elevated"
                  }`}
                >
                  {isBest && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6d28d9] px-4 py-1 text-[10px] font-bold text-white uppercase tracking-wider font-[var(--font-display)]">
                        <Star className="h-3 w-3" />
                        Best Value
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className={`text-base font-semibold font-[var(--font-display)] ${isBest ? "text-white" : "text-[#1a1625]"}`}>
                      {tier.name}
                    </h3>
                    <p className={`text-xs mt-0.5 ${isBest ? "text-[#a78bfa]" : "text-[#8c8579]"}`}>
                      {periodLabel(tier.period)} license
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className={`text-4xl font-bold font-[var(--font-display)] ${isBest ? "text-white" : "text-[#1a1625]"}`}>
                      ${Number(tier.price)}
                    </span>
                    <span className={`text-sm ${isBest ? "text-[#a78bfa]" : "text-[#8c8579]"}`}>
                      /{periodLabel(tier.period)}
                    </span>
                  </div>

                  <div className={`border-t mb-5 ${isBest ? "border-white/10" : "border-[#e8e5df]"}`} />

                  <ul className="flex-1 space-y-2.5">
                    {features.map((feature: string, i: number) => (
                      <li key={i} className={`flex items-start gap-2.5 text-sm ${isBest ? "text-[#d1d5db]" : "text-[#5a5550]"}`}>
                        <Check className={`h-4 w-4 shrink-0 mt-0.5 ${isBest ? "text-[#a78bfa]" : "text-[#6d28d9]"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7">
                    <Link
                      href={`/checkout?tier=${tier.id}`}
                      className={`flex items-center justify-center gap-2 w-full rounded-lg py-3 px-6 font-semibold text-sm font-[var(--font-display)] transition-all ${
                        isBest
                          ? "bg-white text-[#1a1625] hover:bg-[#f3f1ee]"
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
            <p className="text-sm text-[#8c8579]">
              All licenses include full platform access, SSL encryption, and 30-day money-back guarantee.
            </p>
            <p className="text-sm text-[#8c8579]">
              Need a custom arrangement?{" "}
              <Link href="/contact" className="text-[#6d28d9] hover:underline underline-offset-4 font-medium">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
