"use client";

import { useState, useRef } from "react";
import {
  useLeadsList,
  useUpdateLead,
  useConvertLeadToClient,
  useSendIntakeForm,
  useLeadIntakeSubmissions,
} from "@/lib/api-hooks";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  MoreHorizontal,
  X,
  LayoutGrid,
  List,
  Clock,
  Tag,
  ChevronRight,
  UserCheck,
  UserX,
  ClipboardList,
  Send,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type ApiStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

interface Lead {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: ApiStatus;
  source?: string;
  notes?: string;
  preferred_times?: string[];
  message?: string;
  created_at: string;
  updated_at?: string;
}

// ── Status mapping: API status → display column ────────────────────────────

const COLUMN_ORDER = [
  "inquiry",
  "consultation_scheduled",
  "assessment",
  "converted",
  "not_a_fit",
] as const;

type ColumnKey = (typeof COLUMN_ORDER)[number];

const COLUMN_META: Record<
  ColumnKey,
  { label: string; apiStatus: ApiStatus; color: string; dotColor: string }
> = {
  inquiry: {
    label: "Inquiry",
    apiStatus: "new",
    color: "#5C7A6B",
    dotColor: "bg-[#5C7A6B]",
  },
  consultation_scheduled: {
    label: "Consultation Scheduled",
    apiStatus: "contacted",
    color: "#D4956A",
    dotColor: "bg-[#D4956A]",
  },
  assessment: {
    label: "Assessment",
    apiStatus: "qualified",
    color: "#7BAF9E",
    dotColor: "bg-[#7BAF9E]",
  },
  converted: {
    label: "Converted",
    apiStatus: "converted",
    color: "#3D8B7A",
    dotColor: "bg-[#3D8B7A]",
  },
  not_a_fit: {
    label: "Not a Fit",
    apiStatus: "lost",
    color: "#C0705A",
    dotColor: "bg-[#C0705A]",
  },
};

const API_TO_COLUMN: Record<ApiStatus, ColumnKey> = {
  new: "inquiry",
  contacted: "consultation_scheduled",
  qualified: "assessment",
  converted: "converted",
  lost: "not_a_fit",
};

// Table view status labels + styles
const TABLE_STATUS_STYLE: Record<
  ApiStatus,
  { label: string; bg: string; text: string }
