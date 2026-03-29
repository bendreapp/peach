"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Sun, Moon, Heart, Leaf, ArrowRight } from "lucide-react";

export default function SignupRolePicker() {
  const { theme, setTheme } = useTheme();

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

      <div className="w-full max-w-[440px]">
        {/* Logo + brand */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Image src="/logo.png" alt="Bendre" width={44} height={44} />
          <span
            className="text-[26px] font-bold tracking-tight leading-none"
            style={{ color: "var(--color-auth-text)" }}
          >
            Bendre
          </span>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-auth-text)" }}>
            Get started
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-auth-text-secondary)" }}>
            Create your account
          </p>
        </div>

        {/* Role cards — side by side on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/signup/therapist"
            className="group relative flex flex-col items-center text-center p-7 rounded-2xl border transition-all duration-200 hover:border-[#6B7E6C]/40 hover:shadow-lg hover:-translate-y-0.5"
            style={{
              background: "var(--color-auth-card)",
              borderColor: "var(--color-auth-card-border)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105"
              style={{ background: "rgba(107,126,108,0.08)" }}
            >
              <Leaf size={28} strokeWidth={1.5} style={{ color: "#6B7E6C" }} />
            </div>
            <div className="text-[17px] font-semibold mb-1" style={{ color: "var(--color-auth-text)" }}>
              Therapist
            </div>
            <div className="text-[13px] leading-relaxed" style={{ color: "var(--color-auth-text-secondary)" }}>
              I provide care
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: "#6B7E6C" }}>
              Continue <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </Link>

          <Link
            href="/signup/client"
            className="group relative flex flex-col items-center text-center p-7 rounded-2xl border transition-all duration-200 hover:border-[#6B7E6C]/40 hover:shadow-lg hover:-translate-y-0.5"
            style={{
              background: "var(--color-auth-card)",
              borderColor: "var(--color-auth-card-border)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105"
              style={{ background: "rgba(107,126,108,0.08)" }}
            >
              <Heart size={28} strokeWidth={1.5} style={{ color: "#6B7E6C" }} />
            </div>
            <div className="text-[17px] font-semibold mb-1" style={{ color: "var(--color-auth-text)" }}>
              Client
            </div>
            <div className="text-[13px] leading-relaxed" style={{ color: "var(--color-auth-text-secondary)" }}>
              I receive care
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: "#6B7E6C" }}>
              Continue <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>

        <p className="text-sm text-center mt-10" style={{ color: "var(--color-auth-text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium transition-colors hover:underline" style={{ color: "var(--color-sage)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
