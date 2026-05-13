import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pages = await prisma.cmsPage.findMany({
      where: { active: true, showInNav: true },
      orderBy: { sortOrder: "asc" },
      select: { title: true, slug: true },
    });
    return NextResponse.json(pages);
  } catch {
    return NextResponse.json([]);
  }
}
