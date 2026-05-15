"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle, Loader2, Mail, User, Building2, MessageSquare } from "lucide-react";

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
  const [pageTitle, setPageTitle] = useState("Contact Us");
  const [pageSubtitle, setPageSubtitle] = useState("Have a question or need help? Select a department and send us a message.");

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
      .then((d) => {
        if (d.contactPageTitle) setPageTitle(d.contactPageTitle);
        if (d.contactPageSubtitle) setPageSubtitle(d.contactPageSubtitle);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !department || !subject.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), department, subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send message."); return; }
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
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Message Sent!</h2>
            <p className="text-[#64748b] text-sm">
              Thank you for contacting us. Our team will review your message and get back to you as soon as possible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="mx-auto max-w-xl px-5 sm:px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/15 px-4 py-1.5 mb-5">
              <Mail className="h-3.5 w-3.5 text-[#6366f1]" />
              <span className="text-xs font-semibold text-[#6366f1] tracking-wide uppercase">
                Get in Touch
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
              {pageTitle}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#6b7280] leading-relaxed">
              {pageSubtitle}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-7 sm:p-8 shadow-sm">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="input-field pl-10 cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="input-field pl-10" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Subject</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="How can we help?" className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Message</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Describe your question or issue..." className="input-field pl-10 resize-y" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
