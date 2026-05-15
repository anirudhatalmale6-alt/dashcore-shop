import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKeyAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ cmsId: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "dns:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cmsId } = await params;

  const cms = await prisma.cmsInstance.findUnique({ where: { cmsId }, select: { cmsId: true, domain: true, dnsSettings: true } });
  if (!cms) return NextResponse.json({ error: "CMS not found" }, { status: 404 });
  return NextResponse.json(cms);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ cmsId: string }> }) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "dns:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cmsId } = await params;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.domain !== undefined) data.domain = body.domain;
  if (body.dnsSettings !== undefined) data.dnsSettings = body.dnsSettings;

  const cms = await prisma.cmsInstance.update({ where: { cmsId }, data });
  return NextResponse.json({ cmsId: cms.cmsId, domain: cms.domain, dnsSettings: cms.dnsSettings });
}
