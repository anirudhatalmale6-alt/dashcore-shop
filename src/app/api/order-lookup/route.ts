import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { orderId, email } = await request.json();

    if (!orderId || !email?.trim()) {
      return NextResponse.json({ error: "Order ID and email are required" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        orderId: orderId.trim().toUpperCase(),
        customerEmail: email.trim().toLowerCase(),
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found. Please check your order ID and email." }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      orderId: order.orderId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      tierName: order.tierName,
      tierPrice: Number(order.tierPrice),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      cryptoCurrency: order.cryptoCurrency,
      selectedOptions: order.selectedOptions,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
    });
  } catch (err) {
    console.error("Order lookup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
