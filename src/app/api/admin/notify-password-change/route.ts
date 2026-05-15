import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { sendPasswordChangedEmail } from "@/lib/cmsEmail";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cmsId, domain, adminUsername, newPassword } = await req.json();

  if (!cmsId || !newPassword) {
    return NextResponse.json({ error: "cmsId and newPassword are required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { notes: { contains: cmsId } },
    select: { customerEmail: true, customerName: true },
  });

  if (!order) {
    return NextResponse.json({ error: "No customer found for this CMS instance" }, { status: 404 });
  }

  try {
    await sendPasswordChangedEmail({
      email: order.customerEmail,
      name: order.customerName,
      cmsId,
      domain: domain || "dashcore.eu",
      adminUsername: adminUsername || "admin",
      newPassword,
    });
    return NextResponse.json({ ok: true, sentTo: order.customerEmail });
  } catch (err) {
    console.error("Password change notification error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
