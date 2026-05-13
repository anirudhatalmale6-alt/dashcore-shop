import Link from "next/link";
import {
  Layers,
  Binary,
  Globe,
  LayoutDashboard,
  Users,
  Code2,
  ShieldCheck,
  Activity,
  Server,
  Radio,
  Lock,
  ArrowRight,
} from "lucide-react";

/* ── Feature cards data ─────────────────────────── */
const features = [
  {
    icon: Layers,
    title: "Modular Architecture",
    desc: "Institutional-grade components built for hot-swapping and 99.9% uptime.",
  },
  {
    icon: Binary,
    title: "Binary Fidelity",
    desc: "Low-latency data transmission with pixel-perfect clarity.",
  },
  {
    icon: Globe,
    title: "Global Balance",
    desc: "Elastic infrastructure that automatically redistributes traffic.",
  },
  {
    icon: LayoutDashboard,
    title: "Minimal Logic",
    desc: "Most intuitive management dashboard in the industry.",
  },
  {
    icon: Users,
    title: "Unmatched Scale",
    desc: "Handling millions of concurrent connections.",
  },
  {
    icon: Code2,
    title: "Unified API",
    desc: "Integrate effortlessly with any existing workflow.",
  },
  {
    icon: ShieldCheck,
    title: "Total Security",
    desc: "Hardened endpoints and advanced firewall logic.",
  },
  {
    icon: Activity,
    title: "Instant Insight",
    desc: "Real-time telemetry and analytics.",
  },
];

/* ── Protocol columns data ──────────────────────── */
const protocolColumns = [
  {
    icon: Radio,
    title: "Protocol Support",
    items: [
      "HTTP, RTMP, RTSP, RTP, UDP",
      "Live Streams, VOD, Radio",
      "TV Series & TMDB API",
      "Fingerprint Sender",
      "MPEG-TS, HLS, RTMP Output",
      "TV Archive & Timeshift",
    ],
  },
  {
    icon: Server,
    title: "Deployment Architecture",
    items: [
      "Multi Main Installation",
      "MPD Streaming with Key",
      "Load Balancing",
      "Server Load, GeoIP & ISP Based",
      "Unlimited Streams & Users",
      "Unlimited Loadbalancers",
      "On-Demand with Fast Zapping",
    ],
  },
  {
    icon: Lock,
    title: "Management & Security",
    items: [
      "Fast Event Sender Mag/Stalker",
      "Remote Change Portals",
      "Mag Security, Firewall",
      "ISP, ASN & Serial Lock",
      "Admin Ticket Creation",
      "Resellers Own Management",
      "Advanced Content Encryption",
    ],
  },
];

export default function HomePage() {
  return (
    <div className="bg-grid">
      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[#7c68a6] opacity-[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-[#9b8cc4]">
            Streaming Infrastructure
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            <span className="gradient-text">The Infrastructure Standard.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-zinc-400 leading-relaxed">
            High-performance streaming engines for global platforms. Built for
            scale, engineered for reliability.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5"
            >
              Get Connected
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#features"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-6 py-3.5 rounded-xl border border-[rgba(124,104,166,0.15)] hover:border-[rgba(124,104,166,0.3)]"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="gradient-text">Enterprise-Grade Features</span>
            </h2>
            <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
              Every component designed for maximum performance and minimal
              downtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((feat) => (
              <div key={feat.title} className="glass-card p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(124,104,166,0.12)]">
                    <feat.icon className="h-5 w-5 text-[#9b8cc4]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {feat.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Protocol Support ──────────────────────── */}
      <section className="py-20 sm:py-28 border-t border-[rgba(124,104,166,0.08)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="gradient-text">Complete Protocol Coverage</span>
            </h2>
            <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
              From ingest to delivery, every protocol and workflow fully
              supported.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {protocolColumns.map((col) => (
              <div key={col.title} className="glass-card p-6 sm:p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(124,104,166,0.12)]">
                    <col.icon className="h-4.5 w-4.5 text-[#9b8cc4]" />
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    {col.title}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-zinc-400"
                    >
                      <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#7c68a6]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-card glow-purple relative overflow-hidden p-10 sm:p-14 text-center">
            {/* Background accent */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-[#7c68a6] opacity-[0.08] blur-[100px]" />
            </div>

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="gradient-text">Ready to scale?</span>
              </h2>
              <p className="mt-4 text-zinc-400 max-w-lg mx-auto">
                Deploy enterprise-grade streaming infrastructure in minutes. No
                contracts, flexible plans.
              </p>
              <div className="mt-8">
                <Link
                  href="/pricing"
                  className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5"
                >
                  View Pricing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
