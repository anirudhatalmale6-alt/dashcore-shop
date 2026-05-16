import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest, isAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: 1 },
      });
    }

    return NextResponse.json({
      ...settings,
      vatRate: Number(settings.vatRate),
    });
  } catch (err) {
    console.error("Settings fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(admin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Sanitize: only allow known fields
    const allowedFields = [
      "siteName",
      "siteDescription",
      "contactEmail",
      "telegramUrl",
      "stripeEnabled",
      "stripePublicKey",
      "stripeSecretKey",
      "multisafepayEnabled",
      "multisafepayApiKey",
      "cryptoEnabled",
      "btcAddress",
      "usdtAddress",
      "usdcAddress",
      "ethAddress",
      "smtpHost",
      "smtpPort",
      "smtpUser",
      "smtpPass",
      "smtpFrom",
      "smtpFromName",
      "confirmEmailSubject",
      "confirmEmailBody",
      "vatRate",
      "metaTitle",
      "metaDescription",
      "metaKeywords",
      "faviconUrl",
      "ogTitle",
      "ogDescription",
      "ogImageUrl",
      "twitterTitle",
      "twitterDescription",
      "twitterImageUrl",
      "cookieBarEnabled",
      "cookieBarText",
      "cookieBarButtonText",
      "heroTitle",
      "heroSubtitle",
      "heroButtonText",
      "showProductsOnHome",
      "showFeaturesSection",
      "showProtocolsSection",
      "showCtaSection",
      "featuresSectionTitle",
      "protocolsSectionTitle",
      "protocolsSectionSubtitle",
      "ctaTitle",
      "ctaSubtitle",
      "ctaButtonText",
      "pricingPageTitle",
      "pricingPageSubtitle",
      "contactPageTitle",
      "contactPageSubtitle",
      "hidePricingForGuests",
      "orderReceivedEmailSubject",
      "orderReceivedEmailBody",
      "orderConfirmedEmailSubject",
      "orderConfirmedEmailBody",
      "gtagId",
      "socialLinks",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Ensure numeric fields are correct type
    if (updateData.smtpPort !== undefined) {
      updateData.smtpPort = Number(updateData.smtpPort);
    }
    if (updateData.vatRate !== undefined) {
      updateData.vatRate = Number(updateData.vatRate);
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: updateData,
      create: { id: 1, ...updateData },
    });

    return NextResponse.json({
      ...settings,
      vatRate: Number(settings.vatRate),
    });
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
