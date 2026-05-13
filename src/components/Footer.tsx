import Link from "next/link";
import { Send, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer-dark">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          <div className="md:col-span-1">
            <h5 className="footer-title">DashCore</h5>
            <p className="text-sm text-[#9ca3af] leading-relaxed">
              Premium IPTV platform engine and streaming infrastructure for global providers.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://t.me/dashcore"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Telegram"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="mailto:info@dashcore.eu"
                className="social-icon"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="footer-title">Platform</h5>
            <ul className="space-y-3">
              <li><Link href="/#features" className="text-sm text-[#d1d5db] hover:text-[#a855f7] transition-all inline-flex items-center gap-2">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-[#d1d5db] hover:text-[#a855f7] transition-all inline-flex items-center gap-2">Pricing</Link></li>
              <li><Link href="/contact" className="text-sm text-[#d1d5db] hover:text-[#a855f7] transition-all inline-flex items-center gap-2">Contact</Link></li>
              <li><Link href="/order-lookup" className="text-sm text-[#d1d5db] hover:text-[#a855f7] transition-all inline-flex items-center gap-2">Order Lookup</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="footer-title">Legal</h5>
            <ul className="space-y-3">
              <li><Link href="/page/privacy" className="text-sm text-[#d1d5db] hover:text-[#a855f7] transition-all inline-flex items-center gap-2">Privacy Policy</Link></li>
              <li><Link href="/page/terms" className="text-sm text-[#d1d5db] hover:text-[#a855f7] transition-all inline-flex items-center gap-2">Terms of Service</Link></li>
              <li><Link href="/page/refund" className="text-sm text-[#d1d5db] hover:text-[#a855f7] transition-all inline-flex items-center gap-2">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="footer-title">Payment Methods</h5>
            <ul className="space-y-3">
              <li className="text-sm text-[#d1d5db]">Stripe</li>
              <li className="text-sm text-[#d1d5db]">MultiSafepay</li>
              <li className="text-sm text-[#d1d5db]">BTC / USDT / USDC / ETH</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} DashCore Systems. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
