"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  useSessionsToday,
  useSessionsPending,
  useClientsList,
  useTherapistMe,
  useAnalyticsOverview,
  useApproveSession,
  useRejectSession,
  useTherapistAvailability,
} from "@/lib/api-hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  CalendarDays,
  Users,
  ArrowRight,
  Video,
  FileText,
  TrendingUp,
  CalendarOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  Plus,
  UserPlus,
  Circle,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });
}

function getGreeting(): string {
  const istHour = parseInt(
    new Date().toLocaleString("en-IN", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }),
    10
  );
  if (istHour < 12) return "Good morning";
  if (istHour < 17) return "Good afternoon";
  return "Good evening";
}

function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

function getSessionStatusLabel(status: string): string {
  if (status === "scheduled") return "Confirmed";
  if (status === "completed") return "Completed";
  if (status === "pending_approval") return "Pending";
  if (status === "cancelled") return "Cancelled";
  return status;
}

// Deterministic color from name for avatar backgrounds
function getAvatarColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: "#EEF7F4", text: "#457A6C" },
    { bg: "#EBF0EB", text: "#5C7A6B" },
    { bg: "#FBF0E8", text: "#B5733A" },
    { bg: "#EAF4F1", text: "#3D8B7A" },
    { bg: "#F0F5EF", text: "#567252" },
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// ── Skeleton components ───────────────────────────────────────────────────────

function StatCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="rounded-card border border-[#E5E0D8] p-5"
      style={{
        background: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Icon circle skeleton */}
      <div className="shimmer w-9 h-9 rounded-full mb-4" />
      {/* Number skeleton */}
      <div className="shimmer h-7 w-14 mb-2" />
      {/* Label skeleton */}
      <div className="shimmer h-3 w-24" />
    </div>
  );
}

