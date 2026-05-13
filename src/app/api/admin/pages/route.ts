import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const pages = await prisma.cmsPage.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(pages);
  } catch (err) {
    console.error("Pages fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, slug, content, active, showInNav, sortOrder } = await request.json();
    if (!title?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const existing = await prisma.cmsPage.findUnique({ where: { slug: cleanSlug } });
    if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 400 });

    const page = await prisma.cmsPage.create({
      data: {
        title: title.trim(),
        slug: cleanSlug,
        content: content || "",
        active: active !== false,
        showInNav: showInNav || false,
        sortOrder: sortOrder || 0,
      },
    });
    return NextResponse.json(page, { status: 201 });
  } catch (err) {
    console.error("Page create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, title, slug, content, active, showInNav, sortOrder } = await request.json();
    if (!id) return NextResponse.json({ error: "Page ID required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (slug !== undefined) data.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (content !== undefined) data.content = content;
    if (active !== undefined) data.active = active;
    if (showInNav !== undefined) data.showInNav = showInNav;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    const page = await prisma.cmsPage.update({ where: { id: Number(id) }, data });
    return NextResponse.json(page);
  } catch (err) {
    console.error("Page update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Page ID required" }, { status: 400 });
    await prisma.cmsPage.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Page delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
