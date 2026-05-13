import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DashCore | Premium Streaming Infrastructure",
  description:
    "High-performance IPTV middleware and streaming infrastructure for global platforms. Modular architecture, unmatched scale, and total security by DashCore Systems.",
  keywords: [
    "IPTV middleware",
    "streaming infrastructure",
    "OTT platform",
    "video streaming",
    "DashCore",
  ],
  openGraph: {
    title: "DashCore | Premium Streaming Infrastructure",
    description:
      "High-performance IPTV middleware and streaming infrastructure for global platforms.",
    siteName: "DashCore",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a14] text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
