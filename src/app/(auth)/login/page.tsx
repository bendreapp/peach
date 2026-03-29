"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Sun, Moon, Heart, Leaf, ArrowRight } from "lucide-react";

function RoleCard({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: typeof Leaf;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center text-center px-6 py-8 rounded-[20px] cursor-pointer transition-all duration-250 outline-none focus-visible:ring-2 focus-visible:ring-[#6B7E6C]/50 focus-visible:ring-offset-2"
      style={{
        background: "var(--color-auth-card)",
        border: "1px solid var(--color-auth-card-border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(107,126,108,0.12), 0 8px 32px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "rgba(107,126,108,0.3)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)";
        e.currentTarget.style.borderColor = "var(--color-auth-card-border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Icon */}
      <div
        className="w-[60px] h-[60px] rounded-[16px] flex items-center justify-center mb-5 transition-transform duration-250 group-hover:scale-110"
        style={{
          background: "linear-gradient(135deg, rgba(107,126,108,0.08), rgba(107,126,108,0.15))",
        }}
      >
        <Icon size={26} strokeWidth={1.5} style={{ color: "#6B7E6C" }} />
      </div>

      {/* Text */}
      <div className="text-[17px] font-semibold tracking-tight mb-1" style={{ color: "var(--color-auth-text)" }}>
        {title}
      </div>
      <div className="text-[13px] leading-relaxed mb-5" style={{ color: "var(--color-auth-text-secondary)" }}>
        {subtitle}
      </div>

      {/* CTA */}
      <div
        className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity duration-250"
        style={{ color: "#6B7E6C" }}
      >
        Continue
        <ArrowRight size={11} className="transition-transform duration-250 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

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
        className="absolute top-6 right-6 w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer"
        style={{
          border: "1px solid var(--color-auth-toggle-border)",
          color: "var(--color-auth-toggle-color)",
        }}
        title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-[460px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-12">
          <Image src="/logo.png" alt="Bendre" width={40} height={40} style={{ width: "auto", height: 40 }} />
          <span
            className="text-[24px] font-bold tracking-tight leading-none"
            style={{ color: "var(--color-auth-text)" }}
          >
            Bendre
          </span>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold tracking-tight leading-tight" style={{ color: "var(--color-auth-text)" }}>
            Welcome back
          </h1>
          <p className="text-[15px] mt-2.5 font-normal" style={{ color: "var(--color-auth-text-secondary)" }}>
            How would you like to sign in?
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-5">
          <RoleCard
            href="/login/therapist"
            icon={Leaf}
            title="Therapist"
            subtitle="I provide care"
          />
          <RoleCard
            href="/login/client"
            icon={Heart}
            title="Client"
            subtitle="I receive care"
          />
        </div>

        {/* Footer link */}
        <p className="text-[14px] text-center mt-12" style={{ color: "var(--color-auth-text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold transition-colors hover:underline underline-offset-2"
            style={{ color: "var(--color-sage)" }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
