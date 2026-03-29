"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Sun, Moon, Stethoscope, User } from "lucide-react";

export default function LoginRolePicker() {
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

      <div className="w-full max-w-[420px]">
        {/* Logo + brand */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <Image src="/logo.png" alt="Bendre" width={52} height={52} />
          <span
            className="text-[28px] font-bold tracking-tight leading-none"
            style={{ color: "var(--color-auth-text)" }}
          >
            Bendre
          </span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold" style={{ color: "var(--color-auth-text)" }}>
            Welcome back
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--color-auth-text-secondary)" }}>
            Sign in to continue
          </p>
        </div>

        {/* Role cards */}
        <div className="space-y-3">
          <Link
            href="/login/therapist"
            className="flex items-center gap-4 p-5 rounded-2xl border transition-all hover:shadow-md"
            style={{
              background: "var(--color-auth-card)",
              borderColor: "var(--color-auth-card-border)",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(107,126,108,0.1)" }}
            >
              <Stethoscope size={26} style={{ color: "#6B7E6C" }} />
            </div>
            <div>
              <div className="text-[16px] font-semibold" style={{ color: "var(--color-auth-text)" }}>
                Therapist
              </div>
              <div className="text-[13px] mt-0.5" style={{ color: "var(--color-auth-text-secondary)" }}>
                I provide care
              </div>
            </div>
          </Link>

          <Link
            href="/login/client"
            className="flex items-center gap-4 p-5 rounded-2xl border transition-all hover:shadow-md"
            style={{
              background: "var(--color-auth-card)",
              borderColor: "var(--color-auth-card-border)",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(107,126,108,0.1)" }}
            >
              <User size={26} style={{ color: "#6B7E6C" }} />
            </div>
            <div>
              <div className="text-[16px] font-semibold" style={{ color: "var(--color-auth-text)" }}>
                Client
              </div>
              <div className="text-[13px] mt-0.5" style={{ color: "var(--color-auth-text-secondary)" }}>
                I receive care
              </div>
            </div>
          </Link>
        </div>

        <p className="text-sm text-center mt-8" style={{ color: "var(--color-auth-text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium transition-colors" style={{ color: "var(--color-sage)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
