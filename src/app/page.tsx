import Link from "next/link";
import {
  Layers, Binary, Globe, LayoutDashboard, Users, Code2, ShieldCheck, Activity,
  Server, Radio, Lock, ArrowRight, Zap, CheckCircle2, Wifi, MonitorPlay,
} from "lucide-react";

const features = [
  { icon: Layers, title: "Modular Architecture", desc: "Institutional-grade components built for hot-swapping and 99.9% uptime." },
  { icon: Binary, title: "Binary Fidelity", desc: "Low-latency data transmission with pixel-perfect streaming clarity." },
  { icon: Globe, title: "Global Load Balancing", desc: "Elastic infrastructure that redistributes traffic by GeoIP and ISP." },
  { icon: LayoutDashboard, title: "Intuitive Dashboard", desc: "The most streamlined management interface in the industry." },
  { icon: Users, title: "Unmatched Scale", desc: "Handle millions of concurrent connections without breaking a sweat." },
  { icon: Code2, title: "Unified API", desc: "Integrate effortlessly with any existing workflow or platform." },
  { icon: ShieldCheck, title: "Total Security", desc: "Hardened endpoints, MAG firewall, ISP/ASN/serial lock." },
  { icon: Activity, title: "Real-Time Telemetry", desc: "Live analytics, monitoring, and instant insight into every stream." },
];

const protocolColumns = [
  {
    icon: Radio, title: "Protocol Support", color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/10",
    items: ["HTTP, RTMP, RTSP, RTP, UDP", "Live Streams, VOD, Radio", "TV Series & TMDB API", "Fingerprint Sender", "MPEG-TS, HLS, RTMP Output", "TV Archive & Timeshift"],
  },
  {
    icon: Server, title: "Deployment", color: "text-[#7c3aed]", bg: "bg-[#7c3aed]/10",
    items: ["Multi Main Installation", "MPD Streaming with Key", "Load Balancing", "Server Load, GeoIP & ISP Based", "Unlimited Streams & Users", "Unlimited Loadbalancers", "On-Demand with Fast Zapping"],
  },
  {
    icon: Lock, title: "Security & Management", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10",
    items: ["Fast Event Sender MAG/Stalker", "Remote Change Portals", "MAG Security, Firewall", "ISP, ASN & Serial Lock", "Admin Ticket Creation", "Resellers Own Management", "Advanced Content Encryption"],
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero (Light) ──────────────────────── */}
      <section className="hero-light relative pt-28 pb-20 sm:pt-36 sm:pb-28 min-h-[90vh] flex items-center">
        <div className="hero-pattern" />

        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/8 border border-[#7c3aed]/15 px-4 py-1.5 mb-6 animate-fade-up">
                <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
                <span className="text-xs font-semibold text-[#7c3aed] tracking-wide uppercase">
                  System Active 99.9%
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] text-[#0f172a] animate-fade-up anim-d1">
                DashCore IPTV
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#06b6d4]">
                  Platform Engine
                </span>
              </h1>

              <p className="mt-5 max-w-md text-base sm:text-lg text-[#64748b] leading-relaxed animate-fade-up anim-d2">
                High-performance streaming infrastructure for global platforms.
                Renew your license and keep your platform running at full power.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start gap-3 animate-fade-up anim-d3">
                <Link href="/pricing" className="btn-glow inline-flex items-center gap-2 text-sm">
                  Renew License
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/#features" className="btn-outline inline-flex items-center gap-2 text-sm">
                  Explore Features
                </Link>
              </div>
            </div>

            <div className="hidden lg:block animate-fade-up anim-d4">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#7c3aed]/8 to-[#06b6d4]/8 rounded-3xl blur-2xl" />
                <div className="relative bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4 shadow-lg shadow-[#7c3aed]/5">
                  <div className="flex items-center gap-3 text-[#475569] text-sm">
                    <Wifi className="h-4 w-4 text-[#06b6d4]" />
                    <span className="font-medium">Live Platform Status</span>
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" />
                      All Systems Operational
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Uptime", value: "99.9%", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Protocols", value: "50+", icon: Radio, color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/8" },
                      { label: "Max Connections", value: "1M+", icon: Users, color: "text-[#7c3aed]", bg: "bg-[#7c3aed]/8" },
                      { label: "Response Time", value: "<10ms", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
                    ].map((s) => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-[#e2e8f0]/50`}>
                        <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
                        <p className="text-2xl font-bold text-[#0f172a]">{s.value}</p>
                        <p className="text-xs text-[#64748b] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#f8fafc] rounded-xl p-3 flex items-center gap-3 border border-[#e2e8f0]">
                    <MonitorPlay className="h-5 w-5 text-[#7c3aed]" />
                    <div className="flex-1">
                      <div className="h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                        <div className="h-full w-[85%] bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] rounded-full" />
                      </div>
                    </div>
                    <span className="text-xs text-[#64748b] font-mono">85% Load</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="badge-purple mb-3 inline-block">Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a]">
              Enterprise-Grade Features
            </h2>
            <p className="mt-3 text-[#64748b] max-w-lg mx-auto">
              Every component designed for maximum performance and zero downtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat) => (
              <div key={feat.title} className="card p-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed]/10 to-[#06b6d4]/10">
                  <feat.icon className="h-5 w-5 text-[#7c3aed]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">{feat.title}</h3>
                  <p className="mt-1 text-sm text-[#64748b] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Protocol Coverage ─────────────────────── */}
      <section className="py-16 sm:py-24 bg-[#f8fafc]">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="badge-teal mb-3 inline-block">Technical Specs</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a]">
              Complete Protocol Coverage
            </h2>
            <p className="mt-3 text-[#64748b] max-w-lg mx-auto">
              From ingest to delivery — every protocol and workflow fully supported.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {protocolColumns.map((col) => (
              <div key={col.title} className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${col.bg}`}>
                    <col.icon className={`h-5 w-5 ${col.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-[#0f172a]">{col.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#475569]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#06b6d4]" />
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
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="hero-light relative overflow-hidden rounded-3xl px-8 sm:px-14 py-14 sm:py-18 text-center border border-[#e2e8f0]">
            <div className="hero-pattern" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a]">
                Ready to renew your license?
              </h2>
              <p className="mt-3 text-[#64748b] max-w-md mx-auto">
                Keep your platform running at peak performance. Flexible durations, multiple payment methods.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/pricing" className="btn-glow inline-flex items-center gap-2 text-sm">
                  View Pricing <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="https://t.me/dashcore" target="_blank" rel="noopener noreferrer" className="btn-outline inline-flex items-center gap-2 text-sm">
                  Contact on Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
