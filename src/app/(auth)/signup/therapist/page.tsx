"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Sun, Moon, User, Users, Building2, ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

type OrgType = "solo" | "small" | "medium" | "large";

const orgOptions: { id: OrgType; icon: typeof User; label: string; desc: string }[] = [
  { id: "solo", icon: User, label: "Solo Practice", desc: "Just me" },
  { id: "small", icon: Users, label: "Small Team", desc: "2–5 members" },
  { id: "medium", icon: Building2, label: "Clinic", desc: "6–20 members" },
  { id: "large", icon: Building2, label: "Organisation", desc: "20+ members" },
];

const countryCodes = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "US" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65", flag: "🇸🇬", name: "SG" },
  { code: "+61", flag: "🇦🇺", name: "AU" },
  { code: "+49", flag: "🇩🇪", name: "DE" },
  { code: "+33", flag: "🇫🇷", name: "FR" },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error") === "oauth";
  const { theme, setTheme } = useTheme();

  const [step, setStep] = useState(1);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");

  // Step 2
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [orgName, setOrgName] = useState("");
  const [username, setUsername] = useState("");

  const [error, setError] = useState<string | null>(
    oauthError ? "OAuth sign-up failed. Please try again." : null
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep(2);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!orgType) {
      setError("Please select your practice type.");
      return;
    }
    if (!username.trim()) {
      setError("Please choose a username.");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: `${countryCode}${phone}`,
          org_type: orgType,
          username,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    posthog.capture("signup_completed", { method: "email", org_type: orgType });

    const name = orgType === "solo" ? "" : orgName.trim();
    if (name) {
      localStorage.setItem("bendre_pending_practice", name);
    }
    localStorage.setItem("bendre_pending_slug", username.trim().toLowerCase());

    router.push("/dashboard");
  }

  async function handleGoogleSignup() {
    setError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
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
      className="min-h-screen flex items-center justify-center px-6 py-12 relative"
      style={{ background: "var(--color-auth-bg)" }}
    >
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
        style={{ border: "1px solid var(--color-auth-toggle-border)", color: "var(--color-auth-toggle-color)" }}
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Image src="/logo.png" alt="Bendre" width={38} height={36} style={{ width: "auto", height: "auto" }} />
          <span className="text-[24px] font-bold tracking-tight" style={{ color: "var(--color-auth-text)" }}>
            Bendre
          </span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-1 rounded-full" style={{ background: "#6B7E6C" }} />
          <div className="w-8 h-1 rounded-full" style={{ background: step >= 2 ? "#6B7E6C" : "var(--color-auth-card-border)" }} />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{ background: "var(--color-auth-card)", borderColor: "var(--color-auth-card-border)" }}
        >
          {step === 1 && (
            <>
              <div className="text-center mb-7">
                <h1 className="text-xl font-bold" style={{ color: "var(--color-auth-text)" }}>
                  Create your account
                </h1>
                <p className="text-[13px] mt-1" style={{ color: "var(--color-auth-text-secondary)" }}>
                  Start managing your practice
                </p>
              </div>

              {error && (
                <div role="alert" className="mb-5 px-4 py-3 rounded-xl text-[13px]" style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.15)", color: "#e55" }}>
                  {error}
                </div>
              )}

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border text-sm font-medium disabled:opacity-50 transition-all cursor-pointer"
                style={{ background: "var(--color-auth-input)", borderColor: "var(--color-auth-input-border)", color: "var(--color-auth-text)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {googleLoading ? "Redirecting..." : "Continue with Google"}
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ background: "var(--color-auth-divider)" }} />
                <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--color-auth-text-muted)" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "var(--color-auth-divider)" }} />
              </div>

              <form onSubmit={handleNext} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className={labelCls} style={{ color: "var(--color-auth-text-secondary)" }}>
                    Full name
                  </label>
                  <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Dr. Priya Sharma" className={inputCls} style={inputStyle} />
                </div>

                <div>
                  <label htmlFor="email" className={labelCls} style={{ color: "var(--color-auth-text-secondary)" }}>
                    Email
                  </label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputCls} style={inputStyle} />
                </div>

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
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-auth-text-muted)" }} />
                    </div>
                    <input
                      id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      required placeholder="98765 43210"
                      className={`${inputCls} flex-1`} style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className={labelCls} style={{ color: "var(--color-auth-text-secondary)" }}>
                    Password
                  </label>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className={inputCls} style={inputStyle} />
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all mt-2 cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: "#6B7E6C" }}
                >
                  Next <ArrowRight size={15} />
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-7">
                <h1 className="text-xl font-bold" style={{ color: "var(--color-auth-text)" }}>
                  Set up your practice
                </h1>
                <p className="text-[13px] mt-1" style={{ color: "var(--color-auth-text-secondary)" }}>
                  How do you practice?
                </p>
              </div>

              {error && (
                <div role="alert" className="mb-5 px-4 py-3 rounded-xl text-[13px]" style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.15)", color: "#e55" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-5">
                {/* Org type grid */}
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

                {/* Org name — only for non-solo */}
                {orgType && orgType !== "solo" && (
                  <div>
                    <label htmlFor="orgName" className={labelCls} style={{ color: "var(--color-auth-text-secondary)" }}>
                      Organisation name
                    </label>
                    <input id="orgName" type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="e.g. Mindful Wellness Clinic" className={inputCls} style={inputStyle} />
                  </div>
                )}

                {/* Username / slug */}
                <div>
                  <label htmlFor="username" className={labelCls} style={{ color: "var(--color-auth-text-secondary)" }}>
                    {orgType === "solo" ? "Choose your username" : "Organisation username"}
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] select-none pointer-events-none"
                      style={{ color: "var(--color-auth-text-muted)" }}
                    >
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

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null); }}
                    className="h-11 px-5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5"
                    style={{ border: "1px solid var(--color-auth-input-border)", color: "var(--color-auth-text-secondary)", background: "transparent" }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all cursor-pointer"
                    style={{ background: "#6B7E6C" }}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-sm text-center mt-6" style={{ color: "var(--color-auth-text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login/therapist" className="font-semibold transition-colors hover:underline underline-offset-2" style={{ color: "#6B7E6C" }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
