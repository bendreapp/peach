"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import {
  Sun, Moon, User, Users, Building2, ArrowLeft, ArrowRight, Check,
} from "lucide-react";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { OTPInput } from "@/components/ui/OTPInput";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

type OrgType = "solo" | "small" | "medium" | "large";

const orgOptions: { id: OrgType; icon: typeof User; label: string; desc: string }[] = [
  { id: "solo",   icon: User,      label: "Solo Practice", desc: "Just me" },
  { id: "small",  icon: Users,     label: "Small Team",    desc: "2–5 members" },
  { id: "medium", icon: Building2, label: "Clinic",        desc: "6–20 members" },
  { id: "large",  icon: Building2, label: "Organisation",  desc: "20+ members" },
];

const timezoneOptions = [
  { value: "Asia/Kolkata",       label: "India (IST, UTC+5:30)" },
  { value: "Asia/Dubai",         label: "Dubai (GST, UTC+4)" },
  { value: "Asia/Singapore",     label: "Singapore (SGT, UTC+8)" },
  { value: "Asia/Tokyo",         label: "Tokyo (JST, UTC+9)" },
  { value: "Europe/London",      label: "London (GMT/BST)" },
  { value: "Europe/Paris",       label: "Paris (CET, UTC+1)" },
  { value: "America/New_York",   label: "New York (ET)" },
  { value: "America/Chicago",    label: "Chicago (CT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "Australia/Sydney",   label: "Sydney (AEST, UTC+10)" },
];

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5C7A6B]/20"
      style={{ background: checked ? "#5C7A6B" : "var(--color-auth-input-border)" }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{
          transform: checked ? "translate(18px, 2px)" : "translate(2px, 2px)",
        }}
      />
    </button>
  );
}

