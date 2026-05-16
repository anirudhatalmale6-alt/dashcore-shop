"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Search,
  MessageSquare,
  CreditCard,
  FileText,
  Images,
  Users,
  Key,
  Server,
  Mail,
  ShieldCheck,
} from "lucide-react";

const allNavItems = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, moderator: true },
  { key: "products", label: "Products", href: "/admin/products", icon: Package, moderator: false },
  { key: "orders", label: "Orders", href: "/admin/orders", icon: ShoppingCart, moderator: true },
  { key: "customers", label: "Customers", href: "/admin/customers", icon: Users, moderator: true },
  { key: "messages", label: "Messages", href: "/admin/messages", icon: MessageSquare, moderator: false },
  { key: "pages", label: "Pages", href: "/admin/pages", icon: FileText, moderator: false },
  { key: "slider", label: "Slider", href: "/admin/slider", icon: Images, moderator: false },
  { key: "cms-instances", label: "CMS Instances", href: "/admin/cms-instances", icon: Server, moderator: true },
  { key: "api-keys", label: "API Keys", href: "/admin/api-keys", icon: Key, moderator: false },
  { key: "payments", label: "Payments", href: "/admin/payments", icon: CreditCard, moderator: false },
  { key: "email-templates", label: "Email Templates", href: "/admin/email-templates", icon: Mail, moderator: false },
  { key: "admin-users", label: "Admin Users", href: "/admin/admin-users", icon: ShieldCheck, moderator: false },
  { key: "settings", label: "Settings", href: "/admin/settings", icon: Settings, moderator: false },
  { key: "seo", label: "SEO", href: "/admin/seo", icon: Search, moderator: false },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("admin");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("dashcore_admin_token");
    const nick = localStorage.getItem("dashcore_admin_nickname");
    const r = localStorage.getItem("dashcore_admin_role");
    if (!token) {
      router.push("/admin");
      return;
    }
    setNickname(nick || "Admin");
    setRole(r || "admin");
    setReady(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("dashcore_admin_token");
    localStorage.removeItem("dashcore_admin_nickname");
    localStorage.removeItem("dashcore_admin_role");
    router.push("/admin");
  };

  const isModerator = role === "moderator";
  const navItems = isModerator
    ? allNavItems.filter((item) => item.moderator)
    : allNavItems;

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
        <div className="h-8 w-8 border-3 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeKey = navItems.find((item) => pathname.startsWith(item.href))?.key || "dashboard";

  return (
    <div className="min-h-screen flex bg-[#f1f5f9]">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-[#e2e8f0] flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="px-5 py-5 border-b border-[#e2e8f0]">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] text-white font-bold text-sm">
              D
            </div>
            <div>
              <span className="text-sm font-bold text-[#0f172a]">DashCore</span>
              <p className="text-[10px] text-[#94a3b8] leading-none mt-0.5">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#7c3aed]/8 text-[#7c3aed]"
                    : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 ${isActive ? "text-[#7c3aed]" : "text-[#94a3b8]"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[#e2e8f0]">
          <div className="px-3 mb-3">
            <p className="text-xs text-[#94a3b8]">Signed in as</p>
            <p className="text-sm font-medium text-[#0f172a] truncate">{nickname}</p>
            <span className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isModerator
                ? "bg-amber-100 text-amber-700"
                : "bg-[#7c3aed]/10 text-[#7c3aed]"
            }`}>
              {isModerator ? "Moderator" : "Administrator"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#64748b] hover:bg-red-50 hover:text-red-600 transition-all w-full"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-60">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
