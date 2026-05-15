import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { readFileSync, existsSync } from "fs";

const TEMPLATES_FILE = "/var/www/dashcore-shop/email-templates.json";

interface TemplateData {
  subject: string;
  body: string;
}

/**
 * Load a custom email template from the JSON file.
 * Returns { subject, body } if found, or null to use hardcoded defaults.
 */
function getTemplate(key: string): TemplateData | null {
  try {
    if (existsSync(TEMPLATES_FILE)) {
      const raw = readFileSync(TEMPLATES_FILE, "utf-8");
      const all = JSON.parse(raw);
      if (all[key] && all[key].subject && all[key].body) {
        return { subject: all[key].subject, body: all[key].body };
      }
    }
  } catch (err) {
    console.error("Error reading email template:", err);
  }
  return null;
}

/**
 * Replace {{placeholder}} tokens in a string with actual values.
 */
function applyPlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

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
    tls: { rejectUnauthorized: false },
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
  const email = settings?.smtpFrom || settings?.contactEmail || "noreply@dashcore.eu";
  const name = settings?.smtpFromName;
  if (name) return `"${name}" <${email}>`;
  return email;
}

export async function sendAccountCreatedEmail(opts: {
  email: string;
  name: string;
  password: string;
}) {
  const transport = await getSmtpTransport();
  if (!transport) return false;

  const from = await getFromAddress();
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const siteName = settings?.siteName || "DashCore";

  const placeholders: Record<string, string> = {
    customerName: opts.name,
    email: opts.email,
    password: opts.password,
    siteName,
  };

  const tpl = getTemplate("account_created");

  const subject = tpl
    ? applyPlaceholders(tpl.subject, placeholders)
    : `Your ${siteName} Account Has Been Created`;

  const html = tpl
    ? applyPlaceholders(tpl.body, placeholders)
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#6366f1;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Welcome to ${siteName}!</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello ${opts.name},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your account has been created. You can use the credentials below to log in to your dashboard and manage your orders and CMS instances.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">Email</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.email}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Password</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">${opts.password}</td></tr></table><div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin:0 0 20px 0"><p style="margin:0;color:#dc2626;font-size:14px;font-weight:600">Important: Please change your password after first login.</p></div><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you have any questions, please contact our support team.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`;

  await transport.sendMail({ from, to: opts.email, subject, html });

  return true;
}

