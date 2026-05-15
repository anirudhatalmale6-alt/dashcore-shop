"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Mail, Globe, Play, MessageCircle, type LucideIcon } from "lucide-react";

interface NavPage {
  title: string;
  slug: string;
}

interface SocialLink {
  platform: string;
  url: string;
  enabled: boolean;
}

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  telegram: Send,
  email: Mail,
  twitter: Globe,
  facebook: Globe,
  instagram: Globe,
  youtube: Play,
  discord: MessageCircle,
  whatsapp: MessageCircle,
};

const PLATFORM_LABELS: Record<string, string> = {
  telegram: "Telegram",
  email: "Email",
  twitter: "Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  discord: "Discord",
  whatsapp: "WhatsApp",
};

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [cmsPages, setCmsPages] = useState<NavPage[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.socialLinks)) {
          setSocialLinks(data.socialLinks.filter((sl: SocialLink) => sl.enabled && sl.url));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/pages/nav")
      .then((res) => res.json())
      .then((data) => setCmsPages(data || []))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-white border-t border-[#e5e7eb]">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              <span className="text-lg font-bold text-[#6366f1]">DashCore</span>
            </div>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              Premium IPTV platform engine and streaming infrastructure for global providers.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 mt-5">
                {socialLinks.map((link) => {
                  const Icon = PLATFORM_ICONS[link.platform] || Send;
                  const label = PLATFORM_LABELS[link.platform] || link.platform;
                  const isExternal = !link.url.startsWith("mailto:");
                  return (
                    <a
                      key={link.platform}
                      href={link.url}
                      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1] hover:text-white transition-all"
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/#features" className="text-sm text-[#6b7280] hover:text-[#6366f1] transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-[#6b7280] hover:text-[#6366f1] transition-colors">Pricing</Link></li>
              <li><Link href="/contact" className="text-sm text-[#6b7280] hover:text-[#6366f1] transition-colors">Contact</Link></li>
              <li><Link href="/order-lookup" className="text-sm text-[#6b7280] hover:text-[#6366f1] transition-colors">Order Lookup</Link></li>
            </ul>
          </div>

          {cmsPages.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {cmsPages.map((page) => (
                  <li key={page.slug}>
                    <Link href={`/page/${page.slug}`} className="text-sm text-[#6b7280] hover:text-[#6366f1] transition-colors">
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] mb-4">
              Payment Methods
            </h4>
            <div className="flex flex-wrap gap-2">
              {/* Stripe */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#635bff]/10 border border-[#635bff]/20">
                <span className="w-2 h-2 rounded-full bg-[#635bff]" />
                <span className="text-xs font-semibold text-[#635bff]">Stripe</span>
              </span>
              {/* MultiSafepay */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0ea5e9]/10 border border-[#0ea5e9]/20">
                <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                <span className="text-xs font-semibold text-[#0ea5e9]">MultiSafepay</span>
              </span>
              {/* BTC */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#f7931a]/10 border border-[#f7931a]/20">
                <span className="w-2 h-2 rounded-full bg-[#f7931a]" />
                <span className="text-xs font-bold text-[#f7931a]">BTC</span>
              </span>
              {/* USDT */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#26a17b]/10 border border-[#26a17b]/20">
                <span className="w-2 h-2 rounded-full bg-[#26a17b]" />
                <span className="text-xs font-bold text-[#26a17b]">USDT</span>
              </span>
              {/* USDC */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#2775ca]/10 border border-[#2775ca]/20">
                <span className="w-2 h-2 rounded-full bg-[#2775ca]" />
                <span className="text-xs font-bold text-[#2775ca]">USDC</span>
              </span>
              {/* ETH */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#627eea]/10 border border-[#627eea]/20">
                <span className="w-2 h-2 rounded-full bg-[#627eea]" />
                <span className="text-xs font-bold text-[#627eea]">ETH</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#e5e7eb] text-center">
          <p className="text-xs text-[#9ca3af]">
            &copy; {new Date().getFullYear()} DashCore Systems. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
