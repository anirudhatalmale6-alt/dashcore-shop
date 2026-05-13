"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers, ShieldCheck, Activity,
  Server, Radio, ArrowRight, CheckCircle2, Zap, Wifi, Shield, Cpu, Eye, Users,
  ChevronLeft, ChevronRight,
} from "lucide-react";

interface HomeSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  showProductsOnHome: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  badge: string;
  badgeColor: string;
  featured: boolean;
  features: string[];
  tiers: { id: number; name: string; price: number; period: string }[];
}

interface SliderImg {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string;
}

const features = [
  {
    icon: Layers, title: "Modular Architecture",
    desc: "Institutional-grade components built for hot-swapping and 99.9% uptime.",
    items: ["Multi main installation", "Load balancing support", "Unlimited streams & users", "On-demand with fast zapping"],
    color: "text-[#6366f1]", bg: "bg-[#6366f1]/10",
  },
  {
    icon: ShieldCheck, title: "Total Security",
    desc: "Hardened endpoints, MAG firewall, ISP/ASN/serial lock protection.",
    items: ["MAG security & firewall", "ISP, ASN & serial lock", "Advanced content encryption", "Remote change portals"],
    color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10",
  },
  {
    icon: Activity, title: "Real-Time Telemetry",
    desc: "Live analytics, monitoring, and instant insight into every stream.",
    items: ["Real-time stream monitoring", "Admin ticket creation", "Resellers own management", "Fast event sender MAG/Stalker"],
    color: "text-[#a855f7]", bg: "bg-[#a855f7]/10",
  },
];

const protocols = [
  { icon: Radio, label: "HTTP, RTMP, RTSP, RTP, UDP" },
  { icon: Wifi, label: "Live Streams, VOD, Radio" },
  { icon: Cpu, label: "TV Series & TMDB API" },
  { icon: Shield, label: "Fingerprint Sender" },
  { icon: Server, label: "MPEG-TS, HLS, RTMP Output" },
  { icon: Eye, label: "TV Archive & Timeshift" },
];