export async function sendOrderPlacedEmail(opts: {
  email: string;
  name: string;
  orderId: string;
  tierName: string;
  totalPrice: number;
  paymentMethod: string;
}) {
  const transport = await getSmtpTransport();
  if (!transport) return false;

  const from = await getFromAddress();

  const placeholders: Record<string, string> = {
    customerName: opts.name,
    orderId: opts.orderId,
    tierName: opts.tierName,
    totalPrice: opts.totalPrice.toFixed(2),
    paymentMethod: opts.paymentMethod,
  };

  const tpl = getTemplate("order_placed");

  const subject = tpl
    ? applyPlaceholders(tpl.subject, placeholders)
    : `Order Received - ${opts.orderId}`;

  let html: string;
  if (tpl) {
    html = applyPlaceholders(tpl.body, placeholders);
  } else {
    const paymentInstructions: Record<string, string> = {
      stripe: "Your payment is being processed via Stripe.",
      multisafepay: "Your payment is being processed via MultiSafepay.",
      crypto: "Please complete your cryptocurrency payment. Your order will be confirmed once the transaction is verified.",
    };

    html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#6366f1;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Order Received!</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello ${opts.name},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Thank you for your order. We have received it and it is being processed.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">Order ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.orderId}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Plan</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.tierName}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Total</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">&euro;${opts.totalPrice.toFixed(2)}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Payment</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">${opts.paymentMethod}</td></tr></table><p style="margin:0 0 12px 0;color:#475569;font-size:15px;line-height:1.6">${paymentInstructions[opts.paymentMethod] || ""}</p><p style="margin:0 0 12px 0;color:#475569;font-size:15px;line-height:1.6">You will receive another email once your payment is confirmed and your CMS instance is ready.</p><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you have any questions, please contact our support team.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`;
  }

  await transport.sendMail({ from, to: opts.email, subject, html });

  return true;
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

  const placeholders: Record<string, string> = {
    customerName: opts.name,
    cmsId: opts.cmsId,
    domain: opts.domain,
    adminUsername: opts.adminUsername,
    adminPassword: opts.adminPassword,
  };

  const tpl = getTemplate("cms_ready");

  const subject = tpl
    ? applyPlaceholders(tpl.subject, placeholders)
    : `Your CMS Instance "${opts.cmsId}" is Ready`;

  const html = tpl
    ? applyPlaceholders(tpl.body, placeholders)
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#6366f1;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Your CMS Instance is Ready!</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello ${opts.name},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your CMS instance <strong style="color:#6366f1">${opts.cmsId}</strong> has been set up and is ready to use.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.cmsId}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Domain</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.domain}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Admin Username</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.adminUsername}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Admin Password</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">${opts.adminPassword}</td></tr></table><div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin:0 0 20px 0"><p style="margin:0;color:#dc2626;font-size:14px;font-weight:600">Important: Please change your password after first login.</p></div><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you have any questions, please contact our support team.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`;

  await transport.sendMail({ from, to: opts.email, subject, html });

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

  const placeholders: Record<string, string> = {
    customerName: opts.name,
    cmsId: opts.cmsId,
    domain: opts.domain,
    daysRemaining: String(opts.daysRemaining),
    expiryDate,
    urgency,
  };

  const tpl = getTemplate("license_reminder");

  const subject = tpl
    ? applyPlaceholders(tpl.subject, placeholders)
    : `${urgency}License Expiry Reminder - ${opts.cmsId} (${opts.daysRemaining} day${opts.daysRemaining === 1 ? "" : "s"} left)`;

  const html = tpl
    ? applyPlaceholders(tpl.body, placeholders)
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#f59e0b;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">License Expiry Reminder</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello ${opts.name},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your CMS instance <strong style="color:#f59e0b">${opts.cmsId}</strong> (${opts.domain}) license will expire in <strong style="color:#ef4444">${opts.daysRemaining} days</strong> on ${expiryDate}.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#f59e0b;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.cmsId}</td></tr><tr><td style="background-color:#f59e0b;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Domain</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.domain}</td></tr><tr><td style="background-color:#f59e0b;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Expiry Date</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">${expiryDate}</td></tr></table><div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:12px 16px;margin:0 0 20px 0"><p style="margin:0;color:#92400e;font-size:14px;font-weight:600">Please renew your license to avoid service interruption.</p></div><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">Contact our support team to renew your license.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`;

  await transport.sendMail({ from, to: opts.email, subject, html });

  return true;
}

export async function sendOrderConfirmedEmail(opts: {
  email: string;
  name: string;
  orderId: string;
  tierName: string;
  tierPrice: number;
  invoicePdf?: Buffer;
}) {
  const transport = await getSmtpTransport();
  if (!transport) return false;

  const from = await getFromAddress();

  const placeholders: Record<string, string> = {
    customerName: opts.name,
    orderId: opts.orderId,
    tierName: opts.tierName,
    tierPrice: opts.tierPrice.toFixed(2),
  };

  const tpl = getTemplate("order_confirmed");

  const subject = tpl
    ? applyPlaceholders(tpl.subject, placeholders)
    : `Order Confirmed - ${opts.orderId}`;

  const html = tpl
    ? applyPlaceholders(tpl.body, placeholders)
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#6366f1;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><div style="text-align:center;margin:0 0 24px 0"><div style="display:inline-block;background-color:#f0fdf4;border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;font-size:28px">&#10003;</div></div><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600;text-align:center">Payment Confirmed!</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello ${opts.name},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your payment has been confirmed. Thank you for your order!</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">Order ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.orderId}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Plan</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.tierName}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Amount</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">&euro;${opts.tierPrice.toFixed(2)}</td></tr></table><p style="margin:0 0 12px 0;color:#475569;font-size:15px;line-height:1.6">Your CMS instance is being set up and you will receive another email with your login details shortly.</p><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you have any questions, please contact our support team.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`;

  const mailOpts: Record<string, unknown> = { from, to: opts.email, subject, html };
  if (opts.invoicePdf) {
    mailOpts.attachments = [
      {
        filename: `Invoice-${opts.orderId}.pdf`,
        content: opts.invoicePdf,
        contentType: "application/pdf",
      },
    ];
  }
  await transport.sendMail(mailOpts);

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

  const placeholders: Record<string, string> = {
    customerName: opts.name,
    cmsId: opts.cmsId,
    domain: opts.domain,
  };

  const tpl = getTemplate("license_expired");

  const subject = tpl
    ? applyPlaceholders(tpl.subject, placeholders)
    : `Service Suspended - ${opts.cmsId} License Expired`;

  const html = tpl
    ? applyPlaceholders(tpl.body, placeholders)
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#ef4444;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Service Suspended</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello ${opts.name},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your CMS instance <strong style="color:#ef4444">${opts.cmsId}</strong> (${opts.domain}) has been suspended because the license has expired.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.cmsId}</td></tr><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Domain</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.domain}</td></tr><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Status</td><td style="padding:10px 16px;color:#ef4444;font-size:14px;font-weight:600">Suspended</td></tr></table><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">Please renew your license to restore service. Contact our support team for assistance.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`;

  await transport.sendMail({ from, to: opts.email, subject, html });

  return true;
}

