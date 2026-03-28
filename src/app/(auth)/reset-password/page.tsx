"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sun, Moon } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      router.push("/login?reset=success");
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--color-auth-input)",
    border: "1px solid var(--color-auth-input-border)",
    color: "var(--color-auth-input-text)",
  };

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
              Set New Password
            </h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--color-auth-text-secondary)" }}>
              Choose a new password for your account
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 px-4 py-3 rounded-lg text-[13px]" style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.15)", color: "#e55" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--color-auth-text-secondary)" }}>
                New Password
              </label>
              <input
                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 characters"
                className="w-full h-11 px-4 rounded-lg text-sm transition-all focus:outline-none focus:border-[#6B7E6C] focus:ring-2 focus:ring-[#6B7E6C]/15"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--color-auth-text-secondary)" }}>
                Confirm Password
              </label>
              <input
                id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter your password"
                className="w-full h-11 px-4 rounded-lg text-sm transition-all focus:outline-none focus:border-[#6B7E6C] focus:ring-2 focus:ring-[#6B7E6C]/15"
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-all"
              style={{ background: "var(--color-sage)" }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
