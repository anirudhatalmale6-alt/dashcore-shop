import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKeyAuth";
import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "cms:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [instances, total] = await Promise.all([
    prisma.cmsInstance.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { users: true } } },
    }),
    prisma.cmsInstance.count({ where }),
  ]);

  return NextResponse.json({
    data: instances.map((i) => ({
      id: i.id,
      cmsId: i.cmsId,
      name: i.name,
      domain: i.domain,
      status: i.status,
      adminEmail: i.adminEmail,
      subscriptionTier: i.subscriptionTier,
      licenseExpiresAt: i.licenseExpiresAt,
      userCount: i._count.users,
      createdAt: i.createdAt,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "cms:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, domain, adminEmail, subscriptionTier, licenseExpiresAt, dnsSettings, settings } = body;

  if (!name?.trim() || !domain?.trim() || !adminEmail?.trim()) {
    return NextResponse.json({ error: "name, domain, and adminEmail are required" }, { status: 400 });
  }

  const cmsId = randomUUID();
  const adminUsername = "admin";
  const adminPassword = randomBytes(12).toString("base64url");
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const cms = await prisma.cmsInstance.create({
    data: {
      cmsId,
      name: name.trim(),
      domain: domain.trim(),
      adminUsername,
      adminPasswordHash,
      adminEmail: adminEmail.trim(),
      subscriptionTier: subscriptionTier || null,
      licenseExpiresAt: licenseExpiresAt ? new Date(licenseExpiresAt) : null,
      dnsSettings: dnsSettings || {},
      settings: settings || {},
      status: "active",
    },
  });

  return NextResponse.json({
    id: cms.id,
    cmsId: cms.cmsId,
    name: cms.name,
    domain: cms.domain,
    status: cms.status,
    adminUsername,
    adminPassword,
    adminEmail: cms.adminEmail,
    licenseExpiresAt: cms.licenseExpiresAt,
    createdAt: cms.createdAt,
  }, { status: 201 });
}
