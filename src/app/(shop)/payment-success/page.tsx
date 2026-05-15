"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Home, Search } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div>
      <section className="hero-light relative pt-28 pb-14 sm:pt-36 sm:pb-18">
        <div className="hero-pattern" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a]">
            Payment Successful
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#64748b]">
            Thank you for your purchase!
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 -mt-4 relative z-10">
        <div className="mx-auto max-w-xl px-5">
          <div className="card-elevated bg-white rounded-2xl border border-[#e2e8f0] p-10 shadow-sm text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#0f172a] mb-2">
              Payment Successful!
            </h2>
            <p className="text-[#64748b] mb-1">
              Your payment has been processed successfully.
            </p>

            {orderId && (
              <div className="my-6 p-4 rounded-xl bg-[#7c3aed]/5 border border-[#7c3aed]/15">
                <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1 font-medium">
                  Order ID
                </p>
                <p className="text-2xl font-mono font-bold text-[#7c3aed]">
                  {orderId}
                </p>
              </div>
            )}

            <p className="text-sm text-[#64748b] mb-8">
              Your license will be activated shortly. You will receive a
              confirmation email once everything is set up.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="btn-outline inline-flex items-center justify-center gap-2 text-sm"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
              <Link
                href="/order-lookup"
                className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
              >
                <Search className="h-4 w-4" />
                Look Up Order
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
