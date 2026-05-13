import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = await prisma.cmsPage.findUnique({
      where: { slug, active: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (err) {
    console.error("Page fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