> = {
  new: { label: "Inquiry", bg: "#EBF0EB", text: "#5C7A6B" },
  contacted: { label: "Consultation Scheduled", bg: "#FBF0E8", text: "#B5733A" },
  qualified: { label: "Assessment", bg: "#EAF4F1", text: "#3D8B7A" },
  converted: { label: "Converted", bg: "#EAF4F1", text: "#3D8B7A" },
  lost: { label: "Not a Fit", bg: "#F9EDED", text: "#A0504A" },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatSource(source?: string) {
  if (!source) return null;
  return source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPreferredTimes(lead: Lead): string[] {
  if (!lead.preferred_times) return [];
  if (Array.isArray(lead.preferred_times)) return lead.preferred_times;
  return [];
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMN_ORDER.map((col) => (
        <div
          key={col}
          className="flex-shrink-0 w-[272px] bg-[#F0EDE7] rounded-xl p-3"
        >
          {/* Column header skeleton */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="h-4 w-28 bg-[#E5E0D8] rounded animate-pulse" />
            <div className="h-5 w-6 bg-[#E5E0D8] rounded-full animate-pulse" />
          </div>
          {/* Card skeletons */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-3 mb-2 animate-pulse"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div className="h-4 w-32 bg-[#F0EDE7] rounded mb-2" />
              <div className="h-3 w-20 bg-[#F0EDE7] rounded mb-2" />
              <div className="h-5 w-16 bg-[#F0EDE7] rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Lead Card (Kanban) ─────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onOpen: (lead: Lead) => void;
  onMenuAction: (lead: Lead, action: "convert" | "not_a_fit" | "notes") => void;
}

function LeadCard({ lead, onDragStart, onOpen, onMenuAction }: LeadCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onClick={() => onOpen(lead)}
      className="bg-white rounded-xl p-3 mb-2 cursor-pointer group select-none"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        transition: "box-shadow 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 12px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
      }}
    >
      {/* Top row: name + 3-dot menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p
          className="text-sm font-semibold leading-tight"
          style={{ color: "#1C1C1E" }}
        >
          {lead.full_name || "Unknown"}
        </p>
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "#8A8480" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#F4F1EC")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "")
            }
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-7 w-44 bg-white rounded-xl z-20 py-1"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                style={{ color: "#1C1C1E" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#F4F1EC")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "")
                }
                onClick={() => {
                  setMenuOpen(false);
                  onMenuAction(lead, "notes");
                }}
              >
                <MessageSquare size={13} style={{ color: "#8A8480" }} />
                Add Note
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                style={{ color: "#3D8B7A" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#EAF4F1")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "")
                }
                onClick={() => {
                  setMenuOpen(false);
                  onMenuAction(lead, "convert");
                }}
              >
                <UserCheck size={13} />
                Convert to Client
              </button>
              <div
                className="my-1 mx-3 border-t"
                style={{ borderColor: "#E5E0D8" }}
              />
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                style={{ color: "#C0705A" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#F9EDED")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "")
                }
                onClick={() => {
                  setMenuOpen(false);
                  onMenuAction(lead, "not_a_fit");
                }}
              >
                <UserX size={13} />
                Mark Not a Fit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date added */}
      <p className="text-xs mb-2.5" style={{ color: "#8A8480" }}>
        {formatDate(lead.created_at)}
      </p>

      {/* Source tag */}
      {lead.source && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: "#EBF0EB", color: "#5C7A6B" }}
        >
          <Tag size={10} />
          {formatSource(lead.source)}
        </span>
      )}
    </div>
  );
}

// ── Right Drawer ───────────────────────────────────────────────────────────

// ── Lead Intake Submission type ────────────────────────────────────────────

interface IntakeQuestionAnswer {
  question_id: string;
  question_text: string;
  field_type: string;
  answer: string | string[] | null;
}

interface LeadIntakeSubmission {
  id: string;
  lead_id: string;
  therapist_id: string;
  access_token: string;
  responses: IntakeQuestionAnswer[] | null;
  sent_at: string;
  submitted_at: string | null;
  created_at: string;
}

interface DrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ApiStatus) => void;
  onConvertToClient: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  onSendIntakeForm: (id: string) => void;
  isSaving: boolean;
  isConverting: boolean;
  isSendingIntake: boolean;
}

