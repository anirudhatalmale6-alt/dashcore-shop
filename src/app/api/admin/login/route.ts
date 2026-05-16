import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, password } = body;

    if (!nickname || !password) {
      return NextResponse.json(
        { error: "Nickname and password are required" },
        { status: 400 }
      );
    }

    // Find admin user
    const admin = await prisma.adminUser.findUnique({
      where: { nickname: nickname.trim() },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(admin.id, admin.nickname, admin.role);

    return NextResponse.json({
      token,
      nickname: admin.nickname,
      role: admin.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
