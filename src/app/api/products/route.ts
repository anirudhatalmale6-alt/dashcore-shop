import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        tiers: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
        options: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(
      products.map((p) => ({
        ...p,
        tiers: p.tiers.map((t) => ({ ...t, price: Number(t.price) })),
      }))
    );
  } catch (err) {
    console.error("Products fetch error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
