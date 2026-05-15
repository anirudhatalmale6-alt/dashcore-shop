import { NextRequest } from "next/server";

const SECRET = process.env.NEXTAUTH_SECRET || "dashcore-fallback-secret";

interface CustomerTokenPayload {
  customerId: number;
  email: string;
  name: string;
  exp: number;
}

export function generateCustomerToken(customerId: number, email: string, name: string): string {
  const payload: CustomerTokenPayload = {
    customerId,
    email,
    name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const payloadStr = JSON.stringify(payload);
  const signature = hmac(payloadStr);
  return Buffer.from(`${payloadStr}:::${signature}`).toString("base64");
}

export function verifyCustomerToken(token: string): CustomerTokenPayload | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const sep = decoded.lastIndexOf(":::");
    if (sep === -1) return null;
    const payloadStr = decoded.substring(0, sep);
    const sig = decoded.substring(sep + 3);
    if (sig !== hmac(payloadStr)) return null;
    const payload: CustomerTokenPayload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getCustomerFromRequest(request: NextRequest): CustomerTokenPayload | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return verifyCustomerToken(authHeader.substring(7));
}

function hmac(data: string): string {
  let hash = 0;
  const combined = "customer:" + data + SECRET;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  let hash2 = 0;
  const reversed = combined.split("").reverse().join("") + SECRET;
  for (let i = 0; i < reversed.length; i++) {
    hash2 = ((hash2 << 7) - hash2 + reversed.charCodeAt(i)) | 0;
  }
  return `${hash.toString(36)}.${hash2.toString(36)}`;
}
