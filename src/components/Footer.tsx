import Link from "next/link";
import { CreditCard, Wallet, Bitcoin, Send, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1a1625] text-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6d28d9] text-white font-bold text-sm">
                D
              </div>
              <span className="text-base font-semibold tracking-tight font-[var(--font-display)]">
                Dash<span className="text-[#a78bfa]">Core</span>
              </span>
            </div>
            <p className="text-sm text-[#9ca3af] leading-relaxed">
              Premium IPTV platform engine and streaming infrastructure for global providers.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#a78bfa] mb-4 font-[var(--font-display)]">
              Platform
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/#features" className="text-sm text-[#9ca3af] hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-[#9ca3af] hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/contact" className="text-sm text-[#9ca3af] hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#a78bfa] mb-4 font-[var(--font-display)]">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/privacy" className="text-sm text-[#9ca3af] hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-[#9ca3af] hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-sm text-[#9ca3af] hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Payment & Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#a78bfa] mb-4 font-[var(--font-display)]">
              Payment Methods
            </h4>
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-1.5 text-[#9ca3af] bg-white/5 px-3 py-1.5 rounded-lg text-xs">
                <CreditCard className="h-3.5 w-3.5" /> Stripe
              </div>
              <div className="flex items-center gap-1.5 text-[#9ca3af] bg-white/5 px-3 py-1.5 rounded-lg text-xs">
                <Wallet className="h-3.5 w-3.5" /> MultiSafepay
              </div>
              <div className="flex items-center gap-1.5 text-[#9ca3af] bg-white/5 px-3 py-1.5 rounded-lg text-xs">
                <Bitcoin className="h-3.5 w-3.5" /> Crypto
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://t.me/dashcore"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-[#9ca3af] hover:text-white hover:bg-white/10 transition-all"
                aria-label="Telegram"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="mailto:info@dashcore.eu"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-[#9ca3af] hover:text-white hover:bg-white/10 transition-all"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-[#6b7280]">
            &copy; {new Date().getFullYear()} DashCore Systems. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
