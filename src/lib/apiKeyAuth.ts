import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export interface ApiKeyPayload {
  id: number;
  name: string;
  permissions: string[];
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function generateApiKey(): { key: string; secret: string; keyPrefix: string } {
  const key = "dk_" + randomBytes(24).toString("hex");
  const secret = randomBytes(32).toString("hex");
  return { key, secret, keyPrefix: key.slice(0, 10) };
}

export function hashKey(key: string): string {
  return sha256(key);
}

export async function validateApiKey(request: NextRequest): Promise<ApiKeyPayload | null> {
  const key = request.headers.get("x-api-key");
  const secret = request.headers.get("x-api-secret");
  if (!key || !secret) return null;

  const keyH = sha256(key);
  const secretH = sha256(secret);

  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: keyH } });
  if (!apiKey || !apiKey.active) return null;
  if (apiKey.secretHash !== secretH) return null;

  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  const permissions = Array.isArray(apiKey.permissions) ? apiKey.permissions as string[] : [];
  return { id: apiKey.id, name: apiKey.name, permissions };
}

export function hasPermission(apiKey: ApiKeyPayload, permission: string): boolean {
  return apiKey.permissions.includes("*") || apiKey.permissions.includes(permission);
}
