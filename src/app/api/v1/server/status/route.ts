import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey, hasPermission } from "@/lib/apiKeyAuth";
import os from "os";

export async function GET(req: NextRequest) {
  const apiKey = await validateApiKey(req);
  if (!apiKey || !hasPermission(apiKey, "server:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalCms, activeCms, suspendedCms, expiredCms, totalUsers] = await Promise.all([
    prisma.cmsInstance.count(),
    prisma.cmsInstance.count({ where: { status: "active" } }),
    prisma.cmsInstance.count({ where: { status: "suspended" } }),
    prisma.cmsInstance.count({ where: { status: "expired" } }),
    prisma.cmsUser.count(),
  ]);

  const mem = process.memoryUsage();

  return NextResponse.json({
    status: "operational",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAvg: os.loadavg(),
      cpus: os.cpus().length,
    },
    process: {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      external: mem.external,
    },
    cms: {
      total: totalCms,
      active: activeCms,
      suspended: suspendedCms,
      expired: expiredCms,
      totalUsers,
    },
  });
}
