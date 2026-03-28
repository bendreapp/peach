"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Calendar, FileText, MessageCircle, IndianRupee, ClipboardList, Shield,
  ArrowRight, Check, ChevronDown, Lock, Server, Zap, Globe,
  Video, Users, BarChart3, Bell, Star, Sparkles,
} from "lucide-react";

function WaitlistForm({ dark }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer re_1AM2qcYE_EM1Z7y7hvXHKhjxCjMciLNm7",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Bendre <noreply@notification.bendre.app>",
          to: ["bendrehq@gmail.com"],
          subject: `Waitlist: ${email}`,
          html: `<p>New waitlist signup: <strong>${email}</strong></p><p>Time: ${new Date().toISOString()}</p>`,
        }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-2" style={{ padding: "14px 0" }}>
        <Check size={18} style={{ color: "#6B7E6C" }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: dark ? "#fff" : "#111" }}>
          You&apos;re on the list! We&apos;ll be in touch.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center justify-center gap-2 flex-wrap">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        style={{
          height: 52,
          padding: "0 20px",
          borderRadius: 14,
          border: dark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e0e0db",
          background: dark ? "rgba(255,255,255,0.06)" : "#fff",
          color: dark ? "#fff" : "#111",
          fontSize: 15,
          width: 280,
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          height: 52,
          padding: "0 28px",
          borderRadius: 14,
          background: dark ? "#fff" : "#1A1A1A",
          color: dark ? "#111" : "#fff",
          fontSize: 15,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          opacity: status === "loading" ? 0.6 : 1,
        }}
      >
        {status === "loading" ? "Joining..." : "Join Waitlist"}
        {status !== "loading" && <ArrowRight size={16} />}
      </button>
      {status === "error" && (
        <p style={{ fontSize: 13, color: "#C62828", width: "100%", textAlign: "center", marginTop: 8 }}>
          Something went wrong. Try again.
        </p>
      )}
    </form>
  );
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: "'Satoshi', sans-serif", background: "#FCFCFA", color: "#111" }}>

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", background: "rgba(252,252,250,0.9)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="max-w-[1180px] mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 no-underline">
            <Image src="/logo.png" alt="Bendre" width={34} height={34} />
            <span style={{ fontSize: 20, fontWeight: 800, color: "#111", letterSpacing: "-0.03em" }}>Bendre</span>
          </Link>
          <div className="hidden md:flex items-center gap-9">
            {["Features", /* "Pricing", */ "FAQ"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:!text-[#111] transition-colors" style={{ fontSize: 14, color: "#888", textDecoration: "none", fontWeight: 500 }}>{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block hover:!text-[#111] transition-colors" style={{ fontSize: 14, fontWeight: 600, color: "#777", textDecoration: "none" }}>Log in</Link>
            <Link href="/signup" className="hover:!bg-[#111] transition-all" style={{ height: 40, padding: "0 22px", borderRadius: 10, background: "#1A1A1A", color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{ paddingTop: 160, paddingBottom: 80 }}>
        <div className="max-w-[720px] mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-8" style={{ padding: "6px 6px 6px 14px", borderRadius: 100, background: "#F0F4F0", fontSize: 13, fontWeight: 600, color: "#5A6D5B" }}>
            <Sparkles size={13} />
            Practice management, reimagined
            <span style={{ padding: "3px 10px", borderRadius: 100, background: "#5A6D5B", color: "#fff", fontSize: 11, fontWeight: 700, marginLeft: 4 }}>NEW</span>
          </div>

          <h1 style={{ fontSize: "clamp(42px, 6.5vw, 72px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.045em", margin: "0 0 24px", color: "#111" }}>
            Your practice,<br />finally at <span style={{ color: "#6B7E6C" }}>peace.</span>
          </h1>

          <p style={{ fontSize: 19, lineHeight: 1.65, color: "#777", maxWidth: 480, margin: "0 auto 40px", fontWeight: 400 }}>
            One calm space for booking, sessions, notes, and payments. Built for therapists in India.
          </p>

          <WaitlistForm />

          <div className="flex items-center justify-center gap-5 mt-10 flex-wrap">
            {["Early access", "No credit card", "Mumbai data center"].map((t) => (
              <div key={t} className="flex items-center gap-1.5" style={{ fontSize: 13, color: "#aaa", fontWeight: 500 }}>
                <Check size={13} style={{ color: "#6B7E6C" }} />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-[1000px] mx-auto px-8 mt-16">
          <div style={{ borderRadius: 20, border: "1px solid rgba(0,0,0,0.08)", background: "#fff", boxShadow: "0 20px 80px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: "#FAFAFA", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex gap-1.5">
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C93F" }} />
              </div>
              <div style={{ marginLeft: 12, padding: "4px 16px", borderRadius: 6, background: "rgba(0,0,0,0.04)", fontSize: 12, color: "#aaa" }}>bendre.app/dashboard</div>
            </div>
            {/* Mock content */}
            <div style={{ padding: "24px 28px" }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Good afternoon, Dr. Priya</div>
                  <div style={{ fontSize: 13, color: "#aaa", marginTop: 2 }}>Thursday, March 28 · 4 sessions today</div>
                </div>
                <div style={{ padding: "8px 16px", borderRadius: 8, background: "#6B7E6C", color: "#fff", fontSize: 13, fontWeight: 600 }}>+ New Session</div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Today", value: "4", accent: "#6B7E6C" },
                  { label: "Pending", value: "1", accent: "#E6A700" },
                  { label: "This Week", value: "18", accent: "#3D6B72" },
                  { label: "Revenue", value: "₹1.2L", accent: "#2E7D32" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", background: "#FAFAFA" }}>
                    <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.accent, letterSpacing: "-0.02em" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { name: "Priya Sharma", time: "10:00 AM", type: "Regular", status: "Next", statusColor: "#6B7E6C" },
                  { name: "Rahul Menon", time: "11:30 AM", type: "Follow-up", status: "Upcoming", statusColor: "#aaa" },
                  { name: "Ananya Iyer", time: "2:00 PM", type: "Intro Call", status: "Upcoming", statusColor: "#aaa" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                    <div>
                      <span style={{ fontWeight: 600, color: "#333" }}>{s.name}</span>
                      <span style={{ color: "#bbb", margin: "0 8px" }}>·</span>
                      <span style={{ color: "#999" }}>{s.time}</span>
                      <span style={{ color: "#bbb", margin: "0 8px" }}>·</span>
                      <span style={{ color: "#999" }}>{s.type}</span>
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: i === 0 ? "rgba(107,126,108,0.1)" : "rgba(0,0,0,0.03)", color: s.statusColor, fontWeight: 600 }}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ LOGOS / TRUST ═══ */}
      <section style={{ padding: "40px 0 60px" }}>
        <div className="max-w-[800px] mx-auto px-8 flex items-center justify-center gap-10 md:gap-14 flex-wrap">
          {[
            { icon: Lock, text: "AES-256 Encrypted" },
            { icon: Server, text: "Mumbai Data Center" },
            { icon: Shield, text: "DPDP Compliant" },
            { icon: Globe, text: "Works Everywhere" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2" style={{ fontSize: 13, color: "#bbb", fontWeight: 500 }}>
              <item.icon size={14} strokeWidth={1.5} style={{ color: "#ccc" }} />
              {item.text}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ padding: "80px 0 100px" }}>
        <div className="max-w-[1100px] mx-auto px-8">
          <div className="text-center" style={{ marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7E6C", marginBottom: 10 }}>Features</p>
            <h2 style={{ fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#111" }}>
              Everything you need.
            </h2>
            <p style={{ fontSize: 17, color: "#999", marginTop: 12, fontWeight: 400 }}>Purpose-built tools for the Indian therapist workflow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Calendar, title: "Scheduling", desc: "Booking page, availability, recurring slots, buffer times. Clients book directly.", color: "#6B7E6C", tags: ["Booking page", "Recurring", "Reminders"] },
              { icon: FileText, title: "Clinical Notes", desc: "SOAP, DAP, BIRP, or freeform. Encrypted with AES-256-GCM at rest.", color: "#3D6B72", tags: ["SOAP/DAP", "Encrypted", "Templates"] },
              { icon: IndianRupee, title: "Payments", desc: "Razorpay, auto-invoicing with GST. Tiered rates for Indian, NRI, couples.", color: "#9E8554", tags: ["Razorpay", "GST invoices", "Tiered"] },
              { icon: MessageCircle, title: "Messaging", desc: "Encrypted client messaging. Keep work and personal communication separate.", color: "#6B7E6C", tags: null },
              { icon: ClipboardList, title: "Intake Forms", desc: "Custom form builder. Send via link. Encrypted responses on client records.", color: "#3D6B72", tags: null },
              { icon: Shield, title: "Privacy First", desc: "Column-level encryption. Row-level security. Mumbai data center. DPDP compliant.", color: "#1A1A1A", tags: null },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{ padding: i < 3 ? 32 : 28, borderRadius: 20, border: "1px solid rgba(0,0,0,0.06)", background: "#fff", transition: "all 0.3s" }} className="hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-1">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}0a`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                    <Icon size={21} style={{ color: f.color }} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em", color: "#111" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#888", lineHeight: 1.65 }}>{f.desc}</p>
                  {f.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {f.tags.map((t) => (
                        <span key={t} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "#F5F5F2", color: "#888", fontWeight: 600 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* More features */}
          <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap mt-12" style={{ padding: "20px 0" }}>
            {[
              { icon: Video, label: "Zoom" },
              { icon: Calendar, label: "Google Cal" },
              { icon: Users, label: "Team Access" },
              { icon: BarChart3, label: "Analytics" },
              { icon: Bell, label: "Reminders" },
              { icon: Globe, label: "Booking Page" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-2" style={{ fontSize: 13, color: "#aaa", fontWeight: 500 }}>
                  <Icon size={14} strokeWidth={1.5} style={{ color: "#6B7E6C" }} />
                  {f.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ PRICING (hidden for now — enable when ready to launch) ═══ */}
      {false && <section id="pricing" style={{ padding: "80px 0 100px", background: "#fff" }}>
        <div className="max-w-[980px] mx-auto px-8">
          <div className="text-center" style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7E6C", marginBottom: 10 }}>Pricing</p>
            <h2 style={{ fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#111" }}>
              Simple, honest pricing.
            </h2>
            <p style={{ fontSize: 17, color: "#999", marginTop: 12 }}>Everything included. No hidden charges.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {[
              { name: "Starter", price: "₹999", period: "/mo", desc: "For therapists just getting started", features: ["Up to 20 clients", "Booking page", "Session notes", "Payments & invoicing", "Auto reminders"], highlighted: false },
              { name: "Professional", price: "₹1,999", period: "/mo", desc: "For established therapists", features: ["Unlimited clients", "Everything in Starter", "Treatment plans", "Custom intake forms", "Zoom + Google Calendar", "Team access", "WhatsApp broadcasts", "Priority support"], highlighted: true },
              { name: "Enterprise", price: "Custom", period: "", desc: "For clinics & group practices", features: ["Everything in Pro", "Multiple therapists", "Admin dashboard", "Custom integrations", "Dedicated support"], highlighted: false },
            ].map((p) => (
              <div
                key={p.name}
                style={{
                  padding: 32, borderRadius: 24,
                  border: p.highlighted ? "2px solid #1A1A1A" : "1px solid rgba(0,0,0,0.06)",
                  background: p.highlighted ? "#1A1A1A" : "#FCFCFA",
                  color: p.highlighted ? "#fff" : "#111",
                  display: "flex", flexDirection: "column",
                  position: "relative",
                }}
              >
                {p.highlighted && (
                  <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", padding: "4px 14px", borderRadius: 100, background: "#6B7E6C", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Most Popular
                  </div>
                )}
                <p style={{ fontSize: 14, fontWeight: 700, color: p.highlighted ? "rgba(255,255,255,0.4)" : "#999", marginBottom: 16 }}>{p.name}</p>
                <div className="flex items-baseline gap-1" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em" }}>{p.price}</span>
                  {p.period && <span style={{ fontSize: 15, color: p.highlighted ? "rgba(255,255,255,0.3)" : "#bbb", fontWeight: 500 }}>{p.period}</span>}
                </div>
                <p style={{ fontSize: 14, color: p.highlighted ? "rgba(255,255,255,0.4)" : "#999", marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${p.highlighted ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>{p.desc}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, display: "flex", flexDirection: "column", gap: 13 }}>
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5" style={{ fontSize: 14, color: p.highlighted ? "rgba(255,255,255,0.7)" : "#666" }}>
                      <Check size={15} style={{ color: p.highlighted ? "#6B7E6C" : "#6B7E6C", flexShrink: 0 }} strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.name === "Enterprise" ? "#" : "/signup"}
                  className="block text-center mt-8 transition-all"
                  style={{
                    height: 48, borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: p.highlighted ? "#6B7E6C" : "#1A1A1A",
                    color: "#fff",
                  }}
                >
                  {p.name === "Enterprise" ? "Contact us" : "Start free trial"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* ═══ FAQ ═══ */}
      <section id="faq" style={{ padding: "80px 0 100px" }}>
        <div className="max-w-[640px] mx-auto px-8">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7E6C", marginBottom: 10 }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(32px, 4.5vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#111" }}>
              Common questions
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { q: "Is my data stored in India?", a: "Yes. All data is hosted in Mumbai (ap-south-1), fully compliant with the DPDP Act 2023. Your client data never leaves India." },
              { q: "Can clients see my session notes?", a: "No. Session notes are strictly therapist-only. Clients have zero access to your clinical observations." },
              { q: "Do I need to install anything?", a: "No. Bendre is fully web-based and works on any device with a browser." },
              { q: "Can I use my own Zoom?", a: "Yes. Connect your Zoom account via OAuth in settings. Meeting links are auto-generated for each session." },
              { q: "What payment methods do you support?", a: "UPI, cards, net banking, and wallets via Razorpay. GST-compliant invoices are generated automatically." },
              { q: "Is there a free trial?", a: "Yes — 14 days free on all plans. No credit card required. Cancel anytime." },
            ].map((faq, i) => (
              <button
                key={i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="text-left w-full transition-all"
                style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", background: openFaq === i ? "#fff" : "transparent", overflow: "hidden", boxShadow: openFaq === i ? "0 4px 16px rgba(0,0,0,0.04)" : "none" }}
              >
                <div className="flex items-center justify-between" style={{ padding: "18px 22px", fontSize: 16, fontWeight: 700, color: "#111" }}>
                  {faq.q}
                  <ChevronDown size={18} style={{ color: "#ccc", transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                </div>
                {openFaq === i && (
                  <div style={{ padding: "0 22px 18px", fontSize: 15, color: "#888", lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: "60px 0 100px" }}>
        <div className="max-w-[760px] mx-auto px-8">
          <div style={{ borderRadius: 28, background: "#111", padding: "72px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div className="absolute pointer-events-none" style={{ top: -60, left: "50%", transform: "translateX(-50%)", width: 500, height: 300, background: "radial-gradient(ellipse, rgba(107,126,108,0.2) 0%, transparent 70%)" }} />

            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 12, position: "relative", zIndex: 1 }}>
              Ready to simplify<br />your practice?
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", marginBottom: 32, position: "relative", zIndex: 1 }}>
              Join the waitlist. Be the first to know when we launch.
            </p>
            <div style={{ position: "relative", zIndex: 1 }}>
              <WaitlistForm dark />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "32px 0", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="max-w-[1180px] mx-auto px-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Bendre" width={20} height={20} />
            <span style={{ fontSize: 13, color: "#bbb" }}>© 2026 Bendre. Made with care in India.</span>
          </div>
          <div className="flex gap-7">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a key={link} href="#" className="hover:!text-[#111] transition-colors" style={{ fontSize: 13, color: "#bbb", textDecoration: "none", fontWeight: 500 }}>{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
