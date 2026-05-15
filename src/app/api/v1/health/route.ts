import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, hasPermission } from "@/lib/apiKeyAuth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "server:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}

  return NextResponse.json({
    status: dbOk ? "healthy" : "degraded",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    database: dbOk ? "connected" : "error",
    timestamp: new Date().toISOString(),
  });
}
