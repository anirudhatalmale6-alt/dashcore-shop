import Link from "next/link";
import { Check, ArrowRight, Star } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const tiers = await prisma.pricingTier.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const product = await prisma.product.findFirst();

  return (
    <div className="bg-grid">
      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[#7c68a6] opacity-[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-[#9b8cc4]">
            Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            <span className="gradient-text">Simple, transparent pricing</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 leading-relaxed">
            {product
              ? "Choose the plan that fits your scale. Upgrade or downgrade anytime."
              : "Flexible plans for every stage of growth."}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {tiers.map((tier, index) => {
              const isPopular = index === 1;
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
                  className={`relative flex flex-col glass-card p-8 sm:p-10 ${
                    isPopular
                      ? "border-[#7c68a6] border-2 glow-purple scale-[1.02] md:scale-105"
                      : ""
                  }`}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7c68a6] to-[#5a4a7a] px-4 py-1.5 text-xs font-semibold text-white uppercase tracking-wider">
                        <Star className="h-3 w-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Tier name */}
                  <h3 className="text-lg font-semibold text-white">
                    {tier.name}
                  </h3>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-bold text-white">
                      ${Number(tier.price)}
                    </span>
                    <span className="text-zinc-500 text-sm">
                      /{tier.period === "monthly"
                        ? "mo"
                        : tier.period === "yearly"
                        ? "yr"
                        : ""}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="my-6 border-t border-[rgba(124,104,166,0.15)]" />

                  {/* Features */}
                  <ul className="flex-1 space-y-3">
                    {features.map((feature: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-zinc-300"
                      >
                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-[#9b8cc4]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="mt-8">
                    <Link
                      href={`/checkout?tier=${tier.id}`}
                      className={`flex items-center justify-center gap-2 w-full rounded-xl py-3.5 px-6 font-semibold text-sm transition-all duration-300 ${
                        isPopular
                          ? "btn-primary"
                          : "border border-[rgba(124,104,166,0.3)] text-white hover:bg-[rgba(124,104,166,0.1)] hover:border-[rgba(124,104,166,0.5)]"
                      }`}
                    >
                      Choose Plan
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-zinc-500">
              All plans include SSL encryption, 99.9% uptime SLA, and 30-day
              money-back guarantee.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Need a custom solution?{" "}
              <Link
                href="/contact"
                className="text-[#9b8cc4] hover:text-white transition-colors underline underline-offset-4"
              >
                Contact our sales team
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
