"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSessionsPending } from "@/lib/api-hooks";
import { toast } from "sonner";
import {
  getMonday,
  startOfDayIST,
  endOfDayIST,
  endOfWeekIST,
  getMonthGrid,
} from "@/lib/date-utils";
import ScheduleHeader from "@/components/schedule/ScheduleHeader";
import WeekView from "@/components/schedule/WeekView";
import DayView from "@/components/schedule/DayView";
import MonthView from "@/components/schedule/MonthView";
import ListView from "@/components/schedule/ListView";
import SessionDetailPopover from "@/components/schedule/SessionDetailPopover";
import AddBreakModal from "@/components/schedule/AddBreakModal";
import CreateSessionModal from "@/components/schedule/CreateSessionModal";
import { AlertCircle } from "lucide-react";

// Unwrap API response: handles both flat arrays and { data: [...] }
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

type ViewMode = "calendar" | "list";
type CalendarView = "week" | "day" | "month";

interface BreakModalData {
  start: string;
  end: string;
  existing?: {
    id: string;
    start_at: string;
    end_at: string;
    reason: string | null;
  };
}

// Color legend items per DESIGN.md
const COLOR_LEGEND = [
  { color: "#5C7A6B", label: "In-person" },
  { color: "#7BAF9E", label: "Online" },
  { color: "#D4956A", label: "Group" },
];

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [monthDate, setMonthDate] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [previousCalendarView, setPreviousCalendarView] = useState<"week" | "month">("week");

  // Modal states
  const [breakModal, setBreakModal] = useState<BreakModalData | null>(null);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Auto-open create modal when ?new=true is in the URL
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setCreateSessionOpen(true);
    }
  }, [searchParams]);

  const qc = useQueryClient();

  // Compute date range based on current view
  const { from, to } = useMemo(() => {
    if (calendarView === "day" && selectedDay) {
      return {
        from: startOfDayIST(selectedDay),
        to: endOfDayIST(selectedDay),
      };
    }
    if (calendarView === "month") {
      const grid = getMonthGrid(monthDate);
      return {
        from: startOfDayIST(grid[0]!),
        to: endOfDayIST(grid[41]!),
      };
    }
    return {
      from: startOfDayIST(weekStart),
      to: endOfWeekIST(weekStart),
    };
  }, [calendarView, weekStart, selectedDay, monthDate]);

  // Data queries
  const sessions = useQuery({
    queryKey: ["sessions", "range", from, to],
    queryFn: () => api.session.listByDateRange({ start: from, end: to }),
  });
  const blockedSlots = useQuery({
    queryKey: ["blocked-slots", from, to],
    queryFn: () => api.blockedSlot.list({ start: from, end: to }),
  });
  const pending = useSessionsPending();

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["sessions"] });
    qc.invalidateQueries({ queryKey: ["blocked-slots"] });
  }

  function optimisticStatusUpdate(sessionId: string, newStatus: string) {
    const queryKey = ["sessions", "range", from, to];
    const previousSessions = qc.getQueryData(queryKey);
    const previousPending = qc.getQueryData(["sessions", "pending"]);

    qc.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return old.map((s: any) =>
        s.id === sessionId ? { ...s, status: newStatus } : s
      );
    });

    if (
      newStatus === "scheduled" ||
      newStatus === "rejected" ||
      newStatus === "cancelled"
    ) {
      qc.setQueryData(["sessions", "pending"], (old: any) => {
        if (!old) return old;
        return old.filter((s: any) => s.id !== sessionId);
      });
    }

    return { previousSessions, previousPending, queryKey };
  }

  function rollbackOptimistic(
    context:
      | {
          previousSessions?: unknown;
          previousPending?: unknown;
          queryKey: unknown;
        }
      | undefined
  ) {
    if (context?.previousSessions !== undefined) {
      qc.setQueryData(context.queryKey as any, context.previousSessions);
    }
    if (context?.previousPending !== undefined) {
      qc.setQueryData(["sessions", "pending"], context.previousPending);
    }
  }

  // Session mutations
  const approve = useMutation({
    mutationFn: (id: string) => api.session.approve(id),
    onMutate: async (id) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["sessions", "range", from, to] }),
        qc.cancelQueries({ queryKey: ["sessions", "pending"] }),
      ]);
      return optimisticStatusUpdate(id, "scheduled");
    },
    onSuccess: () => toast.success("Session approved"),
    onError: (err: any, _vars, context) => {
      rollbackOptimistic(context);
      toast.error(err.message);
    },
    onSettled: () => invalidateAll(),
  });

  const reject = useMutation({
    mutationFn: (id: string) => api.session.reject(id),
    onMutate: async (id) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["sessions", "range", from, to] }),
        qc.cancelQueries({ queryKey: ["sessions", "pending"] }),
      ]);
      return optimisticStatusUpdate(id, "rejected");
    },
    onSuccess: () => toast.success("Booking declined"),
    onError: (err: any, _vars, context) => {
      rollbackOptimistic(context);
      toast.error(err.message);
    },
    onSettled: () => invalidateAll(),
  });

  const complete = useMutation({
    mutationFn: (id: string) => api.session.complete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["sessions", "range", from, to] });
      return optimisticStatusUpdate(id, "completed");
    },
    onSuccess: () => toast.success("Session marked as completed"),
    onError: (err: any, _vars, context) => {
      rollbackOptimistic(context);
      toast.error(err.message);
    },
    onSettled: () => invalidateAll(),
  });

  const cancel = useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Record<string, unknown>) => api.session.cancel(id, data),
    onMutate: async ({ id }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["sessions", "range", from, to] }),
        qc.cancelQueries({ queryKey: ["sessions", "pending"] }),
      ]);
      return optimisticStatusUpdate(id, "cancelled");
    },
    onSuccess: () => toast.success("Session cancelled"),
    onError: (err: any, _vars, context) => {
      rollbackOptimistic(context);
      toast.error(err.message);
    },
    onSettled: () => invalidateAll(),
  });

  const markNoShow = useMutation({
    mutationFn: (id: string) => api.session.markNoShow(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["sessions", "range", from, to] });
      return optimisticStatusUpdate(id, "no_show");
    },
    onSuccess: () => toast.success("Session marked as no-show"),
    onError: (err: any, _vars, context) => {
      rollbackOptimistic(context);
      toast.error(err.message);
    },
    onSettled: () => invalidateAll(),
  });

  const reschedule = useMutation({
    mutationFn: ({
      session_id,
      ...data
    }: { session_id: string } & Record<string, unknown>) =>
      api.session.reschedule(session_id, data),
    onSuccess: () => {
      invalidateAll();
      setSelectedSessionId(null);
      toast.success("Session rescheduled");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) => api.session.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["sessions", "range", from, to] });
      const queryKey = ["sessions", "range", from, to];
      const previousSessions = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return old.filter((s: any) => s.id !== id);
      });
      return { previousSessions, queryKey };
    },
    onSuccess: () => {
      setSelectedSessionId(null);
      toast.success("Session deleted");
    },
    onError: (err: any, _vars, context: any) => {
      if (context?.previousSessions !== undefined) {
        qc.setQueryData(context.queryKey, context.previousSessions);
      }
      toast.error(err.message);
    },
    onSettled: () => invalidateAll(),
  });

  // Blocked slot mutations
  const createBlock = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.blockedSlot.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-slots"] });
      setBreakModal(null);
      toast.success("Break added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateBlock = useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Record<string, unknown>) =>
      api.blockedSlot.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-slots"] });
      setBreakModal(null);
      toast.success("Break updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteBlock = useMutation({
    mutationFn: (id: string) => api.blockedSlot.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-slots"] });
      setBreakModal(null);
      toast.success("Break removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isActing =
    approve.isPending ||
    reject.isPending ||
    complete.isPending ||
    cancel.isPending ||
    markNoShow.isPending ||
    reschedule.isPending ||
    deleteSession.isPending ||
    createBlock.isPending ||
    updateBlock.isPending ||
    deleteBlock.isPending;

  // Navigation
  function goToPrevWeek() {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  }

  function goToNextWeek() {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  }

  function goToPrevMonth() {
    const prev = new Date(monthDate);
    prev.setMonth(prev.getMonth() - 1);
    setMonthDate(prev);
  }

  function goToNextMonth() {
    const next = new Date(monthDate);
    next.setMonth(next.getMonth() + 1);
    setMonthDate(next);
  }

  function goToToday() {
    setWeekStart(getMonday(new Date()));
    setMonthDate(new Date());
    if (calendarView === "day") {
      setCalendarView(previousCalendarView);
    }
    setSelectedDay(null);
  }

  function handleCalendarViewChange(view: "week" | "month") {
    setPreviousCalendarView(view);
    setCalendarView(view);
    setSelectedDay(null);
  }

  function onDayClick(day: Date) {
    setPreviousCalendarView(
      calendarView === "day" ? previousCalendarView : (calendarView as "week" | "month")
    );
    setSelectedDay(day);
    setCalendarView("day");
  }

  function backToParent() {
    setCalendarView(previousCalendarView);
    setSelectedDay(null);
  }

  function onBlockedSlotClick(block: {
    id: string;
    start_at: string;
    end_at: string;
    reason: string | null;
  }) {
    setBreakModal({
      start: block.start_at,
      end: block.end_at,
      existing: block,
    });
  }

  const selectedSession = useMemo(() => {
    if (!selectedSessionId || !sessions.data) return null;
    return toArray(sessions.data).find((s) => s.id === selectedSessionId) ?? null;
  }, [selectedSessionId, sessions.data]);

  const pendingCount = pending.data?.length ?? 0;
  const allSessions = toArray(sessions.data);

  return (
    <div className="space-y-4 relative">
      {/* Action overlay spinner */}
      {isActing && (
        <div className="fixed inset-0 z-30 pointer-events-none flex items-end justify-center pb-8">
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-small border animate-fade-in"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{
                borderColor: "var(--color-primary)",
                borderTopColor: "transparent",
              }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              Processing…
            </span>
          </div>
        </div>
      )}

      {/* Page header: nav controls + view toggle + new session */}
      <div
        className="flex items-center justify-between gap-4 flex-wrap pb-1"
      >
        {/* Page title — left side */}
        <div>
          <h1
            className="text-2xl font-bold leading-none"
            style={{ color: "var(--color-ink)", letterSpacing: "-0.02em" }}
          >
            Schedule
          </h1>
        </div>

        {/* Right: nav controls */}
        <div className="flex-1 flex justify-end">
          <ScheduleHeader
            viewMode={viewMode}
            calendarView={calendarView}
            weekStart={weekStart}
            monthDate={monthDate}
            selectedDay={selectedDay}
            onViewModeChange={setViewMode}
            onCalendarViewChange={handleCalendarViewChange}
            onPrevWeek={goToPrevWeek}
            onNextWeek={goToNextWeek}
            onPrevMonth={goToPrevMonth}
            onNextMonth={goToNextMonth}
            onToday={goToToday}
            onBackToParent={backToParent}
            onAddSession={() => setCreateSessionOpen(true)}
            pendingCount={pendingCount}
          />
        </div>
      </div>

      {/* Pending approval banner */}
      {pendingCount > 0 && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-small border animate-fade-in"
          style={{
            background: "#FBF0E8",
            borderColor: "rgba(212,149,106,0.3)",
          }}
        >
          <AlertCircle size={15} style={{ color: "#B5733A", flexShrink: 0 }} />
          <span className="text-sm font-medium" style={{ color: "#B5733A" }}>
            {pendingCount} booking request{pendingCount !== 1 ? "s" : ""} awaiting your approval
          </span>
        </div>
      )}

      {/* Color legend — only for calendar week/day views */}
      {viewMode === "calendar" && calendarView !== "month" && (
        <div className="flex items-center gap-4">
          {COLOR_LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              <span
                className="text-[12px]"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar views */}
      {viewMode === "list" ? (
        <ListView
          sessions={allSessions as any}
          isLoading={sessions.isLoading}
          onApprove={(id) => approve.mutate(id)}
          onReject={(id) => {
            if (confirm("Decline this booking request?")) {
              reject.mutate(id);
            }
          }}
          onComplete={(id) => complete.mutate(id)}
          onCancel={(id) => {
            if (confirm("Cancel this session?")) {
              cancel.mutate({ id });
            }
          }}
          onMarkNoShow={(id) => {
            if (confirm("Mark this session as no-show?")) {
              markNoShow.mutate(id);
            }
          }}
          isActing={isActing}
        />
      ) : calendarView === "month" ? (
        <MonthView
          monthDate={monthDate}
          sessions={allSessions as any}
          blockedSlots={(blockedSlots.data ?? []) as any}
          isLoading={sessions.isLoading}
          onDayClick={onDayClick}
        />
      ) : calendarView === "week" ? (
        <WeekView
          weekStart={weekStart}
          sessions={allSessions as any}
          blockedSlots={(blockedSlots.data ?? []) as any}
          isLoading={sessions.isLoading}
          onSessionClick={(id) => setSelectedSessionId(id)}
          onEmptySlotClick={(start, end) => setBreakModal({ start, end })}
          onBlockedSlotClick={onBlockedSlotClick}
          onDayClick={onDayClick}
        />
      ) : (
        <DayView
          day={selectedDay!}
          sessions={allSessions as any}
          blockedSlots={(blockedSlots.data ?? []) as any}
          isLoading={sessions.isLoading}
          onSessionClick={(id) => setSelectedSessionId(id)}
          onEmptySlotClick={(start, end) => setBreakModal({ start, end })}
          onBlockedSlotClick={onBlockedSlotClick}
        />
      )}

      {/* Session detail drawer */}
      {selectedSession && (
        <SessionDetailPopover
          session={selectedSession as any}
          onClose={() => setSelectedSessionId(null)}
          onApprove={() => {
            approve.mutate(selectedSession.id);
            setSelectedSessionId(null);
          }}
          onReject={() => {
            reject.mutate(selectedSession.id);
            setSelectedSessionId(null);
          }}
          onComplete={() => {
            complete.mutate(selectedSession.id);
            setSelectedSessionId(null);
          }}
          onCancel={() => {
            cancel.mutate({ id: selectedSession.id });
            setSelectedSessionId(null);
          }}
          onMarkNoShow={() => {
            markNoShow.mutate(selectedSession.id);
            setSelectedSessionId(null);
          }}
          onReschedule={(data) => reschedule.mutate(data)}
          onDelete={(id) => deleteSession.mutate(id)}
          isLoading={isActing}
        />
      )}

      {/* Break modal */}
      {breakModal && (
        <AddBreakModal
          defaultStart={breakModal.start}
          defaultEnd={breakModal.end}
          existingBreak={breakModal.existing}
          onClose={() => setBreakModal(null)}
          onSave={(data) => createBlock.mutate(data)}
          onUpdate={(data) => updateBlock.mutate(data)}
          onDelete={(id) => deleteBlock.mutate(id)}
          isSaving={
            createBlock.isPending || updateBlock.isPending || deleteBlock.isPending
          }
        />
      )}

      {/* Create session modal */}
      {createSessionOpen && (
        <CreateSessionModal
          onClose={() => setCreateSessionOpen(false)}
          onCreated={() => {
            setCreateSessionOpen(false);
            invalidateAll();
          }}
        />
      )}
    </div>
  );
}
