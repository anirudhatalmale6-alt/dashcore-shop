import Link from "next/link";
import { CreditCard, Wallet, Bitcoin } from "lucide-react";

const footerLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

const paymentMethods = [
  { icon: CreditCard, label: "Stripe" },
  { icon: Wallet, label: "MultiSafepay" },
  { icon: Bitcoin, label: "Crypto" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(124,104,166,0.1)] bg-[#08080f]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Branding */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c68a6] to-[#5a4a7a] text-white font-bold text-sm">
                D
              </div>
              <span className="text-base font-semibold tracking-tight text-white">
                Dash<span className="text-[#9b8cc4]">Core</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Premium streaming infrastructure for global platforms.
            </p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Payment methods */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <span className="text-xs text-zinc-600 uppercase tracking-wider">
              Payment Methods
            </span>
            <div className="flex items-center gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.label}
                  className="flex items-center gap-1.5 text-zinc-500"
                  title={method.label}
                >
                  <method.icon className="h-4 w-4" />
                  <span className="text-xs">{method.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-[rgba(124,104,166,0.08)] text-center">
          <p className="text-xs text-zinc-600">
            &copy; 2026 DashCore Systems. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
