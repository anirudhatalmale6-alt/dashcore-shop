import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { BillingPeriod } from "@prisma/client";

const VALID_PERIODS: BillingPeriod[] = [
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
  "lifetime",
];

function serializeProduct(p: Record<string, unknown>) {
  const prod = p as Record<string, unknown>;
  const tiers = (prod.tiers as Record<string, unknown>[]) || [];
  const options = (prod.options as Record<string, unknown>[]) || [];
  return {
    ...prod,
    tiers: tiers.map((t) => ({ ...t, price: Number(t.price) })),
    options,
  };
}

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
        include: {
          tiers: { orderBy: { sortOrder: "asc" } },
          options: { orderBy: { sortOrder: "asc" } },
        },
      });
      if (!product)
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      return NextResponse.json(
        serializeProduct(product as unknown as Record<string, unknown>)
      );
    }

    const products = await prisma.product.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        tiers: { orderBy: { sortOrder: "asc" } },
        options: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(
      products.map((p) =>
        serializeProduct(p as unknown as Record<string, unknown>)
      )
    );
  } catch (err) {
    console.error("Product fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const product = await prisma.product.create({
      data: {
        name: body.name || "New Product",
        description: body.description || "",
        features:
          typeof body.features === "string"
            ? body.features
            : JSON.stringify(body.features || []),
        badge: body.badge || "",
        badgeColor: body.badgeColor || "purple",
        featured: body.featured || false,
        active: body.active !== false,
        sortOrder: body.sortOrder || 0,
      },
      include: {
        tiers: { orderBy: { sortOrder: "asc" } },
        options: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(
      serializeProduct(product as unknown as Record<string, unknown>),
      { status: 201 }
    );
  } catch (err) {
    console.error("Product create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, name, description, features, badge, badgeColor, featured, active, sortOrder, tiers, options } = body;

    if (!id)
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );

    const existing = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!existing)
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );

    const productData: Record<string, unknown> = {};
    if (name !== undefined) productData.name = name;
    if (description !== undefined) productData.description = description;
    if (features !== undefined)
      productData.features =
        typeof features === "string" ? features : JSON.stringify(features);
    if (badge !== undefined) productData.badge = badge;
    if (badgeColor !== undefined) productData.badgeColor = badgeColor;
    if (featured !== undefined) productData.featured = featured;
    if (active !== undefined) productData.active = active;
    if (sortOrder !== undefined) productData.sortOrder = Number(sortOrder);

    await prisma.product.update({
      where: { id: Number(id) },
      data: productData,
    });

    if (tiers && Array.isArray(tiers)) {
      const existingTierIds = (
        await prisma.pricingTier.findMany({
          where: { productId: Number(id) },
          select: { id: true },
        })
      ).map((t) => t.id);

      const incomingIds = tiers.filter((t: Record<string, unknown>) => t.id).map((t: Record<string, unknown>) => t.id as number);
      const toDelete = existingTierIds.filter((eid) => !incomingIds.includes(eid));

      if (toDelete.length > 0) {
        await prisma.pricingTier.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      for (const tier of tiers) {
        const period = VALID_PERIODS.includes(tier.period)
          ? tier.period
          : "monthly";

        if (tier.id) {
          await prisma.pricingTier.update({
            where: { id: tier.id },
            data: {
              name: tier.name,
              price: Number(tier.price || 0),
              period,
              features:
                typeof tier.features === "string"
                  ? tier.features
                  : JSON.stringify(tier.features || []),
              sortOrder: Number(tier.sortOrder || 0),
              active: tier.active !== false,
            },
          });
        } else {
          await prisma.pricingTier.create({
            data: {
              productId: Number(id),
              name: tier.name || "New Plan",
              price: Number(tier.price || 0),
              period,
              features:
                typeof tier.features === "string"
                  ? tier.features
                  : JSON.stringify(tier.features || []),
              sortOrder: Number(tier.sortOrder || 0),
              active: tier.active !== false,
            },
          });
        }
      }
    }

    if (options && Array.isArray(options)) {
      const existingOptIds = (
        await prisma.productOption.findMany({
          where: { productId: Number(id) },
          select: { id: true },
        })
      ).map((o) => o.id);

      const incomingOptIds = options.filter((o: Record<string, unknown>) => o.id).map((o: Record<string, unknown>) => o.id as number);
      const toDeleteOpts = existingOptIds.filter((eid) => !incomingOptIds.includes(eid));

      if (toDeleteOpts.length > 0) {
        await prisma.productOption.deleteMany({
          where: { id: { in: toDeleteOpts } },
        });
      }

      for (const opt of options) {
        const choicesJson =
          typeof opt.choices === "string"
            ? opt.choices
            : JSON.stringify(opt.choices || []);

        if (opt.id) {
          await prisma.productOption.update({
            where: { id: opt.id },
            data: {
              name: opt.name,
              choices: choicesJson,
              required: opt.required !== false,
              sortOrder: Number(opt.sortOrder || 0),
            },
          });
        } else {
          await prisma.productOption.create({
            data: {
              productId: Number(id),
              name: opt.name || "New Option",
              choices: choicesJson,
              required: opt.required !== false,
              sortOrder: Number(opt.sortOrder || 0),
            },
          });
        }
      }
    }

    const result = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        tiers: { orderBy: { sortOrder: "asc" } },
        options: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(
      serializeProduct(result as unknown as Record<string, unknown>)
    );
  } catch (err) {
    console.error("Product update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id)
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );

    await prisma.product.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Product delete error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
