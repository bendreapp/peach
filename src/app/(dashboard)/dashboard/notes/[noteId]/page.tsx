"use client";

import { use, useState } from "react";
import { useNoteById } from "@/lib/api-hooks";
import NoteEditor from "@/components/notes/NoteEditor";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  Pencil,
  Eye,
} from "lucide-react";

// ── Inline constants ──────────────────────────────────────────────────────────

const NOTE_TYPE_LABELS: Record<string, string> = {
  soap: "SOAP Note",
  dap: "DAP Note",
  freeform: "Free Form",
};

function getNoteStatus(note: any): "Draft" | "Final" {
  const hasSoap =
    note.subjective || note.objective || note.assessment || note.plan;
  const hasFreeform = note.freeform_content;
  if (!hasSoap && !hasFreeform) return "Draft";
  if (
    note.note_type === "soap" &&
    note.subjective &&
    note.objective &&
    note.assessment &&
    note.plan
  )
    return "Final";
  if (note.note_type === "freeform" && note.freeform_content) return "Final";
  if (
    note.note_type === "dap" &&
    note.subjective &&
    note.objective &&
    note.assessment
  )
    return "Final";
  return "Draft";
}

// ── Read-only note view ───────────────────────────────────────────────────────

function NoteReadView({ note }: { note: any }) {
  const soapSections = [
    { key: "subjective", label: "Subjective" },
    { key: "objective", label: "Objective" },
    { key: "assessment", label: "Assessment" },
    { key: "plan", label: "Plan" },
  ];

  const dapSections = [
    { key: "subjective", label: "Data" },
    { key: "objective", label: "Assessment" },
    { key: "assessment", label: "Plan" },
  ];

  const sections =
    note.note_type === "soap"
      ? soapSections
      : note.note_type === "dap"
      ? dapSections
      : null;

  return (
    <div className="space-y-6">
      {sections
        ? sections.map((s) => (
            <div key={s.key}>
              <p
                className="text-[11px] font-medium uppercase tracking-wider mb-2"
                style={{ color: "#8A8480" }}
              >
                {s.label}
              </p>
              {note[s.key] ? (
                <p
                  className="text-[14px] leading-relaxed whitespace-pre-wrap"
                  style={{ color: "#1C1C1E" }}
                >
                  {note[s.key]}
                </p>
              ) : (
                <p
                  className="text-[13px] italic"
                  style={{ color: "#C5BFB8" }}
                >
                  Not filled
                </p>
              )}
            </div>
          ))
        : note.freeform_content
        ? (
            <p
              className="text-[14px] leading-relaxed whitespace-pre-wrap"
              style={{ color: "#1C1C1E" }}
            >
              {note.freeform_content}
            </p>
          )
        : (
            <p className="text-[13px] italic" style={{ color: "#C5BFB8" }}>
              No content yet
            </p>
          )}

      {/* Extra fields */}
      {(note.homework ||
        note.techniques_used?.length > 0 ||
        note.risk_flags?.length > 0) && (
        <div
          className="mt-8 pt-6 space-y-4"
          style={{ borderTop: "1px solid #E5E0D8" }}
        >
          {note.homework && (
            <div>
              <p
                className="text-[11px] font-medium uppercase tracking-wider mb-1.5"
                style={{ color: "#8A8480" }}
              >
                Homework / Between-Session Tasks
              </p>
              <p
                className="text-[14px] leading-relaxed whitespace-pre-wrap"
                style={{ color: "#1C1C1E" }}
              >
                {note.homework}
              </p>
            </div>
          )}
          {note.techniques_used?.length > 0 && (
            <div>
              <p
                className="text-[11px] font-medium uppercase tracking-wider mb-2"
                style={{ color: "#8A8480" }}
              >
                Techniques Used
              </p>
              <div className="flex flex-wrap gap-1.5">
                {note.techniques_used.map((t: string) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                    style={{ background: "#EBF0EB", color: "#5C7A6B" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {note.risk_flags?.length > 0 && (
            <div>
              <p
                className="text-[11px] font-medium uppercase tracking-wider mb-2"
                style={{ color: "#C0705A" }}
              >
                Risk Flags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {note.risk_flags.map((f: string) => (
                  <span
                    key={f}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                    style={{ background: "#F9EDED", color: "#C0705A" }}
                  >
                    <AlertTriangle size={10} strokeWidth={1.5} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditNotePage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = use(params);
  const noteQuery = useNoteById(noteId);
  const [mode, setMode] = useState<"view" | "edit">("view");

  // Loading skeleton
  if (noteQuery.isLoading) {
    return (
      <div className="max-w-[800px] mx-auto space-y-6">
        <div
          className="h-5 w-28 rounded-lg animate-pulse"
          style={{ background: "#E5E0D8" }}
        />
        <div
          className="h-8 w-48 rounded-lg animate-pulse"
          style={{ background: "#E5E0D8" }}
        />
        <div
          className="rounded-xl border p-8 space-y-6"
          style={{ background: "#FFFFFF", borderColor: "#E5E0D8" }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg animate-pulse"
              style={{ background: "#F4F1EC" }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (noteQuery.error || !noteQuery.data) {
    return (
      <div className="max-w-[800px] mx-auto space-y-6">
        <Link
          href="/dashboard/notes"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-150"
          style={{ color: "#8A8480" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#5C5856")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8480")}
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to notes
        </Link>
        <div
          className="rounded-xl border p-10 text-center"
          style={{
            background: "#FFFFFF",
            borderColor: "#E5E0D8",
          }}
        >
          <p className="text-[14px] font-medium" style={{ color: "#C0705A" }}>
            Note not found
          </p>
          <p
            className="text-[12px] mt-1"
            style={{ color: "#8A8480" }}
          >
            This note may have been deleted or does not exist.
          </p>
        </div>
      </div>
    );
  }

  const n = noteQuery.data as any;
  const sessions = n.sessions as {
    starts_at: string;
    ends_at: string;
    client_id: string;
    clients: { full_name: string } | null;
  } | null;

  const clientName = sessions?.clients?.full_name ?? "Unknown";
  const noteStatus = getNoteStatus(n);
  const noteTypeLabel = NOTE_TYPE_LABELS[n.note_type] ?? n.note_type;

  return (
    <div
      className="max-w-[800px] mx-auto space-y-6"
      style={{ paddingBottom: "48px" }}
    >
      {/* Back nav */}
      <Link
        href="/dashboard/notes"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-150"
        style={{ color: "#8A8480" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#5C5856")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8480")}
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Back to notes
      </Link>

      {/* Note header */}
      <div
        className="rounded-xl border p-6"
        style={{
          background: "#FFFFFF",
          borderColor: "#E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Client avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[14px] font-semibold"
              style={{ background: "#EBF0EB", color: "#5C7A6B" }}
            >
              {clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-[18px] font-semibold"
                  style={{ color: "#1C1C1E" }}
                >
                  {clientName}
                </h1>
                {/* Note type badge */}
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: "#F4F1EC", color: "#5C5856" }}
                >
                  {noteTypeLabel}
                </span>
                {/* Status badge */}
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={
                    noteStatus === "Final"
                      ? { background: "#EAF4F1", color: "#3D8B7A" }
                      : { background: "#FBF0E8", color: "#B5733A" }
                  }
                >
                  {noteStatus}
                </span>
                {n.risk_flags?.length > 0 && (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ background: "#F9EDED", color: "#C0705A" }}
                  >
                    <AlertTriangle size={10} strokeWidth={1.5} />
                    Risk flags
                  </span>
                )}
              </div>
              {sessions && (
                <div
                  className="flex items-center gap-4 mt-1.5 text-[12px]"
                  style={{ color: "#8A8480" }}
                >
                  <span className="flex items-center gap-1">
                    <Calendar size={11} strokeWidth={1.5} />
                    {new Date(sessions.starts_at).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} strokeWidth={1.5} />
                    {new Date(sessions.starts_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Kolkata",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* View / Edit toggle */}
          <div
            className="flex items-center rounded-lg p-0.5 flex-shrink-0"
            style={{ background: "#F4F1EC", border: "1px solid #E5E0D8" }}
          >
            <button
              onClick={() => setMode("view")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150"
              style={
                mode === "view"
                  ? { background: "#FFFFFF", color: "#1C1C1E", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }
                  : { background: "transparent", color: "#8A8480" }
              }
            >
              <Eye size={12} strokeWidth={1.5} />
              View
            </button>
            <button
              onClick={() => setMode("edit")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150"
              style={
                mode === "edit"
                  ? { background: "#FFFFFF", color: "#1C1C1E", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }
                  : { background: "transparent", color: "#8A8480" }
              }
            >
              <Pencil size={12} strokeWidth={1.5} />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Note content */}
      <div
        className="rounded-xl border p-8"
        style={{
          background: "#FFFFFF",
          borderColor: "#E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {mode === "view" ? (
          <NoteReadView note={n} />
        ) : (
          <NoteEditor
            sessionId={n.session_id}
            existingNote={{
              id: n.id,
              note_type: n.note_type,
              subjective: n.subjective,
              objective: n.objective,
              assessment: n.assessment,
              plan: n.plan,
              freeform_content: n.freeform_content,
              homework: n.homework,
              techniques_used: n.techniques_used ?? [],
              risk_flags: n.risk_flags ?? [],
            }}
            sessionInfo={
              sessions
                ? {
                    clientName: sessions.clients?.full_name ?? "Unknown",
                    startsAt: sessions.starts_at,
                  }
                : undefined
            }
            onSaved={() => setMode("view")}
          />
        )}
      </div>
    </div>
  );
}
