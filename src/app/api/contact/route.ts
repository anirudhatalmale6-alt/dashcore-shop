import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHmac } from "crypto";

const DEPARTMENTS = ["Sales", "Technical Support", "Billing", "General Inquiry"];
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || "dashcore-captcha-2026-secret-key";
const CAPTCHA_EXPIRY_MS = 5 * 60 * 1000;

function verifyCaptcha(input: string, token: string): { valid: boolean; error?: string } {
  if (!input || !token) return { valid: false, error: "Captcha is required" };

  const [tsStr, sig] = token.split(".");
  const timestamp = parseInt(tsStr, 10);

  if (isNaN(timestamp) || Date.now() - timestamp > CAPTCHA_EXPIRY_MS) {
    return { valid: false, error: "Captcha expired. Please refresh and try again." };
  }

  const expectedSig = createHmac("sha256", CAPTCHA_SECRET)
    .update(`${input}:${timestamp}`)
    .digest("hex")
    .substring(0, 32);

  if (expectedSig !== sig) {
    return { valid: false, error: "Captcha verification failed. Please try again." };
  }

  return { valid: true };
}

export async function GET() {
  return NextResponse.json({ departments: DEPARTMENTS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, department, subject, message, captchaInput, captchaToken } = body;

    const captchaResult = verifyCaptcha(captchaInput, captchaToken);
    if (!captchaResult.valid) {
      return NextResponse.json({ error: captchaResult.error }, { status: 400 });
    }

    if (!name?.trim() || !email?.trim() || !department?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!DEPARTMENTS.includes(department)) {
      return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const msg = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        department: department.trim(),
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    return NextResponse.json({ success: true, id: msg.id });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
