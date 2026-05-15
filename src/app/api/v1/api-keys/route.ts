import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey, hasPermission, generateApiKey, hashKey } from "@/lib/apiKeyAuth";
import { getAdminFromRequest } from "@/lib/adminAuth";

async function checkAuth(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (admin) return true;
  const apiKey = await validateApiKey(req);
  if (apiKey && hasPermission(apiKey, "api-keys:manage")) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, keyPrefix: true, permissions: true, active: true, rateLimit: true, lastUsedAt: true, createdAt: true },
  });
  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, permissions, rateLimit } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { key, secret, keyPrefix } = generateApiKey();
  const keyHash = hashKey(key);
  const secretHash = hashKey(secret);

  const apiKey = await prisma.apiKey.create({
    data: {
      name: name.trim(),
      keyPrefix,
      keyHash,
      secretHash,
      permissions: Array.isArray(permissions) ? permissions : ["cms:read"],
      rateLimit: rateLimit || 60,
    },
  });

  return NextResponse.json({
    id: apiKey.id,
    name: apiKey.name,
    key,
    secret,
    permissions: apiKey.permissions,
    message: "Save these credentials - the secret will not be shown again",
  }, { status: 201 });
}
