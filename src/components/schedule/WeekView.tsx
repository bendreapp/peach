import { useMemo } from "react";
import {
  getWeekDays,
  formatShortDateIST,
  getISTHour,
  getISTMinutes,
  formatHourLabel,
  isSameISTDay,
  makeISTDateTime,
} from "@/lib/date-utils";
import SessionBlock, { BlockedSlotBlock } from "./SessionBlock";

const HOUR_HEIGHT = 64; // px per hour — 50-min session = ~85px
const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;

// Today highlight color per DESIGN.md
const TODAY_BG = "#EBF0EB";

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

interface WeekViewProps {
  weekStart: Date;
  sessions: SessionData[];
  blockedSlots: BlockedSlotData[];
  isLoading: boolean;
  onSessionClick: (id: string) => void;
  onEmptySlotClick: (start: string, end: string) => void;
  onBlockedSlotClick: (block: {
    id: string;
    start_at: string;
    end_at: string;
    reason: string | null;
  }) => void;
  onDayClick: (day: Date) => void;
}

function getBlockPosition(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const startHour = getISTHour(start) + getISTMinutes(start) / 60;
  const endHour = getISTHour(end) + getISTMinutes(end) / 60;

  const top = (startHour - START_HOUR) * HOUR_HEIGHT;
  const height = (endHour - startHour) * HOUR_HEIGHT;
  return {
    top: Math.max(0, top),
    height: Math.max(HOUR_HEIGHT / 4, height),
  };
}

