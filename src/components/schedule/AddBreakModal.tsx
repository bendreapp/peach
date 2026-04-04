import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { formatDateIST } from "@/lib/date-utils";

interface BreakData {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
}

interface AddBreakModalProps {
  defaultStart: string; // ISO datetime
  defaultEnd: string;   // ISO datetime
  existingBreak?: BreakData; // If provided, we're in edit mode
  onClose: () => void;
  onSave: (data: { start_at: string; end_at: string; reason?: string }) => void;
  onUpdate?: (data: { id: string; start_at: string; end_at: string; reason?: string }) => void;
  onDelete?: (id: string) => void;
  isSaving: boolean;
}

function toTimeValue(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    hour12: false,
  });
}

function toISTDateStr(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).formatToParts(new Date(iso));
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

export default function AddBreakModal({
  defaultStart,
  defaultEnd,
  existingBreak,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  isSaving,
}: AddBreakModalProps) {
  const isEditing = !!existingBreak;
  const [startTime, setStartTime] = useState(toTimeValue(defaultStart));
  const [endTime, setEndTime] = useState(toTimeValue(defaultEnd));
  const [reason, setReason] = useState(existingBreak?.reason ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dateStr = toISTDateStr(defaultStart);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const start_at = new Date(`${dateStr}T${startTime}:00+05:30`).toISOString();
    const end_at = new Date(`${dateStr}T${endTime}:00+05:30`).toISOString();
    if (isEditing && onUpdate) {
      onUpdate({ id: existingBreak.id, start_at, end_at, reason: reason || undefined });
    } else {
      onSave({ start_at, end_at, reason: reason || undefined });
    }
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (existingBreak && onDelete) {
      onDelete(existingBreak.id);
    }
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
        aria-label={isEditing ? "Edit break" : "Add break"}
        className="bg-surface w-full max-w-sm space-y-5 p-7"
        style={{
          borderRadius: "16px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--color-ink)", letterSpacing: "-0.01em" }}
            >
              {isEditing ? "Edit Break" : "Block Time"}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-tertiary)" }}>
              {formatDateIST(defaultStart)}
            </p>
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ui-label">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="ui-input"
              />
            </div>
          </div>

          <div>
            <label className="ui-label">
              Reason{" "}
              <span className="font-normal" style={{ color: "var(--color-ink-tertiary)" }}>
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="e.g. Lunch break, Personal time"
              className="ui-input"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-small text-sm font-semibold text-white transition-all disabled:opacity-50 hover:-translate-y-px"
              style={{ background: "var(--color-primary)", boxShadow: "0 2px 8px rgba(74,111,165,0.25)" }}
            >
              {isSaving ? "Saving…" : isEditing ? "Update" : "Block time"}
            </button>
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                aria-label={confirmDelete ? "Confirm delete break" : "Delete break"}
                className="px-3 py-2.5 rounded-small text-sm font-medium transition-all disabled:opacity-50"
                style={
                  confirmDelete
                    ? { background: "var(--color-danger)", color: "white" }
                    : {
                        background: "rgba(192,112,90,0.08)",
                        color: "var(--color-danger)",
                        border: "1px solid rgba(192,112,90,0.18)",
                      }
                }
              >
                <Trash2 size={14} className="inline -mt-0.5" />
                {confirmDelete ? " Confirm" : ""}
              </button>
            )}
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
