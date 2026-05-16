import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAdminFromRequest, isAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const caller = getAdminFromRequest(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.adminUser.findMany({
    select: { id: true, nickname: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const caller = getAdminFromRequest(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { nickname, password, role } = await req.json();

  if (!nickname || !password) {
    return NextResponse.json({ error: "Nickname and password are required" }, { status: 400 });
  }

  const validRoles = ["moderator", "admin"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { nickname: nickname.trim() } });
  if (existing) {
    return NextResponse.json({ error: "Nickname already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: { nickname: nickname.trim(), passwordHash, role },
    select: { id: true, nickname: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const caller = getAdminFromRequest(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, nickname, password, role } = await req.json();

  if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

  const validRoles = ["moderator", "admin"];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Prevent demoting yourself
  if (target.id === caller.adminId && role === "moderator") {
    return NextResponse.json({ error: "Cannot change your own role to moderator" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (nickname) data.nickname = nickname.trim();
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  if (role) data.role = role;

  if (nickname && nickname.trim() !== target.nickname) {
    const dup = await prisma.adminUser.findUnique({ where: { nickname: nickname.trim() } });
    if (dup) return NextResponse.json({ error: "Nickname already exists" }, { status: 409 });
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data,
    select: { id: true, nickname: true, role: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const caller = getAdminFromRequest(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

  // Prevent self-deletion
  if (id === caller.adminId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  // Ensure at least one admin remains
  const adminCount = await prisma.adminUser.count({
    where: { role: { in: ["admin", "super"] } },
  });
  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if ((target.role === "admin" || target.role === "super") && adminCount <= 1) {
    return NextResponse.json({ error: "Cannot delete the last administrator" }, { status: 400 });
  }

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
