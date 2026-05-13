"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Wallet,
  Bitcoin,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Copy,
  User,
  Mail,
} from "lucide-react";

/* ── Types ──────────────────────────────────────── */
interface TierInfo {
  id: number;
  name: string;
  price: number;
  period: string;
  features: string[];
}

type PaymentTab = "stripe" | "multisafepay" | "crypto";
type CryptoCoin = "btc" | "usdt" | "usdc" | "eth";

interface SiteSettings {
  siteName: string;
  stripeEnabled: boolean;
  multisafepayEnabled: boolean;
  cryptoEnabled: boolean;
  btcAddress: string;
  usdtAddress: string;
  usdcAddress: string;
  ethAddress: string;
}

/* ── Crypto address labels ──────────────────────── */
const cryptoLabels: Record<CryptoCoin, { name: string; network: string }> = {
  btc: { name: "Bitcoin", network: "BTC" },
  usdt: { name: "Tether", network: "TRC-20" },
  usdc: { name: "USD Coin", network: "ERC-20" },
  eth: { name: "Ethereum", network: "ERC-20" },
};

/* ── Inner component using useSearchParams ──────── */
function CheckoutContent() {
  const searchParams = useSearchParams();
  const tierId = searchParams.get("tier");

  const [tier, setTier] = useState<TierInfo | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("stripe");
  const [cryptoCoin, setCryptoCoin] = useState<CryptoCoin>("btc");

  // Success state
  const [orderId, setOrderId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch tier info and settings in parallel
        const [tierRes, settingsRes] = await Promise.all([
          tierId ? fetch(`/api/orders?tierId=${tierId}`) : null,
          fetch("/api/settings"),
        ]);

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }

        // We need to get tier info from the pricing tiers endpoint
        // For now, fetch it from our tier-info approach via the checkout API
        if (tierId) {
          const infoRes = await fetch(`/api/settings?tierId=${tierId}`);
          if (infoRes.ok) {
            const data = await infoRes.json();
            if (data.tier) {
              setTier(data.tier);
            }
          }
        }
      } catch {
        setError("Failed to load checkout information.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tierId]);

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setError("Please fill in your name and email.");
      return;
    }
    if (!tier) {
      setError("No plan selected.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          tierId: tier.id,
          paymentMethod: paymentTab,
          cryptoCurrency: paymentTab === "crypto" ? cryptoCoin : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create order.");
        return;
      }

      setOrderId(data.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCryptoAddress = (): string => {
    if (!settings) return "";
    const map: Record<CryptoCoin, string> = {
      btc: settings.btcAddress,
      usdt: settings.usdtAddress,
      usdc: settings.usdcAddress,
      eth: settings.ethAddress,
    };
    return map[cryptoCoin] || "";
  };

  /* ── Loading state ──────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#9b8cc4]" />
      </div>
    );
  }

  /* ── No tier selected ───────────────────────────── */
  if (!tier && !orderId) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-32 pb-20 text-center">
        <div className="glass-card p-10">
          <h2 className="text-xl font-semibold text-white mb-4">
            No plan selected
          </h2>
          <p className="text-zinc-400 mb-6">
            Please select a plan from the pricing page first.
          </p>
          <Link
            href="/pricing"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            View Pricing
          </Link>
        </div>
      </div>
    );
  }

  /* ── Success state ──────────────────────────────── */
  if (orderId) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-32 pb-20">
        <div className="glass-card p-10 text-center glow-purple">
          <CheckCircle className="h-16 w-16 text-[#9b8cc4] mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Order Created Successfully
          </h2>
          <p className="text-zinc-400 mb-2">
            Your order has been placed and is pending payment confirmation.
          </p>
          <div className="my-6 p-4 rounded-xl bg-[rgba(124,104,166,0.1)] border border-[rgba(124,104,166,0.2)]">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
              Order ID
            </p>
            <p className="text-2xl font-mono font-bold text-[#9b8cc4]">
              #{orderId}
            </p>
          </div>
          <p className="text-sm text-zinc-500 mb-6">
            {paymentTab === "crypto"
              ? "Once your payment is confirmed on-chain, your order will be activated."
              : "Our team will verify your payment and activate your order shortly."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-sm font-medium border border-[rgba(124,104,166,0.3)] text-white hover:bg-[rgba(124,104,166,0.1)] transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              href="/pricing"
              className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Checkout form ──────────────────────────────── */
  return (
    <div className="bg-grid">
      <div className="mx-auto max-w-4xl px-4 pt-32 pb-20 sm:pt-36">
        {/* Back link */}
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pricing
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Order summary */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 sticky top-24">
              <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500 mb-4">
                Order Summary
              </h3>
              <div className="mb-4">
                <p className="text-lg font-semibold text-white">{tier!.name}</p>
                <p className="text-sm text-zinc-400 mt-1">
                  DashCore IPTV Middleware
                </p>
              </div>
              <div className="border-t border-[rgba(124,104,166,0.15)] pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-zinc-400 text-sm">Price</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">
                      ${tier!.price}
                    </span>
                    <span className="text-zinc-500 text-sm ml-1">
                      /{tier!.period === "monthly" ? "mo" : tier!.period === "yearly" ? "yr" : ""}
                    </span>
                  </div>
                </div>
              </div>
              {tier!.features && tier!.features.length > 0 && (
                <div className="mt-4 border-t border-[rgba(124,104,166,0.15)] pt-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                    Included
                  </p>
                  <ul className="space-y-2">
                    {tier!.features.slice(0, 5).map((f: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-zinc-400"
                      >
                        <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-[#7c68a6]" />
                        {f}
                      </li>
                    ))}
                    {tier!.features.length > 5 && (
                      <li className="text-xs text-zinc-500">
                        +{tier!.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right: Checkout form */}
          <div className="lg:col-span-3">
            <div className="glass-card p-8">
              <h2 className="text-xl font-bold text-white mb-6">Checkout</h2>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Customer info */}
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full rounded-xl bg-[rgba(124,104,166,0.06)] border border-[rgba(124,104,166,0.15)] pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#7c68a6] focus:outline-none focus:ring-1 focus:ring-[#7c68a6] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Payment method tabs */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    {
                      key: "stripe" as PaymentTab,
                      icon: CreditCard,
                      label: "Stripe",
                      enabled: settings?.stripeEnabled !== false,
                    },
                    {
                      key: "multisafepay" as PaymentTab,
                      icon: Wallet,
                      label: "MultiSafepay",
                      enabled: settings?.multisafepayEnabled !== false,
                    },
                    {
                      key: "crypto" as PaymentTab,
                      icon: Bitcoin,
                      label: "Crypto",
                      enabled: settings?.cryptoEnabled !== false,
                    },
                  ] as const).map((method) => (
                    <button
                      key={method.key}
                      onClick={() => setPaymentTab(method.key)}
                      disabled={!method.enabled}
                      className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-3 text-xs font-medium transition-all ${
                        paymentTab === method.key
                          ? "bg-[rgba(124,104,166,0.15)] border-2 border-[#7c68a6] text-white"
                          : method.enabled
                          ? "bg-[rgba(124,104,166,0.04)] border border-[rgba(124,104,166,0.1)] text-zinc-400 hover:text-white hover:border-[rgba(124,104,166,0.25)]"
                          : "bg-[rgba(124,104,166,0.02)] border border-[rgba(124,104,166,0.05)] text-zinc-600 cursor-not-allowed"
                      }`}
                    >
                      <method.icon className="h-5 w-5" />
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stripe payment */}
              {paymentTab === "stripe" && (
                <div className="mb-6 p-5 rounded-xl bg-[rgba(124,104,166,0.04)] border border-[rgba(124,104,166,0.1)]">
                  <p className="text-sm text-zinc-400 mb-4">
                    You will be redirected to Stripe secure checkout to complete
                    your payment by card.
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    {submitting ? "Processing..." : "Pay with Card"}
                  </button>
                </div>
              )}

              {/* MultiSafepay payment */}
              {paymentTab === "multisafepay" && (
                <div className="mb-6 p-5 rounded-xl bg-[rgba(124,104,166,0.04)] border border-[rgba(124,104,166,0.1)]">
                  <p className="text-sm text-zinc-400 mb-4">
                    Pay using iDEAL, Bancontact, or other local payment methods
                    via MultiSafepay.
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wallet className="h-4 w-4" />
                    )}
                    {submitting
                      ? "Processing..."
                      : "Pay with iDEAL / Bancontact"}
                  </button>
                </div>
              )}

              {/* Crypto payment */}
              {paymentTab === "crypto" && (
                <div className="mb-6 space-y-4">
                  {/* Crypto coin tabs */}
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      ["btc", "usdt", "usdc", "eth"] as CryptoCoin[]
                    ).map((coin) => (
                      <button
                        key={coin}
                        onClick={() => setCryptoCoin(coin)}
                        className={`rounded-lg py-2 px-3 text-xs font-semibold uppercase transition-all ${
                          cryptoCoin === coin
                            ? "bg-[#7c68a6] text-white"
                            : "bg-[rgba(124,104,166,0.06)] text-zinc-400 hover:text-white border border-[rgba(124,104,166,0.1)]"
                        }`}
                      >
                        {coin}
                      </button>
                    ))}
                  </div>

                  <div className="p-5 rounded-xl bg-[rgba(124,104,166,0.04)] border border-[rgba(124,104,166,0.1)]">
                    <p className="text-sm font-medium text-white mb-1">
                      {cryptoLabels[cryptoCoin].name}
                    </p>
                    <p className="text-xs text-zinc-500 mb-4">
                      Network: {cryptoLabels[cryptoCoin].network}
                    </p>

                    {/* Wallet address */}
                    {getCryptoAddress() ? (
                      <>
                        {/* QR Code placeholder */}
                        <div className="flex justify-center mb-4">
                          <div className="w-40 h-40 rounded-xl bg-white p-3 flex items-center justify-center">
                            <div className="w-full h-full bg-[rgba(124,104,166,0.08)] rounded-lg flex items-center justify-center border-2 border-dashed border-[rgba(124,104,166,0.2)]">
                              <span className="text-xs text-zinc-400 text-center px-2">
                                QR Code
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Address display */}
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(124,104,166,0.1)]">
                          <code className="flex-1 text-xs text-zinc-300 break-all font-mono">
                            {getCryptoAddress()}
                          </code>
                          <button
                            onClick={() => copyAddress(getCryptoAddress())}
                            className="shrink-0 p-2 rounded-lg hover:bg-[rgba(124,104,166,0.15)] transition-colors"
                            title="Copy address"
                          >
                            <Copy className="h-4 w-4 text-[#9b8cc4]" />
                          </button>
                        </div>
                        {copied && (
                          <p className="text-xs text-[#9b8cc4] mt-2 text-center">
                            Address copied to clipboard
                          </p>
                        )}

                        <p className="text-xs text-zinc-500 mt-4 text-center">
                          Send exactly ${tier!.price} worth of{" "}
                          {cryptoCoin.toUpperCase()} to the address above.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-500 text-center py-6">
                        {cryptoCoin.toUpperCase()} wallet address not configured
                        yet. Please contact support or choose another payment
                        method.
                      </p>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {submitting
                        ? "Processing..."
                        : "I've sent the payment"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Exported page with Suspense boundary ─────── */
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[#9b8cc4]" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
