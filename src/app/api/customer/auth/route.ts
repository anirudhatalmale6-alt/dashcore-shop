import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateCustomerToken } from "@/lib/customerAuth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, email, password, name } = body;

  if (action === "register") {
    if (!email?.trim() || !password?.trim() || !name?.trim()) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const existing = await prisma.customer.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    const hash = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: { email: email.trim().toLowerCase(), name: name.trim(), passwordHash: hash },
    });
    const token = generateCustomerToken(customer.id, customer.email, customer.name);
    return NextResponse.json({ token, customer: { id: customer.id, email: customer.email, name: customer.name } });
  }

  if (action === "login") {
    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const customer = await prisma.customer.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!customer || !customer.active) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (customer.banned) {
      return NextResponse.json({ error: customer.banReason ? `Account suspended: ${customer.banReason}` : "Account suspended" }, { status: 403 });
    }
    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    await Promise.all([
      prisma.customer.update({ where: { id: customer.id }, data: { lastLogin: new Date() } }),
      prisma.customerLoginLog.create({ data: { customerId: customer.id, ip, userAgent: userAgent.slice(0, 500) } }),
    ]);
    const token = generateCustomerToken(customer.id, customer.email, customer.name);
    return NextResponse.json({ token, customer: { id: customer.id, email: customer.email, name: customer.name } });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
