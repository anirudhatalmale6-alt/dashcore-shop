import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const SECRET = process.env.CAPTCHA_SECRET || "dashcore-captcha-2026-secret-key";
const EXPIRY_MS = 5 * 60 * 1000;

function getSitePrefix(): string {
  const siteName = (process.env.SITE_PREFIX || "dash").toLowerCase().replace(/[^a-z]/g, "");
  return siteName.substring(0, 6) || "dash";
}

function generateCode(): string {
  const prefix = getSitePrefix();
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${num}`;
}

function signCode(code: string, timestamp: number): string {
  return createHmac("sha256", SECRET).update(`${code}:${timestamp}`).digest("hex").substring(0, 32);
}

export async function GET() {
  const code = generateCode();
  const timestamp = Date.now();
  const signature = signCode(code, timestamp);

  return NextResponse.json({
    code,
    token: `${timestamp}.${signature}`,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { captchaInput, captchaToken } = await req.json();

    if (!captchaInput || !captchaToken) {
      return NextResponse.json({ valid: false, error: "Missing captcha" }, { status: 400 });
    }

    const [tsStr, sig] = captchaToken.split(".");
    const timestamp = parseInt(tsStr, 10);

    if (isNaN(timestamp) || Date.now() - timestamp > EXPIRY_MS) {
      return NextResponse.json({ valid: false, error: "Captcha expired" }, { status: 400 });
    }

    const expectedSig = signCode(captchaInput.toLowerCase(), timestamp);
    if (expectedSig !== sig) {
      return NextResponse.json({ valid: false, error: "Invalid captcha" }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });
  }
}
