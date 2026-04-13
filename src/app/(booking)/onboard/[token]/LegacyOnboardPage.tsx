"use client";

/**
 * Legacy onboarding page for client_onboarding_tokens (UUID-based tokens).
 * Used when a therapist shares a generic link (not a personal portal invite).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingByToken, useRegisterClient } from "@/lib/api-hooks";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

interface LegacyOnboardPageProps {
  token: string;
}

export default function LegacyOnboardPage({ token }: LegacyOnboardPageProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const tokenData = useOnboardingByToken(token);
  const registerClient = useRegisterClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create client record via onboarding endpoint
      await registerClient.mutateAsync({
        token,
        full_name: fullName,
        email,
        phone: phone || undefined,
      });

      // 2. Create Supabase auth account as client
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: "client",
            phone: phone || undefined,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }

    setLoading(false);
  }

  if (tokenData.isLoading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#F4F1EC" }}
      >
        <div
          className="bg-white p-8 rounded-2xl border border-[#E5E0D8] w-full max-w-[400px] space-y-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#E5E0D8] animate-pulse" />
            <div className="h-5 w-48 bg-[#E5E0D8] rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!tokenData.data || !tokenData.data.is_usable) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#F4F1EC" }}
      >
        <div
          className="bg-white p-8 rounded-2xl border border-[#E5E0D8] w-full max-w-[400px] text-center space-y-4"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "#F9EDED" }}
          >
            <AlertCircle size={24} strokeWidth={1.5} style={{ color: "#C0705A" }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: "#1C1C1E" }}>
            Link unavailable
          </h2>
          <p className="text-sm" style={{ color: "#8A8480" }}>
            This onboarding link is no longer active or has expired.
          </p>
        </div>
      </main>
    );
  }

  const t = tokenData.data;

  if (success) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#F4F1EC" }}
      >
        <div
          className="bg-white p-8 rounded-2xl border border-[#E5E0D8] w-full max-w-[400px] space-y-6 text-center"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "#EAF4F1" }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3D8B7A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#1C1C1E" }}>
              Welcome, {fullName.split(" ")[0]}!
            </h2>
            <p className="text-sm mt-2" style={{ color: "#8A8480" }}>
              Your account has been created. You can now view your sessions and intake forms.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/portal"
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white text-center transition-all"
              style={{ background: "#5C7A6B" }}
            >
              Go to your portal
            </Link>
            {t.therapist_slug && (
              <Link
                href={`/booking/${t.therapist_slug}`}
                className="w-full border py-2.5 rounded-lg text-sm font-semibold text-center transition-all"
                style={{ borderColor: "#E5E0D8", color: "#1C1C1E" }}
              >
                Book a session
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#F4F1EC" }}
    >
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Image src={LOGO_URL} alt="Bendre" width={40} height={40} className="rounded-full" />
          <span className="text-2xl font-bold tracking-tight" style={{ color: "#5C7A6B" }}>
            Bendre
          </span>
        </div>

        <div
          className="bg-white rounded-2xl border p-8 space-y-6"
          style={{
            borderColor: "#E5E0D8",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div className="text-center space-y-3">
            {t.therapist_avatar ? (
              <Image
                src={t.therapist_avatar}
                alt={t.therapist_name}
                width={56}
                height={56}
                className="rounded-full mx-auto ring-4 ring-white"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center ring-4 ring-white"
                style={{ background: "#EBF0EB", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
              >
                <Image
                  src={LOGO_URL}
                  alt="Bendre"
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}>
                Register with {t.therapist_name}
              </h1>
              <p className="text-sm mt-1" style={{ color: "#8A8480" }}>
                Create your account to get started
              </p>
              {t.label && (
                <p className="text-xs mt-1" style={{ color: "#8A8480" }}>
                  {t.label}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(192,112,90,0.08)",
                border: "1px solid rgba(192,112,90,0.2)",
                color: "#C0705A",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: "#5C5856" }}
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Your full name"
                className="w-full h-11 px-4 rounded-lg text-sm transition-all focus:outline-none"
                style={{ border: "1px solid #E5E0D8", background: "#F8F6F2", color: "#1C1C1E" }}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: "#5C5856" }}
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
                className="w-full h-11 px-4 rounded-lg text-sm transition-all focus:outline-none"
                style={{ border: "1px solid #E5E0D8", background: "#F8F6F2", color: "#1C1C1E" }}
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: "#5C5856" }}
              >
                Phone{" "}
                <span style={{ color: "#8A8480" }}>(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-11 px-4 rounded-lg text-sm transition-all focus:outline-none"
                style={{ border: "1px solid #E5E0D8", background: "#F8F6F2", color: "#1C1C1E" }}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: "#5C5856" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 characters"
                className="w-full h-11 px-4 rounded-lg text-sm transition-all focus:outline-none"
                style={{ border: "1px solid #E5E0D8", background: "#F8F6F2", color: "#1C1C1E" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-all active:scale-[0.97]"
              style={{ background: "#5C7A6B" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-sm text-center mt-6" style={{ color: "#8A8480" }}>
          Already have an account?{" "}
          <Link href="/login/client" className="font-medium" style={{ color: "#5C7A6B" }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
