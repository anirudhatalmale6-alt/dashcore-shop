import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding DashCore database...");

  const product = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "DashCore IPTV Platform Engine",
      description:
        "High-performance IPTV middleware and streaming engine for global platforms. Enterprise-grade streaming infrastructure with full protocol coverage, advanced load balancing, and ironclad security.",
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

  const tiers = [
    {
      productId: product.id,
      name: "1 Month",
      price: 49,
      period: "monthly" as const,
      sortOrder: 1,
      features: JSON.stringify([
        "Full platform engine access",
        "All streaming protocols",
        "Up to 500 concurrent connections",
        "Basic load balancing",
        "Single server deployment",
        "Standard encryption",
        "Community support",
        "Analytics dashboard",
      ]),
    },
    {
      productId: product.id,
      name: "3 Months",
      price: 129,
      period: "quarterly" as const,
      sortOrder: 2,
      features: JSON.stringify([
        "Full platform engine access",
        "All streaming protocols",
        "Up to 5,000 concurrent connections",
        "GeoIP and ISP load balancing",
        "Multi-server deployment",
        "VOD, TV Series, TMDB integration",
        "TV Archive and Timeshift",
        "MAG/Stalker event sender",
        "Reseller management panel",
        "Advanced content encryption",
        "Email support (24h response)",
        "Save 12% vs monthly",
      ]),
    },
    {
      productId: product.id,
      name: "6 Months",
      price: 229,
      period: "semiannual" as const,
      sortOrder: 3,
      features: JSON.stringify([
        "Full platform engine access",
        "All protocols and output formats",
        "Unlimited concurrent connections",
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
        "Save 22% vs monthly",
      ]),
    },
  ];

  for (const tier of tiers) {
    await prisma.pricingTier.upsert({
      where: { id: tier.sortOrder },
      update: tier,
      create: tier,
    });
    console.log(`Tier created: ${tier.name} - $${tier.price}`);
  }

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

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: "DashCore",
      siteDescription:
        "Premium IPTV platform engine — license renewal",
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