function WeekViewSkeleton() {
  return (
    <div
      className="bg-surface rounded-card border border-border overflow-hidden shadow-card"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Day header skeleton */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border">
            <div className="p-3" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-3 border-l border-border flex flex-col items-center gap-1.5">
                <div className="w-6 h-2.5 bg-bg rounded animate-pulse" />
                <div className="w-7 h-4 bg-bg rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Time grid skeleton */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)]">
            <div className="relative" style={{ height: `${5 * HOUR_HEIGHT}px` }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute right-2"
                  style={{ top: `${i * HOUR_HEIGHT + 6}px` }}
                >
                  <div className="w-8 h-2 bg-bg rounded animate-pulse" />
                </div>
              ))}
            </div>
            {Array.from({ length: 7 }).map((_, col) => (
              <div
                key={col}
                className="relative border-l border-border"
                style={{ height: `${5 * HOUR_HEIGHT}px` }}
              >
                {col % 3 === 0 && (
                  <div
                    className="absolute left-2 right-2 rounded-[8px] animate-pulse"
                    style={{
                      top: `${HOUR_HEIGHT * 0.5}px`,
                      height: `${HOUR_HEIGHT * 1.2}px`,
                      background: "rgba(74,111,165,0.08)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WeekView({
  weekStart,
  sessions,
  blockedSlots,
  isLoading,
  onSessionClick,
  onEmptySlotClick,
  onBlockedSlotClick,
  onDayClick,
}: WeekViewProps) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = new Date();
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  // Group sessions by day index
  const sessionsByDay = useMemo(() => {
    const map = new Map<number, SessionData[]>();
    for (let i = 0; i < 7; i++) map.set(i, []);
    for (const s of sessions) {
      const dayIdx = days.findIndex((d) => isSameISTDay(d, new Date(s.starts_at)));
      if (dayIdx >= 0) map.get(dayIdx)!.push(s);
    }
    return map;
  }, [sessions, days]);

  // Group blocked slots by day index
  const blocksByDay = useMemo(() => {
    const map = new Map<number, BlockedSlotData[]>();
    for (let i = 0; i < 7; i++) map.set(i, []);
    for (const b of blockedSlots) {
      const dayIdx = days.findIndex((d) => isSameISTDay(d, new Date(b.start_at)));
      if (dayIdx >= 0) map.get(dayIdx)!.push(b);
    }
    return map;
  }, [blockedSlots, days]);

  function handleCellClick(dayIdx: number, hour: number) {
    const day = days[dayIdx];
    if (!day) return;
    const start = makeISTDateTime(day, hour);
    const end = makeISTDateTime(day, hour + 1);
    onEmptySlotClick(start, end);
  }

  if (isLoading) return <WeekViewSkeleton />;

  return (
    <div
      className="bg-surface rounded-card border border-border overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Day headers */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border sticky top-0 z-10 bg-surface">
            {/* Time column spacer */}
            <div className="py-3 border-b border-border" style={{ background: "var(--color-surface)" }} />
            {days.map((day, idx) => {
              const { dayName, dateNum } = formatShortDateIST(day);
              const isToday = isSameISTDay(day, today);
              return (
                <button
                  key={idx}
                  onClick={() => onDayClick(day)}
                  className="py-3 text-center border-l border-border transition-colors hover:bg-bg"
                  style={isToday ? { background: TODAY_BG } : {}}
                >
                  <div
                    className="text-[11px] font-medium uppercase tracking-widest mb-0.5"
                    style={{ color: "var(--color-ink-tertiary)", letterSpacing: "0.08em" }}
                  >
                    {dayName}
                  </div>
                  <div
                    className={`text-sm font-bold ${isToday ? "" : "text-ink"}`}
                    style={isToday ? { color: "var(--color-primary)" } : {}}
                  >
                    {dateNum}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)]">
            {/* Time labels */}
            <div className="relative" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 text-[10px] select-none pointer-events-none"
                  style={{
                    top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                    transform: "translateY(-50%)",
                    color: "var(--color-ink-tertiary)",
                    lineHeight: 1,
                    paddingTop: "1px",
                  }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, dayIdx) => {
              const isToday = isSameISTDay(day, today);
              const daySessions = sessionsByDay.get(dayIdx) ?? [];
              const dayBlocks = blocksByDay.get(dayIdx) ?? [];

              return (
                <div
                  key={dayIdx}
                  className="relative border-l border-border"
                  style={{
                    height: `${TOTAL_HOURS * HOUR_HEIGHT}px`,
                    background: isToday ? TODAY_BG : undefined,
                  }}
                >
                  {/* Hour grid lines + click targets */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 cursor-pointer transition-colors"
                      style={{
                        top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`,
                        borderTop: "1px solid var(--color-border)",
                        opacity: 0.5,
                      }}
                      onClick={() => handleCellClick(dayIdx, hour)}
                    >
                      {/* Half-hour line */}
                      <div
                        className="absolute left-0 right-0"
                        style={{
                          top: `${HOUR_HEIGHT / 2}px`,
                          borderTop: "1px dashed var(--color-border)",
                          opacity: 0.5,
                        }}
                      />
                    </div>
                  ))}

                  {/* Hover overlay per hour cell for add prompt */}
                  {hours.map((hour) => (
                    <div
                      key={`hover-${hour}`}
                      className="absolute left-0 right-0 group cursor-pointer"
                      style={{
                        top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`,
                        zIndex: 1,
                      }}
                      onClick={() => handleCellClick(dayIdx, hour)}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(74,111,165,0.08)",
                            color: "var(--color-primary)",
                          }}
                        >
                          + Break
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Blocked slots */}
                  {dayBlocks.map((block) => {
                    const pos = getBlockPosition(block.start_at, block.end_at);
                    return (
                      <BlockedSlotBlock
                        key={block.id}
                        id={block.id}
                        reason={block.reason}
                        startAt={block.start_at}
                        endAt={block.end_at}
                        top={pos.top}
                        height={pos.height}
                        onClick={onBlockedSlotClick}
                      />
                    );
                  })}

                  {/* Sessions — rendered above grid lines */}
                  {daySessions.map((session) => {
                    const pos = getBlockPosition(session.starts_at, session.ends_at);
                    return (
                      <SessionBlock
                        key={session.id}
                        id={session.id}
                        clientName={
                          session.clients?.full_name ?? session.client_name ?? "Client"
                        }
                        startsAt={session.starts_at}
                        endsAt={session.ends_at}
                        status={session.status}
                        sessionTypeName={session.session_type_name}
                        top={pos.top}
                        height={pos.height}
                        onClick={onSessionClick}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
