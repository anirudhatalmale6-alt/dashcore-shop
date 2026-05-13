import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tierId = searchParams.get("tierId");

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });

    const publicSettings = {
      siteName: settings?.siteName || "DashCore",
      siteDescription: settings?.siteDescription || "",
      stripeEnabled: settings?.stripeEnabled ?? false,
      multisafepayEnabled: settings?.multisafepayEnabled ?? false,
      cryptoEnabled: settings?.cryptoEnabled ?? false,
      btcAddress: settings?.btcAddress || "",
      usdtAddress: settings?.usdtAddress || "",
      usdcAddress: settings?.usdcAddress || "",
      ethAddress: settings?.ethAddress || "",
      cookieBarEnabled: settings?.cookieBarEnabled ?? true,
      cookieBarText: settings?.cookieBarText || "We use cookies to improve your experience.",
      cookieBarButtonText: settings?.cookieBarButtonText || "Accept",
      heroTitle: settings?.heroTitle || "DashCore IPTV Platform Engine",
      heroSubtitle: settings?.heroSubtitle || "High-performance streaming infrastructure",
      heroButtonText: settings?.heroButtonText || "View Plans",
      showProductsOnHome: settings?.showProductsOnHome ?? true,
    };

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
        } catch { features = []; }

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
