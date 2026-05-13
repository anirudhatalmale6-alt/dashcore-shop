import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { BillingPeriod } from "@prisma/client";

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const product = await prisma.product.findFirst({
      include: {
        tiers: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Serialize Decimal fields
    const serialized = {
      ...product,
      tiers: product.tiers.map((t) => ({
        ...t,
        price: Number(t.price),
      })),
    };

    return NextResponse.json(serialized);
  } catch (err) {
    console.error("Product fetch error:", err);
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

  try {
    const body = await request.json();
    const { name, description, features, tiers } = body;

    // Find existing product
    const existing = await prisma.product.findFirst();
    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Update product
    const productData: Record<string, unknown> = {};
    if (name !== undefined) productData.name = name;
    if (description !== undefined) productData.description = description;
    if (features !== undefined) {
      productData.features =
        typeof features === "string" ? features : JSON.stringify(features);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: existing.id },
      data: productData,
    });

    // Update tiers if provided
    if (tiers && Array.isArray(tiers)) {
      for (const tier of tiers) {
        const validPeriods: BillingPeriod[] = ["monthly", "yearly", "lifetime"];

        if (tier.id) {
          // Update existing tier
          const tierData: Record<string, unknown> = {};
          if (tier.name !== undefined) tierData.name = tier.name;
          if (tier.price !== undefined) tierData.price = Number(tier.price);
          if (tier.period !== undefined && validPeriods.includes(tier.period)) {
            tierData.period = tier.period;
          }
          if (tier.features !== undefined) {
            tierData.features =
              typeof tier.features === "string"
                ? tier.features
                : JSON.stringify(tier.features);
          }
          if (tier.sortOrder !== undefined)
            tierData.sortOrder = Number(tier.sortOrder);
          if (tier.active !== undefined) tierData.active = tier.active;

          await prisma.pricingTier.update({
            where: { id: tier.id },
            data: tierData,
          });
        } else {
          // Create new tier
          await prisma.pricingTier.create({
            data: {
              productId: existing.id,
              name: tier.name || "New Tier",
              price: Number(tier.price || 0),
              period: validPeriods.includes(tier.period)
                ? tier.period
                : "monthly",
              features: tier.features
                ? typeof tier.features === "string"
                  ? tier.features
                  : JSON.stringify(tier.features)
                : "[]",
              sortOrder: tier.sortOrder || 0,
              active: tier.active !== false,
            },
          });
        }
      }
    }

    // Fetch updated product with tiers
    const result = await prisma.product.findUnique({
      where: { id: existing.id },
      include: {
        tiers: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      ...result,
      tiers: result!.tiers.map((t) => ({
        ...t,
        price: Number(t.price),
      })),
    });
  } catch (err) {
    console.error("Product update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
