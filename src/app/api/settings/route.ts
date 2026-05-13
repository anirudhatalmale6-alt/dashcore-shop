import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check if a tierId was requested (for checkout page tier info)
    const { searchParams } = new URL(request.url);
    const tierId = searchParams.get("tierId");

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });

    // Public settings only -- no secret keys
    const publicSettings = {
      siteName: settings?.siteName || "DashCore",
      stripeEnabled: settings?.stripeEnabled ?? false,
      multisafepayEnabled: settings?.multisafepayEnabled ?? false,
      cryptoEnabled: settings?.cryptoEnabled ?? false,
      btcAddress: settings?.btcAddress || "",
      usdtAddress: settings?.usdtAddress || "",
      usdcAddress: settings?.usdcAddress || "",
      ethAddress: settings?.ethAddress || "",
    };

    // If tierId requested, include tier info
    if (tierId) {
      const tier = await prisma.pricingTier.findUnique({
        where: { id: Number(tierId) },
      });

      if (tier) {
        let features: string[] = [];
        try {
          const raw = tier.features;
          if (typeof raw === "string") features = JSON.parse(raw);
          else if (Array.isArray(raw)) features = raw as string[];
        } catch {
          features = [];
        }

        return NextResponse.json({
          ...publicSettings,
          tier: {
            id: tier.id,
            name: tier.name,
            price: Number(tier.price),
            period: tier.period,
            features,
          },
        });
      }
    }

    return NextResponse.json(publicSettings);
  } catch (err) {
    console.error("Settings fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
