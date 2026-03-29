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
  const [googleLoading, setGoogleLoading] = useState(false);
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
      setError(authError.message);
      setLoading(false);
      return;
    }

    posthog.capture("login_completed", { method: "email" });
    router.push(redirect);
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });

    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
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

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg border text-sm font-medium disabled:opacity-50 transition-all"
            style={{
              background: "var(--color-auth-input)",
              borderColor: "var(--color-auth-input-border)",
              color: "var(--color-auth-text)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: "var(--color-auth-divider)" }} />
            <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--color-auth-text-muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-auth-divider)" }} />
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
              disabled={loading || googleLoading}
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
