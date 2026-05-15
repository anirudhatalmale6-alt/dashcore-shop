import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKeyAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ cmsId: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "cms:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cmsId } = await params;

  const cms = await prisma.cmsInstance.findUnique({
    where: { cmsId },
    include: { users: { select: { id: true, username: true, email: true, role: true, active: true, createdAt: true } } },
  });
  if (!cms) return NextResponse.json({ error: "CMS not found" }, { status: 404 });

  const now = new Date();
  const daysRemaining = cms.licenseExpiresAt ? Math.ceil((cms.licenseExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return NextResponse.json({
    id: cms.id,
    cmsId: cms.cmsId,
    name: cms.name,
    domain: cms.domain,
    status: cms.status,
    adminUsername: cms.adminUsername,
    adminEmail: cms.adminEmail,
    dnsSettings: cms.dnsSettings,
    settings: cms.settings,
    subscriptionTier: cms.subscriptionTier,
    licenseExpiresAt: cms.licenseExpiresAt,
    daysRemaining,
    isExpired: daysRemaining !== null && daysRemaining <= 0,
    users: cms.users,
    createdAt: cms.createdAt,
    updatedAt: cms.updatedAt,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ cmsId: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "cms:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cmsId } = await params;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.domain !== undefined) data.domain = body.domain;
  if (body.status !== undefined) data.status = body.status;
  if (body.settings !== undefined) data.settings = body.settings;
  if (body.dnsSettings !== undefined) data.dnsSettings = body.dnsSettings;
  if (body.subscriptionTier !== undefined) data.subscriptionTier = body.subscriptionTier;

  const cms = await prisma.cmsInstance.update({ where: { cmsId }, data });
  return NextResponse.json({ cmsId: cms.cmsId, name: cms.name, domain: cms.domain, status: cms.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ cmsId: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "cms:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cmsId } = await params;

  await prisma.cmsInstance.update({ where: { cmsId }, data: { status: "suspended" } });
  return NextResponse.json({ ok: true, message: "CMS deactivated" });
}
