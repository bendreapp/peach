import { useMemo } from "react";
import {
  getISTHour,
  getISTMinutes,
  formatHourLabel,
  isSameISTDay,
  makeISTDateTime,
} from "@/lib/date-utils";
import SessionBlock, { BlockedSlotBlock } from "./SessionBlock";

const HOUR_HEIGHT = 64;
const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;

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

interface DayViewProps {
  day: Date;
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

export default function DayView({
  day,
  sessions,
  blockedSlots,
  isLoading,
  onSessionClick,
  onEmptySlotClick,
  onBlockedSlotClick,
}: DayViewProps) {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  const isToday = isSameISTDay(day, new Date());

  const daySessions = useMemo(
    () => sessions.filter((s) => isSameISTDay(new Date(s.starts_at), day)),
    [sessions, day]
  );

  const dayBlocks = useMemo(
    () => blockedSlots.filter((b) => isSameISTDay(new Date(b.start_at), day)),
    [blockedSlots, day]
  );

  function handleCellClick(hour: number) {
    const start = makeISTDateTime(day, hour);
    const end = makeISTDateTime(day, hour + 1);
    onEmptySlotClick(start, end);
  }

  if (isLoading) {
    return (
      <div
        className="bg-surface rounded-card border border-border overflow-hidden max-w-2xl mx-auto"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div className="grid grid-cols-[56px_1fr]">
          <div className="relative" style={{ height: `${5 * HOUR_HEIGHT}px` }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute right-2"
                style={{ top: `${i * HOUR_HEIGHT + 8}px` }}
              >
                <div className="w-8 h-2 bg-bg rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div
            className="relative border-l border-border"
            style={{ height: `${5 * HOUR_HEIGHT}px` }}
          >
            <div
              className="absolute left-3 right-3 rounded-[8px] animate-pulse"
              style={{
                top: `${HOUR_HEIGHT * 0.5}px`,
                height: `${HOUR_HEIGHT * 1.3}px`,
                background: "rgba(74,111,165,0.08)",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-surface rounded-card border border-border overflow-hidden max-w-2xl mx-auto"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div className="grid grid-cols-[56px_1fr]">
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

        {/* Day column */}
        <div
          className="relative border-l border-border"
          style={{
            height: `${TOTAL_HOURS * HOUR_HEIGHT}px`,
            background: isToday ? TODAY_BG : undefined,
          }}
        >
          {/* Hour lines + click targets */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 cursor-pointer group"
              style={{
                top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                height: `${HOUR_HEIGHT}px`,
                borderTop: "1px solid var(--color-border)",
                opacity: 0.5,
              }}
              onClick={() => handleCellClick(hour)}
            >
              {/* Half-hour dashed line */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top: `${HOUR_HEIGHT / 2}px`,
                  borderTop: "1px dashed var(--color-border)",
                  opacity: 0.6,
                }}
              />
            </div>
          ))}

          {/* Hover overlay */}
          {hours.map((hour) => (
            <div
              key={`hover-${hour}`}
              className="absolute left-0 right-0 group cursor-pointer"
              style={{
                top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                height: `${HOUR_HEIGHT}px`,
                zIndex: 1,
              }}
              onClick={() => handleCellClick(hour)}
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

          {/* Sessions */}
          {daySessions.map((session) => {
            const pos = getBlockPosition(session.starts_at, session.ends_at);
            return (
              <SessionBlock
                key={session.id}
                id={session.id}
                clientName={session.clients?.full_name ?? session.client_name ?? "Client"}
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
      </div>
    </div>
  );
}
