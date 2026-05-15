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
    select: {
      cmsId: true,
      name: true,
      status: true,
      subscriptionTier: true,
      licenseExpiresAt: true,
      reminderSchedule: true,
      lastReminderSentAt: true,
    },
  });
  if (!cms) return NextResponse.json({ error: "CMS not found" }, { status: 404 });

  const now = new Date();
  const daysRemaining = cms.licenseExpiresAt
    ? Math.ceil((cms.licenseExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return NextResponse.json({
    cmsId: cms.cmsId,
    name: cms.name,
    status: cms.status,
    subscriptionTier: cms.subscriptionTier,
    licenseExpiresAt: cms.licenseExpiresAt,
    daysRemaining,
    isExpired: daysRemaining !== null && daysRemaining <= 0,
    reminderSchedule: cms.reminderSchedule,
    lastReminderSentAt: cms.lastReminderSentAt,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ cmsId: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "cms:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cmsId } = await params;

  const cms = await prisma.cmsInstance.findUnique({ where: { cmsId }, select: { id: true } });
  if (!cms) return NextResponse.json({ error: "CMS not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.licenseExpiresAt !== undefined) {
    data.licenseExpiresAt = body.licenseExpiresAt ? new Date(body.licenseExpiresAt) : null;
  }
  if (body.subscriptionTier !== undefined) data.subscriptionTier = body.subscriptionTier;
  if (body.reminderSchedule !== undefined) data.reminderSchedule = body.reminderSchedule;

  if (body.action === "renew" && body.days) {
    const current = await prisma.cmsInstance.findUnique({ where: { cmsId }, select: { licenseExpiresAt: true } });
    const base = current?.licenseExpiresAt && current.licenseExpiresAt > new Date()
      ? current.licenseExpiresAt
      : new Date();
    data.licenseExpiresAt = new Date(base.getTime() + body.days * 24 * 60 * 60 * 1000);
    data.status = "active";
    data.lastReminderSentAt = null;
  }

  if (body.action === "suspend") {
    data.status = "suspended";
  }

  if (body.action === "activate") {
    data.status = "active";
  }

  const updated = await prisma.cmsInstance.update({ where: { cmsId }, data });

  const now = new Date();
  const daysRemaining = updated.licenseExpiresAt
    ? Math.ceil((updated.licenseExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return NextResponse.json({
    cmsId: updated.cmsId,
    status: updated.status,
    subscriptionTier: updated.subscriptionTier,
    licenseExpiresAt: updated.licenseExpiresAt,
    daysRemaining,
    isExpired: daysRemaining !== null && daysRemaining <= 0,
  });
}
