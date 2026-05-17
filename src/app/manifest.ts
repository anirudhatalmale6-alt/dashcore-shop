import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let siteName = "DashCore";
  let faviconUrl = "";

  try {
    const s = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { siteName: true, faviconUrl: true },
    });
    if (s?.siteName) siteName = s.siteName;
    if (s?.faviconUrl) faviconUrl = s.faviconUrl;
  } catch {}

  const icons: MetadataRoute.Manifest["icons"] = [];
  if (faviconUrl) {
    icons.push(
      { src: faviconUrl, sizes: "16x16", type: "image/png" },
      { src: faviconUrl, sizes: "32x32", type: "image/png" },
      { src: faviconUrl, sizes: "48x48", type: "image/png" },
      { src: faviconUrl, sizes: "180x180", type: "image/png" },
      { src: faviconUrl, sizes: "192x192", type: "image/png" },
      { src: faviconUrl, sizes: "512x512", type: "image/png" },
    );
  }

  return {
    name: siteName,
    short_name: siteName,
    description: "IPTV Platform Engine",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0a1e",
    theme_color: "#7c3aed",
    icons,
  };
}
