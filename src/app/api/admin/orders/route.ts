import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { PaymentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && ["pending", "paid", "failed", "refunded"].includes(status)) {
      where.paymentStatus = status as PaymentStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Convert Decimal fields to numbers for JSON serialization
    const serializedOrders = orders.map((order) => ({
      ...order,
      tierPrice: Number(order.tierPrice),
    }));

    return NextResponse.json({
      orders: serializedOrders,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Orders fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, status, notes, paymentId, cryptoTxHash } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const existing = await prisma.order.findUnique({
      where: { id: Number(orderId) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.paymentStatus = status as PaymentStatus;
    if (notes !== undefined) updateData.notes = notes;
    if (paymentId !== undefined) updateData.paymentId = paymentId;
    if (cryptoTxHash !== undefined) updateData.cryptoTxHash = cryptoTxHash;

    // Set confirmedAt when marking as paid
    if (status === "paid" && existing.paymentStatus !== "paid") {
      updateData.confirmedAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id: Number(orderId) },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      tierPrice: Number(updated.tierPrice),
    });
  } catch (err) {
    console.error("Order update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
