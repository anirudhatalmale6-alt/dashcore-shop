"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      localStorage.setItem("customer_token", data.token);
      localStorage.setItem("customer_name", data.customer.name);
      localStorage.setItem("customer_email", data.customer.email);
      window.dispatchEvent(new Event("customer-auth-change"));
      router.push("/account");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="hero-light relative pt-28 pb-14 sm:pt-36 sm:pb-18">
        <div className="hero-pattern" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Sign In
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#64748b]">
            Access your dashboard, orders, and licenses.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 -mt-4 relative z-10">
        <div className="mx-auto max-w-md px-5">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7 shadow-sm">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-field !pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field !pl-10"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <p className="text-center text-sm text-[#64748b] mt-5">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[#6366f1] hover:underline font-semibold">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
