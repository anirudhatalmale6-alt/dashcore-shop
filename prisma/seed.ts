import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding DashCore database...");

  // ── Product ──────────────────────────────────────────────────────────
  const product = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "DashCore IPTV Middleware",
      description:
        "High-performance IPTV middleware and streaming infrastructure for global platforms. Modular architecture with support for HTTP, RTMP, RTSP, RTP, UDP protocols. Features include live streams, VOD, radio, TV series with TMDB API integration, fingerprint sender, MPEG-TS/HLS/RTMP output, TV archive and timeshift. Multi main installation, MPD streaming with key, load balancing (server load, GeoIP and ISP based), unlimited streams and users, unlimited load balancers, on-demand with fast zapping. Advanced management and security features including fast event sender for MAG/Stalker, remote change portals, MAG security and firewall, ISP/ASN/serial lock, admin ticket creation, reseller management, and advanced content encryption.",
      features: JSON.stringify([
        "HTTP, RTMP, RTSP, RTP, UDP protocol support",
        "Live Streams, VOD, Radio",
        "TV Series with TMDB API integration",
        "Fingerprint Sender",
        "MPEG-TS, HLS, RTMP output",
        "TV Archive and Timeshift",
        "Multi Main Installation",
        "MPD Streaming with Key",
        "Load Balancing (Server Load, GeoIP, ISP)",
        "Unlimited Streams and Users",
        "Unlimited Load Balancers",
        "On-Demand with Fast Zapping",
        "Fast Event Sender MAG/Stalker",
        "Remote Change Portals",
        "MAG Security and Firewall",
        "ISP, ASN and Serial Lock",
        "Admin Ticket Creation",
        "Reseller Own Management",
        "Advanced Content Encryption",
      ]),
    },
  });

  console.log(`Product created: ${product.name}`);

  // ── Pricing Tiers ────────────────────────────────────────────────────
  const tiers = [
    {
      productId: product.id,
      name: "Starter",
      price: 49,
      period: "monthly" as const,
      sortOrder: 1,
      features: JSON.stringify([
        "Up to 500 concurrent connections",
        "5 Live Streams",
        "HTTP and HLS output",
        "Basic load balancing",
        "Single server deployment",
        "Community support",
        "Standard encryption",
        "Basic analytics dashboard",
      ]),
    },
    {
      productId: product.id,
      name: "Professional",
      price: 149,
      period: "monthly" as const,
      sortOrder: 2,
      features: JSON.stringify([
        "Up to 5,000 concurrent connections",
        "Unlimited Live Streams",
        "All protocol support (RTMP, RTSP, RTP, UDP)",
        "Full load balancing (GeoIP, ISP)",
        "Multi-server deployment",
        "VOD and TV Series with TMDB",
        "TV Archive and Timeshift",
        "MAG/Stalker event sender",
        "Reseller management panel",
        "Email support (24h response)",
        "Advanced content encryption",
        "Full analytics and reporting",
      ]),
    },
    {
      productId: product.id,
      name: "Enterprise",
      price: 399,
      period: "monthly" as const,
      sortOrder: 3,
      features: JSON.stringify([
        "Unlimited concurrent connections",
        "Unlimited everything",
        "All protocols and output formats",
        "Multi main installation",
        "MPD streaming with key",
        "Unlimited load balancers",
        "On-demand with fast zapping",
        "Fingerprint sender",
        "ISP, ASN and serial lock",
        "MAG security and firewall",
        "Remote change portals",
        "Admin ticket system",
        "Priority support (1h response)",
        "Custom deployment assistance",
        "Dedicated account manager",
        "SLA guarantee 99.9% uptime",
      ]),
    },
  ];

  for (const tier of tiers) {
    await prisma.pricingTier.upsert({
      where: { id: tier.sortOrder },
      update: tier,
      create: tier,
    });
    console.log(`Tier created: ${tier.name} - $${tier.price}/month`);
  }

  // ── Admin User ───────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { nickname: "admin" },
    update: { passwordHash },
    create: {
      nickname: "admin",
      passwordHash,
      role: "admin",
    },
  });
  console.log("Admin user created: admin / admin123");

  // ── Site Settings ────────────────────────────────────────────────────
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: "DashCore",
      siteDescription:
        "Premium IPTV middleware and streaming infrastructure",
      contactEmail: "info@dashcore.eu",
      telegramUrl: "https://t.me/dashcore",
      stripeEnabled: true,
      multisafepayEnabled: true,
      cryptoEnabled: true,
      btcAddress: "",
      usdtAddress: "",
      usdcAddress: "",
      ethAddress: "",
    },
  });
  console.log("Site settings initialized");

  console.log("\nSeeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
