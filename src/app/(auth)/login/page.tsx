"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Sun, Moon, ArrowRight } from "lucide-react";

function RoleCard({
  href,
  illustration,
  title,
  subtitle,
}: {
  href: string;
  illustration: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-6 px-7 py-6 rounded-[20px] border cursor-pointer transition-all duration-200"
      style={{
        background: "var(--color-auth-card)",
        borderColor: "var(--color-auth-card-border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(107,126,108,0.35)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(107,126,108,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-auth-card-border)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        className="w-[68px] h-[68px] rounded-[16px] flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(145deg, #EDF2EE, #E2EAE3)" }}
      >
        {illustration}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[18px] font-bold tracking-[-0.01em]" style={{ color: "var(--color-auth-text)" }}>
          {title}
        </div>
        <div className="text-[14px] mt-1 font-normal" style={{ color: "var(--color-auth-text-secondary)" }}>
          {subtitle}
        </div>
      </div>

      <ArrowRight
        size={18}
        strokeWidth={2}
        className="flex-shrink-0 opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-200"
        style={{ color: "var(--color-auth-text)" }}
      />
    </Link>
  );
}

const therapistSvg = (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="12" r="5" fill="#6B7E6C" opacity="0.8" />
    <path d="M8 30c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#6B7E6C" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M26 8l2 2-2 2" stroke="#8AA98B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="30" cy="10" r="3" stroke="#8AA98B" strokeWidth="1.5" fill="none" />
  </svg>
);

const clientSvg = (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
    <circle cx="14" cy="13" r="5" fill="#6B7E6C" opacity="0.7" />
    <circle cx="24" cy="11" r="3.5" fill="#8AA98B" opacity="0.6" />
    <path d="M6 30c0-4.97 3.58-9.1 8.3-9.9" stroke="#6B7E6C" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M20 28c0-3.866 2.239-7 5-7s5 3.134 5 7" stroke="#8AA98B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M18 18v4m-2-2h4" stroke="#8AA98B" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function LoginRolePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 relative"
      style={{ background: "var(--color-auth-bg)" }}
    >
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

      <div className="w-full max-w-[500px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-16">
          <Image src="/logo.png" alt="Bendre" width={38} height={36} style={{ width: "auto", height: "auto" }} />
          <span className="text-[23px] font-bold tracking-[-0.02em]" style={{ color: "var(--color-auth-text)" }}>
            Bendre
          </span>
        </div>

        {/* Heading */}
        <div className="text-center mb-12">
          <h1
            className="text-[36px] font-black tracking-[-0.03em] leading-none"
            style={{ color: "var(--color-auth-text)" }}
          >
            Welcome back
          </h1>
          <p className="text-[15px] mt-3 font-medium" style={{ color: "var(--color-auth-text-muted)" }}>
            Sign in as
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-3.5">
          <RoleCard
            href="/login/therapist"
            illustration={therapistSvg}
            title="Therapist"
            subtitle="I provide care to my clients"
          />
          <RoleCard
            href="/login/client"
            illustration={clientSvg}
            title="Client"
            subtitle="I receive care from my therapist"
          />
        </div>

        {/* Footer */}
        <p className="text-[14px] text-center mt-12 font-medium" style={{ color: "var(--color-auth-text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-bold hover:underline underline-offset-2" style={{ color: "#6B7E6C" }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
