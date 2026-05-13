"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Send } from "lucide-react";

interface NavPage {
  title: string;
  slug: string;
}

const staticLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
  { label: "Order Lookup", href: "/order-lookup" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmsPages, setCmsPages] = useState<NavPage[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/pages/nav")
      .then((res) => res.json())
      .then((data) => setCmsPages(data || []))
      .catch(() => {});
  }, []);

  const allLinks = [
    ...staticLinks,
    ...cmsPages.map((p) => ({ label: p.title, href: `/page/${p.slug}` })),
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 navbar-glass ${scrolled ? "scrolled" : ""}`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] text-white font-bold text-sm transition-transform group-hover:scale-105">
              D
            </div>
            <span className="text-base font-bold tracking-tight text-[#0f172a]">
              Dash<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]">Core</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <a
              href="https://t.me/dashcore"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#64748b] hover:text-[#7c3aed] transition-colors"
              aria-label="Telegram"
            >
              <Send className="h-4 w-4" />
            </a>

            <Link href="/pricing" className="text-sm font-bold px-5 py-2 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-sm transition-all">
              Renew License
            </Link>
          </nav>

          <button
            className="md:hidden text-[#64748b] hover:text-[#0f172a] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#e2e8f0]">
          <div className="px-5 py-4 space-y-3">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-[#64748b] font-medium hover:text-[#0f172a] py-2"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="btn-primary inline-block text-sm px-5 py-2 mt-2"
            >
              Renew License
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
