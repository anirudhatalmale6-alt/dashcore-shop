import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const TEMPLATES_FILE = "/var/www/dashcore-shop/email-templates.json";

export interface EmailTemplateData {
  subject: string;
  body: string;
}

export interface AllEmailTemplates {
  order_placed: EmailTemplateData;
  account_created: EmailTemplateData;
  order_confirmed: EmailTemplateData;
  cms_ready: EmailTemplateData;
  password_changed: EmailTemplateData;
  license_reminder: EmailTemplateData;
  license_expired: EmailTemplateData;
  service_suspended: EmailTemplateData;
  service_reactivated: EmailTemplateData;
}

function getDefaults(): AllEmailTemplates {
  return {
    order_placed: {
      subject: "Order Received - {{orderId}}",
      body: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#6366f1;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Order Received!</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello {{customerName}},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Thank you for your order. We have received it and it is being processed.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">Order ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{orderId}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Plan</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{tierName}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Total</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">&euro;{{totalPrice}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Payment</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">{{paymentMethod}}</td></tr></table><p style="margin:0 0 12px 0;color:#475569;font-size:15px;line-height:1.6">You will receive another email once your payment is confirmed and your CMS instance is ready.</p><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you have any questions, please contact our support team.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`,
    },
    account_created: {
      subject: "Your {{siteName}} Account Has Been Created",
      body: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#6366f1;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Welcome to {{siteName}}!</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello {{customerName}},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your account has been created. You can use the credentials below to log in to your dashboard and manage your orders and CMS instances.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">Email</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{email}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Password</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">{{password}}</td></tr></table><div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin:0 0 20px 0"><p style="margin:0;color:#dc2626;font-size:14px;font-weight:600">Important: Please change your password after first login.</p></div><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you have any questions, please contact our support team.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`,
    },
    order_confirmed: {
      subject: "Order Confirmed - {{orderId}}",
      body: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#6366f1;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><div style="text-align:center;margin:0 0 24px 0"><div style="display:inline-block;background-color:#f0fdf4;border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;font-size:28px">&#10003;</div></div><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600;text-align:center">Payment Confirmed!</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello {{customerName}},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your payment has been confirmed. Thank you for your order!</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">Order ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{orderId}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Plan</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{tierName}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Amount</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">&euro;{{tierPrice}}</td></tr></table><p style="margin:0 0 12px 0;color:#475569;font-size:15px;line-height:1.6">Your CMS instance is being set up and you will receive another email with your login details shortly.</p><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you have any questions, please contact our support team.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`,
    },
    cms_ready: {
      subject: 'Your CMS Instance "{{cmsId}}" is Ready',
      body: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#6366f1;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Your CMS Instance is Ready!</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello {{customerName}},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your CMS instance <strong style="color:#6366f1">{{cmsId}}</strong> has been set up and is ready to use.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{cmsId}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Domain</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{domain}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Admin Username</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{adminUsername}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Admin Password</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">{{adminPassword}}</td></tr></table><div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin:0 0 20px 0"><p style="margin:0;color:#dc2626;font-size:14px;font-weight:600">Important: Please change your password after first login.</p></div><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you have any questions, please contact our support team.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`,
    },
    password_changed: {
      subject: "Password Changed - {{cmsId}}",
      body: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#6366f1;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Password Changed</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello {{customerName}},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">The admin password for your CMS instance <strong style="color:#6366f1">{{cmsId}}</strong> has been updated. Below are your new login details.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{cmsId}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Panel URL</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0"><a href="https://{{domain}}" style="color:#6366f1;text-decoration:none">https://{{domain}}</a></td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Username</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{adminUsername}}</td></tr><tr><td style="background-color:#6366f1;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">New Password</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">{{newPassword}}</td></tr></table><div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin:0 0 20px 0"><p style="margin:0;color:#dc2626;font-size:14px;font-weight:600">Keep these credentials safe. Do not share them with anyone.</p></div><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">If you did not request this change, please contact our support team immediately.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`,
    },
    license_reminder: {
      subject: "{{urgency}}License Expiry Reminder - {{cmsId}} ({{daysRemaining}} days left)",
      body: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#f59e0b;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">License Expiry Reminder</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello {{customerName}},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your CMS instance <strong style="color:#f59e0b">{{cmsId}}</strong> ({{domain}}) license will expire in <strong style="color:#ef4444">{{daysRemaining}} days</strong> on {{expiryDate}}.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#f59e0b;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{cmsId}}</td></tr><tr><td style="background-color:#f59e0b;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Domain</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{domain}}</td></tr><tr><td style="background-color:#f59e0b;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Expiry Date</td><td style="padding:10px 16px;color:#1e293b;font-size:14px">{{expiryDate}}</td></tr></table><div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:12px 16px;margin:0 0 20px 0"><p style="margin:0;color:#92400e;font-size:14px;font-weight:600">Please renew your license to avoid service interruption. After expiry, your CMS instance will be automatically suspended.</p></div><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">Contact our support team to renew your license.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`,
    },
    license_expired: {
      subject: "Service Suspended - {{cmsId}} License Expired",
      body: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#ef4444;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Service Suspended</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello {{customerName}},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your CMS instance <strong style="color:#ef4444">{{cmsId}}</strong> ({{domain}}) has been suspended because the license has expired.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{cmsId}}</td></tr><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Domain</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{domain}}</td></tr><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Status</td><td style="padding:10px 16px;color:#ef4444;font-size:14px;font-weight:600">Suspended</td></tr></table><p style="margin:0 0 12px 0;color:#475569;font-size:15px;line-height:1.6">Please renew your license to restore service. Contact our support team for assistance.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`,
    },
    service_suspended: {
      subject: "Service Suspended - {{cmsId}}",
      body: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#ef4444;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Service Suspended</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello {{customerName}},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Your CMS instance <strong style="color:#ef4444">{{cmsId}}</strong> ({{domain}}) has been suspended.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{cmsId}}</td></tr><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Domain</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{domain}}</td></tr><tr><td style="background-color:#ef4444;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Status</td><td style="padding:10px 16px;color:#ef4444;font-size:14px;font-weight:600">Suspended</td></tr></table><p style="margin:0 0 12px 0;color:#475569;font-size:15px;line-height:1.6">If you believe this is an error or would like to renew, please contact our support team.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`,
    },
    service_reactivated: {
      subject: "Service Reactivated - {{cmsId}}",
      body: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)"><tr><td style="background-color:#22c55e;padding:28px 40px;text-align:center"><h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">DashCore</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 20px 0;color:#1e293b;font-size:22px;font-weight:600">Service Reactivated</h2><p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6">Hello {{customerName}},</p><p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6">Great news! The suspension on your CMS instance <strong style="color:#22c55e">{{cmsId}}</strong> has been lifted and your service is now active again.</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background-color:#22c55e;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600;width:140px">CMS ID</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0">{{cmsId}}</td></tr><tr><td style="background-color:#22c55e;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Domain</td><td style="padding:10px 16px;color:#1e293b;font-size:14px;border-bottom:1px solid #e2e8f0"><a href="https://{{domain}}" style="color:#22c55e;text-decoration:none">https://{{domain}}</a></td></tr><tr><td style="background-color:#22c55e;color:#ffffff;padding:10px 16px;font-size:14px;font-weight:600">Status</td><td style="padding:10px 16px;color:#22c55e;font-size:14px;font-weight:600">Active</td></tr></table><p style="margin:0;color:#475569;font-size:15px;line-height:1.6">You can now access your CMS panel at the domain above. Your login credentials remain the same.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="margin:0;color:#94a3b8;font-size:12px">DashCore IPTV Platform Engine</p></td></tr></table></td></tr></table></body></html>`,
    },
  };
}

