import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerFromRequest } from "@/lib/customerAuth";

export async function GET(req: NextRequest) {
  const user = getCustomerFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findUnique({ where: { id: user.customerId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: customer.id,
    email: customer.email,
    name: customer.name,
    createdAt: customer.createdAt,
    lastLogin: customer.lastLogin,
  });
}

export async function PUT(req: NextRequest) {
  const user = getCustomerFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  if (body.name?.trim()) updateData.name = body.name.trim();

  const customer = await prisma.customer.update({
    where: { id: user.customerId },
    data: updateData,
  });

  return NextResponse.json({ id: customer.id, email: customer.email, name: customer.name });
}

export async function DELETE(req: NextRequest) {
  const user = getCustomerFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.customer.delete({ where: { id: user.customerId } });
  return NextResponse.json({ ok: true });
}
