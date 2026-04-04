import { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  UserX,
  Video,
  FileText,
  Clock,
  IndianRupee,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
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

// Design-system badge styles
const STATUS_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  pending_approval: { label: "Awaiting approval", bg: "#FBF0E8", color: "#B5733A" },
  scheduled: { label: "Scheduled", bg: "#EAF4F1", color: "#3D8B7A" },
  completed: { label: "Completed", bg: "#F0EFED", color: "#6B6460" },
  cancelled: { label: "Cancelled", bg: "#F9EDED", color: "#A0504A" },
  no_show: { label: "No show", bg: "#F9EDED", color: "#A0504A" },
};

const PAYMENT_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "Payment pending", bg: "#FBF0E8", color: "#B5733A" },
  paid: { label: "Paid", bg: "#EAF4F1", color: "#3D8B7A" },
  refunded: { label: "Refunded", bg: "#F0EFED", color: "#6B6460" },
  waived: { label: "Free", bg: "#EAF4F1", color: "#3D8B7A" },
};

// Avatar color based on initial
function getAvatarColor(name: string): string {
  const colors = ["#5C7A6B", "#7BAF9E", "#D4956A", "#457A6C", "#6B8FBF"];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx]!;
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
  const client = s.clients ?? {
    full_name: s.client_name ?? "Client",
    email: "",
    phone: null,
  };
  const statusBadge = STATUS_BADGES[s.status] ?? {
    label: s.status,
    bg: "#F0EFED",
    color: "#6B6460",
  };
  const paymentBadge = PAYMENT_BADGES[s.payment_status] ?? {
    label: s.payment_status,
    bg: "#F0EFED",
    color: "#6B6460",
  };

  const canEdit = s.status === "pending_approval" || s.status === "scheduled";
  const avatarColor = getAvatarColor(client.full_name);

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(
    toISTDateString(new Date(s.starts_at))
  );
  const [rescheduleStart, setRescheduleStart] = useState(toTimeValue(s.starts_at));
  const [rescheduleEnd, setRescheduleEnd] = useState(toTimeValue(s.ends_at));
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleRescheduleSubmit() {
    const starts_at = new Date(
      `${rescheduleDate}T${rescheduleStart}:00+05:30`
    ).toISOString();
    const ends_at = new Date(
      `${rescheduleDate}T${rescheduleEnd}:00+05:30`
    ).toISOString();
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
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(28,28,30,0.2)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Session details"
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden animate-slide-in-right"
        style={{
          width: "400px",
          background: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${avatarColor}18` }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: avatarColor }}
              >
                {client.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3
                className="text-sm font-semibold leading-snug"
                style={{ color: "var(--color-ink)" }}
              >
                {client.full_name}
              </h3>
              {client.email && (
                <p
                  className="text-xs leading-snug"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  {client.email}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-small transition-colors hover:bg-bg"
            style={{ color: "var(--color-ink-tertiary)" }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Session time block */}
          <div
            className="rounded-small p-4 space-y-2"
            style={{ background: "var(--color-bg)" }}
          >
            <div
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--color-ink)" }}
            >
              <Calendar size={14} style={{ color: "var(--color-ink-tertiary)" }} />
              {formatDateIST(s.starts_at)}
            </div>
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              <Clock size={14} style={{ color: "var(--color-ink-tertiary)" }} />
              {formatTimeIST(s.starts_at)} – {formatTimeIST(s.ends_at)}
              <span style={{ color: "var(--color-ink-tertiary)" }}>
                · {s.duration_mins} min
              </span>
            </div>
            {s.session_type_name && (
              <p
                className="text-xs pl-[22px]"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {s.session_type_name}
              </p>
            )}
            {s.amount_inr != null && s.amount_inr > 0 && (
              <div
                className="flex items-center gap-1 pl-[22px] text-xs"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                <IndianRupee size={10} />
                {(s.amount_inr / 100).toLocaleString("en-IN")}
              </div>
            )}
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium"
              style={{ background: statusBadge.bg, color: statusBadge.color }}
            >
              {statusBadge.label}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium"
              style={{ background: paymentBadge.bg, color: paymentBadge.color }}
            >
              {paymentBadge.label}
            </span>
          </div>

          {/* Cancellation reason */}
          {s.status === "cancelled" && s.cancellation_reason && (
            <div
              className="rounded-small px-3 py-2 text-xs"
              style={{ background: "#F9EDED", color: "#A0504A" }}
            >
              Reason: {s.cancellation_reason}
            </div>
          )}

          {/* Reschedule form */}
          {isRescheduling && (
            <div
              className="rounded-small p-4 space-y-3 border"
              style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-ink-tertiary)", letterSpacing: "0.08em" }}
              >
                Reschedule session
              </p>
              <div>
                <label className="ui-label">Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="ui-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ui-label">Start</label>
                  <input
                    type="time"
                    value={rescheduleStart}
                    onChange={(e) => setRescheduleStart(e.target.value)}
                    className="ui-input"
                  />
                </div>
                <div>
                  <label className="ui-label">End</label>
                  <input
                    type="time"
                    value={rescheduleEnd}
                    onChange={(e) => setRescheduleEnd(e.target.value)}
                    className="ui-input"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRescheduleSubmit}
                  disabled={isLoading}
                  className="flex-1 py-2 rounded-small text-xs font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}
                >
                  {isLoading ? "Saving..." : "Confirm Reschedule"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="px-3 py-2 rounded-small border text-xs font-medium transition-colors hover:bg-bg"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {/* Primary actions */}
            {s.status === "pending_approval" && (
              <div className="flex gap-2">
                <button
                  onClick={onApprove}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-small text-sm font-semibold text-white transition-all disabled:opacity-50 hover:-translate-y-px"
                  style={{ background: "var(--color-primary)" }}
                >
                  <CheckCircle2 size={15} />
                  Approve
                </button>
                <button
                  onClick={onReject}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-small text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-90"
                  style={{
                    background: "#F9EDED",
                    color: "#A0504A",
                    border: "1px solid #F5D9D2",
                  }}
                >
                  <XCircle size={15} />
                  Decline
                </button>
              </div>
            )}

            {s.status === "scheduled" && (
              <div className="flex gap-2">
                <button
                  onClick={onComplete}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-small text-sm font-semibold text-white transition-all disabled:opacity-50 hover:-translate-y-px"
                  style={{ background: "var(--color-primary)" }}
                >
                  <CheckCircle2 size={15} />
                  Mark Complete
                </button>
                {s.zoom_start_url && (
                  <a
                    href={s.zoom_start_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-small text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      background: "rgba(74,111,165,0.1)",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Video size={15} />
                    Zoom
                  </a>
                )}
              </div>
            )}

            {/* Secondary actions row */}
            <div className="flex flex-wrap gap-2">
              {canEdit && !isRescheduling && (
                <button
                  onClick={() => setIsRescheduling(true)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small border text-xs font-medium transition-colors hover:bg-bg disabled:opacity-50"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  <Pencil size={13} />
                  Reschedule
                </button>
              )}

              {s.status === "scheduled" && (
                <>
                  <button
                    onClick={onMarkNoShow}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small border text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: "#F9EDED",
                      borderColor: "#F5D9D2",
                      color: "#A0504A",
                    }}
                  >
                    <UserX size={13} />
                    No Show
                  </button>
                  <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small border text-xs font-medium transition-colors hover:bg-bg disabled:opacity-50"
                    style={{
                      borderColor: "var(--color-border)",
                      color: "var(--color-ink-secondary)",
                    }}
                  >
                    <XCircle size={13} />
                    Cancel
                  </button>
                </>
              )}

              {(s.status === "scheduled" ||
                s.status === "completed" ||
                s.status === "no_show") && (
                <Link
                  href={`/dashboard/notes/new?session_id=${s.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small border text-xs font-medium transition-colors hover:bg-bg"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  <FileText size={13} />
                  Add Note
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Drawer footer with delete */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-small text-xs font-medium transition-all disabled:opacity-50"
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
            <Trash2 size={13} />
            {confirmDelete ? "Confirm Delete" : "Delete session"}
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs transition-colors hover:text-ink"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

    </>
  );
}
