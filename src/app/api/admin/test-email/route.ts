import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { testSmtpConnection } from "@/lib/cmsEmail";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const testTo = body.to || "";

    const verify = await testSmtpConnection();
    if (!verify.ok) {
      return NextResponse.json({
        success: false,
        step: "connection",
        error: verify.error,
      });
    }

    if (!testTo) {
      return NextResponse.json({ success: true, step: "connection", message: "SMTP connection verified OK" });
    }

    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!settings?.smtpHost) return NextResponse.json({ success: false, error: "No SMTP settings" });

    const transport = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const from = settings.smtpFrom || settings.contactEmail || "noreply@dashcore.eu";

    await transport.sendMail({
      from,
      to: testTo,
      subject: "DashCore SMTP Test",
      html: "<h2>SMTP Test</h2><p>If you received this email, your SMTP settings are working correctly.</p><p>Sent from DashCore admin panel.</p>",
    });

    return NextResponse.json({ success: true, step: "send", message: `Test email sent to ${testTo}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, step: "send", error: msg });
  }
}
