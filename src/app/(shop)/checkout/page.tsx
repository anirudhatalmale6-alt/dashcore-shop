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

const cryptoLabels: Record<CryptoCoin, { name: string; network: string }> = {
  btc: { name: "Bitcoin", network: "BTC" },
  usdt: { name: "Tether", network: "TRC-20" },
  usdc: { name: "USD Coin", network: "ERC-20" },
  eth: { name: "Ethereum", network: "ERC-20" },
};

function periodLabel(period: string): string {
  switch (period) {
    case "monthly": return "1 month";
    case "quarterly": return "3 months";
    case "semiannual": return "6 months";
    case "yearly": return "1 year";
    case "lifetime": return "lifetime";
    default: return period;
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const tierId = searchParams.get("tier");

  const selectedOptions: Record<string, string> = {};
  const optionPrices: Record<string, number> = {};
  const oneTimeFlags: Record<string, boolean> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith("opt_") && !key.startsWith("optprice_") && !key.startsWith("optonce_")) {
      selectedOptions[key.replace("opt_", "")] = value;
    }
    if (key.startsWith("optprice_")) {
      optionPrices[key.replace("optprice_", "")] = Number(value) || 0;
    }
    if (key.startsWith("optonce_")) {
      oneTimeFlags[key.replace("optonce_", "")] = value === "1";
    }
  });

  const recurringOptionsTotal = Object.entries(optionPrices).reduce((sum, [k, v]) => sum + (oneTimeFlags[k] ? 0 : v), 0);
  const oneTimeTotal = Object.entries(optionPrices).reduce((sum, [k, v]) => sum + (oneTimeFlags[k] ? v : 0), 0);

  const [tier, setTier] = useState<TierInfo | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("stripe");
  const [cryptoCoin, setCryptoCoin] = useState<CryptoCoin>("btc");

  const [orderId, setOrderId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    const savedName = localStorage.getItem("customer_name");
    const savedEmail = localStorage.getItem("customer_email");
    if (token && savedName && savedEmail) {
      setCustomerName(savedName);
      setCustomerEmail(savedEmail);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }

        if (tierId) {
          const infoRes = await fetch(`/api/settings?tierId=${tierId}`);
          if (infoRes.ok) {
            const data = await infoRes.json();
            if (data.tier) setTier(data.tier);
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
    if (!tier) { setError("No plan selected."); return; }

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
          selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
          optionPrices: Object.keys(optionPrices).length > 0 ? optionPrices : undefined,
          oneTimeFlags: Object.keys(oneTimeFlags).length > 0 ? oneTimeFlags : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create order."); return; }
      setOrderId(data.orderId);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
      </div>
    );
  }

  if (!tier && !orderId) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-32 pb-20 text-center">
        <div className="card-elevated p-10">
          <h2 className="text-xl font-semibold mb-3">No plan selected</h2>
          <p className="text-[#64748b] mb-6">
            Please select a license plan from the pricing page first.
          </p>
          <Link href="/pricing" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            View Pricing
          </Link>
        </div>
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-32 pb-20">
        <div className="card-elevated p-10 text-center">
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Order Created</h2>
          <p className="text-[#64748b] mb-2">Your order is pending payment confirmation.</p>
          <div className="my-5 p-4 rounded-xl bg-[#7c3aed]/5 border border-[#7c3aed]/15">
            <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1 font-medium">Order ID</p>
            <p className="text-2xl font-mono font-bold text-[#7c3aed]">{orderId}</p>
          </div>
          <p className="text-sm text-[#64748b] mb-6">
            {paymentTab === "crypto"
              ? "Once your payment is confirmed on-chain, your license will be activated."
              : "Our team will verify your payment and activate your license shortly."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-outline inline-flex items-center justify-center gap-2 text-sm">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <Link href="/pricing" className="btn-primary inline-flex items-center justify-center gap-2 text-sm">
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pt-28 pb-16 sm:pt-32">
      <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Pricing
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="card-elevated p-6 sticky top-24">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-4">Order Summary</h3>
            <div className="mb-4">
              <p className="text-base font-semibold">{tier!.name}</p>
              <p className="text-sm text-[#64748b] mt-0.5">DashCore Platform Engine</p>
            </div>

            {Object.keys(selectedOptions).length > 0 && (
              <div className="border-t border-[#e2e8f0] pt-3 mb-3 space-y-1">
                {Object.entries(selectedOptions).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-[#64748b]">
                      {key}
                      {oneTimeFlags[key] && <span className="text-[10px] ml-1 text-amber-600">(one-time)</span>}
                    </span>
                    <span className="font-medium">
                      {val}
                      {optionPrices[key] > 0 && <span className="text-[#6366f1] ml-1">+${optionPrices[key]}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-[#e2e8f0] pt-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#64748b]">Base price</span>
                <div>
                  <span className="text-lg font-bold">${tier!.price}</span>
                  {tier!.period !== "lifetime" && (
                    <span className="text-xs text-[#64748b] ml-1">/{periodLabel(tier!.period)}</span>
                  )}
                </div>
              </div>
              {recurringOptionsTotal > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-[#64748b]">Options</span>
                  <span className="text-sm font-semibold">+${recurringOptionsTotal}</span>
                </div>
              )}
              {oneTimeTotal > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-[#64748b]">One-time fees</span>
                  <span className="text-sm font-semibold text-amber-600">+${oneTimeTotal}</span>
                </div>
              )}
              <div className="border-t border-[#e2e8f0] pt-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-[#0f172a]">Due today</span>
                <span className="text-2xl font-bold text-[#6366f1]">${tier!.price + recurringOptionsTotal + oneTimeTotal}</span>
              </div>
              {oneTimeTotal > 0 && tier!.period !== "lifetime" && (
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#94a3b8]">Next renewal</span>
                  <span className="text-sm text-[#64748b]">${tier!.price + recurringOptionsTotal}/{periodLabel(tier!.period)}</span>
                </div>
              )}
            </div>

            {tier!.features && tier!.features.length > 0 && (
              <div className="mt-4 border-t border-[#e2e8f0] pt-4">
                <p className="text-xs text-[#64748b] uppercase tracking-wider mb-3 font-medium">Included</p>
                <ul className="space-y-1.5">
                  {tier!.features.slice(0, 5).map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#475569]">
                      <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-[#7c3aed]" />
                      {f}
                    </li>
                  ))}
                  {tier!.features.length > 5 && (
                    <li className="text-xs text-[#64748b]">+{tier!.features.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card-elevated p-7">
            <h2 className="text-lg font-bold mb-5">Checkout</h2>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            <div className="space-y-4 mb-6">
              {isLoggedIn && (
                <div className="p-3 rounded-lg bg-[#f0f0ff] border border-[#c7d2fe] text-sm text-[#4338ca] flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  Ordering as <strong>{customerName}</strong> ({customerEmail})
                </div>
              )}
              {!isLoggedIn && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                      <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" className="input-field pl-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                      <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="john@example.com" className="input-field pl-10" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#0f172a] mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "stripe" as PaymentTab, icon: CreditCard, label: "Stripe", enabled: settings?.stripeEnabled !== false },
                  { key: "multisafepay" as PaymentTab, icon: Wallet, label: "MultiSafepay", enabled: settings?.multisafepayEnabled !== false },
                  { key: "crypto" as PaymentTab, icon: Bitcoin, label: "Crypto", enabled: settings?.cryptoEnabled !== false },
                ] as const).map((method) => (
                  <button
                    key={method.key}
                    onClick={() => setPaymentTab(method.key)}
                    disabled={!method.enabled}
                    className={`flex flex-col items-center gap-1.5 rounded-lg py-3 px-3 text-xs font-medium transition-all border ${
                      paymentTab === method.key
                        ? "bg-[#7c3aed]/8 border-[#7c3aed] text-[#7c3aed]"
                        : method.enabled
                        ? "bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1] hover:text-[#0f172a]"
                        : "bg-[#f8fafc] border-[#e2e8f0] text-[#cbd5e1] cursor-not-allowed"
                    }`}
                  >
                    <method.icon className="h-5 w-5" />
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentTab === "stripe" && (
              <div className="mb-5 p-5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                <p className="text-sm text-[#475569] mb-4">You will be redirected to Stripe secure checkout to complete your payment by card.</p>
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {submitting ? "Processing..." : "Pay with Card"}
                </button>
              </div>
            )}

            {paymentTab === "multisafepay" && (
              <div className="mb-5 p-5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                <p className="text-sm text-[#475569] mb-4">Pay using iDEAL, Bancontact, or other local payment methods via MultiSafepay.</p>
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  {submitting ? "Processing..." : "Pay with iDEAL / Bancontact"}
                </button>
              </div>
            )}

            {paymentTab === "crypto" && (
              <div className="mb-5 space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {(["btc", "usdt", "usdc", "eth"] as CryptoCoin[]).map((coin) => (
                    <button
                      key={coin}
                      onClick={() => setCryptoCoin(coin)}
                      className={`rounded-lg py-2 px-3 text-xs font-semibold uppercase transition-all border ${
                        cryptoCoin === coin
                          ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                          : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1]"
                      }`}
                    >
                      {coin}
                    </button>
                  ))}
                </div>
                <div className="p-5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                  <p className="text-sm font-medium text-[#0f172a] mb-0.5">{cryptoLabels[cryptoCoin].name}</p>
                  <p className="text-xs text-[#64748b] mb-4">Network: {cryptoLabels[cryptoCoin].network}</p>
                  {getCryptoAddress() ? (
                    <>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-[#e2e8f0]">
                        <code className="flex-1 text-xs text-[#475569] break-all font-mono">{getCryptoAddress()}</code>
                        <button onClick={() => copyAddress(getCryptoAddress())} className="shrink-0 p-2 rounded-lg hover:bg-[#f8fafc] transition-colors">
                          <Copy className="h-4 w-4 text-[#7c3aed]" />
                        </button>
                      </div>
                      {copied && <p className="text-xs text-[#7c3aed] mt-2 text-center">Copied!</p>}
                      <p className="text-xs text-[#64748b] mt-3 text-center">
                        Send exactly ${tier!.price} worth of {cryptoCoin.toUpperCase()} to the address above.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[#64748b] text-center py-6">
                      {cryptoCoin.toUpperCase()} wallet not configured yet. Please contact support or choose another method.
                    </p>
                  )}
                  <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {submitting ? "Processing..." : "I've sent the payment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
