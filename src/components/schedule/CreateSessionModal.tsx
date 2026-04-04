import { useState, useMemo } from "react";
import { useClientsList, useTherapistMe, useCreateSession } from "@/lib/api-hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { X } from "lucide-react";
import { toISTDateString } from "@/lib/date-utils";

interface CreateSessionModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateSessionModal({ onClose, onCreated }: CreateSessionModalProps) {
  const clients = useClientsList();
  const therapist = useTherapistMe();
  const sessionTypesQuery = useQuery({
    queryKey: ["session-types"],
    queryFn: () => api.sessionType.list(),
  });

  const [clientId, setClientId] = useState("");
  const [sessionTypeId, setSessionTypeId] = useState("");
  const [date, setDate] = useState(toISTDateString(new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:50");

  const clientsArray = useMemo(() => {
    const d = clients.data as any;
    return Array.isArray(d) ? d : (d?.data ?? []);
  }, [clients.data]);

  const sessionTypes = useMemo(() => {
    const d = sessionTypesQuery.data as any;
    const types = (Array.isArray(d) ? d : (d?.data ?? [])) as {
      id: string; name: string; duration_mins: number; rate_inr: number; is_active: boolean;
    }[];
    return types.filter((t: any) => t.is_active);
  }, [sessionTypesQuery.data]);

  function computeEndTime(start: string, durationMins: number): string {
    const parts = start.split(":").map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    const totalMins = h * 60 + m + durationMins;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }

  // Auto-calculate end time when session type changes
  function handleTypeChange(typeId: string) {
    setSessionTypeId(typeId);
    const type = sessionTypes.find((t) => t.id === typeId);
    if (type && startTime) {
      setEndTime(computeEndTime(startTime, type.duration_mins));
    }
  }

  function handleStartTimeChange(val: string) {
    setStartTime(val);
    const type = sessionTypes.find((t) => t.id === sessionTypeId);
    if (type) {
      setEndTime(computeEndTime(val, type.duration_mins));
    }
  }

  const createSession = useCreateSession();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const starts_at = new Date(`${date}T${startTime}:00+05:30`).toISOString();
    const ends_at = new Date(`${date}T${endTime}:00+05:30`).toISOString();
    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);
    const duration_mins = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

    createSession.mutate(
      {
        client_id: clientId,
        session_type_name: sessionTypeId || undefined,
        starts_at,
        ends_at,
        duration_mins,
        status: "scheduled",
        payment_status: "pending",
        amount_inr: 0,
      },
      {
        onSuccess: () => {
          toast.success("Session created");
          onCreated();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(28,28,30,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add session"
        className="bg-surface w-full max-w-md space-y-5 p-8"
        style={{
          borderRadius: "16px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3
            className="text-xl font-bold"
            style={{ color: "var(--color-ink)", letterSpacing: "-0.01em" }}
          >
            New Session
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-small transition-colors hover:bg-bg"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client picker */}
          <div>
            <label className="ui-label">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="ui-input appearance-none"
            >
              <option value="">Select a client…</option>
              {clientsArray.map((c: { id: string; full_name: string; email: string }) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Session type */}
          {sessionTypes.length > 0 && (
            <div>
              <label className="ui-label">Session type</label>
              <select
                value={sessionTypeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="ui-input appearance-none"
              >
                <option value="">Default</option>
                {sessionTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.duration_mins} min
                    {t.rate_inr > 0
                      ? ` · ₹${(t.rate_inr / 100).toLocaleString("en-IN")}`
                      : " · Free"}
                    )
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="ui-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="ui-input"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ui-label">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
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
          </div>

          {createSession.error && (
            <p className="text-xs" style={{ color: "var(--color-danger)" }}>
              {createSession.error.message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={createSession.isPending || !clientId}
              className="flex-1 py-2.5 rounded-small text-sm font-semibold text-white transition-all disabled:opacity-50 hover:-translate-y-px"
              style={{ background: "var(--color-primary)", boxShadow: "0 2px 8px rgba(74,111,165,0.25)" }}
            >
              {createSession.isPending ? "Creating…" : "Create Session"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
