import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKeyAuth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ cmsId: string; userId: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "users:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cmsId, userId } = await params;

  const cms = await prisma.cmsInstance.findUnique({ where: { cmsId }, select: { id: true } });
  if (!cms) return NextResponse.json({ error: "CMS not found" }, { status: 404 });

  const user = await prisma.cmsUser.findFirst({
    where: { id: Number(userId), cmsInstanceId: cms.id },
    select: { id: true, username: true, email: true, role: true, active: true, createdAt: true, updatedAt: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ cmsId: string; userId: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "users:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cmsId, userId } = await params;

  const cms = await prisma.cmsInstance.findUnique({ where: { cmsId }, select: { id: true } });
  if (!cms) return NextResponse.json({ error: "CMS not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
  if (body.active !== undefined) data.active = body.active;
  if (body.role !== undefined) data.role = body.role;
  if (body.email !== undefined) data.email = body.email;

  const user = await prisma.cmsUser.update({ where: { id: Number(userId) }, data });
  return NextResponse.json({ id: user.id, username: user.username, email: user.email, role: user.role, active: user.active });
}
