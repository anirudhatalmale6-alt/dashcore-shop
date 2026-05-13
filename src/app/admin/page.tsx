"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nickname.trim() || !password.trim()) {
      setError("Please enter both nickname and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed."); return; }
      localStorage.setItem("dashcore_admin_token", data.token);
      localStorage.setItem("dashcore_admin_nickname", data.nickname);
      router.push("/admin/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-[#faf9f7]">
      <div className="w-full max-w-sm">
        <div className="card-elevated p-8">
          <div className="text-center mb-7">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7c3aed]">
                <Lock className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold font-[var(--font-display)]">Admin Panel</h1>
            <p className="mt-1 text-sm text-[#8c8579]">Sign in to manage DashCore</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1625] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
