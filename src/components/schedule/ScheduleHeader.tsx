import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  List,
} from "lucide-react";
import { formatWeekRange, formatDateIST, formatMonthYear } from "@/lib/date-utils";

interface ScheduleHeaderProps {
  viewMode: "calendar" | "list";
  calendarView: "week" | "day" | "month";
  weekStart: Date;
  monthDate: Date;
  selectedDay: Date | null;
  onViewModeChange: (mode: "calendar" | "list") => void;
  onCalendarViewChange: (view: "week" | "month") => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onBackToParent: () => void;
  onAddSession: () => void;
  pendingCount: number;
}

export default function ScheduleHeader({
  viewMode,
  calendarView,
  weekStart,
  monthDate,
  selectedDay,
  onViewModeChange,
  onCalendarViewChange,
  onPrevWeek,
  onNextWeek,
  onPrevMonth,
  onNextMonth,
  onToday,
  onBackToParent,
  onAddSession,
  pendingCount,
}: ScheduleHeaderProps) {
  // Navigation label + handlers based on current view
  const isDay = calendarView === "day" && selectedDay;
  const isMonth = calendarView === "month";
  const isWeek = calendarView === "week";

  const navLabel = isDay
    ? formatDateIST(selectedDay!.toISOString())
    : isMonth
    ? formatMonthYear(monthDate)
    : formatWeekRange(weekStart);

  const onPrev = isMonth ? onPrevMonth : onPrevWeek;
  const onNext = isMonth ? onNextMonth : onNextWeek;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Left: nav arrows + label / back button for day view */}
      <div className="flex items-center gap-2">
        {isDay ? (
          <button
            onClick={onBackToParent}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        ) : (
          <>
            <button
              onClick={onPrev}
              aria-label="Previous"
              className="p-1.5 rounded-small border border-border text-ink-tertiary hover:bg-bg hover:text-ink transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span
              className="text-sm font-semibold text-ink min-w-[160px] text-center select-none"
              style={{ letterSpacing: "-0.01em" }}
            >
              {navLabel}
            </span>
            <button
              onClick={onNext}
              aria-label="Next"
              className="p-1.5 rounded-small border border-border text-ink-tertiary hover:bg-bg hover:text-ink transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Today button */}
        {!isDay && (
          <button
            onClick={onToday}
            className="px-3 py-1.5 rounded-small border border-border text-xs font-medium text-ink-secondary hover:bg-bg hover:text-ink transition-colors"
          >
            Today
          </button>
        )}

        {/* Day view label */}
        {isDay && (
          <span className="text-sm font-semibold text-ink">{navLabel}</span>
        )}
      </div>

      {/* Right: view toggles + add session */}
      <div className="flex items-center gap-2">
        {/* Week / Month / List toggle — only show when not in day view */}
        {!isDay && (
          <div
            className="flex rounded-small border border-border overflow-hidden"
            style={{ background: "var(--color-surface)" }}
          >
            <button
              onClick={() => { onViewModeChange("calendar"); onCalendarViewChange("week"); }}
              title="Week view"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "calendar" && calendarView === "week"
                  ? "text-ink"
                  : "text-ink-tertiary hover:bg-bg"
              }`}
              style={
                viewMode === "calendar" && calendarView === "week"
                  ? { background: "var(--color-bg)" }
                  : {}
              }
            >
              <CalendarDays size={13} />
              Week
            </button>
            <button
              onClick={() => { onViewModeChange("calendar"); onCalendarViewChange("month"); }}
              title="Month view"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
                viewMode === "calendar" && calendarView === "month"
                  ? "text-ink"
                  : "text-ink-tertiary hover:bg-bg"
              }`}
              style={
                viewMode === "calendar" && calendarView === "month"
                  ? { background: "var(--color-bg)" }
                  : {}
              }
            >
              <CalendarRange size={13} />
              Month
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              title="List view"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
                viewMode === "list"
                  ? "text-ink"
                  : "text-ink-tertiary hover:bg-bg"
              }`}
              style={
                viewMode === "list"
                  ? { background: "var(--color-bg)" }
                  : {}
              }
            >
              <List size={13} />
              List
            </button>
          </div>
        )}

        {/* Add session */}
        <button
          onClick={onAddSession}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-small text-white text-sm font-semibold transition-all shadow-primary hover:-translate-y-px"
          style={{ background: "var(--color-primary)", minHeight: "36px" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-primary-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-primary)")}
        >
          <Plus size={15} />
          New Session
          {pendingCount > 0 && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ml-0.5"
              style={{ background: "rgba(255,255,255,0.25)", color: "white" }}
            >
              {pendingCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
