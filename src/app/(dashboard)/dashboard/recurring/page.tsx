"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRecurringReservations, useClientsList } from "@/lib/api-hooks";
import { DAYS_OF_WEEK } from "@bendre/shared";
import { toast } from "sonner";
import {
  Repeat,
  Plus,
  X,
  CalendarDays,
  Clock,
  Trash2,
  User,
} from "lucide-react";

// Unwrap API response: handles both flat arrays and { data: [...] }
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

// Status derivation — reservations don't have explicit status in API,
// we treat all active reservations as "Active"
function getStatusBadge(_r: any) {
  return {
    label: "Active",
    bg: "#EAF4F1",
    text: "#3D8B7A",
  };
}

export default function RecurringReservationsPage() {
  const reservations = useRecurringReservations();
  const clients = useClientsList();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:50");
  const [sessionTypeName, setSessionTypeName] = useState("");
  const [amountInr, setAmountInr] = useState(0);

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.recurringReservation.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-reservations"] });
      setShowForm(false);
      setClientId("");
      toast.success("Recurring slot reserved");
    },
    onError: (err) => toast.error(err.message),
  });

  const release = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api.recurringReservation.release(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-reservations"] });
      toast.success("Slot released");
    },
  });

  const reservationsData = toArray(reservations.data);
  const clientsData = toArray(clients.data);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      client_id: clientId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      session_type_name: sessionTypeName || null,
      amount_inr: amountInr * 100,
    });
  }

  // Skeleton loading state
  if (reservations.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-[#E5E0D8] rounded-[8px] animate-pulse" />
            <div className="h-4 w-72 bg-[#E5E0D8] rounded-[6px] animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-[#E5E0D8] rounded-[8px] animate-pulse" />
        </div>
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[72px] border-b border-[#E5E0D8] last:border-b-0 px-6 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-[#E5E0D8] animate-pulse flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-36 bg-[#E5E0D8] rounded animate-pulse" />
                <div className="h-3 w-56 bg-[#E5E0D8] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Recurring Sessions</h1>
          <p className="text-sm text-[#5C5856] mt-1">
            Reserve fixed weekly slots for regular clients.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-150 min-h-[36px] ${
            showForm
              ? "bg-white border border-[#E5E0D8] text-[#1C1C1E] hover:bg-[#F4F1EC]"
              : "bg-[#5C7A6B] text-white hover:bg-[#496158]"
          }`}
        >
          {showForm ? (
            <>
              <X size={14} />
              Cancel
            </>
          ) : (
            <>
              <Plus size={14} />
              Reserve Slot
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-[#1C1C1E] mb-5 flex items-center gap-2">
            <Plus size={14} className="text-[#5C7A6B]" />
            Reserve a weekly slot
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#5C5856] mb-1.5">
                  Client *
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
                >
                  <option value="">Select client...</option>
                  {clientsData.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#5C5856] mb-1.5">
                  Day of week *
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
                >
                  {DAYS_OF_WEEK.map((day, i) => (
                    <option key={i} value={i}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#5C5856] mb-1.5">
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#5C5856] mb-1.5">
                  End time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#5C5856] mb-1.5">
                  Session type
                </label>
                <input
                  type="text"
                  value={sessionTypeName}
                  onChange={(e) => setSessionTypeName(e.target.value)}
                  placeholder="e.g. Regular"
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] placeholder:text-[#8A8480] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#5C5856] mb-1.5">
                  Fee (Rs.)
                </label>
                <input
                  type="number"
                  min={0}
                  value={amountInr}
                  onChange={(e) => setAmountInr(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={create.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#5C7A6B] text-white text-sm font-medium transition-all duration-150 hover:bg-[#496158] disabled:opacity-60 min-h-[36px]"
              >
                {create.isPending ? "Reserving..." : "Reserve Slot"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reservations table */}
      {reservationsData.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-16 flex flex-col items-center justify-center text-center">
          <Repeat size={40} className="text-[#C5BFB8] mb-4" strokeWidth={1.5} />
          <p className="text-base font-medium text-[#5C5856]">
            No recurring slots yet
          </p>
          <p className="text-sm text-[#8A8480] mt-1">
            Reserve a weekly slot and it will be blocked on the booking page automatically.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#5C7A6B] text-white text-sm font-medium transition-all duration-150 hover:bg-[#496158]"
          >
            <Plus size={14} />
            Reserve your first slot
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#E5E0D8] bg-[#F4F1EC]">
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480]">Client</span>
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480] w-28">Schedule</span>
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480] w-28">Session Type</span>
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480] w-20">Status</span>
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480] w-20">Actions</span>
          </div>

          {/* Table rows */}
          {reservationsData.map((r: any) => {
            const clientData = r.clients as {
              full_name: string;
              email: string | null;
            } | null;
            const status = getStatusBadge(r);
            const initials = clientData?.full_name
              ? clientData.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "?";

            return (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-4 items-center border-b border-[#E5E0D8] last:border-b-0 hover:bg-[#F9F8F5] transition-colors duration-150"
              >
                {/* Client */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white bg-[#5C7A6B]">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#1C1C1E] truncate">
                      {clientData?.full_name ?? "Unknown"}
                    </div>
                    {clientData?.email && (
                      <div className="text-xs text-[#8A8480] truncate">
                        {clientData.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule */}
                <div className="w-28">
                  <div className="flex items-center gap-1 text-xs font-medium text-[#1C1C1E]">
                    <CalendarDays size={11} className="text-[#8A8480]" />
                    {DAYS_OF_WEEK[r.day_of_week]}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#5C5856] mt-0.5">
                    <Clock size={11} className="text-[#8A8480]" />
                    {r.start_time}–{r.end_time}
                  </div>
                </div>

                {/* Session type */}
                <div className="w-28">
                  {r.session_type_name ? (
                    <span className="text-xs text-[#5C5856]">
                      {r.session_type_name}
                    </span>
                  ) : (
                    <span className="text-xs text-[#8A8480]">—</span>
                  )}
                  {r.amount_inr > 0 && (
                    <div className="text-xs text-[#B5733A] font-medium mt-0.5">
                      Rs. {(r.amount_inr / 100).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="w-20">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-[999px] text-[11px] font-medium"
                    style={{ backgroundColor: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="w-20 flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm("Release this recurring slot?")) {
                        release.mutate({ id: r.id });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#C0705A] bg-[#FBF0ED] hover:bg-[#F9EDED] transition-all duration-150"
                  >
                    <Trash2 size={11} />
                    Release
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
