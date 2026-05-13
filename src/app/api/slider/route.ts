import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const images = await prisma.sliderImage.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, imageUrl: true, linkUrl: true },
    });
    return NextResponse.json(images);
  } catch {
    return NextResponse.json([]);
  }
}
