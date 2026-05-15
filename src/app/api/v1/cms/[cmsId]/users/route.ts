import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKeyAuth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ cmsId: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "users:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cmsId } = await params;

  const cms = await prisma.cmsInstance.findUnique({ where: { cmsId }, select: { id: true } });
  if (!cms) return NextResponse.json({ error: "CMS not found" }, { status: 404 });

  const users = await prisma.cmsUser.findMany({
    where: { cmsInstanceId: cms.id },
    select: { id: true, username: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ cmsId: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "users:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cmsId } = await params;

  const cms = await prisma.cmsInstance.findUnique({ where: { cmsId }, select: { id: true } });
  if (!cms) return NextResponse.json({ error: "CMS not found" }, { status: 404 });

  const body = await req.json();
  const { username, email, password, role } = body;
  if (!username?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "username, email, and password are required" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.cmsUser.create({
    data: {
      cmsInstanceId: cms.id,
      username: username.trim(),
      email: email.trim(),
      passwordHash,
      role: role || "user",
    },
  });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    active: user.active,
  }, { status: 201 });
}