export async function sendPasswordChangedEmail(opts: {
  email: string;
  name: string;
  cmsId: string;
  domain: string;
  adminUsername: string;
  newPassword: string;
}) {
  const transport = await getSmtpTransport();
  if (!transport) return false;

  const from = await getFromAddress();

  const placeholders: Record<string, string> = {
    customerName: opts.name,
    cmsId: opts.cmsId,
    domain: opts.domain,
    adminUsername: opts.adminUsername,
    newPassword: opts.newPassword,
  };

  const tpl = getTemplate("password_changed");

  const subject = tpl
    ? applyPlaceholders(tpl.subject, placeholders)
    : `Password Changed - ${opts.cmsId}`;

  const html = tpl
    ? applyPlaceholders(tpl.body, placeholders)
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#6366f1;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Password Changed</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello ${opts.name},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">The admin password for your CMS instance <strong style="color:#6366f1">${opts.cmsId}</strong> has been updated.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.cmsId}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Panel URL</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0"><a href="https://${opts.domain}" style="color:#6366f1;text-decoration:none">https://${opts.domain}</a></td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Username</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.adminUsername}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">New Password</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">${opts.newPassword}</td></tr></table><div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin:0 0 20px 0"><p style="margin:0;color:#dc2626;font-size:14px;font-weight:600">Keep these credentials safe. Do not share them with anyone.</p></div><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you did not request this change, please contact our support team immediately.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`;

  await transport.sendMail({ from, to: opts.email, subject, html });

  return true;
}

export async function sendServiceSuspendedEmail(opts: {
  email: string;
  name: string;
  cmsId: string;
  domain: string;
}) {
  const transport = await getSmtpTransport();
  if (!transport) return false;

  const from = await getFromAddress();

  const placeholders: Record<string, string> = {
    customerName: opts.name,
    cmsId: opts.cmsId,
    domain: opts.domain,
  };

  const tpl = getTemplate("service_suspended");

  const subject = tpl
    ? applyPlaceholders(tpl.subject, placeholders)
    : `Service Suspended - ${opts.cmsId}`;

  const html = tpl
    ? applyPlaceholders(tpl.body, placeholders)
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#ef4444;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Service Suspended</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello ${opts.name},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your CMS instance <strong style="color:#ef4444">${opts.cmsId}</strong> (${opts.domain}) has been suspended.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.cmsId}</td></tr><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Domain</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.domain}</td></tr><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Status</td><td style="padding:10px 16px;color:#ef4444;font-size:14px;font-weight:600">Suspended</td></tr></table><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you believe this is an error or would like to renew, please contact our support team.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`;

  await transport.sendMail({ from, to: opts.email, subject, html });

  return true;
}

export async function sendServiceReactivatedEmail(opts: {
  email: string;
  name: string;
  cmsId: string;
  domain: string;
}) {
  const transport = await getSmtpTransport();
  if (!transport) return false;

  const from = await getFromAddress();

  const placeholders: Record<string, string> = {
    customerName: opts.name,
    cmsId: opts.cmsId,
    domain: opts.domain,
  };

  const tpl = getTemplate("service_reactivated");

  const subject = tpl
    ? applyPlaceholders(tpl.subject, placeholders)
    : `Service Reactivated - ${opts.cmsId}`;

  const html = tpl
    ? applyPlaceholders(tpl.body, placeholders)
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#22c55e;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Service Reactivated</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello ${opts.name},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Great news! The suspension on your CMS instance <strong style="color:#22c55e">${opts.cmsId}</strong> has been lifted and your service is now active again.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#22c55e;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">${opts.cmsId}</td></tr><tr><td style="background-color:#22c55e;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Domain</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0"><a href="https://${opts.domain}" style="color:#22c55e;text-decoration:none">https://${opts.domain}</a></td></tr><tr><td style="background-color:#22c55e;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Status</td><td style="padding:10px 16px;color:#22c55e;font-size:14px;font-weight:600">Active</td></tr></table><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">You can now access your CMS panel at the domain above. Your login credentials remain the same.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`;

  await transport.sendMail({ from, to: opts.email, subject, html });

  return true;
}