function LeadDrawer({
  lead,
  onClose,
  onUpdateStatus,
  onConvertToClient,
  onSaveNotes,
  onSendIntakeForm,
  isSaving,
  isConverting,
  isSendingIntake,
}: DrawerProps) {
  const [notesText, setNotesText] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);

  const intakeSubmissions = useLeadIntakeSubmissions(lead?.id ?? null);
  const submissions: LeadIntakeSubmission[] = Array.isArray(intakeSubmissions.data)
    ? (intakeSubmissions.data as LeadIntakeSubmission[])
    : [];

  if (!lead) return null;

  const preferredTimes = getPreferredTimes(lead);
  const column = API_TO_COLUMN[lead.status];
  const colMeta = COLUMN_META[column];

  function handleSaveNotes() {
    onSaveNotes(lead!.id, notesText);
    setEditingNotes(false);
    setNotesText("");
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-30"
        style={{ background: "rgba(28,28,30,0.2)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-[400px] bg-white z-40 flex flex-col"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: "#E5E0D8" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: colMeta.color }}
            >
              {getInitials(lead.full_name || "?")}
            </div>
            <div>
              <p className="font-semibold text-[15px]" style={{ color: "#1C1C1E" }}>
                {lead.full_name || "Unknown"}
              </p>
              <span
                className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5"
                style={{
                  background: `${colMeta.color}18`,
                  color: colMeta.color,
                }}
              >
                {colMeta.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#8A8480" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#F4F1EC")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "")
            }
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Contact info */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#8A8480", letterSpacing: "0.06em" }}
            >
              Contact
            </p>
            <div className="space-y-2">
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail size={14} style={{ color: "#8A8480" }} />
                  <span className="text-sm" style={{ color: "#5C5856" }}>
                    {lead.email}
                  </span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={14} style={{ color: "#8A8480" }} />
                  <span className="text-sm" style={{ color: "#5C5856" }}>
                    {lead.phone}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar size={14} style={{ color: "#8A8480" }} />
                <span className="text-sm" style={{ color: "#5C5856" }}>
                  Added {formatFullDate(lead.created_at)}
                </span>
              </div>
              {lead.source && (
                <div className="flex items-center gap-3">
                  <Tag size={14} style={{ color: "#8A8480" }} />
                  <span className="text-sm" style={{ color: "#5C5856" }}>
                    {formatSource(lead.source)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preferred times */}
          {preferredTimes.length > 0 && (
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                style={{ color: "#8A8480", letterSpacing: "0.06em" }}
              >
                Preferred Times
              </p>
              <div className="flex flex-wrap gap-2">
                {preferredTimes.map((time, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: "#EAF4F1", color: "#3D8B7A" }}
                  >
                    <Clock size={10} />
                    {time}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          {lead.message && (
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                style={{ color: "#8A8480", letterSpacing: "0.06em" }}
              >
                Message
              </p>
              <p
                className="text-sm leading-relaxed rounded-xl px-4 py-3"
                style={{ background: "#F4F1EC", color: "#5C5856" }}
              >
                {lead.message}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "#8A8480", letterSpacing: "0.06em" }}
              >
                Notes
              </p>
              {!editingNotes && (
                <button
                  onClick={() => {
                    setEditingNotes(true);
                    setNotesText(lead.notes || "");
                  }}
                  className="text-xs font-medium transition-colors"
                  style={{ color: "#5C7A6B" }}
                >
                  {lead.notes ? "Edit" : "+ Add note"}
                </button>
              )}
            </div>

            {editingNotes ? (
              <div>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={4}
                  autoFocus
                  className="w-full resize-none rounded-lg text-sm p-3 outline-none transition-colors"
                  style={{
                    border: "1.5px solid #E5E0D8",
                    color: "#1C1C1E",
                    background: "#FFFFFF",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#5C7A6B")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#E5E0D8")
                  }
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="btn-primary"
                    style={{ fontSize: "13px", padding: "6px 14px" }}
                  >
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingNotes(false);
                      setNotesText("");
                    }}
                    className="btn-secondary"
                    style={{ fontSize: "13px", padding: "6px 14px" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : lead.notes ? (
              <p
                className="text-sm leading-relaxed rounded-xl px-4 py-3"
                style={{ background: "#F4F1EC", color: "#5C5856" }}
              >
                {lead.notes}
              </p>
            ) : (
              <p className="text-sm" style={{ color: "#8A8480" }}>
                No notes yet.
              </p>
            )}
          </div>

          {/* Status timeline */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#8A8480", letterSpacing: "0.06em" }}
            >
              Timeline
            </p>
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C5BFB8" }} />
                <span className="text-xs" style={{ color: "#8A8480" }}>
                  Created {formatFullDate(lead.created_at)}
                </span>
              </div>
              {lead.updated_at && lead.updated_at !== lead.created_at && (
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C5BFB8" }} />
                  <span className="text-xs" style={{ color: "#8A8480" }}>
                    Last updated {formatFullDate(lead.updated_at)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: colMeta.color }}
                />
                <span className="text-xs font-medium" style={{ color: colMeta.color }}>
                  {colMeta.label}
                </span>
              </div>
            </div>
          </div>

          {/* Intake Form section */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#8A8480", letterSpacing: "0.06em" }}
            >
              Intake Form
            </p>

            {intakeSubmissions.isLoading ? (
              <div className="h-10 rounded-lg animate-pulse" style={{ background: "#F4F1EC" }} />
            ) : submissions.length === 0 ? (
              // No submission yet
              <div>
                <p className="text-xs mb-3" style={{ color: "#8A8480" }}>
                  No intake form sent yet.
                </p>
                {lead.email ? (
                  <button
                    onClick={() => onSendIntakeForm(lead.id)}
                    disabled={isSendingIntake}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
                    style={{
                      background: "#EBF0EB",
                      color: "#5C7A6B",
                      border: "1.5px solid #D4E4D4",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSendingIntake)
                        (e.currentTarget as HTMLButtonElement).style.background = "#D4E4D4";
                    }}
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "#EBF0EB")
                    }
                  >
                    <Send size={13} />
                    {isSendingIntake ? "Sending…" : "Send Intake Form"}
                  </button>
                ) : (
                  <p className="text-xs" style={{ color: "#C0705A" }}>
                    Add an email address to send the intake form.
                  </p>
                )}
              </div>
            ) : (() => {
              const latest = submissions[0];
              const isSubmitted = !!latest.submitted_at;

              return (
                <div className="space-y-3">
                  {isSubmitted ? (
                    // Submitted — show responses
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 size={14} style={{ color: "#5C7A6B" }} />
                        <span className="text-xs font-medium" style={{ color: "#5C7A6B" }}>
                          Submitted {formatFullDate(latest.submitted_at!)}
                        </span>
                      </div>
                      {latest.responses && latest.responses.length > 0 ? (
                        <div className="space-y-2.5">
                          {latest.responses.map((r, i) => (
                            <div
                              key={r.question_id ?? i}
                              className="rounded-lg px-3 py-2.5"
                              style={{ background: "#F4F1EC" }}
                            >
                              <p className="text-xs font-medium mb-0.5" style={{ color: "#5C5856" }}>
                                {r.question_text}
                              </p>
                              <p className="text-sm" style={{ color: "#1C1C1E" }}>
                                {Array.isArray(r.answer)
                                  ? r.answer.join(", ")
                                  : r.answer ?? <span style={{ color: "#8A8480" }}>No answer</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: "#8A8480" }}>No responses recorded.</p>
                      )}
                    </div>
                  ) : (
                    // Sent but not submitted
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ClipboardList size={14} style={{ color: "#D4956A" }} />
                        <span className="text-xs" style={{ color: "#8A8480" }}>
                          Sent {formatFullDate(latest.sent_at)} — awaiting response
                        </span>
                      </div>
                      {lead.email && (
                        <button
                          onClick={() => onSendIntakeForm(lead.id)}
                          disabled={isSendingIntake}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
                          style={{
                            background: "#F4F1EC",
                            color: "#8A8480",
                            border: "1.5px solid #E5E0D8",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSendingIntake)
                              (e.currentTarget as HTMLButtonElement).style.background = "#E5E0D8";
                          }}
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.background = "#F4F1EC")
                          }
                        >
                          <RefreshCw size={12} />
                          {isSendingIntake ? "Sending…" : "Resend"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Stage selector */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#8A8480", letterSpacing: "0.06em" }}
            >
              Move to Stage
            </p>
            <div className="space-y-1.5">
              {COLUMN_ORDER.map((col) => {
                const meta = COLUMN_META[col];
                const isActive = lead.status === meta.apiStatus;
                return (
                  <button
                    key={col}
                    onClick={() =>
                      !isActive && onUpdateStatus(lead.id, meta.apiStatus)
                    }
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                    style={{
                      background: isActive ? `${meta.color}12` : "transparent",
                      border: `1.5px solid ${isActive ? meta.color : "#E5E0D8"}`,
                      cursor: isActive ? "default" : "pointer",
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: meta.color }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: isActive ? meta.color : "#5C5856" }}
                    >
                      {meta.label}
                    </span>
                    {isActive && (
                      <span
                        className="ml-auto text-xs font-medium"
                        style={{ color: meta.color }}
                      >
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div
          className="px-6 py-4 border-t space-y-2"
          style={{ borderColor: "#E5E0D8" }}
        >
          <button
            onClick={() => onConvertToClient(lead.id)}
            disabled={isConverting || lead.status === "converted"}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#5C7A6B" }}
            onMouseEnter={(e) => {
              if (!isConverting && lead.status !== "converted")
                (e.currentTarget as HTMLButtonElement).style.background = "#496158";
            }}
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#5C7A6B")
            }
          >
            <UserCheck size={15} />
            {isConverting ? "Converting…" : lead.status === "converted" ? "Already Converted" : "Convert to Client"}
          </button>
          <button
            onClick={() => onUpdateStatus(lead.id, "lost")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: "#C0705A", background: "transparent", border: "1.5px solid #E5E0D8" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#F9EDED";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#C0705A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E0D8";
            }}
          >
            <UserX size={15} />
            Mark Not a Fit
          </button>
        </div>
      </div>
    </>
  );
}

// ── Kanban Column ──────────────────────────────────────────────────────────

interface ColumnProps {
  columnKey: ColumnKey;
  leads: Lead[];
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetColumn: ColumnKey) => void;
  onOpenLead: (lead: Lead) => void;
  onMenuAction: (lead: Lead, action: "convert" | "not_a_fit" | "notes") => void;
  isFirst: boolean;
  onAddLead?: () => void;
}

function KanbanColumn({
  columnKey,
  leads,
  onDragStart,
  onDragOver,
  onDrop,
  onOpenLead,
  onMenuAction,
  isFirst,
  onAddLead,
}: ColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const meta = COLUMN_META[columnKey];

  return (
    <div
      className="flex-shrink-0 w-[272px] flex flex-col rounded-xl"
      style={{ background: "#F0EDE7", minHeight: 400 }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver(e);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, columnKey);
      }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: meta.color }}
        />
        <span
          className="text-sm font-semibold leading-tight"
          style={{ color: "#1C1C1E" }}
        >
          {meta.label}
        </span>
        <span
          className="ml-auto inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold"
          style={{ background: meta.color + "20", color: meta.color }}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        className="flex-1 px-3 pb-3 transition-colors rounded-b-xl"
        style={{
          background: isDragOver ? `${meta.color}10` : "transparent",
          outline: isDragOver ? `2px dashed ${meta.color}50` : "none",
          outlineOffset: "-4px",
        }}
      >
        {leads.length === 0 && !isDragOver ? (
          <div
            className="flex flex-col items-center justify-center py-8 rounded-xl"
            style={{
              border: "1.5px dashed #C8C0B8",
              minHeight: 80,
            }}
          >
            <p className="text-xs" style={{ color: "#8A8480" }}>
              No leads here
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onDragStart={onDragStart}
              onOpen={onOpenLead}
              onMenuAction={onMenuAction}
            />
          ))
        )}

        {/* Add Lead button — first column only */}
        {isFirst && (
          <button
            onClick={onAddLead}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium mt-1 transition-colors"
            style={{ color: "#8A8480" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#5C7A6B";
              (e.currentTarget as HTMLButtonElement).style.background = "#EBF0EB";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#8A8480";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <UserPlus size={12} />
            Add Lead
          </button>
        )}
      </div>
    </div>
  );
}

// ── Table View ─────────────────────────────────────────────────────────────

interface TableViewProps {
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
  onUpdateStatus: (id: string, status: ApiStatus) => void;
}

function TableView({ leads, onOpenLead, onUpdateStatus }: TableViewProps) {
  if (leads.length === 0) {
    return (
      <div
        className="bg-white rounded-xl flex flex-col items-center justify-center py-20"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <UserPlus size={40} style={{ color: "#C5BFB8", marginBottom: 12 }} />
        <p
          className="text-base font-medium mb-1"
          style={{ color: "#5C5856" }}
        >
          No leads yet
        </p>
        <p className="text-sm" style={{ color: "#8A8480" }}>
          Leads will appear here when potential clients reach out.
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {/* Table header */}
      <div
        className="grid border-b px-5 py-3"
        style={{
          gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 80px",
          borderColor: "#E5E0D8",
        }}
      >
        {["Name", "Status", "Source", "Date Added", "Last Contact", ""].map(
          (h) => (
            <span
              key={h}
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "#8A8480", letterSpacing: "0.06em" }}
            >
              {h}
            </span>
          )
        )}
      </div>

      {/* Rows */}
      <div>
        {leads.map((lead, idx) => {
          const style = TABLE_STATUS_STYLE[lead.status] ?? TABLE_STATUS_STYLE.new;
          return (
            <div
              key={lead.id}
              className="grid items-center px-5 py-3.5 transition-colors cursor-pointer"
              style={{
                gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 80px",
                borderBottom:
                  idx < leads.length - 1 ? "1px solid #E5E0D8" : "none",
                background: "transparent",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background =
                  "#F9F8F5")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background =
                  "transparent")
              }
              onClick={() => onOpenLead(lead)}
            >
              {/* Name */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: COLUMN_META[API_TO_COLUMN[lead.status]].color }}
                >
                  {getInitials(lead.full_name || "?")}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "#1C1C1E" }}
                  >
                    {lead.full_name}
                  </p>
                  {lead.email && (
                    <p className="text-xs truncate" style={{ color: "#8A8480" }}>
                      {lead.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: style.bg, color: style.text }}
                >
                  {style.label}
                </span>
              </div>

              {/* Source */}
              <p className="text-sm" style={{ color: "#5C5856" }}>
                {formatSource(lead.source) || (
                  <span style={{ color: "#8A8480" }}>—</span>
                )}
              </p>

              {/* Date Added */}
              <p className="text-sm" style={{ color: "#5C5856" }}>
                {formatDate(lead.created_at)}
              </p>

              {/* Last Contact */}
              <p className="text-sm" style={{ color: "#5C5856" }}>
                {lead.updated_at ? formatDate(lead.updated_at) : (
                  <span style={{ color: "#8A8480" }}>—</span>
                )}
              </p>

              {/* Actions */}
              <div
                className="flex items-center justify-end"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onOpenLead(lead)}
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: "#5C7A6B" }}
                >
                  Open
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggingLead, setDraggingLead] = useState<Lead | null>(null);

  const leads = useLeadsList({ limit: "100", offset: "0" });
  const updateLead = useUpdateLead();
  const convertLead = useConvertLeadToClient();
  const sendIntake = useSendIntakeForm();

  const leadsArray: Lead[] = Array.isArray(leads.data)
    ? (leads.data as Lead[])
    : ((leads.data as { data?: Lead[] })?.data ?? []);

  const filtered = leadsArray.filter(
    (l) =>
      l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search)
  );

  // Group leads into columns
  const columns = Object.fromEntries(
    COLUMN_ORDER.map((col) => [
      col,
      filtered.filter(
        (l) => API_TO_COLUMN[l.status as ApiStatus] === col
      ),
    ])
  ) as Record<ColumnKey, Lead[]>;

  function handleUpdateStatus(leadId: string, newStatus: ApiStatus) {
    updateLead.mutate(
      { id: leadId, status: newStatus },
      {
        onSuccess: () => {
          toast.success("Lead moved");
          // Refresh selected lead status optimistically
          if (selectedLead?.id === leadId) {
            setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : prev);
          }
        },
        onError: (err: Error) => toast.error(err.message || "Failed to update"),
      }
    );
  }

  function handleSaveNotes(leadId: string, notes: string) {
    updateLead.mutate(
      { id: leadId, notes },
      {
        onSuccess: () => {
          toast.success("Notes saved");
          if (selectedLead?.id === leadId) {
            setSelectedLead((prev) => prev ? { ...prev, notes } : prev);
          }
        },
        onError: (err: Error) => toast.error(err.message || "Failed to save notes"),
      }
    );
  }

  function handleConvertToClient(leadId: string) {
    convertLead.mutate(leadId, {
      onSuccess: () => {
        toast.success("Converted to client — send them a portal invite next");
        setSelectedLead(null);
      },
      onError: (err: Error) =>
        toast.error(err.message || "Conversion failed — try again"),
    });
  }

  function handleSendIntakeForm(leadId: string) {
    const lead = leadsArray.find((l) => l.id === leadId);
    sendIntake.mutate(leadId, {
      onSuccess: () => {
        toast.success(`Intake form sent to ${lead?.email ?? "lead"}`);
      },
      onError: (err: Error) =>
        toast.error(err.message || "Failed to send intake form — try again"),
    });
  }

  function handleMenuAction(
    lead: Lead,
    action: "convert" | "not_a_fit" | "notes"
  ) {
    if (action === "convert") {
      handleConvertToClient(lead.id);
    } else if (action === "not_a_fit") {
      handleUpdateStatus(lead.id, "lost");
    } else if (action === "notes") {
      setSelectedLead(lead);
    }
  }

  // Drag-and-drop
  function handleDragStart(e: React.DragEvent, lead: Lead) {
    setDraggingLead(lead);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, targetColumn: ColumnKey) {
    e.preventDefault();
    if (!draggingLead) return;
    const targetStatus = COLUMN_META[targetColumn].apiStatus;
    if (draggingLead.status !== targetStatus) {
      handleUpdateStatus(draggingLead.id, targetStatus);
    }
    setDraggingLead(null);
  }

  const totalCount = leadsArray.length;

  // ── Skeleton ──
  if (leads.isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div
              className="h-7 w-24 rounded-lg animate-pulse mb-2"
              style={{ background: "#E5E0D8" }}
            />
            <div
              className="h-4 w-32 rounded animate-pulse"
              style={{ background: "#E5E0D8" }}
            />
          </div>
          <div
            className="h-9 w-32 rounded-lg animate-pulse"
            style={{ background: "#E5E0D8" }}
          />
        </div>
        <KanbanSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#1C1C1E" }}
            >
              Leads
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#8A8480" }}>
              {totalCount} lead{totalCount !== 1 ? "s" : ""} total
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#8A8480" }}
              />
              <input
                type="text"
                placeholder="Search leads…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-colors w-52"
                style={{
                  border: "1.5px solid #E5E0D8",
                  background: "#FFFFFF",
                  color: "#1C1C1E",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "#5C7A6B")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "#E5E0D8")
                }
              />
            </div>

            {/* View toggle */}
            <div
              className="flex items-center p-1 rounded-lg gap-0.5"
              style={{ background: "#E5E0D8" }}
            >
              <button
                onClick={() => setView("kanban")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: view === "kanban" ? "#FFFFFF" : "transparent",
                  color: view === "kanban" ? "#1C1C1E" : "#8A8480",
                  boxShadow:
                    view === "kanban"
                      ? "0 1px 3px rgba(0,0,0,0.06)"
                      : "none",
                }}
              >
                <LayoutGrid size={13} />
                Board
              </button>
              <button
                onClick={() => setView("table")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: view === "table" ? "#FFFFFF" : "transparent",
                  color: view === "table" ? "#1C1C1E" : "#8A8480",
                  boxShadow:
                    view === "table"
                      ? "0 1px 3px rgba(0,0,0,0.06)"
                      : "none",
                }}
              >
                <List size={13} />
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        {view === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMN_ORDER.map((col, idx) => (
              <KanbanColumn
                key={col}
                columnKey={col}
                leads={columns[col]}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onOpenLead={setSelectedLead}
                onMenuAction={handleMenuAction}
                isFirst={idx === 0}
                onAddLead={() => {
                  /* Future: open add lead modal */
                  toast.info("Use your booking page to collect leads.");
                }}
              />
            ))}
          </div>
        )}

        {/* Table View */}
        {view === "table" && (
          <TableView
            leads={filtered}
            onOpenLead={setSelectedLead}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>

      {/* Right Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateStatus={handleUpdateStatus}
          onConvertToClient={handleConvertToClient}
          onSaveNotes={handleSaveNotes}
          onSendIntakeForm={handleSendIntakeForm}
          isSaving={updateLead.isPending}
          isConverting={convertLead.isPending}
          isSendingIntake={sendIntake.isPending}
        />
      )}
    </>
  );
}
