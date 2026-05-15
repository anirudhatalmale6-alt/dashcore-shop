import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKeyAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "server:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const cms = await prisma.cmsInstance.findUnique({
    where: { cmsId: id },
    include: {
      users: { select: { id: true, username: true, role: true, active: true, createdAt: true } },
    },
  });
  if (!cms) return NextResponse.json({ error: "CMS instance not found" }, { status: 404 });

  const now = new Date();
  const daysRemaining = cms.licenseExpiresAt
    ? Math.ceil((cms.licenseExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return NextResponse.json({
    cmsId: cms.cmsId,
    name: cms.name,
    domain: cms.domain,
    status: cms.status,
    subscriptionTier: cms.subscriptionTier,
    licenseExpiresAt: cms.licenseExpiresAt,
    daysRemaining,
    isExpired: daysRemaining !== null && daysRemaining <= 0,
    adminEmail: cms.adminEmail,
    settings: cms.settings,
    dnsSettings: cms.dnsSettings,
    users: cms.users,
    userCount: cms.users.length,
    createdAt: cms.createdAt,
    updatedAt: cms.updatedAt,
  });
}
