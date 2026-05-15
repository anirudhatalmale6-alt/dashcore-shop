"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "@/components/AdminShell";
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  RotateCcw,
  Mail,
  ShoppingCart,
  UserPlus,
  Server,
  ClipboardCheck,
} from "lucide-react";

interface TemplateData {
  subject: string;
  body: string;
}

interface AllTemplates {
  order_placed: TemplateData;
  account_created: TemplateData;
  order_confirmed: TemplateData;
  cms_ready: TemplateData;
}

type TemplateKey = keyof AllTemplates;

interface TemplateInfo {
  key: TemplateKey;
  name: string;
  description: string;
  icon: typeof Mail;
  placeholders: string[];
}

const TEMPLATE_INFO: TemplateInfo[] = [
  {
    key: "order_placed",
    name: "Order Placed",
    description: "Sent automatically when a customer places a new order.",
    icon: ShoppingCart,
    placeholders: [
      "{{customerName}}",
      "{{orderId}}",
      "{{tierName}}",
      "{{totalPrice}}",
      "{{paymentMethod}}",
    ],
  },
  {
    key: "account_created",
    name: "Account Created",
    description: "Sent when a new customer account is created with login credentials.",
    icon: UserPlus,
    placeholders: [
      "{{customerName}}",
      "{{email}}",
      "{{password}}",
      "{{siteName}}",
    ],
  },
  {
    key: "order_confirmed",
    name: "Order Confirmed",
    description: "Sent when an admin marks an order as paid / confirmed.",
    icon: ClipboardCheck,
    placeholders: [
      "{{customerName}}",
      "{{orderId}}",
      "{{tierName}}",
      "{{tierPrice}}",
    ],
  },
  {
    key: "cms_ready",
    name: "CMS Ready",
    description: "Sent when a CMS instance is provisioned and ready for the customer.",
    icon: Server,
    placeholders: [
      "{{customerName}}",
      "{{cmsId}}",
      "{{domain}}",
      "{{adminUsername}}",
      "{{adminPassword}}",
    ],
  },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<AllTemplates | null>(null);
  const [defaults, setDefaults] = useState<AllTemplates | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<TemplateKey | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const getToken = () => localStorage.getItem("dashcore_admin_token");

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/email-templates", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to load templates");
      const data: AllTemplates = await res.json();
      setTemplates(data);
      // Store defaults on first load
      if (!defaults) {
        setDefaults(JSON.parse(JSON.stringify(data)));
      }
    } catch {
      setFlash({ type: "error", msg: "Failed to load email templates" });
    } finally {
      setLoading(false);
    }
  }, [defaults]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const showFlash = (type: "success" | "error", msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3000);
  };

  const saveTemplate = async (key: TemplateKey) => {
    if (!templates) return;
    setSaving(key);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ [key]: templates[key] }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data: AllTemplates = await res.json();
      setTemplates(data);
      showFlash("success", `"${TEMPLATE_INFO.find((t) => t.key === key)?.name}" template saved`);
    } catch {
      showFlash("error", "Failed to save template");
    } finally {
      setSaving(null);
    }
  };

  const saveAll = async () => {
    if (!templates) return;
    setSavingAll(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(templates),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data: AllTemplates = await res.json();
      setTemplates(data);
      showFlash("success", "All templates saved successfully");
    } catch {
      showFlash("error", "Failed to save templates");
    } finally {
      setSavingAll(false);
    }
  };

  const resetTemplate = (key: TemplateKey) => {
    if (!defaults || !templates) return;
    setTemplates({ ...templates, [key]: JSON.parse(JSON.stringify(defaults[key])) });
    showFlash("success", `"${TEMPLATE_INFO.find((t) => t.key === key)?.name}" reset to default (not saved yet)`);
  };

  const previewTemplate = (key: TemplateKey) => {
    if (!templates) return;
    const t = templates[key];
    // Replace placeholders with sample data for preview
    const sampleData: Record<string, string> = {
      "{{customerName}}": "John Doe",
      "{{orderId}}": "ORD-A1B2C3D",
      "{{tierName}}": "Premium Monthly",
      "{{totalPrice}}": "29.99",
      "{{paymentMethod}}": "stripe",
      "{{tierPrice}}": "29.99",
      "{{email}}": "john@example.com",
      "{{password}}": "SecureP@ss123",
      "{{siteName}}": "DashCore",
      "{{cmsId}}": "cms-abc123",
      "{{domain}}": "example.dashcore.eu",
      "{{adminUsername}}": "admin",
      "{{adminPassword}}": "TempP@ss456",
    };

    let html = t.body;
    for (const [placeholder, value] of Object.entries(sampleData)) {
      html = html.replaceAll(placeholder, value);
    }

    let subject = t.subject;
    for (const [placeholder, value] of Object.entries(sampleData)) {
      subject = subject.replaceAll(placeholder, value);
    }

    const previewHtml = `<!DOCTYPE html>
<html>
<head><title>Preview: ${subject}</title><style>body{background:#f1f5f9;padding:40px;font-family:Arial,sans-serif}
.preview-bar{background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px 8px 0 0;font-size:14px}
.preview-bar strong{font-size:16px}
.preview-body{background:#fff;padding:20px;border-radius:0 0 8px 8px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}</style></head>
<body>
<div style="max-width:640px;margin:0 auto">
<div class="preview-bar"><strong>Subject:</strong> ${subject}</div>
<div class="preview-body">${html}</div>
</div>
</body></html>`;

    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const updateField = (key: TemplateKey, field: "subject" | "body", value: string) => {
    if (!templates) return;
    setTemplates({
      ...templates,
      [key]: { ...templates[key], [field]: value },
    });
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {/* Flash message */}
      {flash && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            flash.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {flash.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {flash.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Email Templates</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Customize the emails sent to customers. Use placeholders to insert dynamic data.
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={savingAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
        >
          {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Templates
        </button>
      </div>

      {/* Template cards */}
      <div className="space-y-6">
        {TEMPLATE_INFO.map((info) => {
          const Icon = info.icon;
          const t = templates?.[info.key];
          const isSaving = saving === info.key;

          return (
            <div
              key={info.key}
              className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7c3aed]/10">
                    <Icon className="h-4.5 w-4.5 text-[#7c3aed]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#0f172a]">{info.name}</h2>
                    <p className="text-xs text-[#64748b]">{info.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => previewTemplate(info.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748b] hover:text-[#0f172a] bg-white border border-[#e2e8f0] rounded-lg hover:border-[#cbd5e1] transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => resetTemplate(info.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748b] hover:text-amber-600 bg-white border border-[#e2e8f0] rounded-lg hover:border-amber-300 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                  <button
                    onClick={() => saveTemplate(info.key)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="px-6 py-5 space-y-4">
                {/* Placeholders */}
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1.5">
                    Available Placeholders
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {info.placeholders.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-[#7c3aed]/5 text-[#7c3aed] text-xs font-mono border border-[#7c3aed]/15 cursor-default select-all"
                        title={`Click to select, then paste into subject or body`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={t?.subject || ""}
                    onChange={(e) => updateField(info.key, "subject", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] text-[#0f172a] placeholder-[#94a3b8]"
                    placeholder="Email subject line..."
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Body (HTML)
                  </label>
                  <textarea
                    value={t?.body || ""}
                    onChange={(e) => updateField(info.key, "body", e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] text-[#0f172a] placeholder-[#94a3b8] font-mono leading-relaxed resize-y"
                    placeholder="HTML email body..."
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
