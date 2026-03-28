"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSessionsToday,
  useSessionsUpcoming,
  useSessionsPending,
  useClientsList,
  useTherapistMe,
  useApproveSession,
  useRejectSession,
} from "@/lib/api-hooks";
import {
  Clock,
  CalendarDays,
  Users,
  ArrowRight,
  Video,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  FileText,
  TrendingUp,
  CalendarCheck,
} from "lucide-react";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function TodayPage() {
  const today = useSessionsToday();
  const upcoming = useSessionsUpcoming();
  const pending = useSessionsPending();
  const clients = useClientsList();
  const therapist = useTherapistMe();
  const qc = useQueryClient();

  const approve = useApproveSession();
  const reject = useRejectSession();

  const todayCount = today.data?.length ?? 0;
  const pendingCount = pending.data?.length ?? 0;
  const upcomingCount = upcoming.data?.length ?? 0;
  const clientCount = clients.data?.length ?? 0;
  const greeting = getGreeting();
  const displayName =
    therapist.data?.display_name || therapist.data?.full_name || "";

  if (today.isLoading) {
    return (
      <div className="max-w-4xl space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-border rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-border rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-surface rounded-card border border-border animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 bg-surface rounded-card border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">
          {greeting}
          {displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="text-sm text-ink-secondary mt-1 flex items-center gap-2">
          <span>{formatTodayDate()}</span>
          <span className="text-ink-tertiary">&middot;</span>
          <span>
            {todayCount === 0
              ? "No sessions today"
              : `${todayCount} session${todayCount !== 1 ? "s" : ""} today`}
          </span>
        </p>
      </div>

      {/* Stat cards — 4 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's sessions */}
        <div className="ui-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-small bg-sage-bg flex items-center justify-center">
              <Clock size={18} className="text-sage" />
            </div>
            {todayCount > 0 && (
              <span className="badge badge-sage">
                <CircleDot size={10} className="mr-1" />
                Live
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-ink">{todayCount}</div>
          <div className="text-xs text-ink-secondary mt-0.5">
            Today&apos;s sessions
          </div>
        </div>

        {/* Pending approval */}
        <div className="ui-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-small bg-warning-bg flex items-center justify-center">
              <AlertCircle size={18} className="text-warning" />
            </div>
            {pendingCount > 0 && (
              <span className="badge badge-warning">
                <TrendingUp size={10} className="mr-1" />
                {pendingCount}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-ink">{pendingCount}</div>
          <div className="text-xs text-ink-secondary mt-0.5">
            Pending approval
          </div>
        </div>

        {/* This week's sessions (upcoming) */}
        <div className="ui-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-small bg-info-bg flex items-center justify-center">
              <CalendarCheck size={18} className="text-info" />
            </div>
          </div>
          <div className="text-2xl font-bold text-ink">{upcomingCount}</div>
          <div className="text-xs text-ink-secondary mt-0.5">
            This week&apos;s sessions
          </div>
        </div>

        {/* Active clients */}
        <div className="ui-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-small bg-success-bg flex items-center justify-center">
              <Users size={18} className="text-success" />
            </div>
          </div>
          <div className="text-2xl font-bold text-ink">{clientCount}</div>
          <div className="text-xs text-ink-secondary mt-0.5">
            Active clients
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingCount > 0 && (
        <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <AlertCircle size={16} className="text-warning" />
            <h2 className="text-sm font-semibold text-ink">
              {pendingCount} Pending Request
              {pendingCount !== 1 ? "s" : ""}
            </h2>
          </div>
          <div className="divide-y divide-border">
            {pending.data?.map((session: any) => {
              const client = session.clients as {
                full_name: string;
                email: string | null;
                phone: string | null;
              } | null;
              return (
                <div
                  key={session.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-warning-bg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-warning">
                        {client?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {client?.full_name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-ink-secondary flex items-center gap-1">
                        <CalendarDays size={11} />
                        {formatDate(session.starts_at)} &middot;{" "}
                        {formatTime(session.starts_at)} &ndash;{" "}
                        {formatTime(session.ends_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approve.mutate(session.id)}
                      disabled={approve.isPending}
                      className="btn-primary btn-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Decline this booking request?")) {
                          reject.mutate(session.id);
                        }
                      }}
                      disabled={reject.isPending}
                      className="btn-danger btn-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's sessions */}
      <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-ink-secondary" />
            <h2 className="text-sm font-semibold text-ink">
              Today&apos;s Sessions
            </h2>
          </div>
          <Link
            href="/dashboard/schedule"
            className="btn-ghost btn-sm flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {todayCount === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-sage-bg mx-auto mb-3 flex items-center justify-center">
              <Clock size={20} className="text-sage" />
            </div>
            <p className="text-sm font-medium text-ink-secondary">
              No sessions today
            </p>
            <p className="text-xs text-ink-tertiary mt-1">
              Enjoy your free day!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {today.data?.map((session: any) => {
              const client = session.clients as {
                full_name: string;
                email: string | null;
                phone: string | null;
              } | null;
              return (
                <div
                  key={session.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-sage-bg/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-sage-dark">
                        {client?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {client?.full_name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-ink-secondary flex items-center gap-1.5">
                        <Clock size={11} />
                        {formatTime(session.starts_at)} &ndash;{" "}
                        {formatTime(session.ends_at)} &middot;{" "}
                        {session.duration_mins} min
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/notes/new?session_id=${session.id}`}
                      className="btn-ghost btn-sm"
                      title="Add note"
                    >
                      <FileText size={14} />
                    </Link>
                    {session.zoom_join_url && (
                      <a
                        href={session.zoom_join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary btn-sm flex items-center gap-1"
                      >
                        <Video size={13} />
                        Join
                      </a>
                    )}
                    <span
                      className={`badge ${
                        session.status === "scheduled"
                          ? "badge-sage"
                          : session.status === "completed"
                            ? "badge-success"
                            : "badge-warning"
                      }`}
                    >
                      {session.status === "scheduled" && (
                        <CircleDot size={10} className="mr-1" />
                      )}
                      {session.status === "completed" && (
                        <CheckCircle2 size={10} className="mr-1" />
                      )}
                      {session.status === "pending_approval" && (
                        <AlertCircle size={10} className="mr-1" />
                      )}
                      {session.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming sessions */}
      {upcomingCount > 0 && (
        <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <CalendarDays size={15} className="text-ink-secondary" />
            <h2 className="text-sm font-semibold text-ink">Upcoming</h2>
          </div>
          <div className="divide-y divide-border">
            {upcoming.data?.map((session: any) => {
              const client = session.clients as {
                full_name: string;
                email: string | null;
                phone: string | null;
              } | null;
              return (
                <div
                  key={session.id}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-sage-bg/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sage-bg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-sage-dark">
                        {client?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {client?.full_name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-ink-secondary flex items-center gap-1">
                        <CalendarDays size={11} />
                        {formatDate(session.starts_at)} &middot;{" "}
                        {formatTime(session.starts_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-ink-secondary flex items-center gap-1">
                    <Clock size={11} />
                    {session.duration_mins} min
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
