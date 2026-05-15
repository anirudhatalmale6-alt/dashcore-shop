import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { sendServiceSuspendedEmail, sendServiceReactivatedEmail } from "@/lib/cmsEmail";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cmsId, domain, action } = await req.json();

  if (!cmsId || !action) {
    return NextResponse.json({ error: "cmsId and action are required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { notes: { contains: cmsId } },
    select: { customerEmail: true, customerName: true },
  });

  if (!order) {
    return NextResponse.json({ error: "No customer found for this CMS instance" }, { status: 404 });
  }

  try {
    if (action === "deactivated") {
      await sendServiceSuspendedEmail({
        email: order.customerEmail,
        name: order.customerName,
        cmsId,
        domain: domain || "dashcore.eu",
      });
    } else if (action === "reactivated") {
      await sendServiceReactivatedEmail({
        email: order.customerEmail,
        name: order.customerName,
        cmsId,
        domain: domain || "dashcore.eu",
      });
    }
    return NextResponse.json({ ok: true, sentTo: order.customerEmail });
  } catch (err) {
    console.error("CMS status notification error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
