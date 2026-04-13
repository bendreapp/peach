"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClientInvitationDetail, useClaimClientInvitation } from "@/lib/api-hooks";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

interface PortalClaimPageProps {
  token: string;
}

export default function PortalClaimPage({ token }: PortalClaimPageProps) {
  const router = useRouter();

  const invitationQuery = useClientInvitationDetail(token);
  const claimMutation = useClaimClientInvitation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const invitation = invitationQuery.data as any;

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (invitationQuery.isLoading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#F4F1EC" }}
      >
        <div
          className="bg-white rounded-2xl border border-[#E5E0D8] p-8 w-full max-w-[400px] space-y-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#E5E0D8] animate-pulse" />
            <div className="h-5 w-48 bg-[#E5E0D8] rounded-lg animate-pulse" />
            <div className="h-3 w-36 bg-[#E5E0D8] rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-10 bg-[#E5E0D8] rounded-lg animate-pulse" />
            <div className="h-10 bg-[#E5E0D8] rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  // ── Invalid / expired / already claimed ──────────────────────────────
  if (invitationQuery.isError || !invitation) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#F4F1EC" }}
      >
        <div
          className="bg-white rounded-2xl border border-[#E5E0D8] p-8 w-full max-w-[400px] text-center space-y-4"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "#F9EDED" }}
          >
            <AlertCircle size={24} strokeWidth={1.5} style={{ color: "#C0705A" }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: "#1C1C1E" }}>
            Link unavailable
          </h2>
          <p className="text-sm" style={{ color: "#8A8480" }}>
            This portal invite link is no longer active, has expired, or has already been used.
          </p>
          <Link
            href="/login/client"
            className="inline-block mt-2 text-sm font-medium transition-colors"
            style={{ color: "#5C7A6B" }}
          >
            Sign in to your portal &rarr;
          </Link>
        </div>
      </main>
    );
  }

  // Already claimed — redirect to login
  if (!invitation.is_usable) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#F4F1EC" }}
      >
        <div
          className="bg-white rounded-2xl border border-[#E5E0D8] p-8 w-full max-w-[400px] text-center space-y-4"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "#EAF4F1" }}
          >
            <CheckCircle2 size={24} strokeWidth={1.5} style={{ color: "#3D8B7A" }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: "#1C1C1E" }}>
            Already set up
          </h2>
          <p className="text-sm" style={{ color: "#8A8480" }}>
            Your portal account has already been created. Sign in to continue.
          </p>
          <Link
            href="/login/client"
            className="block w-full py-2.5 rounded-lg text-sm font-semibold text-white text-center transition-all"
            style={{ background: "#5C7A6B" }}
          >
            Sign in to your portal
          </Link>
        </div>
      </main>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────
  if (success) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#F4F1EC" }}
      >
        <div
          className="bg-white rounded-2xl border border-[#E5E0D8] p-8 w-full max-w-[400px] text-center space-y-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "#EAF4F1" }}
          >
            <CheckCircle2 size={24} strokeWidth={1.5} style={{ color: "#3D8B7A" }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#1C1C1E" }}>
              You&apos;re all set, {invitation.client_full_name?.split(" ")[0]}!
            </h2>
            <p className="text-sm mt-2" style={{ color: "#8A8480" }}>
              Your portal account is ready. You can now view your upcoming sessions, resources, and intake forms.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/portal"
              className="block w-full py-2.5 rounded-lg text-sm font-semibold text-white text-center transition-all"
              style={{ background: "#5C7A6B" }}
            >
              Go to your portal
            </Link>
            {invitation.therapist_slug && (
              <Link
                href={`/booking/${invitation.therapist_slug}`}
                className="block w-full border py-2.5 rounded-lg text-sm font-semibold text-center transition-all"
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

  // ── Validation helpers ────────────────────────────────────────────────
  function validatePassword(value: string) {
    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
    } else {
      setPasswordError(null);
    }
  }

  function validateConfirm(value: string) {
    if (value && value !== password) {
      setConfirmError("Passwords don't match.");
    } else {
      setConfirmError(null);
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    // Final validation
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Create Supabase auth account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.client_email,
        password,
        options: {
          data: {
            full_name: invitation.client_full_name,
            user_type: "client",
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered") ||
            signUpError.message.toLowerCase().includes("already exists")) {
          setAuthError(
            "An account with this email already exists. Sign in to your portal instead."
          );
        } else {
          setAuthError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;

      // 2. Claim the invitation and link user_id to client record
      await claimMutation.mutateAsync({ token, userId });

      toast.success("Portal account created successfully!");
      setSuccess(true);

      // Auto-navigate after a short delay
      setTimeout(() => router.push("/portal"), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setAuthError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // ── Claim form ────────────────────────────────────────────────────────
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

        {/* Card */}
        <div
          className="bg-white rounded-2xl border p-8 space-y-6"
          style={{
            borderColor: "#E5E0D8",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {/* Therapist context */}
          <div className="text-center space-y-3">
            {invitation.therapist_avatar_url ? (
              <Image
                src={invitation.therapist_avatar_url}
                alt={invitation.therapist_name}
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
                <Image src={LOGO_URL} alt="Bendre" width={28} height={28} className="rounded-full" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}>
                Set up your portal
              </h1>
              <p className="text-sm mt-1" style={{ color: "#8A8480" }}>
                Invited by <strong style={{ color: "#5C5856" }}>{invitation.therapist_name}</strong>
              </p>
            </div>
          </div>

          {/* Pre-filled info */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: "#F4F1EC" }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: "#8A8480" }}>Name</span>
              <span className="font-medium" style={{ color: "#1C1C1E" }}>
                {invitation.client_full_name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#8A8480" }}>Email</span>
              <span className="font-medium truncate max-w-[200px]" style={{ color: "#1C1C1E" }}>
                {invitation.client_email}
              </span>
            </div>
          </div>

          {/* Error */}
          {authError && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(192,112,90,0.08)",
                border: "1px solid rgba(192,112,90,0.2)",
                color: "#C0705A",
              }}
            >
              {authError}
            </div>
          )}

          {/* Password form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: "#5C5856" }}
              >
                Choose a password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => validatePassword(e.target.value)}
                  required
                  placeholder="Min 8 characters"
                  className="w-full h-11 px-4 pr-10 rounded-lg text-sm transition-all focus:outline-none"
                  style={{
                    border: `1px solid ${passwordError ? "#C0705A" : "#E5E0D8"}`,
                    background: "#F8F6F2",
                    color: "#1C1C1E",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  tabIndex={-1}
                  style={{ color: "#8A8480" }}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs mt-1" style={{ color: "#C0705A" }}>
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: "#5C5856" }}
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={(e) => validateConfirm(e.target.value)}
                  required
                  placeholder="Re-enter your password"
                  className="w-full h-11 px-4 pr-10 rounded-lg text-sm transition-all focus:outline-none"
                  style={{
                    border: `1px solid ${confirmError ? "#C0705A" : "#E5E0D8"}`,
                    background: "#F8F6F2",
                    color: "#1C1C1E",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  tabIndex={-1}
                  style={{ color: "#8A8480" }}
                >
                  {showConfirm ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
              {confirmError && (
                <p className="text-xs mt-1" style={{ color: "#C0705A" }}>
                  {confirmError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-all active:scale-[0.97]"
              style={{ background: "#5C7A6B" }}
            >
              {loading ? "Creating your account..." : "Set up portal access"}
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
