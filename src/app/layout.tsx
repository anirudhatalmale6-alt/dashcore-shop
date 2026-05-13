import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!s) return { title: "DashCore" };

    return {
      title: s.metaTitle || "DashCore | IPTV Platform Engine",
      description: s.metaDescription || "Renew your DashCore IPTV platform engine license.",
      keywords: s.metaKeywords ? s.metaKeywords.split(",").map((k) => k.trim()) : [],
      icons: s.faviconUrl ? [{ rel: "icon", url: s.faviconUrl }] : [],
      openGraph: {
        title: s.ogTitle || s.metaTitle || "DashCore",
        description: s.ogDescription || s.metaDescription || "",
        siteName: s.siteName || "DashCore",
        type: "website",
        ...(s.ogImageUrl ? { images: [{ url: s.ogImageUrl, width: 1200, height: 630 }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: s.twitterTitle || s.metaTitle || "DashCore",
        description: s.twitterDescription || s.metaDescription || "",
        ...(s.twitterImageUrl ? { images: [s.twitterImageUrl] } : {}),
      },
    };
  } catch {
    return {
      title: "DashCore | IPTV Platform Engine",
      description: "Renew your DashCore IPTV platform engine license.",
    };
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-[#0f172a]">
        {children}
      </body>
    </html>
  );
}
