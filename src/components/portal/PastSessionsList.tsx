"use client";

import { Calendar } from "lucide-react";

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

interface PastSessionsListProps {
  sessions: Session[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: "#EAF4F1", text: "#3D8B7A", label: "Completed" },
  cancelled: { bg: "#F9EDED", text: "#A0504A", label: "Cancelled" },
  no_show: { bg: "#F0EFED", text: "#6B6460", label: "No show" },
};

export default function PastSessionsList({
  sessions,
  hasMore,
  loading,
  onLoadMore,
}: PastSessionsListProps) {
  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E5E0D8] px-4 py-3 flex items-center justify-between gap-4 animate-pulse"
            style={{ background: "white" }}
          >
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-[#E5E0D8] rounded w-1/3" />
              <div className="h-3 bg-[#E5E0D8] rounded w-1/2" />
            </div>
            <div className="h-5 bg-[#E5E0D8] rounded-full w-20" />
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
          No past sessions
        </p>
        <p className="text-xs mt-1" style={{ color: "#8A8480" }}>
          Your completed sessions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const badge = STATUS_BADGE[session.status] ?? {
          bg: "#F0EFED",
          text: "#6B6460",
          label: session.status.replace(/_/g, " "),
        };

        return (
          <div
            key={session.id}
            className="rounded-xl border border-[#E5E0D8] px-4 py-3 flex items-center justify-between gap-4"
            style={{
              background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: "#8A8480" }}>
                  {formatDate(session.starts_at)}
                </span>
                <span className="font-medium truncate" style={{ color: "#1C1C1E" }}>
                  {session.session_type_name ?? "Session"}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#8A8480" }}>
                with {session.therapist_name}
                {session.duration_mins && ` · ${session.duration_mins} min`}
                {session.amount_inr != null && session.amount_inr > 0 && (
                  <> · ₹{(session.amount_inr / 100).toLocaleString("en-IN")}</>
                )}
              </p>
            </div>
            <span
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
              style={{ background: badge.bg, color: badge.text }}
            >
              {badge.label}
            </span>
          </div>
        );
      })}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="w-full text-center py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          style={{ color: "#5C7A6B" }}
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
