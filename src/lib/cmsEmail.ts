import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

async function getSmtpTransport() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings?.smtpHost || !settings.smtpUser) {
    console.error("SMTP not configured: missing smtpHost or smtpUser in site settings");
    return null;
  }

  console.log(`SMTP config: host=${settings.smtpHost} port=${settings.smtpPort} user=${settings.smtpUser} secure=${settings.smtpPort === 465}`);

  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

export async function testSmtpConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const transport = await getSmtpTransport();
    if (!transport) return { ok: false, error: "SMTP not configured" };
    await transport.verify();
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("SMTP verification failed:", msg);
    return { ok: false, error: msg };
  }
}

async function getFromAddress(): Promise<string> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return settings?.smtpFrom || settings?.contactEmail || "noreply@dashcore.eu";
}

export async function sendCmsReadyEmail(opts: {
  email: string;
  name: string;
  cmsId: string;
  domain: string;
  adminUsername: string;
  adminPassword: string;
}) {
  const transport = await getSmtpTransport();
  if (!transport) return false;

  const from = await getFromAddress();

  await transport.sendMail({
    from,
    to: opts.email,
    subject: `Your CMS Instance "${opts.name}" is Ready`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#6366f1">Your CMS Instance is Ready!</h2>
        <p>Hello,</p>
        <p>Your CMS instance <strong>${opts.name}</strong> has been set up and is ready to use.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">CMS ID</td><td style="padding:8px;border:1px solid #ddd">${opts.cmsId}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Domain</td><td style="padding:8px;border:1px solid #ddd">${opts.domain}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Admin Username</td><td style="padding:8px;border:1px solid #ddd">${opts.adminUsername}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Admin Password</td><td style="padding:8px;border:1px solid #ddd">${opts.adminPassword}</td></tr>
        </table>
        <p style="color:#ef4444"><strong>Important:</strong> Please change your password after first login.</p>
        <p>If you have any questions, please contact our support team.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="font-size:12px;color:#888">DashCore IPTV Platform Engine</p>
      </div>
    `,
  });

  return true;
}

export async function sendLicenseReminderEmail(opts: {
  email: string;
  name: string;
  cmsId: string;
  domain: string;
  daysRemaining: number;
  licenseExpiresAt: Date;
}) {
  const transport = await getSmtpTransport();
  if (!transport) return false;

  const from = await getFromAddress();
  const expiryDate = opts.licenseExpiresAt.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const urgency = opts.daysRemaining <= 1 ? "URGENT: " : "";
  const color = opts.daysRemaining <= 1 ? "#ef4444" : opts.daysRemaining <= 3 ? "#f59e0b" : "#6366f1";

  await transport.sendMail({
    from,
    to: opts.email,
    subject: `${urgency}License Expiry Reminder - ${opts.name} (${opts.daysRemaining} day${opts.daysRemaining === 1 ? "" : "s"} left)`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:${color}">License Expiry Reminder</h2>
        <p>Hello,</p>
        <p>Your CMS instance <strong>${opts.name}</strong> (${opts.domain}) license will expire in <strong style="color:${color}">${opts.daysRemaining} day${opts.daysRemaining === 1 ? "" : "s"}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">CMS ID</td><td style="padding:8px;border:1px solid #ddd">${opts.cmsId}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Domain</td><td style="padding:8px;border:1px solid #ddd">${opts.domain}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Expiry Date</td><td style="padding:8px;border:1px solid #ddd">${expiryDate}</td></tr>
        </table>
        <p>Please renew your license to avoid service interruption. After expiry, your CMS instance will be automatically suspended.</p>
        <p>Contact our support team to renew your license.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="font-size:12px;color:#888">DashCore IPTV Platform Engine</p>
      </div>
    `,
  });

  return true;
}

export async function sendLicenseExpiredEmail(opts: {
  email: string;
  name: string;
  cmsId: string;
  domain: string;
}) {
  const transport = await getSmtpTransport();
  if (!transport) return false;

  const from = await getFromAddress();

  await transport.sendMail({
    from,
    to: opts.email,
    subject: `Service Suspended - ${opts.name} License Expired`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#ef4444">Service Suspended</h2>
        <p>Hello,</p>
        <p>Your CMS instance <strong>${opts.name}</strong> (${opts.domain}) has been suspended because the license has expired.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">CMS ID</td><td style="padding:8px;border:1px solid #ddd">${opts.cmsId}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Domain</td><td style="padding:8px;border:1px solid #ddd">${opts.domain}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Status</td><td style="padding:8px;border:1px solid #ddd;color:#ef4444">Suspended</td></tr>
        </table>
        <p>Please renew your license to restore service. Contact our support team for assistance.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="font-size:12px;color:#888">DashCore IPTV Platform Engine</p>
      </div>
    `,
  });

  return true;
}