export default function HomePage() {
  const [settings, setSettings] = useState<HomeSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sliderImages, setSliderImages] = useState<SliderImg[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .catch(() => {});
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d || []))
      .catch(() => {});
    fetch("/api/slider")
      .then((r) => r.json())
      .then((d) => setSliderImages(d || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [sliderImages.length]);

  return (
    <div>
      {/* ── Hero Section ──────────────────────── */}
      <section className="hero-section">
        <div className="floating-shape shape-1" />
        <div className="floating-shape shape-2" />
        <div className="floating-shape shape-3" />

        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <h1 className="hero-title">
                {settings?.heroTitle?.split(" ").slice(0, -2).join(" ") || "DashCore IPTV"}{" "}
                <span className="hero-title-gradient">
                  {settings?.heroTitle?.split(" ").slice(-2).join(" ") || "Platform Engine"}
                </span>
              </h1>
              <p className="hero-subtitle mt-5 animate-fade-up anim-d1">
                {settings?.heroSubtitle || "High-performance streaming infrastructure for global platforms. Renew your license and keep your platform running at full power."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3 animate-fade-up anim-d2">
                <Link href="/pricing" className="btn-glow">
                  {settings?.heroButtonText || "View Plans"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/#features" className="btn-outline">
                  Explore Features
                </Link>
              </div>
            </div>

            <div className="hidden lg:block animate-fade-up anim-d3">
              <div className="relative bg-white border border-[#e5e7eb] rounded-2xl p-6 space-y-4 shadow-lg"
                   style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.1)", transform: "perspective(1000px) rotateY(-5deg)", transition: "transform 0.5s ease" }}>
                <div className="flex items-center gap-3 text-[#6b7280] text-sm">
                  <Wifi className="h-4 w-4 text-[#6366f1]" />
                  <span className="font-medium">Live Platform Status</span>
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" />
                    All Systems Operational
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Uptime", value: "99.9%", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Protocols", value: "50+", icon: Radio, color: "text-[#6366f1]", bg: "bg-[#6366f1]/8" },
                    { label: "Max Connections", value: "1M+", icon: Users, color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/8" },
                    { label: "Response Time", value: "<10ms", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
                  ].map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-[#e5e7eb]/50`}>
                      <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
                      <p className="text-2xl font-bold text-[#111827]">{s.value}</p>
                      <p className="text-xs text-[#6b7280] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <h2 className="section-title mb-14">Powerful Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div key={feat.title} className="feature-card">
                <div className={`feature-icon ${feat.bg}`}>
                  <feat.icon className={`h-7 w-7 ${feat.color}`} />
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-2">{feat.title}</h3>
                <p className="text-[#6b7280] leading-relaxed mb-5 text-sm">{feat.desc}</p>
                <ul className="space-y-2.5">
                  {feat.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[#111827]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10b981]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Image Slider ────────────────────── */}
      {sliderImages.length > 0 && (
        <section className="py-10 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#e5e7eb]" style={{ aspectRatio: "16/6" }}>
              {sliderImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{ opacity: idx === currentSlide ? 1 : 0 }}
                >
                  {img.linkUrl ? (
                    <a href={img.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                    </a>
                  ) : (
                    <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                  )}
                  {img.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                      <p className="text-white font-semibold text-lg">{img.title}</p>
                    </div>
                  )}
                </div>
              ))}

              {sliderImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-md z-10"
                  >
                    <ChevronLeft className="h-5 w-5 text-[#111827]" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % sliderImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-md z-10"
                  >
                    <ChevronRight className="h-5 w-5 text-[#111827]" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {sliderImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlide ? "bg-white w-6" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Protocol Coverage ────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <h2 className="section-title mb-6">Complete Protocol Coverage</h2>
          <p className="text-center text-[#6b7280] mb-14 max-w-lg mx-auto">
            From ingest to delivery — every protocol and workflow fully supported.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {protocols.map((p) => (
              <div key={p.label} className="feature-card flex items-center gap-4 !p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6366f1]/10">
                  <p.icon className="h-5 w-5 text-[#6366f1]" />
                </div>
                <span className="text-sm font-medium text-[#111827]">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products Section (conditional) ──── */}
      {settings?.showProductsOnHome !== false && products.length > 0 && (
        <section className="py-16 sm:py-20 bg-white/60">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
            <h2 className="section-title mb-6">Our Products</h2>
            <p className="text-center text-[#6b7280] mb-14 max-w-lg mx-auto">
              Choose the perfect plan for your needs. All plans include access to our complete platform.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const lowestTier = product.tiers?.sort((a, b) => a.price - b.price)[0];
                return (
                  <div key={product.id} className={`pricing-card ${product.featured ? "popular" : ""}`}>
                    {product.badge && (
                      <span className="absolute top-4 right-4 bg-[#6366f1] text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {product.badge}
                      </span>
                    )}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-[#111827] mb-2">{product.name}</h3>
                      {lowestTier && (
                        <>
                          <div className="text-3xl font-bold text-[#6366f1]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            ${lowestTier.price}
                          </div>
                          <div className="text-sm text-[#6b7280]">/ {lowestTier.period}</div>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-[#6b7280] leading-relaxed mb-5 line-clamp-3">{product.description}</p>
                    {product.features && (
                      <ul className="space-y-2.5 mb-6">
                        {(typeof product.features === "string" ? JSON.parse(product.features) : product.features).slice(0, 5).map((f: string) => (
                          <li key={f} className="flex items-center gap-2.5 text-sm text-[#111827] border-b border-[#e5e7eb] pb-2.5">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10b981]" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href="/pricing"
                      className={`block text-center w-full py-3 rounded-full font-semibold text-sm transition-all ${
                        product.featured
                          ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md hover:shadow-lg"
                          : "border-2 border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1] hover:text-white"
                      }`}
                    >
                      View Plans
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Section ──────────────────────── */}
      <section className="cta-section">
        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Ready to Renew Your License?
          </h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-10">
            Keep your platform running at peak performance. Flexible durations, multiple payment methods.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/pricing" className="inline-flex items-center gap-2 bg-white text-[#6366f1] font-semibold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              View Pricing <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://t.me/dashcore"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-2 border-white/80 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/10 transition-all"
            >
              Contact on Telegram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
