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
  Zap,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Modular Architecture",
    desc: "Institutional-grade components built for hot-swapping and 99.9% uptime.",
  },
  {
    icon: Binary,
    title: "Binary Fidelity",
    desc: "Low-latency data transmission with pixel-perfect streaming clarity.",
  },
  {
    icon: Globe,
    title: "Global Load Balancing",
    desc: "Elastic infrastructure that redistributes traffic by GeoIP and ISP.",
  },
  {
    icon: LayoutDashboard,
    title: "Intuitive Dashboard",
    desc: "The most streamlined management interface in the industry.",
  },
  {
    icon: Users,
    title: "Unmatched Scale",
    desc: "Handle millions of concurrent connections without breaking a sweat.",
  },
  {
    icon: Code2,
    title: "Unified API",
    desc: "Integrate effortlessly with any existing workflow or platform.",
  },
  {
    icon: ShieldCheck,
    title: "Total Security",
    desc: "Hardened endpoints, MAG firewall, ISP/ASN/serial lock.",
  },
  {
    icon: Activity,
    title: "Real-Time Telemetry",
    desc: "Live analytics, monitoring, and instant insight into every stream.",
  },
];

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
    title: "Deployment",
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
    title: "Security & Management",
    items: [
      "Fast Event Sender MAG/Stalker",
      "Remote Change Portals",
      "MAG Security, Firewall",
      "ISP, ASN & Serial Lock",
      "Admin Ticket Creation",
      "Resellers Own Management",
      "Advanced Content Encryption",
    ],
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────── */}
      <section className="hero-gradient relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.03]">
          <div className="w-full h-full rounded-full border-[40px] border-[#6d28d9] translate-x-1/3 -translate-y-1/4" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#6d28d9]/8 border border-[#6d28d9]/15 px-4 py-1.5 mb-6">
            <Zap className="h-3.5 w-3.5 text-[#6d28d9]" />
            <span className="text-xs font-semibold text-[#6d28d9] tracking-wide uppercase font-[var(--font-display)]">
              Streaming Engine
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] font-[var(--font-display)]">
            The Infrastructure
            <br />
            <span className="text-[#6d28d9]">Standard.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg text-[#8c8579] leading-relaxed">
            High-performance IPTV platform engine for global providers.
            Built for scale, engineered for reliability.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/pricing"
              className="btn-primary inline-flex items-center gap-2 text-sm px-7 py-3"
            >
              Renew License
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/#features" className="btn-outline inline-flex items-center gap-2 text-sm px-7 py-3">
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trusted Stats Strip ───────────────────── */}
      <section className="border-y border-[#e8e5df] bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "99.9%", label: "Uptime SLA" },
              { value: "50+", label: "Protocols" },
              { value: "1M+", label: "Connections" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-3xl font-bold text-[#6d28d9] font-[var(--font-display)]">{stat.value}</p>
                <p className="text-xs text-[#8c8579] mt-1 uppercase tracking-wider font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────── */}
      <section id="features" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6d28d9] mb-2 font-[var(--font-display)]">
              Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[var(--font-display)]">
              Enterprise-Grade Features
            </h2>
            <p className="mt-3 text-[#8c8579] max-w-lg mx-auto">
              Every component designed for maximum performance and zero downtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat) => (
              <div key={feat.title} className="card p-6 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6d28d9]/8">
                  <feat.icon className="h-5 w-5 text-[#6d28d9]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1625] font-[var(--font-display)]">
                    {feat.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#8c8579] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Protocol Coverage ─────────────────────── */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#e8e5df]">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6d28d9] mb-2 font-[var(--font-display)]">
              Technical Specs
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[var(--font-display)]">
              Complete Protocol Coverage
            </h2>
            <p className="mt-3 text-[#8c8579] max-w-lg mx-auto">
              From ingest to delivery — every protocol and workflow fully supported.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {protocolColumns.map((col) => (
              <div key={col.title} className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6d28d9]/8">
                    <col.icon className="h-4 w-4 text-[#6d28d9]" />
                  </div>
                  <h3 className="text-sm font-semibold font-[var(--font-display)]">
                    {col.title}
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#5a5550]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#6d28d9]/60" />
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
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-[#1a1625] px-8 sm:px-14 py-12 sm:py-16 text-center">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-[#6d28d9] opacity-[0.15] blur-[100px]" />
            </div>

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-[var(--font-display)]">
                Ready to renew?
              </h2>
              <p className="mt-3 text-[#9ca3af] max-w-md mx-auto">
                Keep your platform running at peak performance. Flexible license durations, multiple payment methods.
              </p>
              <div className="mt-8">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-white text-[#1a1625] px-7 py-3 rounded-lg font-semibold text-sm font-[var(--font-display)] hover:bg-[#f3f1ee] transition-colors"
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
