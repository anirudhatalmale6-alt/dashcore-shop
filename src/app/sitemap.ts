import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dashcore.eu";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const pages = await prisma.cmsPage.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });
    for (const page of pages) {
      entries.push({
        url: `${BASE_URL}/page/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {}

  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { id: true, updatedAt: true },
    });
    for (const product of products) {
      entries.push({
        url: `${BASE_URL}/pricing?product=${product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {}

  return entries;
}
