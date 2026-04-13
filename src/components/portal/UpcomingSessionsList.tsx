"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalCancelSession } from "@/lib/api-hooks";
import { toast } from "sonner";
import { X, Calendar } from "lucide-react";

interface Session {
  id: string;
  starts_at: string;
  ends_at: string;
  duration_mins: number;
  status: string;
  session_type_name: string | null;
  amount_inr: number | null;
  therapist_name: string;
}

interface UpcomingSessionsListProps {
  sessions: Session[];
  loading: boolean;
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  return { date, time };
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "#EAF4F1", text: "#3D8B7A", label: "Confirmed" },
  pending_approval: { bg: "#FBF0E8", text: "#B5733A", label: "Pending approval" },
  completed: { bg: "#F0EFED", text: "#6B6460", label: "Completed" },
};

export default function UpcomingSessionsList({
  sessions,
  loading,
}: UpcomingSessionsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const qc = useQueryClient();

  const cancelMutation = usePortalCancelSession();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E5E0D8] p-4 animate-pulse"
            style={{ background: "white" }}
          >
            <div className="h-4 bg-[#E5E0D8] rounded w-1/3 mb-2" />
            <div className="h-3 bg-[#E5E0D8] rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div
        className="rounded-xl border border-[#E5E0D8] p-8 text-center"
        style={{
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: "#F4F1EC" }}
        >
          <Calendar size={20} strokeWidth={1.5} style={{ color: "#C5BFB8" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "#5C5856" }}>
          No upcoming sessions
        </p>
        <p className="text-xs mt-1" style={{ color: "#8A8480" }}>
          Use the booking link shared by your therapist to schedule a session.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session) => {
          const { date, time } = formatDateTime(session.starts_at);
          const badge =
            STATUS_BADGE[session.status] ?? {
              bg: "#F0EFED",
              text: "#6B6460",
              label: session.status.replace(/_/g, " "),
            };

          return (
            <div
              key={session.id}
              className="rounded-xl border border-[#E5E0D8] p-4 flex items-center justify-between gap-4"
              style={{
                background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>
                    {date}
                  </span>
                  <span className="text-xs" style={{ color: "#8A8480" }}>
                    {time}
                  </span>
                  <span
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                    style={{ background: badge.bg, color: badge.text }}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs flex-wrap" style={{ color: "#8A8480" }}>
                  <span>with {session.therapist_name}</span>
                  {session.session_type_name && (
                    <>
                      <span>&middot;</span>
                      <span>{session.session_type_name}</span>
                    </>
                  )}
                  <span>&middot;</span>
                  <span>{session.duration_mins} min</span>
                  {session.amount_inr != null && session.amount_inr > 0 && (
                    <>
                      <span>&middot;</span>
                      <span>₹{(session.amount_inr / 100).toLocaleString("en-IN")}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setCancellingId(session.id)}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                  style={{ color: "#C0705A", background: "transparent" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#F9EDED";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel confirmation modal */}
      {cancellingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(28,28,30,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancellingId(null);
          }}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-4"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: "#1C1C1E" }}>
                Cancel session?
              </h3>
              <button
                type="button"
                onClick={() => setCancellingId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "#8A8480" }}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <p className="text-sm" style={{ color: "#5C5856", lineHeight: "1.6" }}>
              Are you sure? Late cancellations may be charged per your
              therapist&apos;s cancellation policy.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCancellingId(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ color: "#5C5856", border: "1px solid #E5E0D8" }}
              >
                Keep session
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() =>
                  cancelMutation.mutate(cancellingId, {
                    onSuccess: (data: any) => {
                      setCancellingId(null);
                      qc.invalidateQueries({
                        queryKey: ["portal", "sessions", "upcoming"],
                      });
                      qc.invalidateQueries({
                        queryKey: ["portal", "sessions", "past"],
                      });
                      if (data?.lateCancellation) {
                        toast.info(
                          "Session cancelled. This is a late cancellation and may be charged per your therapist's policy."
                        );
                      } else {
                        toast.success("Session cancelled.");
                      }
                    },
                    onError: (err: Error) => {
                      toast.error(err.message || "Failed to cancel session");
                    },
                  })
                }
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 active:scale-[0.97]"
                style={{ background: "#C0705A" }}
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
