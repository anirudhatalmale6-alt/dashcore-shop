import { NextRequest } from "next/server";

const SECRET = process.env.NEXTAUTH_SECRET || "dashcore-fallback-secret";

interface TokenPayload {
  adminId: number;
  nickname: string;
  exp: number;
}

/**
 * Generate a base64-encoded token containing admin identity and expiry.
 * Token is valid for 24 hours.
 */
export function generateToken(adminId: number, nickname: string): string {
  const payload: TokenPayload = {
    adminId,
    nickname,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  const payloadStr = JSON.stringify(payload);
  const signature = simpleHmac(payloadStr);
  const token = Buffer.from(`${payloadStr}:::${signature}`).toString("base64");
  return token;
}

/**
 * Verify a token and return the payload if valid.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const separatorIndex = decoded.lastIndexOf(":::");
    if (separatorIndex === -1) return null;

    const payloadStr = decoded.substring(0, separatorIndex);
    const signature = decoded.substring(separatorIndex + 3);

    // Verify signature
    const expectedSignature = simpleHmac(payloadStr);
    if (signature !== expectedSignature) return null;

    const payload: TokenPayload = JSON.parse(payloadStr);

    // Check expiry
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract admin info from the Authorization header of a request.
 * Expects: Authorization: Bearer <token>
 */
export function getAdminFromRequest(
  request: NextRequest
): TokenPayload | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  return verifyToken(token);
}

/**
 * Simple HMAC-like hash using the secret.
 * Uses a basic hash approach suitable for development.
 */
function simpleHmac(data: string): string {
  let hash = 0;
  const combined = data + SECRET;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Create a more complex hash by running multiple passes
  let hash2 = 0;
  const reversed = combined.split("").reverse().join("") + SECRET;
  for (let i = 0; i < reversed.length; i++) {
    const char = reversed.charCodeAt(i);
    hash2 = ((hash2 << 7) - hash2 + char) | 0;
  }
  return `${hash.toString(36)}.${hash2.toString(36)}`;
}
