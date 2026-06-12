"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, ShieldAlert, MailCheck, Copy, LogOut, RefreshCw, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePlanStatus } from "@/lib/api-hooks";

const SUPPORT_EMAIL = "hello@bendre.app";
const SUPPORT_UPI = process.env.NEXT_PUBLIC_BENDRE_UPI ?? "bendre@upi";

type Status = "pending" | "expired" | "suspended";

function copyForStatus(status: Status, expiresAt: string | null) {
  switch (status) {
    case "pending":
      return {
        icon: MailCheck,
        title: "Welcome to Bendre",
        body: (
          <>
            Thanks for signing up. Our team is reviewing your account and we'll
            email you when access is granted — usually within 24 hours.
          </>
        ),
        helper: (
          <>
            If you don't hear back within a business day, write to{" "}
            <a className="text-[#5C7A6B] hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </>
        ),
        showUpi: false,
      };
    case "suspended":
      return {
        icon: ShieldAlert,
        title: "Your account is suspended",
        body: (
          <>
            Access has been suspended. To discuss reinstatement, email{" "}
            <a className="text-[#5C7A6B] hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </>
        ),
        helper: null,
        showUpi: false,
      };
    case "expired":
    default:
      return {
        icon: Clock,
        title: "Your access has expired",
        body: (
          <>
            Your 30 days of Bendre access have ended
            {expiresAt ? ` on ${new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}.
            Pay any amount you owe via UPI and email us — we renew within an hour
            during business hours.
          </>
        ),
        helper: (
          <>
            Already paid? Tap <em>Refresh</em> below — we may have just activated you.
          </>
        ),
        showUpi: true,
      };
  }
}

function AccessLockedInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status") ?? "expired";
  const status: Status = ["pending", "expired", "suspended"].includes(rawStatus)
    ? (rawStatus as Status)
    : "expired";
  const expiresAt = searchParams.get("expires_at");

  const { icon: Icon, title, body, helper, showUpi } = copyForStatus(status, expiresAt);
  const [authChecked, setAuthChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const planStatus = usePlanStatus();

  // Guard: must be authenticated to see this page.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace("/login/therapist");
        return;
      }
      setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // If the admin activates the user while they're sitting on this screen, the
  // next refetch returns status="active" and we forward them to the dashboard
  // without making them reload.
  useEffect(() => {
    if (planStatus.data?.status === "active") {
      router.replace("/dashboard");
    }
  }, [planStatus.data?.status, router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login/therapist";
  }

  function handleRefresh() {
    planStatus.refetch();
  }

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(SUPPORT_UPI);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard may be unavailable; user can long-press the value.
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC]">
        <div className="text-sm text-[#736E6A]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#E8E4DC] p-8">
        <div className="w-12 h-12 rounded-full bg-[#EBF0EB] flex items-center justify-center mb-5">
          <Icon size={20} strokeWidth={1.6} className="text-[#5C7A6B]" />
        </div>
        <h1 className="text-xl font-bold text-[#1C1C1E] mb-2 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-[#5C5856] leading-relaxed">{body}</p>

        {showUpi && (
          <div className="mt-5 rounded-lg border border-[#E8E4DC] bg-[#FAFAF8] p-4">
            <p className="text-[11px] uppercase tracking-wider text-[#8A8480] font-semibold mb-2">
              UPI to renew
            </p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm font-mono text-[#1C1C1E]">{SUPPORT_UPI}</code>
              <button
                onClick={copyUpi}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C7A6B] hover:text-[#4A6557] transition-colors px-2 py-1 rounded-md hover:bg-white"
              >
                <Copy size={12} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[11px] text-[#736E6A] mt-3">
              Pay any amount, then email <a className="text-[#5C7A6B] hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with the UTR.
            </p>
          </div>
        )}

        {helper && (
          <p className="text-[12px] text-[#736E6A] mt-5 leading-relaxed">{helper}</p>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleRefresh}
            disabled={planStatus.isFetching}
            aria-label="Check if access has been granted"
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-[#5C7A6B] text-white hover:bg-[#4A6557] transition-colors h-11 rounded-lg disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7A6B] focus-visible:ring-offset-2"
          >
            {planStatus.isFetching ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw size={14} aria-hidden="true" />
            )}
            {planStatus.isFetching ? "Checking…" : "Refresh"}
          </button>
          <button
            onClick={handleLogout}
            aria-label="Log out and return to login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5C5856] hover:text-[#1C1C1E] transition-colors h-11 px-4 rounded-lg hover:bg-[#F4F1EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7A6B]"
          >
            <LogOut size={14} aria-hidden="true" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccessLockedPage() {
  return (
    <Suspense fallback={null}>
      <AccessLockedInner />
    </Suspense>
  );
}
