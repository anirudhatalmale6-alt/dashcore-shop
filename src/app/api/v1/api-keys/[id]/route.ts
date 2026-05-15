import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKeyAuth";
import { getAdminFromRequest } from "@/lib/adminAuth";

async function checkAuth(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (admin) return true;
  const apiKey = await validateApiKey(req);
  if (apiKey && hasPermission(apiKey, "api-keys:manage")) return true;
  return false;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const key = await prisma.apiKey.findUnique({
    where: { id: Number(id) },
    select: { id: true, name: true, keyPrefix: true, permissions: true, active: true, rateLimit: true, lastUsedAt: true, createdAt: true },
  });
  if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(key);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.permissions !== undefined) data.permissions = body.permissions;
  if (body.active !== undefined) data.active = body.active;
  if (body.rateLimit !== undefined) data.rateLimit = body.rateLimit;

  const key = await prisma.apiKey.update({ where: { id: Number(id) }, data });
  return NextResponse.json({ id: key.id, name: key.name, active: key.active, permissions: key.permissions });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.apiKey.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
