"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Sun, Moon } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

// ── Google button ─────────────────────────────────────────────────────────────

function GoogleButton({ redirect }: { redirect: string }) {
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth/callback${redirect !== "/dashboard" ? `?next=${encodeURIComponent(redirect)}` : ""}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setLoading(false);
    }
    // On success the browser is redirected to Google — no further action needed here.
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full h-11 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2.5"
      style={{
        background: "var(--color-auth-input)",
        border: "1px solid var(--color-auth-input-border)",
        color: "var(--color-auth-text)",
      }}
    >
      {/* Google logo */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M17.64 9.2045c0-.638-.0573-1.252-.1636-1.8409H9v3.4814h4.8436c-.2086 1.1254-.8427 2.0791-1.7959 2.7191v2.2582h2.9086C16.6582 14.2523 17.64 11.9454 17.64 9.2045z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1818l-2.9086-2.2582c-.8059.54-1.8368.8591-3.0478.8591-2.3436 0-4.3282-1.5832-5.036-3.7096H.9573v2.3318C2.4382 15.9836 5.4818 18 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9573A8.9961 8.9961 0 0 0 0 9c0 1.4523.3477 2.8254.9573 4.0418L3.964 10.71z" fill="#FBBC05"/>
        <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5818-2.5818C13.4627.8918 11.4255 0 9 0 5.4818 0 2.4382 2.0164.9573 4.9582L3.964 7.29C4.6718 5.1636 6.6564 3.5795 9 3.5795z" fill="#EA4335"/>
      </svg>
      {loading ? "Redirecting..." : "Continue with Google"}
    </button>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const redirect =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.includes("//")
      ? rawRedirect
      : "/dashboard";
  const oauthError = searchParams.get("error") === "oauth";
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    oauthError ? "OAuth sign-in failed. Please try again." : null
  );
  const [loading, setLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const msg = authError.message?.toLowerCase() || "";
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        setError("Your email hasn't been verified yet. Please check your inbox for the verification code, or sign up again to resend it.");
      } else if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
        setError("Invalid email or password. Please check and try again.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    posthog.capture("login_completed", { method: "email" });
    router.push(redirect);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 relative transition-colors duration-300"
      style={{ background: "var(--color-auth-bg)" }}
    >
      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 w-9 h-9 rounded-lg flex items-center justify-center transition-all"
        style={{
          border: "1px solid var(--color-auth-toggle-border)",
          color: "var(--color-auth-toggle-color)",
        }}
        title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-[380px]">
        {/* Logo + brand */}
        <div className="flex items-center justify-center gap-1.5 mb-10">
          <Image src="/logo.png" alt="Bendre" width={52} height={52} />
          <span
            className="text-[28px] font-bold tracking-tight leading-none"
            style={{ color: "var(--color-auth-text)" }}
          >
            Bendre
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8 transition-colors duration-300"
          style={{
            background: "var(--color-auth-card)",
            borderColor: "var(--color-auth-card-border)",
          }}
        >
          <div className="text-center mb-7">
            <h1 className="text-xl font-bold" style={{ color: "var(--color-auth-text)" }}>
              Welcome back
            </h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--color-auth-text-secondary)" }}>
              Sign in to your practice dashboard
            </p>
          </div>

          {resetSuccess && (
            <div className="mb-5 px-4 py-3 rounded-lg text-[13px]" style={{ background: "rgba(52,168,83,0.08)", border: "1px solid rgba(52,168,83,0.15)", color: "#5cb85c" }}>
              Password updated. Please log in.
            </div>
          )}
          {error && (
            <div role="alert" className="mb-5 px-4 py-3 rounded-lg text-[13px]" style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.15)", color: "#e55" }}>
              {error}
            </div>
          )}

          {/* Google OAuth */}
          <GoogleButton redirect={redirect} />

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--color-auth-card-border)" }} />
            <span className="text-[12px]" style={{ color: "var(--color-auth-text-muted)" }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-auth-card-border)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--color-auth-text-secondary)" }}>
                Email
              </label>
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-lg text-sm transition-all focus:outline-none focus:border-[#6B7E6C] focus:ring-2 focus:ring-[#6B7E6C]/15"
                style={{
                  background: "var(--color-auth-input)",
                  border: "1px solid var(--color-auth-input-border)",
                  color: "var(--color-auth-input-text)",
                }}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--color-auth-text-secondary)" }}>
                Password
              </label>
              <input
                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full h-11 px-4 rounded-lg text-sm transition-all focus:outline-none focus:border-[#6B7E6C] focus:ring-2 focus:ring-[#6B7E6C]/15"
                style={{
                  background: "var(--color-auth-input)",
                  border: "1px solid var(--color-auth-input-border)",
                  color: "var(--color-auth-input-text)",
                }}
              />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-[13px] transition-colors" style={{ color: "var(--color-sage)" }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-all"
              style={{ background: "var(--color-sage)" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-sm text-center mt-6" style={{ color: "var(--color-auth-text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup/therapist" className="font-medium transition-colors" style={{ color: "var(--color-sage)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
