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
      showFeaturesSection: settings?.showFeaturesSection ?? true,
      showProtocolsSection: settings?.showProtocolsSection ?? true,
      showCtaSection: settings?.showCtaSection ?? true,
      featuresSectionTitle: settings?.featuresSectionTitle || "Powerful Capabilities",
      protocolsSectionTitle: settings?.protocolsSectionTitle || "Complete Protocol Coverage",
      protocolsSectionSubtitle: settings?.protocolsSectionSubtitle || "From ingest to delivery — every protocol and workflow fully supported.",
      ctaTitle: settings?.ctaTitle || "Ready to Renew Your License?",
      ctaSubtitle: settings?.ctaSubtitle || "Keep your platform running at peak performance. Flexible durations, multiple payment methods.",
      ctaButtonText: settings?.ctaButtonText || "View Pricing",
      pricingPageTitle: settings?.pricingPageTitle || "Choose Your License Plan",
      pricingPageSubtitle: settings?.pricingPageSubtitle || "Renew your DashCore platform engine license. Choose the plan that fits your needs.",
      contactPageTitle: settings?.contactPageTitle || "Contact Us",
      contactPageSubtitle: settings?.contactPageSubtitle || "Have a question or need help? Select a department and send us a message.",
      hidePricingForGuests: settings?.hidePricingForGuests ?? false,
      gtagId: settings?.gtagId || "",
      socialLinks: settings?.socialLinks || [],
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