function SessionRowSkeleton() {
  return (
    <div className="px-5 flex items-center gap-4" style={{ height: "52px" }}>
      <div className="shimmer w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="shimmer h-3.5 w-32" />
        <div className="shimmer h-3 w-24" />
      </div>
      <div className="shimmer h-6 w-16 rounded-full" />
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; icon: ReactNode }> = {
    scheduled: {
      bg: "#EAF4F1",
      text: "#3D8B7A",
      icon: <CircleDot size={10} strokeWidth={1.5} />,
    },
    completed: {
      bg: "#EAF4F1",
      text: "#3D8B7A",
      icon: <CheckCircle2 size={10} strokeWidth={1.5} />,
    },
    pending_approval: {
      bg: "#FBF0E8",
      text: "#B5733A",
      icon: <AlertCircle size={10} strokeWidth={1.5} />,
    },
    cancelled: {
      bg: "#F9EDED",
      text: "#A0504A",
      icon: null,
    },
  };

  const style = map[status] ?? { bg: "#F0EFED", text: "#6B6460", icon: null };

  return (
    <span
      className="inline-flex items-center gap-1 font-medium"
      style={{
        background: style.bg,
        color: style.text,
        borderRadius: "999px",
        fontSize: "12px",
        padding: "3px 10px",
      }}
    >
      {style.icon}
      {getSessionStatusLabel(status)}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconColor,
  value,
  label,
  valueSize = "28px",
  pendingWarning = false,
  delay = 0,
  loading = false,
}: {
  icon: ReactNode;
  iconColor: string;
  value: ReactNode;
  label: string;
  valueSize?: string;
  pendingWarning?: boolean;
  delay?: number;
  loading?: boolean;
}) {
  // Icon bg: 6% opacity of the icon color
  const iconBg = `${iconColor}0F`;

  return (
    <div
      className="rounded-card border border-[#E5E0D8] p-5 flex flex-col gap-3 transition-all duration-150 ease-out cursor-default"
      style={{
        background: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        animation: `slideUp 300ms ease-out forwards`,
        animationDelay: `${delay}ms`,
        opacity: 0,
        borderLeft: pendingWarning ? "3px solid #D4956A" : undefined,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 12px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)";
      }}
    >
      {/* Icon circle */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: iconBg,
          color: iconColor,
        }}
      >
        {icon}
      </div>

      {/* Number + label */}
      <div>
        {loading ? (
          <div className="shimmer mb-2" style={{ height: "28px", width: "56px" }} />
        ) : (
          <div
            className="font-bold leading-none"
            data-stat
            style={{
              fontSize: valueSize,
              color: "#1C1C1E",
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </div>
        )}
        <div
          className="font-medium mt-1"
          style={{ fontSize: "13px", color: "#8A8480" }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Setup Checklist ───────────────────────────────────────────────────────────

interface ChecklistItem {
  label: string;
  done: boolean;
  href: string;
  hrefLabel: string;
}

function SetupChecklist({ items }: { items: ChecklistItem[] }) {
  const pending = items.filter((i) => !i.done);
  const completed = items.filter((i) => i.done).length;
  const total = items.length;

  if (pending.length === 0) return null;

  return (
    <div
      className="rounded-card overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E0D8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      {/* Two-tone header */}
      <div
        className="flex items-center justify-between"
        style={{
          background: "#FAFAF8",
          borderBottom: "1px solid #E5E0D8",
          padding: "14px 20px",
        }}
      >
        <h2 className="font-semibold" style={{ fontSize: "14px", color: "#1C1C1E" }}>
          Complete your setup
        </h2>
        <span
          className="font-medium"
          style={{ fontSize: "12px", color: "#8A8480" }}
        >
          {completed} of {total} complete
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-[#F0ECE6]">
        {pending.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 transition-colors duration-100"
            style={{ height: "48px", padding: "0 20px" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = "#F7F5F2")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = "")
            }
          >
            <Circle
              size={16}
              strokeWidth={1.5}
              style={{ color: "#C5BFB8", flexShrink: 0 }}
            />
            <span
              className="flex-1 font-medium"
              style={{ fontSize: "14px", color: "#5C5856" }}
            >
              {item.label}
            </span>
            <Link
              href={item.href}
              className="flex items-center gap-1 font-medium transition-colors duration-100 hover:opacity-80"
              style={{ fontSize: "13px", color: "#5C7A6B" }}
            >
              {item.hrefLabel}
              <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = useSessionsToday();
  const pending = useSessionsPending();
  const clients = useClientsList();
  const therapist = useTherapistMe();
  const analytics = useAnalyticsOverview();
  const availability = useTherapistAvailability();
  const sessionTypes = useQuery({
    queryKey: ["session-types", "list"],
    queryFn: () => api.sessionType.list(),
  });

  const approve = useApproveSession();
  const reject = useRejectSession();

  const todayCount = today.data?.length ?? 0;
  const pendingCount = pending.data?.length ?? 0;
  const clientCount = clients.data?.length ?? 0;
  const monthlyRevenue = (analytics.data as any)?.total_revenue_inr ?? 0;

  const greeting = getGreeting();
  const displayName =
    therapist.data?.display_name || therapist.data?.full_name || "";
  const firstName = displayName.split(" ")[0];

  const isLoading = today.isLoading;

  // ── Setup checklist items ──
  const checklistItems: ChecklistItem[] = [
    {
      label: "Add your bio",
      done: !!therapist.data?.bio,
      href: "/settings?tab=profile",
      hrefLabel: "Go to Profile",
    },
    {
      label: "Set your availability",
      done: Array.isArray(availability.data) && availability.data.length > 0,
      href: "/settings?tab=availability",
      hrefLabel: "Set availability",
    },
    {
      label: "Create session types",
      done: Array.isArray((sessionTypes.data as any[])) && (sessionTypes.data as any[]).length > 0,
      href: "/settings?tab=session-types",
      hrefLabel: "Add session type",
    },
    {
      label: "Write cancellation policy",
      done: !!therapist.data?.cancellation_policy,
      href: "/settings?tab=policies",
      hrefLabel: "Add policy",
    },
  ];

  // ── Skeleton state ──
  if (isLoading) {
    return (
      <div className="max-w-[1000px] mx-auto space-y-6 animate-fade-in">
        {/* Greeting skeleton */}
        <div>
          <div className="shimmer mb-2" style={{ height: "28px", width: "280px" }} />
          <div className="shimmer" style={{ height: "16px", width: "200px" }} />
          <div
            className="mt-6"
            style={{ borderBottom: "1px solid #E5E0D8" }}
          />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 60, 120, 180].map((delay, i) => (
            <StatCardSkeleton key={i} delay={delay} />
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sessions card skeleton */}
          <div
            className="flex-1 rounded-card border border-[#E5E0D8] overflow-hidden"
            style={{ background: "#FFFFFF" }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                background: "#FAFAF8",
                borderBottom: "1px solid #E5E0D8",
                padding: "16px 20px",
              }}
            >
              <div className="shimmer" style={{ height: "16px", width: "140px" }} />
              <div className="shimmer" style={{ height: "14px", width: "60px" }} />
            </div>
            {[1, 2, 3].map((i) => (
              <SessionRowSkeleton key={i} />
            ))}
          </div>

          {/* Quick actions skeleton */}
          <div
            className="lg:w-[280px] rounded-card border border-[#E5E0D8] p-5"
            style={{ background: "#FFFFFF" }}
          >
            <div className="shimmer mb-4" style={{ height: "16px", width: "100px" }} />
            <div className="space-y-3">
              <div className="shimmer" style={{ height: "38px", borderRadius: "8px" }} />
              <div className="shimmer" style={{ height: "38px", borderRadius: "8px" }} />
              <div className="shimmer" style={{ height: "38px", borderRadius: "8px" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 animate-fade-in">

      {/* ── Greeting ── */}
      <div>
        <h1
          className="font-bold"
          style={{
            fontSize: "24px",
            color: "#1C1C1E",
            lineHeight: "1.15",
            letterSpacing: "-0.02em",
          }}
        >
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p
          className="mt-1"
          style={{ fontSize: "14px", color: "#8A8480" }}
        >
          {formatTodayDate()}
          {" · "}
          {todayCount === 0
            ? "No sessions today"
            : `${todayCount} session${todayCount !== 1 ? "s" : ""} today`}
          {pendingCount > 0 && `, ${pendingCount} pending approval`}
        </p>
        <div
          className="mt-6"
          style={{ borderBottom: "1px solid #E5E0D8" }}
        />
      </div>

      {/* ── Setup checklist (shown while pending items exist) ── */}
      {!therapist.isLoading && !availability.isLoading && !sessionTypes.isLoading && (
        <SetupChecklist items={checklistItems} />
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CalendarDays size={18} strokeWidth={1.5} />}
          iconColor="#5C7A6B"
          value={todayCount}
          label="Today's sessions"
          valueSize="28px"
          delay={0}
        />
        <StatCard
          icon={<AlertCircle size={18} strokeWidth={1.5} />}
          iconColor="#D4956A"
          value={pendingCount}
          label="Pending approvals"
          valueSize="24px"
          pendingWarning={pendingCount > 0}
          delay={60}
        />
        <StatCard
          icon={<Users size={18} strokeWidth={1.5} />}
          iconColor="#8FAF8A"
          value={clientCount}
          label="Active clients"
          valueSize="28px"
          delay={120}
        />
        <StatCard
          icon={<TrendingUp size={18} strokeWidth={1.5} />}
          iconColor="#5C7A6B"
          value={analytics.isLoading ? null : formatINR(monthlyRevenue)}
          label="This month's revenue"
          valueSize="24px"
          delay={180}
          loading={analytics.isLoading}
        />
      </div>

      {/* ── Pending Approvals section (conditional) ── */}
      {pendingCount > 0 && (
        <div
          className="rounded-card overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            borderLeft: "3px solid #D4956A",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          {/* Two-tone header */}
          <div
            className="flex items-center gap-2"
            style={{
              background: "#FAFAF8",
              borderBottom: "1px solid #E5E0D8",
              padding: "16px 20px",
            }}
          >
            <AlertCircle size={14} strokeWidth={1.5} style={{ color: "#D4956A" }} />
            <h2
              className="font-semibold"
              style={{ fontSize: "14px", color: "#1C1C1E" }}
            >
              Pending Approvals
            </h2>
            <span
              className="ml-auto font-medium"
              style={{
                background: "#FBF0E8",
                color: "#B5733A",
                borderRadius: "999px",
                fontSize: "12px",
                padding: "2px 8px",
              }}
            >
              {pendingCount}
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#F0ECE6]">
            {pending.data?.map((session: any) => {
              const client = session.clients as {
                full_name: string;
                email: string | null;
                phone: string | null;
              } | null;
              const avatarColor = getAvatarColor(client?.full_name ?? "?");
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between transition-colors duration-100"
                  style={{ padding: "12px 20px", height: "52px" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background = "#F7F5F2")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background = "")
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        width: "36px",
                        height: "36px",
                        background: avatarColor.bg,
                      }}
                    >
                      <span
                        className="font-semibold"
                        style={{ fontSize: "13px", color: avatarColor.text }}
                      >
                        {client?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div>
                      <div
                        className="font-medium"
                        style={{ fontSize: "14px", color: "#1C1C1E" }}
                      >
                        {client?.full_name ?? "Unknown"}
                      </div>
                      <div
                        className="flex items-center gap-1 mt-0.5"
                        style={{ fontSize: "12px", color: "#8A8480" }}
                      >
                        <Clock size={11} strokeWidth={1.5} />
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

      {/* ── Row 2: Sessions (65%) + Quick Actions (35%) ── */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Today's Sessions — two-tone card */}
        <div
          className="flex-1 rounded-card overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          {/* Two-tone header */}
          <div
            className="flex items-center justify-between"
            style={{
              background: "#FAFAF8",
              borderBottom: "1px solid #E5E0D8",
              padding: "16px 20px",
            }}
          >
            <h2
              className="font-semibold"
              style={{ fontSize: "14px", color: "#1C1C1E" }}
            >
              Today&apos;s Sessions
            </h2>
            <Link
              href="/dashboard/schedule"
              className="flex items-center gap-1 font-medium transition-colors duration-100"
              style={{ fontSize: "13px", color: "#5C7A6B" }}
            >
              View all <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          </div>

          {/* Empty state */}
          {todayCount === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3"
              style={{ padding: "48px 20px" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#F4F1EC",
                }}
              >
                <CalendarOff
                  size={32}
                  strokeWidth={1.5}
                  style={{ color: "#C5BFB8" }}
                />
              </div>
              <div className="text-center">
                <p
                  className="font-medium"
                  style={{ fontSize: "16px", color: "#5C5856" }}
                >
                  No sessions today
                </p>
                <p className="mt-1" style={{ fontSize: "14px", color: "#8A8480" }}>
                  Enjoy your free day!
                </p>
              </div>
            </div>
          ) : (
            <div>
              {today.data?.map((session: any, idx: number) => {
                const client = session.clients as {
                  full_name: string;
                  email: string | null;
                  phone: string | null;
                } | null;
                const sessionType = session.session_types as {
                  name: string;
                } | null;
                const avatarColor = getAvatarColor(client?.full_name ?? "?");
                const isLast = idx === (today.data?.length ?? 0) - 1;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between transition-colors duration-100"
                    style={{
                      height: "52px",
                      padding: "12px 20px",
                      borderBottom: isLast ? "none" : "1px solid #F0ECE6",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background = "#F7F5F2")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background = "")
                    }
                  >
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          width: "36px",
                          height: "36px",
                          background: avatarColor.bg,
                        }}
                      >
                        <span
                          className="font-semibold"
                          style={{ fontSize: "13px", color: avatarColor.text }}
                        >
                          {client?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </span>
                      </div>

                      <div>
                        <div
                          className="font-medium"
                          style={{ fontSize: "14px", color: "#1C1C1E" }}
                        >
                          {client?.full_name ?? "Unknown"}
                        </div>
                        <div
                          className="flex items-center gap-1.5 mt-0.5"
                          style={{ fontSize: "12px", color: "#8A8480" }}
                        >
                          <Clock size={11} strokeWidth={1.5} />
                          <span>
                            {formatTime(session.starts_at)} &ndash;{" "}
                            {formatTime(session.ends_at)}
                          </span>
                          {sessionType?.name && (
                            <>
                              <span style={{ color: "#C5BFB8" }}>&middot;</span>
                              <span>{sessionType.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: status badge + actions */}
                    <div className="flex items-center gap-2">
                      <StatusBadge status={session.status} />

                      <Link
                        href={`/dashboard/notes/new?session_id=${session.id}`}
                        className="btn-ghost btn-sm"
                        title="Add note"
                      >
                        <FileText size={14} strokeWidth={1.5} />
                      </Link>

                      {session.zoom_join_url && (
                        <a
                          href={session.zoom_join_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary btn-sm flex items-center gap-1"
                        >
                          <Video size={13} strokeWidth={1.5} />
                          Join
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions — right column */}
        <div
          className="lg:w-[260px] rounded-card overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          {/* Two-tone header */}
          <div
            style={{
              background: "#FAFAF8",
              borderBottom: "1px solid #E5E0D8",
              padding: "16px 20px",
            }}
          >
            <h2
              className="font-semibold"
              style={{ fontSize: "14px", color: "#1C1C1E" }}
            >
              Quick Actions
            </h2>
          </div>

          <div className="p-4 flex flex-col gap-2.5">
            <Link
              href="/dashboard/schedule?new=true"
              className="btn-primary w-full flex items-center justify-center gap-2"
              style={{ height: "38px", fontSize: "14px" }}
            >
              <Plus size={15} strokeWidth={2} />
              New Session
            </Link>

            <Link
              href="/dashboard/clients/new"
              className="btn-secondary w-full flex items-center justify-center gap-2"
              style={{ height: "38px", fontSize: "14px" }}
            >
              <UserPlus size={15} strokeWidth={1.5} />
              Add Client
            </Link>

            <Link
              href="/dashboard/schedule"
              className="btn-ghost w-full flex items-center justify-center gap-2"
              style={{ height: "38px", fontSize: "14px" }}
            >
              <CalendarDays size={15} strokeWidth={1.5} />
              View Schedule
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
