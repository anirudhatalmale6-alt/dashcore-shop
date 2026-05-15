import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerFromRequest } from "@/lib/customerAuth";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  const user = getCustomerFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: user.customerId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, customer.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.customer.update({ where: { id: user.customerId }, data: { passwordHash: hash } });

  return NextResponse.json({ ok: true });
}
