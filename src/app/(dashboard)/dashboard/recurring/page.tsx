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

  if (reservations.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-48 bg-bg rounded-small animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-card rounded-card border border-border shadow-card animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Repeat size={22} className="text-sage" />
            <h1 className="text-2xl font-semibold text-ink">
              Fixed Weekly Slots
            </h1>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            Reserve recurring time slots for regular clients. These slots are
            blocked on the calendar and booking page.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? "btn-secondary" : "btn-primary"}
        >
          {showForm ? (
            <>
              <X size={14} /> Cancel
            </>
          ) : (
            <>
              <Plus size={14} /> Reserve Slot
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-card rounded-card border border-border shadow-card p-7 space-y-5 animate-slide-up"
        >
          <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
            <Plus size={14} className="text-sage" /> Reserve a weekly slot
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="ui-label">Client *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="ui-input"
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
              <label className="ui-label">Day of week *</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="ui-input"
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
              <label className="ui-label">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label">Session type</label>
              <input
                type="text"
                value={sessionTypeName}
                onChange={(e) => setSessionTypeName(e.target.value)}
                placeholder="e.g. Regular"
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label">Fee (Rs.)</label>
              <input
                type="number"
                min={0}
                value={amountInr}
                onChange={(e) => setAmountInr(Number(e.target.value))}
                className="ui-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={create.isPending}
            className="btn-primary"
          >
            {create.isPending ? "Reserving..." : "Reserve Slot"}
          </button>
        </form>
      )}

      {/* Reservations list */}
      {reservationsData.length === 0 ? (
        <div className="bg-card rounded-card border border-border shadow-card p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-bg mx-auto mb-3 flex items-center justify-center">
            <Repeat size={20} className="text-ink-tertiary" />
          </div>
          <p className="text-sm text-ink-secondary font-medium">
            No recurring slots reserved
          </p>
          <p className="text-xs text-ink-tertiary mt-1">
            Reserve weekly slots for regular clients so their time is always
            blocked
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-card border border-border shadow-card overflow-hidden divide-y divide-border">
          {reservationsData.map((r: any) => {
            const clientData = r.clients as {
              full_name: string;
              email: string | null;
            } | null;
            return (
              <div
                key={r.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-bg transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-bg flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-teal" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {clientData?.full_name ?? "Unknown"}
                    </div>
                    <div className="text-xs text-ink-secondary flex items-center gap-2.5 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={10} />
                        {DAYS_OF_WEEK[r.day_of_week]}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={10} />
                        {r.start_time}--{r.end_time}
                      </span>
                      {r.session_type_name && (
                        <span className="text-ink-tertiary">
                          {r.session_type_name}
                        </span>
                      )}
                      {r.amount_inr > 0 && (
                        <span className="text-gold font-medium">
                          Rs.{(r.amount_inr / 100).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Release this recurring slot?")) {
                      release.mutate({ id: r.id });
                    }
                  }}
                  className="btn-danger btn-sm"
                >
                  <Trash2 size={12} /> Release
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