function SignupForm() {
  const router = useRouter();
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
  const [teamSize, setTeamSize] = useState("");
  const [orgName, setOrgName] = useState("");
  const [username, setUsername] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [waCountryCode, setWaCountryCode] = useState("+91");
  const [waPhone, setWaPhone] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);

  // Step 3: OTP verification
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore signup form state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bendre_signup_form");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.fullName) setFullName(d.fullName);
        if (d.email) setEmail(d.email);
        if (d.countryCode) setCountryCode(d.countryCode);
        if (d.phone) setPhone(d.phone);
        if (d.orgType) setOrgType(d.orgType);
        if (d.teamSize) setTeamSize(d.teamSize);
        if (d.orgName) setOrgName(d.orgName);
        if (d.username) setUsername(d.username);
        if (d.timezone) setTimezone(d.timezone);
        if (d.waCountryCode) setWaCountryCode(d.waCountryCode);
        if (d.waPhone) setWaPhone(d.waPhone);
        if (typeof d.sameAsPhone === "boolean") setSameAsPhone(d.sameAsPhone);
        if (typeof d.notifWhatsapp === "boolean") setNotifWhatsapp(d.notifWhatsapp);
        if (typeof d.notifEmail === "boolean") setNotifEmail(d.notifEmail);
        if (typeof d.notifSms === "boolean") setNotifSms(d.notifSms);
        if (typeof d.step === "number") setStep(d.step);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist signup form state to localStorage (but NOT password or otp)
  useEffect(() => {
    if (!hydrated) return;
    const data = {
      fullName, email, countryCode, phone,
      orgType, teamSize, orgName, username, timezone,
      waCountryCode, waPhone, sameAsPhone,
      notifWhatsapp, notifEmail, notifSms, step,
    };
    localStorage.setItem("bendre_signup_form", JSON.stringify(data));
  }, [hydrated, fullName, email, countryCode, phone, orgType, teamSize, orgName, username, timezone, waCountryCode, waPhone, sameAsPhone, notifWhatsapp, notifEmail, notifSms, step]);

  // Slug availability check (debounced)
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  useEffect(() => {
    if (!username || username.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8095";
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/booking/${username}/profile`);
        // 200 = profile exists → taken; 404 = not found → available
        setSlugStatus(res.ok ? "taken" : "available");
      } catch {
        setSlugStatus("available");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep(2);
  }

  function handleSameAsPhone(checked: boolean) {
    setSameAsPhone(checked);
    if (checked) {
      setWaCountryCode(countryCode);
      setWaPhone(phone);
    } else {
      setWaCountryCode("+91");
      setWaPhone("");
    }
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
    if (slugStatus === "taken") {
      setError("This username is already taken. Please choose another.");
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
          // Extra preferences stored in user_metadata
          team_size: orgType !== "solo" && teamSize ? parseInt(teamSize, 10) : null,
          timezone,
          whatsapp: waPhone ? `${waCountryCode}${waPhone}` : `${countryCode}${phone}`,
          notif_whatsapp: notifWhatsapp,
          notif_email: notifEmail,
          notif_sms: notifSms,
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

    posthog.capture("signup_started", { method: "email", org_type: orgType });

    const name = orgType === "solo" ? "" : orgName.trim();
    if (name) {
      localStorage.setItem("bendre_pending_practice", name);
    }
    localStorage.setItem("bendre_pending_slug", username.trim().toLowerCase());

    // Move to OTP verification step
    setStep(3);
    setResendCooldown(60);
    setLoading(false);
  }

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleVerifyOtp(code?: string) {
    const otpValue = code || otp;
    if (otpValue.length !== 8) return;
    if (loading) return; // Prevent concurrent calls
    setError(null);
    setOtpError(false);
    setLoading(true);

    const supabase = createClient();
    console.log("[OTP] Verifying", { email, token: otpValue, type: "email" });
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpValue,
      type: "email",
    });
    console.log("[OTP] Result", { verifyData, verifyError });

    if (verifyError) {
      const msg = verifyError.message || "";
      const isTokenIssue =
        msg.toLowerCase().includes("expired") ||
        msg.toLowerCase().includes("invalid");

      // Fallback: if token is expired/invalid, user may already be verified.
      // Try logging in with their password.
      if (isTokenIssue && password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!signInError) {
          // Success — they were already verified
          localStorage.removeItem("bendre_signup_form");
          posthog.capture("signup_completed", { method: "email", org_type: orgType });
          router.push("/signup/plan");
          return;
        }
      }

      setOtpError(true);
      if (isTokenIssue) {
        setError("That code didn't work. It may be expired or already used. Please request a new one.");
      } else if (msg.toLowerCase().includes("rate limit")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError(msg || "Verification failed. Please try again.");
      }
      setLoading(false);
      setOtp(""); // Clear the OTP so user can re-enter
      return;
    }

    // Clear saved signup form on successful verification
    localStorage.removeItem("bendre_signup_form");
    posthog.capture("signup_completed", { method: "email", org_type: orgType });
    router.push("/signup/plan");
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setError(null);
    setOtp("");
    setOtpError(false);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setError(resendError.message || "Failed to resend code.");
      return;
    }

    setResendCooldown(60);
  }

  const inputCls =
    "w-full h-11 px-4 rounded-xl text-sm transition-all focus:outline-none focus:border-[#5C7A6B] focus:ring-2 focus:ring-[#5C7A6B]/15";
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
      {/* Dark mode toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
        style={{
          border: "1px solid var(--color-auth-toggle-border)",
          color: "var(--color-auth-toggle-color)",
        }}
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Image
            src="/logo.png"
            alt="Bendre"
            width={38}
            height={36}
            style={{ width: "auto", height: "auto" }}
          />
          <span
            className="text-[24px] font-bold tracking-tight"
            style={{ color: "var(--color-auth-text)" }}
          >
            Bendre
          </span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-1 rounded-full" style={{ background: "#5C7A6B" }} />
          <div
            className="w-8 h-1 rounded-full"
            style={{
              background: step >= 2 ? "#5C7A6B" : "var(--color-auth-card-border)",
            }}
          />
          <div
            className="w-8 h-1 rounded-full"
            style={{
              background: step >= 3 ? "#5C7A6B" : "var(--color-auth-card-border)",
            }}
          />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "var(--color-auth-card)",
            borderColor: "var(--color-auth-card-border)",
          }}
        >
          {/* ── Step 1: Account basics ─────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="text-center mb-7">
                <h1
                  className="text-xl font-bold"
                  style={{ color: "var(--color-auth-text)" }}
                >
                  Create your account
                </h1>
                <p
                  className="text-[13px] mt-1"
                  style={{ color: "var(--color-auth-text-secondary)" }}
                >
                  Start managing your practice
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 px-4 py-3 rounded-xl text-[13px]"
                  style={{
                    background: "rgba(192,112,90,0.08)",
                    border: "1px solid rgba(192,112,90,0.2)",
                    color: "#C0705A",
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleNext} className="space-y-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className={labelCls}
                    style={{ color: "var(--color-auth-text-secondary)" }}
                  >
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Dr. Priya Sharma"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className={labelCls}
                    style={{ color: "var(--color-auth-text-secondary)" }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    className={labelCls}
                    style={{ color: "var(--color-auth-text-secondary)" }}
                  >
                    Phone number
                  </label>
                  <PhoneInput
                    countryCode={countryCode}
                    onCountryCodeChange={setCountryCode}
                    phone={phone}
                    onPhoneChange={setPhone}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className={labelCls}
                    style={{ color: "var(--color-auth-text-secondary)" }}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all mt-2 cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: "#5C7A6B" }}
                >
                  Continue <ArrowRight size={15} />
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Practice & Preferences ────────────────────── */}
          {step === 2 && (
            <>
              <div className="text-center mb-7">
                <h1
                  className="text-xl font-bold"
                  style={{ color: "var(--color-auth-text)" }}
                >
                  Set up your practice
                </h1>
                <p
                  className="text-[13px] mt-1"
                  style={{ color: "var(--color-auth-text-secondary)" }}
                >
                  A few more details to personalise your experience
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 px-4 py-3 rounded-xl text-[13px]"
                  style={{
                    background: "rgba(192,112,90,0.08)",
                    border: "1px solid rgba(192,112,90,0.2)",
                    color: "#C0705A",
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-5">
                {/* Practice type */}
                <div>
                  <label
                    className={labelCls}
                    style={{ color: "var(--color-auth-text-secondary)" }}
                  >
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
                            background: selected
                              ? "rgba(92,122,107,0.06)"
                              : "var(--color-auth-input)",
                            borderColor: selected
                              ? "#5C7A6B"
                              : "var(--color-auth-input-border)",
                            borderWidth: selected ? 2 : 1,
                          }}
                        >
                          <Icon
                            size={20}
                            strokeWidth={1.5}
                            style={{
                              color: selected
                                ? "#5C7A6B"
                                : "var(--color-auth-text-muted)",
                              marginBottom: 6,
                            }}
                          />
                          <span
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--color-auth-text)" }}
                          >
                            {opt.label}
                          </span>
                          <span
                            className="text-[11px] mt-0.5"
                            style={{ color: "var(--color-auth-text-muted)" }}
                          >
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Team size — only for non-solo */}
                {orgType && orgType !== "solo" && (
                  <div>
                    <label
                      htmlFor="teamSize"
                      className={labelCls}
                      style={{ color: "var(--color-auth-text-secondary)" }}
                    >
                      How many practitioners?
                    </label>
                    <input
                      id="teamSize"
                      type="number"
                      min={2}
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      required
                      placeholder="e.g. 4"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* Org name — only for non-solo */}
                {orgType && orgType !== "solo" && (
                  <div>
                    <label
                      htmlFor="orgName"
                      className={labelCls}
                      style={{ color: "var(--color-auth-text-secondary)" }}
                    >
                      Organisation name
                    </label>
                    <input
                      id="orgName"
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                      placeholder="e.g. Mindful Wellness Clinic"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* Username / slug */}
                <div>
                  <label
                    htmlFor="username"
                    className={labelCls}
                    style={{ color: "var(--color-auth-text-secondary)" }}
                  >
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
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      required
                      placeholder="priya"
                      minLength={3}
                      className={inputCls}
                      style={{ ...inputStyle, paddingLeft: 96 }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                    {slugStatus === "idle" && (
                      <span style={{ color: "var(--color-auth-text-muted)" }}>
                        This will be your public booking page URL
                      </span>
                    )}
                    {slugStatus === "checking" && (
                      <span style={{ color: "var(--color-auth-text-muted)" }}>
                        Checking availability...
                      </span>
                    )}
                    {slugStatus === "available" && (
                      <span className="flex items-center gap-1" style={{ color: "#3D8B7A" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Available
                      </span>
                    )}
                    {slugStatus === "taken" && (
                      <span className="flex items-center gap-1" style={{ color: "#C0705A" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Not available
                      </span>
                    )}
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label
                    htmlFor="timezone"
                    className={labelCls}
                    style={{ color: "var(--color-auth-text-secondary)" }}
                  >
                    Timezone
                  </label>
                  <Select
                    id="timezone"
                    value={timezone}
                    onChange={setTimezone}
                    options={timezoneOptions}
                    placeholder="Select timezone"
                  />
                </div>

                {/* WhatsApp number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className={labelCls + " !mb-0"}
                      style={{ color: "var(--color-auth-text-secondary)" }}
                    >
                      WhatsApp number
                    </label>
                    <label
                      className="flex items-center gap-1.5 cursor-pointer select-none"
                      htmlFor="sameAsPhone"
                    >
                      <span
                        className="relative flex items-center justify-center w-4 h-4 rounded border transition-all"
                        style={{
                          background: sameAsPhone
                            ? "#5C7A6B"
                            : "var(--color-auth-input)",
                          borderColor: sameAsPhone
                            ? "#5C7A6B"
                            : "var(--color-auth-input-border)",
                        }}
                      >
                        {sameAsPhone && (
                          <Check size={10} color="white" strokeWidth={3} />
                        )}
                      </span>
                      <input
                        id="sameAsPhone"
                        type="checkbox"
                        className="sr-only"
                        checked={sameAsPhone}
                        onChange={(e) => handleSameAsPhone(e.target.checked)}
                      />
                      <span
                        className="text-[12px]"
                        style={{ color: "var(--color-auth-text-muted)" }}
                      >
                        Same as phone
                      </span>
                    </label>
                  </div>
                  <PhoneInput
                    countryCode={waCountryCode}
                    onCountryCodeChange={setWaCountryCode}
                    phone={waPhone}
                    onPhoneChange={setWaPhone}
                  />
                  <p
                    className="text-[11px] mt-1.5"
                    style={{ color: "var(--color-auth-text-muted)" }}
                  >
                    For receiving notifications — not shown on your public page
                  </p>
                </div>

                {/* Communication preferences */}
                <div>
                  <p
                    className={labelCls}
                    style={{ color: "var(--color-auth-text-secondary)" }}
                  >
                    Notification preferences
                  </p>
                  <div
                    className="rounded-xl border divide-y"
                    style={{
                      borderColor: "var(--color-auth-input-border)",
                      background: "var(--color-auth-input)",
                    }}
                  >
                    {[
                      {
                        id: "notif-wa",
                        label: "WhatsApp notifications",
                        checked: notifWhatsapp,
                        onChange: setNotifWhatsapp,
                      },
                      {
                        id: "notif-email",
                        label: "Email notifications",
                        checked: notifEmail,
                        onChange: setNotifEmail,
                      },
                      {
                        id: "notif-sms",
                        label: "SMS notifications",
                        checked: notifSms,
                        onChange: setNotifSms,
                      },
                    ].map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-4 py-3"
                        style={{
                          borderColor: "var(--color-auth-input-border)",
                          borderTopLeftRadius: idx === 0 ? 12 : 0,
                          borderTopRightRadius: idx === 0 ? 12 : 0,
                          borderBottomLeftRadius: idx === 2 ? 12 : 0,
                          borderBottomRightRadius: idx === 2 ? 12 : 0,
                        }}
                      >
                        <label
                          htmlFor={item.id}
                          className="text-[13px] cursor-pointer select-none"
                          style={{ color: "var(--color-auth-text)" }}
                        >
                          {item.label}
                        </label>
                        <Toggle
                          id={item.id}
                          checked={item.checked}
                          onChange={item.onChange}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    className="h-11 px-5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5"
                    style={{
                      border: "1px solid var(--color-auth-input-border)",
                      color: "var(--color-auth-text-secondary)",
                      background: "transparent",
                    }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all cursor-pointer"
                    style={{ background: "#5C7A6B" }}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center mb-7">
                <h1
                  className="text-xl font-bold"
                  style={{ color: "var(--color-auth-text)" }}
                >
                  Check your email
                </h1>
                <p
                  className="text-[13px] mt-1.5"
                  style={{ color: "var(--color-auth-text-secondary)" }}
                >
                  We sent a 6-digit code to
                  <br />
                  <span className="font-semibold" style={{ color: "var(--color-auth-text)" }}>
                    {email}
                  </span>
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 px-4 py-3 rounded-xl text-[13px]"
                  style={{
                    background: "rgba(229,57,53,0.08)",
                    border: "1px solid rgba(229,57,53,0.15)",
                    color: "#e55",
                  }}
                >
                  {error}
                </div>
              )}

              <div className="mb-6">
                <OTPInput
                  value={otp}
                  onChange={(v) => {
                    setOtp(v);
                    setOtpError(false);
                  }}
                  length={8}
                  error={otpError}
                  onComplete={(code) => handleVerifyOtp(code)}
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.length !== 8}
                className="w-full h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all cursor-pointer mb-4"
                style={{ background: "#5C7A6B" }}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>

              <div className="text-center text-[13px]" style={{ color: "var(--color-auth-text-muted)" }}>
                Didn&apos;t receive the code?{" "}
                {resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-semibold hover:underline underline-offset-2 cursor-pointer"
                    style={{ color: "#5C7A6B" }}
                  >
                    Resend code
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setOtpError(false);
                  setError(null);
                  setResendCooldown(0);
                }}
                className="mt-3 w-full text-[12px] font-medium transition-colors hover:underline"
                style={{ color: "var(--color-auth-text-muted)" }}
              >
                Use a different email
              </button>
            </>
          )}
        </div>

        <p
          className="text-sm text-center mt-6"
          style={{ color: "var(--color-auth-text-muted)" }}
        >
          Already have an account?{" "}
          <Link
            href="/login/therapist"
            className="font-semibold transition-colors hover:underline underline-offset-2"
            style={{ color: "#5C7A6B" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
