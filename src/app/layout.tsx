import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "DashCore | IPTV Platform Engine — License Renewal",
  description:
    "Renew your DashCore IPTV platform engine license. High-performance streaming infrastructure with full protocol coverage, advanced load balancing, and enterprise security.",
  keywords: [
    "IPTV middleware",
    "streaming engine",
    "DashCore license",
    "IPTV platform",
    "streaming infrastructure",
  ],
  openGraph: {
    title: "DashCore | IPTV Platform Engine",
    description:
      "Renew your DashCore streaming engine license. Built for scale, engineered for reliability.",
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#faf9f7] text-[#1a1625]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
