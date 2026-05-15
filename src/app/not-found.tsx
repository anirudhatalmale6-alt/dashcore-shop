import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{ fontFamily: "'Montserrat', sans-serif" }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd]"
      >
        <div className="mx-auto max-w-md px-5 text-center">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 shadow-sm">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-[#6366f1]/10 flex items-center justify-center">
                <FileQuestion className="h-10 w-10 text-[#6366f1]" />
              </div>
            </div>

            <h1
              className="text-7xl font-extrabold tracking-tight text-[#0f172a] mb-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              404
            </h1>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">
              Page Not Found
            </h2>
            <p className="text-sm text-[#64748b] leading-relaxed mb-8">
              The page you are looking for does not exist or has been moved.
              Please check the URL or head back to the homepage.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                }}
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
