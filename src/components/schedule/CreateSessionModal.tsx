import { useState, useMemo, useEffect } from "react";
import {
  useClientsList,
  useCreateSession,
  useClientSessionTypes,
} from "@/lib/api-hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { X, Clock, IndianRupee, AlertCircle } from "lucide-react";
import { toISTDateString } from "@/lib/date-utils";
import { Select } from "@/components/ui/Select";

interface CreateSessionModalProps {
  onClose: () => void;
  onCreated: () => void;
}

interface SessionTypeOption {
  id: string;
  name: string;
  duration_mins: number;
  rate_inr: number;
  is_active: boolean;
  is_default?: boolean;
}

function computeEndTime(start: string, durationMins: number): string {
  const parts = start.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const totalMins = h * 60 + m + durationMins;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export default function CreateSessionModal({
  onClose,
  onCreated,
}: CreateSessionModalProps) {
  const clientsQuery = useClientsList();
  const practiceSessionTypesQuery = useQuery({
    queryKey: ["session-types"],
    queryFn: () => api.sessionType.list(),
  });

  const [clientId, setClientId] = useState("");
  const [sessionTypeId, setSessionTypeId] = useState("");
  const [date, setDate] = useState(toISTDateString(new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:50");

  // Fetch client-specific session types when a client is selected
  const clientSessionTypesQuery = useClientSessionTypes(clientId);

  const clientsArray = useMemo(() => {
    const d = clientsQuery.data as any;
    return Array.isArray(d) ? d : (d?.data ?? []);
  }, [clientsQuery.data]);

  const practiceSessionTypes = useMemo(() => {
    const d = practiceSessionTypesQuery.data as any;
    const types = (Array.isArray(d) ? d : (d?.data ?? [])) as SessionTypeOption[];
    return types.filter((t) => t.is_active);
  }, [practiceSessionTypesQuery.data]);

  const clientSessionTypes = useMemo(() => {
    const d = clientSessionTypesQuery.data as any;
    const types = (Array.isArray(d) ? d : (d?.data ?? [])) as SessionTypeOption[];
    return types.filter((t) => t.is_active);
  }, [clientSessionTypesQuery.data]);

  // Determine which session types to show and whether we're using fallback
  const { sessionTypes, usingFallback } = useMemo(() => {
    if (!clientId) {
      return { sessionTypes: practiceSessionTypes, usingFallback: false };
    }
    if (clientSessionTypesQuery.isLoading) {
      return { sessionTypes: [], usingFallback: false };
    }
    if (clientSessionTypes.length > 0) {
      return { sessionTypes: clientSessionTypes, usingFallback: false };
    }
    return { sessionTypes: practiceSessionTypes, usingFallback: true };
  }, [
    clientId,
    clientSessionTypes,
    practiceSessionTypes,
    clientSessionTypesQuery.isLoading,
  ]);

  // Reset session type when client changes
  useEffect(() => {
    setSessionTypeId("");
    setEndTime(computeEndTime(startTime, 50)); // reset to default 50 min
  }, [clientId]);

  // When session types load after client selection, auto-select default
  useEffect(() => {
    if (!clientId || clientSessionTypesQuery.isLoading) return;
    const defaultType = clientSessionTypes.find((t) => t.is_default);
    if (defaultType) {
      setSessionTypeId(defaultType.id);
      setEndTime(computeEndTime(startTime, defaultType.duration_mins));
    }
  }, [clientSessionTypes, clientId, clientSessionTypesQuery.isLoading]);

  const selectedType = useMemo(
    () => sessionTypes.find((t) => t.id === sessionTypeId) ?? null,
    [sessionTypes, sessionTypeId]
  );

  function handleTypeChange(typeId: string) {
    setSessionTypeId(typeId);
    const type = sessionTypes.find((t) => t.id === typeId);
    if (type && startTime) {
      setEndTime(computeEndTime(startTime, type.duration_mins));
    }
  }

  function handleStartTimeChange(val: string) {
    setStartTime(val);
    if (selectedType) {
      setEndTime(computeEndTime(val, selectedType.duration_mins));
    }
  }

  // Build Select options for clients
  const clientOptions = useMemo(
    () =>
      clientsArray.map((c: { id: string; full_name: string; email: string }) => ({
        value: c.id,
        label: `${c.full_name}${c.email ? ` (${c.email})` : ""}`,
      })),
    [clientsArray]
  );

  // Build Select options for session types
  const sessionTypeOptions = useMemo(() => {
    const opts = sessionTypes.map((t) => ({
      value: t.id,
      label: `${t.name} · ${t.duration_mins} min${
        t.rate_inr > 0
          ? ` · ₹${(t.rate_inr / 100).toLocaleString("en-IN")}`
          : " · Free"
      }`,
    }));
    return opts;
  }, [sessionTypes]);

  const createSession = useCreateSession();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }

    const starts_at = new Date(`${date}T${startTime}:00+05:30`).toISOString();
    const ends_at = new Date(`${date}T${endTime}:00+05:30`).toISOString();
    const amount_inr = selectedType?.rate_inr ?? 0;
    const session_type_name = selectedType?.name ?? undefined;

    createSession.mutate(
      {
        client_id: clientId,
        session_type_name,
        starts_at,
        ends_at,
        amount_inr,
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

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isLoadingSessionTypes = clientId && clientSessionTypesQuery.isLoading;

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
        className="bg-surface w-full space-y-5 p-8"
        style={{
          maxWidth: "520px",
          borderRadius: "16px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          margin: "0 16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client picker */}
          <div>
            <label
              className="ui-label"
              htmlFor="session-client"
            >
              Client
            </label>
            <Select
              id="session-client"
              value={clientId}
              onChange={(val) => setClientId(val)}
              options={clientOptions}
              placeholder="Select a client…"
              disabled={clientsQuery.isLoading}
              required
            />
          </div>

          {/* Session type — shown once client is selected or session types exist */}
          {(sessionTypes.length > 0 || isLoadingSessionTypes) && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="ui-label" htmlFor="session-type">
                  Session type
                </label>
                {usingFallback && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-medium"
                    style={{ color: "#B5733A" }}
                  >
                    <AlertCircle size={11} strokeWidth={1.5} />
                    Using default session types
                  </span>
                )}
              </div>
              <Select
                id="session-type"
                value={sessionTypeId}
                onChange={handleTypeChange}
                options={sessionTypeOptions}
                placeholder={
                  isLoadingSessionTypes
                    ? "Loading session types…"
                    : "Select a session type…"
                }
                disabled={!!isLoadingSessionTypes}
              />

              {/* Rate + duration info strip */}
              {selectedType && (
                <div
                  className="mt-2 flex items-center gap-4 px-3 py-2 rounded-[8px]"
                  style={{ background: "#F4F1EC" }}
                >
                  <div
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    <Clock size={12} strokeWidth={1.5} />
                    {selectedType.duration_mins} min
                  </div>
                  <div
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    <IndianRupee size={11} strokeWidth={1.5} />
                    {selectedType.rate_inr > 0
                      ? (selectedType.rate_inr / 100).toLocaleString("en-IN")
                      : "Free"}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="ui-label" htmlFor="session-date">
              Date
            </label>
            <input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="ui-input"
            />
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ui-label" htmlFor="session-start-time">
                Start time
              </label>
              <input
                id="session-start-time"
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label" htmlFor="session-end-time">
                End time
                {selectedType && (
                  <span
                    className="ml-1.5 text-[11px] font-normal"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    (auto)
                  </span>
                )}
              </label>
              <input
                id="session-end-time"
                type="time"
                value={endTime}
                onChange={
                  selectedType
                    ? undefined
                    : (e) => setEndTime(e.target.value)
                }
                readOnly={!!selectedType}
                required
                className="ui-input"
                style={
                  selectedType
                    ? {
                        background: "#F4F1EC",
                        color: "var(--color-ink-secondary)",
                        cursor: "default",
                      }
                    : undefined
                }
              />
            </div>
          </div>

          {createSession.error && (
            <p className="text-xs" style={{ color: "var(--color-danger)" }}>
              {createSession.error.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={createSession.isPending || !clientId}
              className="flex-1 py-2.5 rounded-small text-sm font-semibold text-white transition-all disabled:opacity-50 hover:-translate-y-px"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 2px 8px rgba(92,122,107,0.25)",
              }}
            >
              {createSession.isPending ? "Creating…" : "Create Session"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
