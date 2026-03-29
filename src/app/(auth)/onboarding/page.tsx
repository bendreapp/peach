"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Users, Building2, ChevronDown, ArrowRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8095";

type OrgType = "solo" | "small" | "medium" | "large";

const orgOptions: { id: OrgType; icon: typeof User; label: string; desc: string }[] = [
  { id: "solo", icon: User, label: "Solo Practice", desc: "Just me" },
  { id: "small", icon: Users, label: "Small Team", desc: "2–5 members" },
  { id: "medium", icon: Building2, label: "Clinic", desc: "6–20 members" },
  { id: "large", icon: Building2, label: "Organisation", desc: "20+ members" },
];

const countryCodes = [
  { code: "+91", flag: "🇮🇳" },
  { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+971", flag: "🇦🇪" },
  { code: "+65", flag: "🇸🇬" },
  { code: "+61", flag: "🇦🇺" },
  { code: "+49", flag: "🇩🇪" },
  { code: "+33", flag: "🇫🇷" },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [orgName, setOrgName] = useState("");
  const [username, setUsername] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgType) { setError("Please select your practice type."); return; }
    if (!username.trim() || username.trim().length < 3) { setError("Username must be at least 3 characters."); return; }
    setError(null);
    setLoading(true);

    try {
      // Get auth token
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError("Not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      // Update therapist profile with slug, phone, org info
      const updateData: Record<string, unknown> = {
        slug: username.trim().toLowerCase(),
        phone: phone ? `${countryCode}${phone}` : null,
      };

      const res = await fetch(`${API_BASE}/api/v1/therapists/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error?.message || body?.message || "Failed to save. Please try again.";
        setError(msg);
        setLoading(false);
        return;
      }

      // Store practice info for dashboard to pick up
      if (orgType !== "solo" && orgName.trim()) {
        localStorage.setItem("bendre_pending_practice", orgName.trim());
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputCls = "w-full h-11 px-4 rounded-xl text-sm transition-all focus:outline-none focus:border-[#6B7E6C] focus:ring-2 focus:ring-[#6B7E6C]/15";
  const inputStyle: React.CSSProperties = {
    background: "var(--color-auth-input)",
    border: "1px solid var(--color-auth-input-border)",
    color: "var(--color-auth-input-text)",
  };
  const labelCls = "block text-[13px] font-medium mb-1.5";

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "var(--color-auth-bg)" }}
    >
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Image src="/logo.png" alt="Bendre" width={38} height={36} style={{ width: "auto", height: "auto" }} />
          <span className="text-[24px] font-bold tracking-tight" style={{ color: "var(--color-auth-text)" }}>
            Bendre
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{ background: "var(--color-auth-card)", borderColor: "var(--color-auth-card-border)" }}
        >
          <div className="text-center mb-7">
            <h1 className="text-xl font-bold" style={{ color: "var(--color-auth-text)" }}>
              Almost there
            </h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--color-auth-text-secondary)" }}>
              Set up your practice to get started
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 px-4 py-3 rounded-xl text-[13px]" style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.15)", color: "#e55" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone */}
            <div>
              <label htmlFor="phone" className={labelCls} style={{ color: "var(--color-auth-text-secondary)" }}>
                Phone number
              </label>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="h-11 pl-3 pr-7 rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:border-[#6B7E6C] focus:ring-2 focus:ring-[#6B7E6C]/15"
                    style={{ ...inputStyle, minWidth: 90 }}
                  >
                    {countryCodes.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-auth-text-muted)" }} />
                </div>
                <input
                  id="phone" type="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className={`${inputCls} flex-1`} style={inputStyle}
                />
              </div>
            </div>

            {/* Org type */}
            <div>
              <label className={labelCls} style={{ color: "var(--color-auth-text-secondary)" }}>
                Practice type
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {orgOptions.map((opt) => {
                  const Icon = opt.icon;
                  const selected = orgType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOrgType(opt.id)}
                      className="flex flex-col items-center text-center p-4 rounded-xl border cursor-pointer transition-all duration-200"
                      style={{
                        background: selected ? "rgba(107,126,108,0.06)" : "var(--color-auth-input)",
                        borderColor: selected ? "#6B7E6C" : "var(--color-auth-input-border)",
                        borderWidth: selected ? 2 : 1,
                      }}
                    >
                      <Icon size={20} strokeWidth={1.5} style={{ color: selected ? "#6B7E6C" : "var(--color-auth-text-muted)", marginBottom: 6 }} />
                      <span className="text-[13px] font-semibold" style={{ color: "var(--color-auth-text)" }}>{opt.label}</span>
                      <span className="text-[11px] mt-0.5" style={{ color: "var(--color-auth-text-muted)" }}>{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Org name */}
            {orgType && orgType !== "solo" && (
              <div>
                <label htmlFor="orgName" className={labelCls} style={{ color: "var(--color-auth-text-secondary)" }}>
                  Organisation name
                </label>
                <input id="orgName" type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="e.g. Mindful Wellness Clinic" className={inputCls} style={inputStyle} />
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="username" className={labelCls} style={{ color: "var(--color-auth-text-secondary)" }}>
                {orgType === "solo" || !orgType ? "Choose your username" : "Organisation username"}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] select-none pointer-events-none" style={{ color: "var(--color-auth-text-muted)" }}>
                  bendre.app/
                </span>
                <input
                  id="username" type="text" value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required placeholder="priya" minLength={3}
                  className={inputCls}
                  style={{ ...inputStyle, paddingLeft: 96 }}
                />
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: "var(--color-auth-text-muted)" }}>
                This will be your public booking page URL
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              style={{ background: "#6B7E6C" }}
            >
              {loading ? "Setting up..." : "Continue to Dashboard"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
