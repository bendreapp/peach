"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Sun, Moon, ShieldCheck } from "lucide-react";

export default function ClientSignupInfoPage() {
  const { theme, setTheme } = useTheme();

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-12 relative transition-colors duration-300"
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

      <div className="w-full max-w-[420px] text-center">
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
          className="rounded-2xl border p-10 transition-colors duration-300"
          style={{
            background: "var(--color-auth-card)",
            borderColor: "var(--color-auth-card-border)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: "rgba(107,126,108,0.1)" }}
          >
            <ShieldCheck size={28} style={{ color: "var(--color-sage)" }} />
          </div>

          <h1
            className="text-xl font-bold mb-3"
            style={{ color: "var(--color-auth-text)" }}
          >
            Client accounts are invite-only
          </h1>

          <p
            className="text-[14px] leading-relaxed"
            style={{ color: "var(--color-auth-text-secondary)" }}
          >
            Your therapist will send you an invite link to create your portal
            account.
          </p>
        </div>

        <p
          className="text-sm mt-8"
          style={{ color: "var(--color-auth-text-muted)" }}
        >
          Already have an account?{" "}
          <Link
            href="/login/client"
            className="font-medium transition-colors"
            style={{ color: "var(--color-sage)" }}
          >
            Sign in
          </Link>
        </p>

        <p
          className="text-xs mt-3"
          style={{ color: "var(--color-auth-text-muted)" }}
        >
          Are you a therapist?{" "}
          <Link
            href="/signup/therapist"
            className="font-medium transition-colors"
            style={{ color: "var(--color-sage)" }}
          >
            Sign up here
          </Link>
        </p>
      </div>
    </main>
  );
}
