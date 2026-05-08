"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalCancelSession, useRescheduleSession } from "@/lib/api-hooks";
import { toast } from "sonner";
import { X, Calendar, RefreshCw } from "lucide-react";

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
  reschedule_requested: { bg: "#FBF0E8", text: "#B5733A", label: "Reschedule requested" },
  completed: { bg: "#F0EFED", text: "#6B6460", label: "Completed" },
};

export default function UpcomingSessionsList({
  sessions,
  loading,
}: UpcomingSessionsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reschedulingSession, setReschedulingSession] = useState<Session | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ requested_date: "", requested_time: "", reason: "" });
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  const qc = useQueryClient();
  const cancelMutation = usePortalCancelSession();
  const rescheduleMutation = useRescheduleSession();

  function openReschedule(session: Session) {
    setReschedulingSession(session);
    setRescheduleForm({ requested_date: "", requested_time: "", reason: "" });
    setRescheduleSuccess(false);
  }

  function closeReschedule() {
    setReschedulingSession(null);
    setRescheduleSuccess(false);
  }

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
        <p className="text-xs mt-1" style={{ color: "#736E6A" }}>
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

          const canReschedule = session.status === "scheduled" || session.status === "pending_approval";

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
                  <span className="text-xs" style={{ color: "#736E6A" }}>
                    {time} IST
                  </span>
                  <span
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                    style={{ background: badge.bg, color: badge.text }}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs flex-wrap" style={{ color: "#736E6A" }}>
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
              <div className="flex items-center gap-2 shrink-0">
                {canReschedule && (
                  <button
                    type="button"
                    onClick={() => openReschedule(session)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    style={{ color: "#5C7A6B", background: "transparent", border: "1px solid #E5E0D8" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#EBF0EB";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <RefreshCw size={12} strokeWidth={1.5} />
                    <span className="hidden sm:inline">Reschedule</span>
                  </button>
                )}
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
                style={{ color: "#736E6A" }}
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

      {/* Reschedule modal */}
      {reschedulingSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(28,28,30,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReschedule();
          }}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-md space-y-5"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: "#1C1C1E" }}>
                Request a reschedule
              </h3>
              <button
                type="button"
                onClick={closeReschedule}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "#736E6A" }}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {rescheduleSuccess ? (
              <div className="text-center py-4 space-y-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: "#EAF4F1" }}
                >
                  <RefreshCw size={22} strokeWidth={1.5} style={{ color: "#3D8B7A" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>
                  Reschedule request sent
                </p>
                <p className="text-sm" style={{ color: "#736E6A", lineHeight: "1.6" }}>
                  {reschedulingSession.therapist_name} will confirm your new time.
                </p>
                <button
                  type="button"
                  onClick={closeReschedule}
                  className="mt-2 px-5 py-2 text-sm font-medium rounded-lg transition-all active:scale-[0.97]"
                  style={{ background: "#5C7A6B", color: "white" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Current session */}
                <div
                  className="rounded-xl p-3 text-sm"
                  style={{ background: "#F4F1EC" }}
                >
                  <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "#736E6A" }}>
                    Current session
                  </p>
                  <p className="font-semibold" style={{ color: "#1C1C1E" }}>
                    {formatDateTime(reschedulingSession.starts_at).date} &middot; {formatDateTime(reschedulingSession.starts_at).time} IST
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#736E6A" }}>
                    with {reschedulingSession.therapist_name}
                  </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "#5C5856" }}>
                      Preferred new date
                    </label>
                    <input
                      type="date"
                      value={rescheduleForm.requested_date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setRescheduleForm((f) => ({ ...f, requested_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                      style={{
                        border: "1.5px solid #E5E0D8",
                        color: "#1C1C1E",
                        background: "white",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#8FAF8A")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E0D8")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "#5C5856" }}>
                      Preferred time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3:00 PM"
                      value={rescheduleForm.requested_time}
                      onChange={(e) => setRescheduleForm((f) => ({ ...f, requested_time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                      style={{
                        border: "1.5px solid #E5E0D8",
                        color: "#1C1C1E",
                        background: "white",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#8FAF8A")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E0D8")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "#5C5856" }}>
                      Reason <span style={{ color: "#736E6A", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Let your therapist know why you need to reschedule..."
                      value={rescheduleForm.reason}
                      onChange={(e) => setRescheduleForm((f) => ({ ...f, reason: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all resize-none"
                      style={{
                        border: "1.5px solid #E5E0D8",
                        color: "#1C1C1E",
                        background: "white",
                        lineHeight: "1.6",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#8FAF8A")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E0D8")}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-1">
                  <button
                    type="button"
                    onClick={closeReschedule}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{ color: "#5C5856", border: "1px solid #E5E0D8" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={rescheduleMutation.isPending || !rescheduleForm.requested_date || !rescheduleForm.requested_time}
                    onClick={() =>
                      rescheduleMutation.mutate(
                        {
                          sessionId: reschedulingSession.id,
                          requested_date: rescheduleForm.requested_date,
                          requested_time: rescheduleForm.requested_time,
                          reason: rescheduleForm.reason || undefined,
                        },
                        {
                          onSuccess: () => {
                            setRescheduleSuccess(true);
                          },
                          onError: (err: Error) => {
                            toast.error(err.message || "Could not send reschedule request");
                          },
                        }
                      )
                    }
                    className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 active:scale-[0.97]"
                    style={{ background: "#5C7A6B" }}
                  >
                    {rescheduleMutation.isPending ? "Sending..." : "Send request"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
