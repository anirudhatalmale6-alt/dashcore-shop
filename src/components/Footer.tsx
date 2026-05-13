import Link from "next/link";
import { CreditCard, Wallet, Bitcoin, Send, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#f8fafc] border-t border-[#e2e8f0]">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] text-white font-bold text-sm">
                D
              </div>
              <span className="text-base font-semibold tracking-tight">
                Dash<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]">Core</span>
              </span>
            </div>
            <p className="text-sm text-[#64748b] leading-relaxed">
              Premium IPTV platform engine and streaming infrastructure for global providers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7c3aed] mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/#features" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Pricing</Link></li>
              <li><Link href="/contact" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7c3aed] mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/privacy" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7c3aed] mb-4">
              Payment Methods
            </h4>
            <div className="flex flex-wrap gap-2.5 mb-6">
              <div className="flex items-center gap-1.5 text-[#64748b] bg-white px-3 py-1.5 rounded-lg text-xs border border-[#e2e8f0]">
                <CreditCard className="h-3.5 w-3.5" /> Stripe
              </div>
              <div className="flex items-center gap-1.5 text-[#64748b] bg-white px-3 py-1.5 rounded-lg text-xs border border-[#e2e8f0]">
                <Wallet className="h-3.5 w-3.5" /> MultiSafepay
              </div>
              <div className="flex items-center gap-1.5 text-[#64748b] bg-white px-3 py-1.5 rounded-lg text-xs border border-[#e2e8f0]">
                <Bitcoin className="h-3.5 w-3.5" /> Crypto
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://t.me/dashcore"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#64748b] hover:text-[#7c3aed] border border-[#e2e8f0] hover:border-[#7c3aed] transition-all"
                aria-label="Telegram"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="mailto:info@dashcore.eu"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#64748b] hover:text-[#7c3aed] border border-[#e2e8f0] hover:border-[#7c3aed] transition-all"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#e2e8f0] text-center">
          <p className="text-xs text-[#94a3b8]">
            &copy; {new Date().getFullYear()} DashCore Systems. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