function loadTemplates(): AllEmailTemplates {
  try {
    if (existsSync(TEMPLATES_FILE)) {
      const raw = readFileSync(TEMPLATES_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      const defaults = getDefaults();
      // Merge with defaults so new template keys are always present
      const result = { ...defaults };
      for (const key of Object.keys(defaults) as (keyof AllEmailTemplates)[]) {
        if (parsed[key]) result[key] = { ...defaults[key], ...parsed[key] };
      }
      return result;
    }
  } catch (err) {
    console.error("Error reading email templates file:", err);
  }
  return getDefaults();
}

function saveTemplates(templates: AllEmailTemplates): void {
  const dir = dirname(TEMPLATES_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), "utf-8");
}

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templates = loadTemplates();
    return NextResponse.json(templates);
  } catch (err) {
    console.error("Email templates fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const current = loadTemplates();

    // Only update the template keys that are provided
    const validKeys: (keyof AllEmailTemplates)[] = [
      "order_placed",
      "account_created",
      "order_confirmed",
      "cms_ready",
      "password_changed",
      "license_reminder",
      "license_expired",
      "service_suspended",
      "service_reactivated",
    ];

    for (const key of validKeys) {
      if (body[key]) {
        if (typeof body[key].subject === "string") {
          current[key].subject = body[key].subject;
        }
        if (typeof body[key].body === "string") {
          current[key].body = body[key].body;
        }
      }
    }

    saveTemplates(current);
    return NextResponse.json(current);
  } catch (err) {
    console.error("Email templates save error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
