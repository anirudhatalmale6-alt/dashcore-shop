"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Send } from "lucide-react";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "navbar-blur shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6d28d9] text-white font-bold text-sm font-[var(--font-display)] transition-transform group-hover:scale-105">
              D
            </div>
            <span className="text-base font-semibold tracking-tight font-[var(--font-display)]">
              Dash<span className="text-[#6d28d9]">Core</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-[#8c8579] font-medium transition-colors hover:text-[#1a1625]"
              >
                {link.label}
              </Link>
            ))}

            <a
              href="https://t.me/dashcore"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8c8579] transition-colors hover:text-[#6d28d9]"
              aria-label="Telegram"
            >
              <Send className="h-4 w-4" />
            </a>

            <Link href="/pricing" className="btn-primary text-sm px-5 py-2">
              Renew License
            </Link>
          </nav>

          <button
            className="md:hidden text-[#8c8579] hover:text-[#1a1625]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden navbar-blur border-t border-[#e8e5df]">
          <div className="px-5 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-[#8c8579] font-medium transition-colors hover:text-[#1a1625] py-2"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://t.me/dashcore"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8c8579] transition-colors hover:text-[#6d28d9]"
              >
                <Send className="h-4 w-4" />
              </a>
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="btn-primary text-sm px-5 py-2 inline-block"
              >
                Renew License
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
