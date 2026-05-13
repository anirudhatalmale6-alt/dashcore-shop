"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import {
  Loader2,
  Mail,
  MailOpen,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
} from "lucide-react";

interface Message {
  id: number;
  name: string;
  email: string;
  department: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("dashcore_admin_token");
    if (!t) {
      router.push("/admin");
      return;
    }
    setToken(t);
  }, [router]);

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        router.push("/admin");
        throw new Error("Session expired");
      }
      return res;
    },
    [token, router]
  );

  const loadMessages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (unreadOnly) params.set("unread", "true");
      const res = await apiFetch(`/api/admin/messages?${params}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch {
      /* handled by 401 redirect */
    } finally {
      setLoading(false);
    }
  }, [token, page, unreadOnly, apiFetch]);

  useEffect(() => {
    if (token) loadMessages();
  }, [token, loadMessages]);

  const toggleRead = async (msg: Message) => {
    try {
      await apiFetch("/api/admin/messages", {
        method: "PATCH",
        body: JSON.stringify({ id: msg.id, read: !msg.read }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, read: !m.read } : m))
      );
    } catch {
      /* silent */
    }
  };

  const deleteMsg = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    try {
      await apiFetch("/api/admin/messages", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setTotal((t) => t - 1);
      if (expanded === id) setExpanded(null);
    } catch {
      /* silent */
    }
  };

  const handleExpand = async (msg: Message) => {
    if (expanded === msg.id) {
      setExpanded(null);
      return;
    }
    setExpanded(msg.id);
    if (!msg.read) {
      try {
        await apiFetch("/api/admin/messages", {
          method: "PATCH",
          body: JSON.stringify({ id: msg.id, read: true }),
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
        );
      } catch {
        /* silent */
      }
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const deptColor = (dept: string) => {
    switch (dept) {
      case "Sales":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Technical Support":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Billing":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Messages</h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            {total} message{total !== 1 ? "s" : ""} from the contact form
          </p>
        </div>
        <button
          onClick={() => {
            setUnreadOnly(!unreadOnly);
            setPage(1);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
            unreadOnly
              ? "bg-[#7c3aed]/8 border-[#7c3aed]/20 text-[#7c3aed]"
              : "bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          {unreadOnly ? "Unread Only" : "All Messages"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center">
          <Inbox className="h-10 w-10 text-[#cbd5e1] mx-auto mb-3" />
          <p className="text-[#64748b] text-sm">
            {unreadOnly
              ? "No unread messages"
              : "No messages yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`${i > 0 ? "border-t border-[#e2e8f0]" : ""}`}
              >
                <div
                  onClick={() => handleExpand(msg)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#f8fafc] transition-all ${
                    !msg.read ? "bg-[#7c3aed]/3" : ""
                  }`}
                >
                  <div className="shrink-0">
                    {msg.read ? (
                      <MailOpen className="h-4 w-4 text-[#94a3b8]" />
                    ) : (
                      <Mail className="h-4 w-4 text-[#7c3aed]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm truncate ${
                          !msg.read ? "font-semibold text-[#0f172a]" : "text-[#0f172a]"
                        }`}
                      >
                        {msg.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${deptColor(
                          msg.department
                        )}`}
                      >
                        {msg.department}
                      </span>
                    </div>
                    <p
                      className={`text-sm truncate mt-0.5 ${
                        !msg.read
                          ? "font-medium text-[#334155]"
                          : "text-[#64748b]"
                      }`}
                    >
                      {msg.subject}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-[#94a3b8] whitespace-nowrap">
                      {formatDate(msg.createdAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRead(msg);
                      }}
                      title={msg.read ? "Mark unread" : "Mark read"}
                      className="p-1.5 rounded hover:bg-[#f1f5f9] transition-all"
                    >
                      {msg.read ? (
                        <Mail className="h-3.5 w-3.5 text-[#94a3b8]" />
                      ) : (
                        <MailOpen className="h-3.5 w-3.5 text-[#94a3b8]" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMsg(msg.id);
                      }}
                      title="Delete"
                      className="p-1.5 rounded hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[#94a3b8] hover:text-red-500" />
                    </button>
                  </div>
                </div>

                {expanded === msg.id && (
                  <div className="px-5 pb-4 bg-[#f8fafc] border-t border-[#e2e8f0]">
                    <div className="pt-4 space-y-2">
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-[#94a3b8]">From:</span>{" "}
                          <span className="text-[#0f172a] font-medium">
                            {msg.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8]">Email:</span>{" "}
                          <a
                            href={`mailto:${msg.email}`}
                            className="text-[#7c3aed] hover:underline"
                          >
                            {msg.email}
                          </a>
                        </div>
                        <div>
                          <span className="text-[#94a3b8]">Department:</span>{" "}
                          <span className="text-[#0f172a]">{msg.department}</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-[#e2e8f0] p-4 mt-3">
                        <p className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-[#94a3b8]">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
