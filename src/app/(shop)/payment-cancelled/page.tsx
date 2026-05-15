"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ArrowLeft, Mail } from "lucide-react";

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div>
      <section className="hero-light relative pt-28 pb-14 sm:pt-36 sm:pb-18">
        <div className="hero-pattern" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a]">
            Payment Cancelled
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#64748b]">
            Your payment was not completed.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 -mt-4 relative z-10">
        <div className="mx-auto max-w-xl px-5">
          <div className="card-elevated bg-white rounded-2xl border border-[#e2e8f0] p-10 shadow-sm text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#0f172a] mb-2">
              Payment Cancelled
            </h2>
            <p className="text-[#64748b] mb-1">
              Your order was not completed.
            </p>

            {orderId && (
              <div className="my-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1 font-medium">
                  Order ID
                </p>
                <p className="text-2xl font-mono font-bold text-amber-700">
                  {orderId}
                </p>
              </div>
            )}

            <p className="text-sm text-[#64748b] mb-8">
              No charges have been made. You can try again by selecting a plan
              from our pricing page, or contact our support team if you need
              assistance.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/pricing"
                className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Pricing
              </Link>
              <Link
                href="/contact"
                className="btn-outline inline-flex items-center justify-center gap-2 text-sm"
              >
                <Mail className="h-4 w-4" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PaymentCancelledPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentCancelledContent />
    </Suspense>
  );
}
