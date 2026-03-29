"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInvitationByToken, useAcceptInvitation } from "@/lib/api-hooks";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Shield, ShieldAlert, XCircle } from "lucide-react";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setAuthEmail(data.user?.email ?? null);
      setAuthChecked(true);
    });
  }, []);

  const invitation = useInvitationByToken(token);

  const acceptInvitation = useAcceptInvitation();

  if (invitation.isLoading || !authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0B0B0B] px-4 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[480px] h-[480px] rounded-full bg-sage/[0.04] blur-[100px]" />
        </div>
        <div className="relative bg-[#1C1C1C] border border-[#2A2A2A] rounded-card p-8 max-w-md w-full space-y-6 shadow-2xl shadow-black/40">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#2A2A2A] animate-pulse" />
            <div className="h-5 w-48 bg-[#2A2A2A] rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-[#2A2A2A] rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!invitation.data || invitation.data.status !== "pending") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0B0B0B] px-4 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[480px] h-[480px] rounded-full bg-sage/[0.04] blur-[100px]" />
        </div>
        <div className="relative bg-[#1C1C1C] border border-[#2A2A2A] rounded-card p-8 max-w-md w-full space-y-4 text-center shadow-2xl shadow-black/40">
          <div className="w-14 h-14 rounded-full bg-[#2A2A2A] mx-auto flex items-center justify-center">
            <XCircle size={24} className="text-[#666]" />
          </div>
          <h2 className="text-lg font-semibold text-[#EAEAEA]">
            Invalid invitation
          </h2>
          <p className="text-sm text-[#A3A3A3]">
            This invitation link is invalid, expired, or has already been used.
          </p>
          <Link
            href="/login/therapist"
            className="inline-block text-sm text-sage font-medium hover:text-sage-dark transition-colors"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  const inv = invitation.data;
  const isExpired = new Date(inv.expires_at) < new Date();
  const RoleIcon = inv.role === "admin" ? ShieldAlert : Shield;

  if (isExpired) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0B0B0B] px-4 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[480px] h-[480px] rounded-full bg-sage/[0.04] blur-[100px]" />
        </div>
        <div className="relative bg-[#1C1C1C] border border-[#2A2A2A] rounded-card p-8 max-w-md w-full space-y-4 text-center shadow-2xl shadow-black/40">
          <h2 className="text-lg font-semibold text-[#EAEAEA]">
            Invitation expired
          </h2>
          <p className="text-sm text-[#A3A3A3]">
            This invitation has expired. Please ask the practice owner for a new link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B0B0B] px-4 relative overflow-hidden">
      {/* Subtle sage glow behind card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[480px] h-[480px] rounded-full bg-sage/[0.04] blur-[100px]" />
      </div>

      <div className="relative bg-[#1C1C1C] border border-[#2A2A2A] rounded-card p-8 max-w-md w-full space-y-6 shadow-2xl shadow-black/40">
        <div className="text-center space-y-4">
          <Image
            src="/logo.png"
            alt="Bendre"
            width={52}
            height={52}
            className="-mt-1 -mb-1 mx-auto"
          />
          <div>
            <h1 className="text-xl font-bold text-[#EAEAEA] tracking-tight">
              Join {inv.practice_name}
            </h1>
            <p className="text-sm text-[#A3A3A3] mt-1">
              You&apos;ve been invited to join as a team member.
            </p>
          </div>
        </div>

        {/* Invitation details */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-small p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
              <RoleIcon size={18} className="text-sage" />
            </div>
            <div>
              <div className="text-sm font-medium text-[#EAEAEA] capitalize">{inv.role}</div>
              <div className="text-xs text-[#A3A3A3]">
                {inv.can_view_notes ? "Can view client notes" : "No notes access"}
              </div>
            </div>
          </div>
        </div>

        {authEmail ? (
          <div className="space-y-4">
            <p className="text-sm text-[#A3A3A3] text-center">
              Logged in as <span className="font-medium text-[#EAEAEA]">{authEmail}</span>
            </p>

            {acceptInvitation.error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-small text-sm">
                {acceptInvitation.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                acceptInvitation.mutate(token, {
                  onSuccess: () => router.push("/dashboard/team"),
                })
              }
              disabled={acceptInvitation.isPending}
              className="w-full bg-sage text-white py-2.5 rounded-small text-sm font-semibold hover:bg-sage/90 transition-all disabled:opacity-50 shadow-lg shadow-sage/20"
            >
              {acceptInvitation.isPending ? "Joining..." : "Accept & Join"}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[#A3A3A3]">
              Sign in or create an account to accept this invitation.
            </p>
            <div className="flex gap-3">
              <Link
                href={`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                className="flex-1 bg-sage text-white py-2.5 rounded-small text-sm font-semibold hover:bg-sage/90 transition-all text-center shadow-lg shadow-sage/20"
              >
                Sign In
              </Link>
              <Link
                href={`/signup?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                className="flex-1 border border-[#2A2A2A] text-[#EAEAEA] py-2.5 rounded-small text-sm font-semibold hover:bg-[#222] hover:border-[#333] transition-all text-center"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
