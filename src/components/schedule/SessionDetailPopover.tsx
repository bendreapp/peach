import { useState } from "react";
import { X, CheckCircle2, XCircle, UserX, Video, FileText, Clock, IndianRupee, Pencil, Trash2 } from "lucide-react";
import { formatTimeIST, formatDateIST, toISTDateString } from "@/lib/date-utils";
import Link from "next/link";

interface SessionClient {
  full_name: string;
  email: string;
  phone: string | null;
}

interface SessionData {
  id: string;
  starts_at: string;
  ends_at: string;
  duration_mins: number;
  status: string;
  payment_status: string;
  amount_inr: number | null;
  session_type_name: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  cancellation_reason: string | null;
  clients: SessionClient;
  client_name?: string;
}

interface SessionDetailPopoverProps {
  session: SessionData;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onMarkNoShow: () => void;
  onReschedule: (data: { session_id: string; starts_at: string; ends_at: string }) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending_approval: { label: "Awaiting approval", className: "bg-amber-50 text-amber" },
  scheduled: { label: "Scheduled", className: "bg-sage-50 text-sage" },
  completed: { label: "Completed", className: "bg-bg text-ink-secondary" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600" },
  no_show: { label: "No show", className: "bg-red-50 text-red-600" },
};

const PAYMENT_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Payment pending", className: "bg-amber-50 text-amber" },
  paid: { label: "Paid", className: "bg-sage-50 text-sage" },
  refunded: { label: "Refunded", className: "bg-bg text-ink-secondary" },
  waived: { label: "Free", className: "bg-sage-50 text-sage" },
};

function toTimeValue(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    hour12: false,
  });
}

export default function SessionDetailPopover({
  session,
  onClose,
  onApprove,
  onReject,
  onComplete,
  onCancel,
  onMarkNoShow,
  onReschedule,
  onDelete,
  isLoading,
}: SessionDetailPopoverProps) {
  const s = session;
  const client = s.clients ?? { full_name: s.client_name ?? "Client", email: "", phone: null };
  const statusBadge = STATUS_BADGES[s.status] ?? { label: s.status, className: "bg-bg text-ink-secondary" };
  const paymentBadge = PAYMENT_BADGES[s.payment_status] ?? { label: s.payment_status, className: "bg-bg text-ink-secondary" };

  const canEdit = s.status === "pending_approval" || s.status === "scheduled";

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(toISTDateString(new Date(s.starts_at)));
  const [rescheduleStart, setRescheduleStart] = useState(toTimeValue(s.starts_at));
  const [rescheduleEnd, setRescheduleEnd] = useState(toTimeValue(s.ends_at));
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleRescheduleSubmit() {
    const starts_at = new Date(`${rescheduleDate}T${rescheduleStart}:00+05:30`).toISOString();
    const ends_at = new Date(`${rescheduleDate}T${rescheduleEnd}:00+05:30`).toISOString();
    onReschedule({ session_id: s.id, starts_at, ends_at });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(s.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-surface rounded-card border border-border shadow-xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-sage">
                {client.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">{client.full_name}</h3>
              <p className="text-xs text-ink-tertiary">{client.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-ink-tertiary hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Session details */}
        <div className="bg-bg/50 rounded-small p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-ink">
            <Clock size={14} className="text-ink-tertiary" />
            <span>{formatDateIST(s.starts_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-secondary">
            <span className="ml-[22px]">
              {formatTimeIST(s.starts_at)} – {formatTimeIST(s.ends_at)} · {s.duration_mins} min
            </span>
          </div>
          {s.session_type_name && (
            <div className="ml-[22px] text-xs text-ink-tertiary">{s.session_type_name}</div>
          )}
          {s.amount_inr != null && s.amount_inr > 0 && (
            <div className="flex items-center gap-1 ml-[22px] text-xs text-ink-secondary">
              <IndianRupee size={10} />
              {(s.amount_inr / 100).toLocaleString("en-IN")}
            </div>
          )}
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium ${paymentBadge.className}`}>
            {paymentBadge.label}
          </span>
        </div>

        {/* Cancellation reason */}
        {s.status === "cancelled" && s.cancellation_reason && (
          <p className="text-xs text-red-600 bg-red-50 rounded-small px-3 py-2">
            Reason: {s.cancellation_reason}
          </p>
        )}

        {/* Reschedule form */}
        {isRescheduling && (
          <div className="bg-bg rounded-small p-3 space-y-3 border border-border">
            <p className="text-xs font-medium text-ink-secondary">Reschedule session</p>
            <div>
              <label className="block text-xs text-ink-tertiary mb-1">Date</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-tertiary mb-1">Start</label>
                <input
                  type="time"
                  value={rescheduleStart}
                  onChange={(e) => setRescheduleStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-tertiary mb-1">End</label>
                <input
                  type="time"
                  value={rescheduleEnd}
                  onChange={(e) => setRescheduleEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRescheduleSubmit}
                disabled={isLoading}
                className="flex-1 bg-sage text-white py-2 rounded-small text-xs font-semibold hover:bg-sage-dark transition-all disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Confirm Reschedule"}
              </button>
              <button
                type="button"
                onClick={() => setIsRescheduling(false)}
                className="px-3 py-2 rounded-small border border-border text-xs font-medium text-ink-secondary hover:bg-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {s.status === "pending_approval" && (
            <>
              <button
                onClick={onApprove}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small bg-sage text-white text-xs font-semibold hover:bg-sage-dark transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <XCircle size={14} />
                Decline
              </button>
            </>
          )}

          {s.status === "scheduled" && (
            <>
              <button
                onClick={onComplete}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small bg-sage text-white text-xs font-semibold hover:bg-sage-dark transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                Complete
              </button>
              <button
                onClick={onMarkNoShow}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <UserX size={14} />
                No Show
              </button>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small border border-border text-ink-secondary text-xs font-semibold hover:bg-bg transition-all disabled:opacity-50"
              >
                <XCircle size={14} />
                Cancel
              </button>
              {s.zoom_start_url && (
                <a
                  href={s.zoom_start_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-all"
                >
                  <Video size={14} />
                  Zoom
                </a>
              )}
            </>
          )}

          {/* Reschedule button (for pending/scheduled) */}
          {canEdit && !isRescheduling && (
            <button
              onClick={() => setIsRescheduling(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small border border-border text-ink-secondary text-xs font-semibold hover:bg-bg transition-all disabled:opacity-50"
            >
              <Pencil size={14} />
              Reschedule
            </button>
          )}

          {(s.status === "scheduled" || s.status === "completed" || s.status === "no_show") && (
            <Link
              href={`/dashboard/notes/new?session_id=${s.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small border border-border text-ink-secondary text-xs font-semibold hover:bg-bg transition-all"
            >
              <FileText size={14} />
              Notes
            </Link>
          )}

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-small text-xs font-semibold transition-all disabled:opacity-50 ${
              confirmDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-red-200 text-red-600 hover:bg-red-50"
            }`}
          >
            <Trash2 size={14} />
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
