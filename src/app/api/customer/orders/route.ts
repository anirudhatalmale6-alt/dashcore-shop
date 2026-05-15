import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerFromRequest } from "@/lib/customerAuth";

export async function GET(req: NextRequest) {
  const user = getCustomerFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { customerEmail: user.email },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderId: true,
      tierName: true,
      tierPrice: true,
      paymentMethod: true,
      paymentStatus: true,
      cryptoCurrency: true,
      selectedOptions: true,
      createdAt: true,
      confirmedAt: true,
      notes: true,
    },
  });

  return NextResponse.json(orders);
}
