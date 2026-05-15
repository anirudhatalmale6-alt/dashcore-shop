import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/adminAuth";

const CMS_BACKEND_URL = process.env.CMS_BACKEND_URL || "https://backend.dashcore.eu";
const CMS_API_KEY = process.env.CMS_API_KEY || "";
const CMS_API_SECRET = process.env.CMS_API_SECRET || "";

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;
  const search = searchParams.get("search")?.trim() || "";
  const customerId = searchParams.get("id");

  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(customerId) },
      include: {
        loginLogs: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const orders = await prisma.order.findMany({
      where: { customerEmail: customer.email },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, orderId: true, tierName: true, tierPrice: true,
        paymentMethod: true, paymentStatus: true, createdAt: true, confirmedAt: true,
        totalPrice: true, optionsPrice: true, oneTimeFees: true, notes: true,
      },
    });

    return NextResponse.json({ customer, orders });
  }

  const where = search
    ? { OR: [
        { email: { contains: search, mode: "insensitive" as const } },
        { name: { contains: search, mode: "insensitive" as const } },
      ]}
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true, email: true, name: true, active: true, banned: true,
        banReason: true, createdAt: true, lastLogin: true,
        _count: { select: { loginLogs: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const customersWithOrders = await Promise.all(
    customers.map(async (c) => {
      const [orderCount, cmsOrders] = await Promise.all([
        prisma.order.count({ where: { customerEmail: c.email } }),
        prisma.order.count({
          where: {
            customerEmail: c.email,
            notes: { contains: "[CMS Auto-Created]" },
          },
        }),
      ]);
      return { ...c, orderCount, cmsCount: cmsOrders };
    })
  );

  return NextResponse.json({
    customers: customersWithOrders,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function PATCH(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { customerId, action, banReason } = body;

  if (!customerId || !action) {
    return NextResponse.json({ error: "customerId and action are required" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: Number(customerId) } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  if (action === "activate") {
    await prisma.customer.update({ where: { id: customer.id }, data: { active: true, banned: false, banReason: null } });
  } else if (action === "deactivate") {
    await prisma.customer.update({ where: { id: customer.id }, data: { active: false } });
  } else if (action === "ban") {
    await prisma.customer.update({ where: { id: customer.id }, data: { banned: true, banReason: banReason || null } });
  } else if (action === "unban") {
    await prisma.customer.update({ where: { id: customer.id }, data: { banned: false, banReason: null } });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("id");
    if (!customerId) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { id: Number(customerId) } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Find orders with CMS notes to extract CMS IDs for deletion
    const orders = await prisma.order.findMany({
      where: { customerEmail: customer.email },
      select: { id: true, notes: true },
    });

    const cmsDeleted: string[] = [];
    const cmsFailed: string[] = [];

    // Delete CMS instances linked to this customer's orders
    for (const order of orders) {
      if (!order.notes) continue;
      const match = order.notes.match(/\[CMS Auto-Created\] ID: (CMS-\S+)/);
      if (!match) continue;
      const cmsUniqueId = match[1];
      try {
        // Look up CMS by unique_id to get its numeric id
        const listRes = await fetch(`${CMS_BACKEND_URL}/api/v1/cms`, {
          headers: { "x-api-key": CMS_API_KEY, "x-api-secret": CMS_API_SECRET },
        });
        const listData = await listRes.json();
        const cmsList = listData.data || [];
        const cms = cmsList.find((c: { unique_id: string }) => c.unique_id === cmsUniqueId);
        if (cms) {
          const delRes = await fetch(`${CMS_BACKEND_URL}/api/v1/cms/${cms.id}`, {
            method: "DELETE",
            headers: { "x-api-key": CMS_API_KEY, "x-api-secret": CMS_API_SECRET },
          });
          if (delRes.ok) {
            cmsDeleted.push(cmsUniqueId);
          } else {
            cmsFailed.push(cmsUniqueId);
          }
        }
      } catch (err) {
        console.error(`Failed to delete CMS ${cmsUniqueId}:`, err);
        cmsFailed.push(cmsUniqueId);
      }
    }

    // Delete customer login logs, orders, then customer
    await prisma.customerLoginLog.deleteMany({ where: { customerId: customer.id } });
    await prisma.order.deleteMany({ where: { customerEmail: customer.email } });
    await prisma.customer.delete({ where: { id: customer.id } });

    return NextResponse.json({
      ok: true,
      message: `Customer ${customer.email} deleted`,
      cmsDeleted,
      cmsFailed,
    });
  } catch (err) {
    console.error("Customer delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
