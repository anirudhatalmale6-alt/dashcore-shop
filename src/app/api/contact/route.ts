import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEPARTMENTS = ["Sales", "Technical Support", "Billing", "General Inquiry"];

export async function GET() {
  return NextResponse.json({ departments: DEPARTMENTS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, department, subject, message } = body;

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
