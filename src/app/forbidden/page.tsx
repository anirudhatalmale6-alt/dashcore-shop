import Link from "next/link";
import { ShieldOff, Home } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd]">
      <div className="mx-auto max-w-md px-5 text-center">
        <div className="card-elevated bg-white rounded-2xl border border-[#e2e8f0] p-10 shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
              <ShieldOff className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <h1
            className="text-7xl font-extrabold tracking-tight text-[#0f172a] mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            403
          </h1>
          <h2 className="text-xl font-bold text-[#0f172a] mb-3">
            Access Denied
          </h2>
          <p className="text-sm text-[#64748b] leading-relaxed mb-8">
            You do not have permission to access this page. If you believe this
            is an error, please contact support.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
