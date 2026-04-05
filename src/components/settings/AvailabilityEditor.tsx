"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Copy, Loader2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AvailabilityRule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AvailabilityEditorProps {
  availability: AvailabilityRule[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

// Mon-first order: [1,2,3,4,5,6,0]
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

// 30-min intervals 06:00 – 22:00
const TIME_OPTIONS: { value: string; label: string }[] = [];
for (let h = 6; h <= 22; h++) {
  for (const m of ["00", "30"]) {
    if (h === 22 && m === "30") continue;
    const value = `${String(h).padStart(2, "0")}:${m}`;
    const label = formatTimeLabel(value);
    TIME_OPTIONS.push({ value, label });
  }
}

function formatTimeLabel(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m} ${ampm}`;
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className="relative flex-shrink-0 w-10 h-[22px] rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: checked ? "#5C7A6B" : "#E5E0D8",
        boxShadow: checked
          ? "0 0 0 0px rgba(92,122,107,0)"
          : "0 0 0 0px transparent",
      }}
    >
      <span
        className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          transform: checked ? "translateX(18px)" : "translateX(0px)",
        }}
      />
    </button>
  );
}

// ─── Day Row ─────────────────────────────────────────────────────────────────

interface DayState {
  day_of_week: number;
  is_active: boolean;
  start_time: string;
  end_time: string;
}

interface DayRowProps {
  day: DayState;
  isSaving: boolean;
  onToggle: () => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

function DayRow({ day, isSaving, onToggle, onStartChange, onEndChange }: DayRowProps) {
  const label = DAY_LABELS[day.day_of_week] ?? "";

  // Validate: end must be after start
  const endOptions = TIME_OPTIONS.filter((opt) => opt.value > day.start_time);
  const startOptions = TIME_OPTIONS.filter((opt) => opt.value < day.end_time);
  const hasError =
    day.is_active && day.end_time <= day.start_time;

  return (
    <div
      className="group transition-all duration-150"
      style={{
        borderBottom: "1px solid #F0EDE8",
      }}
    >
      <div
        className="flex items-center gap-4 px-4 py-3.5 transition-colors duration-100"
        style={{
          background: day.is_active ? "#FDFCFA" : "transparent",
        }}
      >
        {/* Day name */}
        <div className="w-[108px] flex-shrink-0">
          <span
            className="text-sm font-semibold tracking-tight transition-colors duration-150"
            style={{
              color: day.is_active ? "#1C1C1E" : "#C5BFB8",
              fontFamily: "Satoshi",
            }}
          >
            {label}
          </span>
        </div>

        {/* Unavailable label or time selectors */}
        <div className="flex-1 min-w-0">
          {day.is_active ? (
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {/* Start time */}
              <div className="w-[118px] flex-shrink-0">
                <Select
                  value={day.start_time}
                  onChange={onStartChange}
                  options={startOptions.length > 0 ? startOptions : TIME_OPTIONS.slice(0, -1)}
                  ariaLabel={`${label} start time`}
                  disabled={isSaving}
                />
              </div>

              <span
                className="text-xs flex-shrink-0"
                style={{ color: "#A8A29E" }}
              >
                to
              </span>

              {/* End time */}
              <div className="w-[118px] flex-shrink-0">
                <Select
                  value={day.end_time}
                  onChange={onEndChange}
                  options={endOptions.length > 0 ? endOptions : TIME_OPTIONS.slice(1)}
                  ariaLabel={`${label} end time`}
                  disabled={isSaving}
                  error={hasError}
                />
              </div>

              {/* Saving spinner */}
              {isSaving && (
                <Loader2
                  size={14}
                  strokeWidth={2}
                  className="animate-spin flex-shrink-0"
                  style={{ color: "#8FAF8A" }}
                />
              )}

              {/* Validation error */}
              {hasError && !isSaving && (
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: "#C0705A", fontFamily: "Satoshi" }}
                >
                  End must be after start
                </span>
              )}
            </div>
          ) : (
            <span
              className="text-sm"
              style={{ color: "#C5BFB8", fontFamily: "Satoshi" }}
            >
              Unavailable
            </span>
          )}
        </div>

        {/* Toggle */}
        <div className="flex-shrink-0">
          <ToggleSwitch
            checked={day.is_active}
            onChange={onToggle}
            disabled={isSaving}
            label={`Toggle ${label}`}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AvailabilityEditor({ availability }: AvailabilityEditorProps) {
  // Build per-day state (0=Sun ... 6=Sat)
  const initialDays: DayState[] = Array.from({ length: 7 }, (_, i) => {
    const existing = availability.find((a) => a.day_of_week === i);
    return {
      day_of_week: i,
      is_active: existing?.is_active ?? false,
      start_time: existing?.start_time?.slice(0, 5) ?? "09:00",
      end_time: existing?.end_time?.slice(0, 5) ?? "18:00",
    };
  });

  const [days, setDays] = useState<DayState[]>(initialDays);
  const [savingDays, setSavingDays] = useState<Set<number>>(new Set());

  const qc = useQueryClient();

  // Debounce map: dayIndex → timer ref
  const debounceTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const saveAvailability = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.therapist.setAvailability(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["therapist", "availability"] });
      const dayIdx = variables["day_of_week"] as number;
      setSavingDays((prev) => {
        const next = new Set(prev);
        next.delete(dayIdx);
        return next;
      });
      toast.success("Availability updated");
    },
    onError: (err, variables) => {
      const dayIdx = variables["day_of_week"] as number;
      setSavingDays((prev) => {
        const next = new Set(prev);
        next.delete(dayIdx);
        return next;
      });
      toast.error(err instanceof Error ? err.message : "Failed to save availability");
    },
  });

  const scheduleSave = useCallback(
    (day: DayState) => {
      // Only save if end > start (or day is being deactivated)
      if (day.is_active && day.end_time <= day.start_time) return;

      const idx = day.day_of_week;

      // Clear any existing timer
      const existing = debounceTimers.current.get(idx);
      if (existing) clearTimeout(existing);

      // Mark as saving optimistically after a very short delay
      const timer = setTimeout(() => {
        setSavingDays((prev) => new Set(prev).add(idx));
        saveAvailability.mutate({
          day_of_week: idx,
          start_time: day.start_time,
          end_time: day.end_time,
          is_active: day.is_active,
        });
      }, 600);

      debounceTimers.current.set(idx, timer);
    },
    [saveAvailability]
  );

  function handleToggle(dayIndex: number) {
    setDays((prev) => {
      const updated = prev.map((d) =>
        d.day_of_week === dayIndex ? { ...d, is_active: !d.is_active } : d
      );
      const day = updated.find((d) => d.day_of_week === dayIndex);
      if (day) scheduleSave(day);
      return updated;
    });
  }

  function handleStartChange(dayIndex: number, value: string) {
    setDays((prev) => {
      const updated = prev.map((d) =>
        d.day_of_week === dayIndex ? { ...d, start_time: value } : d
      );
      const day = updated.find((d) => d.day_of_week === dayIndex);
      if (day) scheduleSave(day);
      return updated;
    });
  }

  function handleEndChange(dayIndex: number, value: string) {
    setDays((prev) => {
      const updated = prev.map((d) =>
        d.day_of_week === dayIndex ? { ...d, end_time: value } : d
      );
      const day = updated.find((d) => d.day_of_week === dayIndex);
      if (day) scheduleSave(day);
      return updated;
    });
  }

  function handleCopyMondayToWeekdays() {
    const monday = days.find((d) => d.day_of_week === 1);
    if (!monday) return;

    // Weekdays: Mon–Fri (1–5), skip Monday itself
    const weekdays = [2, 3, 4, 5];
    setDays((prev) => {
      const updated = prev.map((d) =>
        weekdays.includes(d.day_of_week)
          ? {
              ...d,
              is_active: monday.is_active,
              start_time: monday.start_time,
              end_time: monday.end_time,
            }
          : d
      );
      // Schedule saves for each updated weekday
      weekdays.forEach((idx) => {
        const day = updated.find((d) => d.day_of_week === idx);
        if (day) scheduleSave(day);
      });
      return updated;
    });

    toast.success("Monday's hours copied to Tue–Fri");
  }

  const monday = days.find((d) => d.day_of_week === 1);
  const canCopyMonday = monday?.is_active && monday.end_time > monday.start_time;

  return (
    <section
      className="bg-white rounded-xl border overflow-hidden"
      style={{
        borderColor: "#E5E0D8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-start justify-between gap-4 border-b"
        style={{ borderColor: "#E5E0D8", background: "#FAFAF8" }}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <Calendar
            size={18}
            strokeWidth={1.5}
            className="flex-shrink-0 mt-0.5"
            style={{ color: "#5C7A6B" }}
          />
          <div className="min-w-0">
            <h2
              className="text-[15px] font-semibold tracking-tight leading-snug"
              style={{ color: "#1C1C1E", fontFamily: "Satoshi" }}
            >
              Weekly Availability
            </h2>
            <p
              className="text-[13px] mt-0.5"
              style={{ color: "#8A8480", fontFamily: "Satoshi" }}
            >
              Set when clients can book sessions. Changes save automatically.
            </p>
          </div>
        </div>

        {/* Copy Monday button */}
        {canCopyMonday && (
          <button
            type="button"
            onClick={handleCopyMondayToWeekdays}
            className="flex items-center gap-1.5 flex-shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 hover:bg-[#F4F1EC] active:scale-[0.97]"
            style={{
              color: "#5C7A6B",
              borderColor: "#C5D9C5",
              fontFamily: "Satoshi",
            }}
          >
            <Copy size={12} strokeWidth={2} />
            Copy Mon to weekdays
          </button>
        )}
      </div>

      {/* Column headers */}
      <div
        className="hidden sm:flex items-center gap-4 px-4 pt-3 pb-1.5"
        style={{ borderBottom: "1px solid #F0EDE8" }}
      >
        <div className="w-[108px] flex-shrink-0">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#C5BFB8", fontFamily: "Satoshi", letterSpacing: "0.08em" }}
          >
            Day
          </span>
        </div>
        <div className="flex-1">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#C5BFB8", fontFamily: "Satoshi", letterSpacing: "0.08em" }}
          >
            Hours
          </span>
        </div>
        <div className="flex-shrink-0 w-10 text-center">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#C5BFB8", fontFamily: "Satoshi", letterSpacing: "0.08em" }}
          >
            On
          </span>
        </div>
      </div>

      {/* Day rows */}
      <div>
        {DAY_ORDER.map((dayIndex, i) => {
          const day = days.find((d) => d.day_of_week === dayIndex);
          if (!day) return null;
          const isLast = i === DAY_ORDER.length - 1;
          return (
            <div
              key={dayIndex}
              style={isLast ? { borderBottom: "none" } : undefined}
            >
              <DayRow
                day={day}
                isSaving={savingDays.has(dayIndex)}
                onToggle={() => handleToggle(dayIndex)}
                onStartChange={(val) => handleStartChange(dayIndex, val)}
                onEndChange={(val) => handleEndChange(dayIndex, val)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
