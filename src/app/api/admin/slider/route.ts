import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest as verifyAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const images = await prisma.sliderImage.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(images);
}

export async function POST(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const image = await prisma.sliderImage.create({
    data: {
      title: body.title || "",
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl || "",
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return NextResponse.json(image);
}

export async function PUT(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const image = await prisma.sliderImage.update({
    where: { id: body.id },
    data: {
      title: body.title,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl,
      active: body.active,
      sortOrder: body.sortOrder,
    },
  });
  return NextResponse.json(image);
}

export async function DELETE(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.sliderImage.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
