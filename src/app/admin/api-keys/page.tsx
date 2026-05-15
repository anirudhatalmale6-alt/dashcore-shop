"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "@/components/AdminShell";
import {
  Key, Loader2, Plus, Trash2, Copy, CheckCircle, XCircle,
  Eye, EyeOff, Shield, Clock, X, AlertTriangle,
} from "lucide-react";

interface ApiKeyRow {
  id: number;
  name: string;
  keyPrefix: string;
  permissions: string[];
  active: boolean;
  rateLimit: number;
  lastUsedAt: string | null;
  createdAt: string;
}

interface NewKeyResponse {
  id: number;
  name: string;
  key: string;
  secret: string;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  "cms:read", "cms:write",
  "dns:read", "dns:write",
  "users:read", "users:write",
  "server:read",
  "api-keys:manage",
  "*",
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [rateLimit, setRateLimit] = useState(60);
  const [selectedPerms, setSelectedPerms] = useState<string[]>(["cms:read"]);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const headers = useCallback(() => {
    const token = localStorage.getItem("dashcore_admin_token");
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }, []);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/api-keys", { headers: headers() });
      if (res.ok) setKeys(await res.json());
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: name.trim(), permissions: selectedPerms, rateLimit }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data);
        fetchKeys();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this API key? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE", headers: headers() });
      fetchKeys();
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (id: number, active: boolean) => {
    await fetch(`/api/v1/api-keys/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ active: !active }),
    });
    fetchKeys();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const togglePerm = (p: string) => {
    if (p === "*") {
      setSelectedPerms(selectedPerms.includes("*") ? ["cms:read"] : ["*"]);
      return;
    }
    setSelectedPerms((prev) => {
      const filtered = prev.filter((x) => x !== "*");
      return filtered.includes(p) ? filtered.filter((x) => x !== p) : [...filtered, p];
    });
  };

  const resetCreate = () => {
    setShowCreate(false);
    setNewKey(null);
    setName("");
    setRateLimit(60);
    setSelectedPerms(["cms:read"]);
    setShowSecret(false);
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Key className="h-6 w-6 text-[#7c3aed]" />
          <h1 className="text-2xl font-bold text-[#0f172a]">API Keys</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create API Key
        </button>
      </div>

      <p className="text-sm text-[#64748b] mb-6">
        Manage API keys for the CMS Creation API. Keys authenticate requests to backend.dashcore.eu.
      </p>

      {/* Keys table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-[#7c3aed] animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-16 text-[#94a3b8]">
            <Key className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No API keys yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Name</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Key Prefix</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Permissions</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Rate Limit</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Last Used</th>
                <th className="px-4 py-3 text-left text-[#64748b] font-medium">Status</th>
                <th className="px-4 py-3 text-right text-[#64748b] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-[#f1f5f9] hover:bg-[#fafbfc] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#0f172a]">{k.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-[#f1f5f9] px-2 py-1 rounded text-[#6366f1]">{k.keyPrefix}...</code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(k.permissions as string[]).map((p) => (
                        <span key={p} className="text-[10px] bg-[#7c3aed]/8 text-[#7c3aed] px-1.5 py-0.5 rounded-md font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#64748b]">{k.rateLimit}/min</td>
                  <td className="px-4 py-3 text-[#64748b]">
                    {k.lastUsedAt ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(k.lastUsedAt)}
                      </span>
                    ) : (
                      <span className="text-[#94a3b8]">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(k.id, k.active)} title="Toggle active">
                      {k.active ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Disabled
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(k.id)}
                      disabled={deleting === k.id}
                      className="p-1.5 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      {deleting === k.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && !newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#7c3aed]" />
                Create API Key
              </h2>
              <button onClick={resetCreate} className="p-1 hover:bg-[#f1f5f9] rounded-lg">
                <X className="h-5 w-5 text-[#94a3b8]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Production Server"
                  className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] text-sm focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Rate Limit (requests/min)</label>
                <input
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  min={1}
                  max={1000}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] text-sm focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PERMISSIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePerm(p)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        selectedPerms.includes(p) || selectedPerms.includes("*")
                          ? "bg-[#7c3aed] text-white"
                          : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={resetCreate} className="px-4 py-2.5 text-sm text-[#64748b] hover:bg-[#f1f5f9] rounded-lg">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="px-4 py-2.5 bg-[#7c3aed] text-white text-sm font-medium rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 flex items-center gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials modal */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-[#0f172a]">Save Your Credentials</h2>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
              <p className="text-sm text-amber-800">
                Copy these credentials now. The secret will not be shown again.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">API Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-[#f1f5f9] px-3 py-2.5 rounded-lg text-[#0f172a] font-mono break-all">{newKey.key}</code>
                  <button
                    onClick={() => copyToClipboard(newKey.key, "key")}
                    className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
                  >
                    {copied === "key" ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-[#94a3b8]" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">API Secret</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-[#f1f5f9] px-3 py-2.5 rounded-lg text-[#0f172a] font-mono break-all">
                    {showSecret ? newKey.secret : "•".repeat(40)}
                  </code>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4 text-[#94a3b8]" /> : <Eye className="h-4 w-4 text-[#94a3b8]" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(newKey.secret, "secret")}
                    className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
                  >
                    {copied === "secret" ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-[#94a3b8]" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#f1f5f9] rounded-lg p-3 mt-5">
              <p className="text-xs text-[#64748b] font-medium mb-1">Usage:</p>
              <code className="text-[11px] text-[#374151] block">
                curl -H &quot;x-api-key: {newKey.key.slice(0, 12)}...&quot; \<br />
                &nbsp;&nbsp;&nbsp;&nbsp; -H &quot;x-api-secret: YOUR_SECRET&quot; \<br />
                &nbsp;&nbsp;&nbsp;&nbsp; https://backend.dashcore.eu/api/v1/cms
              </code>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={resetCreate}
                className="px-4 py-2.5 bg-[#7c3aed] text-white text-sm font-medium rounded-lg hover:bg-[#6d28d9]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
