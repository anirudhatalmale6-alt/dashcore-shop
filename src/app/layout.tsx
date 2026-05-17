import type { Metadata } from "next";
import Script from "next/script";
import { prisma } from "@/lib/db";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dashcore.eu";

function toAbsolute(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!s) return { title: "DashCore" };

    const faviconAbs = toAbsolute(s.faviconUrl);
    const ogImageAbs = toAbsolute(s.ogImageUrl);
    const twImageAbs = toAbsolute(s.twitterImageUrl);

    return {
      metadataBase: new URL(BASE_URL),
      title: s.metaTitle || "DashCore | IPTV Platform Engine",
      description: s.metaDescription || "Fully automated IPTV platform engine for livestreaming infrastructure.",
      keywords: s.metaKeywords ? s.metaKeywords.split(",").map((k) => k.trim()) : [],
      icons: faviconAbs
        ? [
            { rel: "icon", url: faviconAbs, sizes: "32x32" },
            { rel: "icon", url: faviconAbs, sizes: "16x16" },
            { rel: "apple-touch-icon", url: faviconAbs, sizes: "180x180" },
          ]
        : [],
      openGraph: {
        title: s.ogTitle || s.metaTitle || "DashCore",
        description: s.ogDescription || s.metaDescription || "",
        siteName: s.siteName || "DashCore",
        type: "website",
        url: BASE_URL,
        ...(ogImageAbs ? { images: [{ url: ogImageAbs, width: 1200, height: 630, alt: s.ogTitle || s.siteName || "DashCore" }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: s.twitterTitle || s.metaTitle || "DashCore",
        description: s.twitterDescription || s.metaDescription || "",
        ...(twImageAbs ? { images: [twImageAbs] } : {}),
      },
    };
  } catch {
    return {
      title: "DashCore | IPTV Platform Engine",
      description: "Fully automated IPTV platform engine for livestreaming infrastructure.",
    };
  }
}

async function getGtagId(): Promise<string> {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: 1 }, select: { gtagId: true } });
    return s?.gtagId || "";
  } catch {
    return "";
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gtagId = await getGtagId();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-[#0f172a]">
        {gtagId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gtagId}');
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
