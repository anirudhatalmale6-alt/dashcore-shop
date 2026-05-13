import Link from "next/link";
import { Send, Mail } from "lucide-react";

export default function Footer() {
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
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://t.me/dashcore"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1] hover:text-white transition-all"
                aria-label="Telegram"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="mailto:info@dashcore.eu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1] hover:text-white transition-all"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
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

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/page/privacy" className="text-sm text-[#6b7280] hover:text-[#6366f1] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/page/terms" className="text-sm text-[#6b7280] hover:text-[#6366f1] transition-colors">Terms of Service</Link></li>
              <li><Link href="/page/refund" className="text-sm text-[#6b7280] hover:text-[#6366f1] transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6366f1] mb-4">
              Payment Methods
            </h4>
            <ul className="space-y-2.5">
              <li className="text-sm text-[#6b7280]">Stripe</li>
              <li className="text-sm text-[#6b7280]">MultiSafepay</li>
              <li className="text-sm text-[#6b7280]">BTC / USDT / USDC / ETH</li>
            </ul>
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
