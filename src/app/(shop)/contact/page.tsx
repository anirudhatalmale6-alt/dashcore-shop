"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send, CheckCircle, Loader2, Mail, User,
  MessageSquare, MapPin, Phone, Clock, RefreshCw,
} from "lucide-react";

interface ContactSettings {
  contactPageTitle?: string;
  contactPageSubtitle?: string;
}

const infoItems = [
  { icon: MapPin, label: "Address", value: "Netherlands, EU", color: "bg-[#6366f1]" },
  { icon: Phone, label: "Phone", value: "+31 6 12345678", color: "bg-[#8b5cf6]" },
  { icon: Mail, label: "Email", value: "support@dashcore.eu", color: "bg-[#a78bfa]" },
  { icon: Clock, label: "Hours", value: "Mon-Fri 09:00-18:00", color: "bg-[#6366f1]" },
];

export default function ContactPage() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<ContactSettings>({});

  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const loadCaptcha = useCallback(() => {
    fetch("/api/captcha")
      .then((r) => r.json())
      .then((d) => {
        setCaptchaCode(d.code || "");
        setCaptchaToken(d.token || "");
        setCaptchaInput("");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/contact")
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data.departments || []);
        if (data.departments?.length) setDepartment(data.departments[0]);
      })
      .catch(() => {});
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .catch(() => {});
    loadCaptcha();
  }, [loadCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !department || !subject.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
      setError("Captcha verification failed. Please type the code exactly as shown.");
      loadCaptcha();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          department,
          subject: subject.trim(),
          message: message.trim(),
          captchaInput: captchaInput.toLowerCase(),
          captchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message.");
        if (data.error?.includes("aptcha")) loadCaptcha();
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center pt-20">
        <div className="max-w-md mx-auto px-5 text-center">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-10 shadow-sm">
            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 rounded-full bg-[#6366f1]/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-[#6366f1]" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-2">Message Sent!</h2>
            <p className="text-[#6b7280] text-sm leading-relaxed">
              Thank you for contacting us. Our team will get back to you shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="pt-24 pb-32 sm:pt-28 sm:pb-36 bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#8b5cf6] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 0%, transparent 50%), radial-gradient(circle at 70% 80%, white 0%, transparent 40%)" }} />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {settings.contactPageTitle || "Get In Touch"}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm sm:text-base text-white/70 leading-relaxed">
            {settings.contactPageSubtitle || "Have a question or need help? We'd love to hear from you."}
          </p>
        </div>
      </section>

      {/* Form Card — Overlapping the Banner */}
      <section className="-mt-20 pb-16 sm:pb-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          {/* Info Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">{item.label}</p>
                  <p className="text-xs font-medium text-[#111827]">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 sm:p-8 shadow-lg">
            {/* Department Buttons */}
            {departments.length > 0 && (
              <div className="mb-7">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-3">
                  Select Department
                </label>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setDepartment(dept)}
                      className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        department === dept
                          ? "bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/25"
                          : "bg-[#f8fafc] text-[#6b7280] border border-[#e5e7eb] hover:border-[#6366f1]/40 hover:text-[#6366f1]"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#cbd5e1]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-[#e5e7eb] bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-[#111827] placeholder:text-[#cbd5e1] focus:border-[#6366f1] focus:bg-white focus:ring-2 focus:ring-[#6366f1]/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#cbd5e1]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-[#e5e7eb] bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-[#111827] placeholder:text-[#cbd5e1] focus:border-[#6366f1] focus:bg-white focus:ring-2 focus:ring-[#6366f1]/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f8fafc] py-3 px-4 text-sm text-[#111827] placeholder:text-[#cbd5e1] focus:border-[#6366f1] focus:bg-white focus:ring-2 focus:ring-[#6366f1]/10 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Message</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3.5 h-4 w-4 text-[#cbd5e1]" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Describe your question or issue..."
                    className="w-full rounded-lg border border-[#e5e7eb] bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-[#111827] placeholder:text-[#cbd5e1] focus:border-[#6366f1] focus:bg-white focus:ring-2 focus:ring-[#6366f1]/10 focus:outline-none transition-all resize-y"
                  />
                </div>
              </div>

              {/* Captcha */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
                  Security Verification
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 px-5 py-3 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] select-none">
                    <span
                      className="text-lg font-mono font-bold tracking-[0.3em] text-[#334155]"
                      style={{ letterSpacing: "0.25em" }}
                    >
                      {captchaCode || "..."}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    className="p-2 rounded-lg text-[#94a3b8] hover:text-[#6366f1] hover:bg-[#6366f1]/5 transition-colors"
                    title="Refresh captcha"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Type the code above"
                    className="flex-1 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] py-3 px-4 text-sm text-[#111827] placeholder:text-[#cbd5e1] focus:border-[#6366f1] focus:bg-white focus:ring-2 focus:ring-[#6366f1]/10 focus:outline-none transition-all"
                    autoComplete="off"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#6366f1] text-white text-sm font-bold rounded-lg uppercase tracking-wider hover:bg-[#4f46e5] hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4" /> Send Message</>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
