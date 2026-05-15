import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { sendCmsReadyEmail } from "@/lib/cmsEmail";
import { PaymentStatus } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const CMS_BACKEND_URL = process.env.CMS_BACKEND_URL || "https://backend.dashcore.eu";
const CMS_API_KEY = process.env.CMS_API_KEY || "";
const CMS_API_SECRET = process.env.CMS_API_SECRET || "";

function generatePassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function mapTierToSubscriptionPlan(tierName: string): Promise<string> {
  try {
    const tier = await prisma.pricingTier.findFirst({
      where: { name: tierName },
      select: { period: true },
    });
    if (tier) return tier.period;
  } catch (err) {
    console.error("Failed to look up tier period for CMS creation:", err);
  }
  return "monthly";
}

async function createCmsInstance(order: {
  customerName: string;
  customerEmail: string;
  tierName: string;
}): Promise<{ unique_id?: string; adminUsername?: string; adminPassword?: string; domain?: string; error?: string }> {
  const subscriptionPlan = await mapTierToSubscriptionPlan(order.tierName);
  const adminPassword = generatePassword(12);

  const slug = order.customerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || "cms";
  const suffix = crypto.randomBytes(3).toString("hex");
  const subdomain = `${slug}-${suffix}`;
  const domain = `${subdomain}.dashcore.eu`;

  const adminUsername = `admin_${suffix}`;
  const adminEmail = `admin_${suffix}@${subdomain}.dashcore.eu`;

  const res = await fetch(`${CMS_BACKEND_URL}/api/v1/cms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CMS_API_KEY,
      "x-api-secret": CMS_API_SECRET,
    },
    body: JSON.stringify({
      name: order.customerName,
      dns: domain,
      subdomain,
      subscription_plan: subscriptionPlan,
      adminUsername,
      adminEmail,
      adminPassword: adminPassword,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { error: `CMS API responded ${res.status}: ${JSON.stringify(data)}` };
  }
  const cmsData = data.data || data;
  return { unique_id: cmsData.unique_id || cmsData.id, adminUsername, adminPassword, domain };
}

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

    let updated = await prisma.order.update({
      where: { id: Number(orderId) },
      data: updateData,
    });

    // Auto-create CMS instance when order is newly confirmed as paid
    let cmsError: string | undefined;
    if (status === "paid" && existing.paymentStatus !== "paid") {
      try {
        const result = await createCmsInstance({
          customerName: existing.customerName,
          customerEmail: existing.customerEmail,
          tierName: existing.tierName,
        });

        if (result.unique_id) {
          const cmsNote = `[CMS Auto-Created] ID: ${result.unique_id} | Domain: ${result.domain} | Admin: ${result.adminUsername || "admin"} / ${result.adminPassword || "N/A"}`;
          const existingNotes = updated.notes || "";
          const newNotes = existingNotes
            ? `${existingNotes}\n${cmsNote}`
            : cmsNote;

          updated = await prisma.order.update({
            where: { id: Number(orderId) },
            data: { notes: newNotes },
          });
          console.log(`CMS instance created for order ${existing.orderId}: ${result.unique_id}`);

          // Send CMS ready email to customer
          try {
            await sendCmsReadyEmail({
              email: existing.customerEmail,
              name: existing.customerName,
              cmsId: result.unique_id,
              domain: result.domain || "dashcore.eu",
              adminUsername: result.adminUsername || "admin",
              adminPassword: result.adminPassword || "N/A",
            });
            console.log(`CMS ready email sent to ${existing.customerEmail}`);
          } catch (emailErr) {
            console.error(`Failed to send CMS ready email:`, emailErr);
          }
        } else {
          cmsError = result.error || "No unique_id returned";
          console.error(`CMS creation failed for order ${existing.orderId}:`, cmsError);
        }
      } catch (err) {
        cmsError = err instanceof Error ? err.message : String(err);
        console.error(`CMS creation error for order ${existing.orderId}:`, cmsError);
      }
    }

    // Auto-create customer account when order is newly confirmed as paid
    if (status === "paid" && existing.paymentStatus !== "paid") {
      try {
        const existingCustomer = await prisma.customer.findUnique({
          where: { email: existing.customerEmail },
        });
        if (!existingCustomer) {
          const customerPassword = generatePassword(10);
          const passwordHash = await bcrypt.hash(customerPassword, 10);
          await prisma.customer.create({
            data: {
              email: existing.customerEmail,
              name: existing.customerName,
              passwordHash,
            },
          });
          console.log(`Customer account created for ${existing.customerEmail}`);
        }
      } catch (custErr) {
        console.error(`Customer creation error:`, custErr);
      }
    }

    return NextResponse.json({
      ...updated,
      tierPrice: Number(updated.tierPrice),
      ...(cmsError ? { cmsWarning: `CMS auto-creation failed: ${cmsError}` } : {}),
    });
  } catch (err) {
    console.error("Order update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
