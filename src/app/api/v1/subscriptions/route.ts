import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKeyAuth";

export async function GET(req: NextRequest) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "cms:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const expiring = searchParams.get("expiring");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  if (expiring === "true") {
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    where.licenseExpiresAt = { lte: sevenDays, gt: new Date() };
    where.status = "active";
  }

  const instances = await prisma.cmsInstance.findMany({
    where,
    select: {
      cmsId: true,
      name: true,
      domain: true,
      status: true,
      subscriptionTier: true,
      licenseExpiresAt: true,
      adminEmail: true,
      _count: { select: { users: true } },
    },
    orderBy: { licenseExpiresAt: "asc" },
  });

  const now = new Date();
  const data = instances.map((i) => {
    const daysRemaining = i.licenseExpiresAt
      ? Math.ceil((i.licenseExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      cmsId: i.cmsId,
      name: i.name,
      domain: i.domain,
      status: i.status,
      subscriptionTier: i.subscriptionTier,
      licenseExpiresAt: i.licenseExpiresAt,
      daysRemaining,
      isExpired: daysRemaining !== null && daysRemaining <= 0,
      adminEmail: i.adminEmail,
      userCount: i._count.users,
    };
  });

  return NextResponse.json({ data, total: data.length });
}
