"use client";

import { useMemo } from "react";
import {
  getMonthGrid,
  isSameISTDay,
  toISTDateString,
  getISTMonth,
} from "@/lib/date-utils";

interface SessionData {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  session_type_name: string | null;
  client_name?: string;
  clients?: { full_name: string; email: string; phone: string | null };
}

interface BlockedSlotData {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
}

interface MonthViewProps {
  monthDate: Date;
  sessions: SessionData[];
  blockedSlots: BlockedSlotData[];
  isLoading: boolean;
  onDayClick: (day: Date) => void;
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Session type → dot color
function getSessionDotColor(typeName: string | null): string {
  const name = (typeName ?? "").toLowerCase();
  if (name.includes("online") || name.includes("video") || name.includes("virtual") || name.includes("tele")) {
    return "#7BAF9E";
  }
  if (name.includes("group") || name.includes("family") || name.includes("couple") || name.includes("workshop")) {
    return "#D4956A";
  }
  return "#5C7A6B";
}

// Status-based fallback dot color
const STATUS_DOT_COLOR: Record<string, string> = {
  pending_approval: "#D4956A",
  scheduled: "#5C7A6B",
  completed: "#C8C0B8",
  cancelled: "#E8AFA3",
  no_show: "#C0705A",
};

function getDotColor(session: SessionData): string {
  if (session.session_type_name) return getSessionDotColor(session.session_type_name);
  return STATUS_DOT_COLOR[session.status] ?? "#5C7A6B";
}

export default function MonthView({
  monthDate,
  sessions,
  blockedSlots,
  isLoading,
  onDayClick,
}: MonthViewProps) {
  const grid = useMemo(() => getMonthGrid(monthDate), [monthDate]);
  const currentMonth = getISTMonth(monthDate);
  const todayStr = toISTDateString(new Date());

  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionData[]> = {};
    for (const s of sessions) {
      const dateStr = toISTDateString(new Date(s.starts_at));
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr]!.push(s);
    }
    return map;
  }, [sessions]);

  const blockedByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of blockedSlots) {
      const dateStr = toISTDateString(new Date(b.start_at));
      map[dateStr] = (map[dateStr] ?? 0) + 1;
    }
    return map;
  }, [blockedSlots]);

  if (isLoading) {
    return (
      <div
        className="bg-surface rounded-card border border-border p-4"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center py-2">
              <div className="w-8 h-2 bg-bg rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-20 bg-bg rounded-small animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-surface rounded-card border border-border p-4"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-center py-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-ink-tertiary)", letterSpacing: "0.08em" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, i) => {
          const dateStr = toISTDateString(day);
          const dayMonth = getISTMonth(day);
          const isCurrentMonth = dayMonth === currentMonth;
          const isToday = dateStr === todayStr;
          const daySessions = sessionsByDate[dateStr] ?? [];
          const hasBlocked = (blockedByDate[dateStr] ?? 0) > 0;

          return (
            <button
              key={i}
              onClick={() => onDayClick(day)}
              className={`
                relative h-[88px] rounded-small p-2 text-left transition-colors
                ${!isCurrentMonth ? "opacity-35" : "hover:bg-bg"}
              `}
              style={isToday ? { background: "#EBF0EB", boxShadow: "inset 0 0 0 1.5px rgba(74,111,165,0.25)" } : {}}
            >
              {/* Date number */}
              <span
                className="text-[12px] font-semibold block leading-none mb-1.5"
                style={
                  isToday
                    ? { color: "var(--color-primary)" }
                    : { color: isCurrentMonth ? "var(--color-ink-secondary)" : "var(--color-ink-tertiary)" }
                }
              >
                {day.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" })}
              </span>

              {/* Session type dots */}
              {daySessions.length > 0 && (
                <div className="flex flex-wrap gap-[3px]">
                  {daySessions.slice(0, 5).map((s, idx) => (
                    <span
                      key={s.id}
                      className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                      style={{ background: getDotColor(s) }}
                      title={`${s.clients?.full_name ?? s.client_name ?? "Client"}${s.session_type_name ? ` · ${s.session_type_name}` : ""}`}
                    />
                  ))}
                  {daySessions.length > 5 && (
                    <span
                      className="text-[9px] leading-none self-center"
                      style={{ color: "var(--color-ink-tertiary)" }}
                    >
                      +{daySessions.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Session count — bottom right */}
              {daySessions.length > 0 && (
                <div className="absolute bottom-2 right-2">
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    {daySessions.length}
                  </span>
                </div>
              )}

              {/* Blocked slot indicator */}
              {hasBlocked && !daySessions.length && (
                <div className="absolute bottom-2 left-2">
                  <span
                    className="text-[9px]"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    blocked
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
