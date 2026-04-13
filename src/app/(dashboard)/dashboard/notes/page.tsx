"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useNotesList, useClientsList } from "@/lib/api-hooks";
import {
  FileText,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  ChevronRight,
} from "lucide-react";

// ── Inline constants (no @bendre/shared) ──────────────────────────────────────
const NOTE_TEMPLATES = {
  soap: {
    label: "SOAP Note",
    name: "SOAP Note",
    description: "Subjective, Objective, Assessment, Plan",
    fields: ["subjective", "objective", "assessment", "plan"],
  },
  dap: {
    label: "DAP Note",
    name: "DAP Note",
    description: "Data, Assessment, Plan",
    fields: ["subjective", "objective", "assessment"],
  },
  freeform: {
    label: "Free Form",
    name: "Free Form",
    description: "Open-ended clinical notes",
    fields: ["freeform_content"],
  },
} as const;

type NoteTemplate = keyof typeof NOTE_TEMPLATES;

// Unwrap API response: handles both flat arrays and { data: [...] }
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

// Derive a display status from note fields (no DB status column exists)
function getNoteStatus(note: any): "Draft" | "Final" {
  const hasSoap =
    note.subjective || note.objective || note.assessment || note.plan;
  const hasFreeform = note.freeform_content;
  const filled = hasSoap || hasFreeform;
  if (!filled) return "Draft";
  // If it has content in all SOAP fields we treat it as Final
  if (
    note.note_type === "soap" &&
    note.subjective &&
    note.objective &&
    note.assessment &&
    note.plan
  ) {
    return "Final";
  }
  if (note.note_type === "freeform" && note.freeform_content) return "Final";
  if (
    note.note_type === "dap" &&
    note.subjective &&
    note.objective &&
    note.assessment
  ) {
    return "Final";
  }
  return "Draft";
}

type FilterOption = "all" | "drafts" | "this-week" | "by-client";

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drafts", label: "Drafts" },
  { key: "this-week", label: "This Week" },
  { key: "by-client", label: "By Client" },
];

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return date >= startOfWeek && date < endOfWeek;
}

export default function NotesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const notes = useNotesList({ limit: 100 });
  const clients = useClientsList();

  const notesData = toArray(notes.data);
  const clientsData = toArray(clients.data);

  // Filter notes
  const filteredNotes = useMemo(() => {
    let list = notesData;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((note: any) => {
        const clientName =
          note.sessions?.clients?.full_name ?? "";
        const preview = note.freeform_content || note.subjective || "";
        return (
          clientName.toLowerCase().includes(q) ||
          preview.toLowerCase().includes(q)
        );
      });
    }

    if (activeFilter === "drafts") {
      list = list.filter((note: any) => getNoteStatus(note) === "Draft");
    } else if (activeFilter === "this-week") {
      list = list.filter((note: any) => {
        const dateStr =
          note.sessions?.starts_at ?? note.created_at;
        return isThisWeek(dateStr);
      });
    } else if (activeFilter === "by-client" && clientFilter) {
      list = list.filter(
        (note: any) => note.sessions?.client_id === clientFilter
      );
    }

    return list;
  }, [notesData, activeFilter, clientFilter, searchQuery]);

  const selectedNote = useMemo(
    () =>
      selectedNoteId
        ? notesData.find((n: any) => n.id === selectedNoteId)
        : null,
    [selectedNoteId, notesData]
  );

  // Skeleton loading state
  if (notes.isLoading) {
    return (
      <div
        className="flex h-[calc(100vh-64px)] overflow-hidden rounded-card border border-border shadow-card"
        style={{ background: "var(--color-surface)" }}
      >
        {/* Left panel skeleton */}
        <div
          className="flex flex-col border-r border-border"
          style={{ width: 280, flexShrink: 0 }}
        >
          <div className="p-4 border-b border-border">
            <div className="h-8 w-28 bg-border rounded-small animate-pulse mb-3" />
            <div className="h-8 bg-border rounded-small animate-pulse" />
          </div>
          <div className="p-3 flex gap-1 border-b border-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 flex-1 bg-border/60 rounded-pill animate-pulse" />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[72px] bg-border/40 rounded-small animate-pulse" />
            ))}
          </div>
        </div>

        {/* Right panel skeleton */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 bg-border rounded-full mx-auto animate-pulse" />
            <div className="h-4 w-40 bg-border/60 rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex overflow-hidden rounded-card border border-border shadow-card"
      style={{
        height: "calc(100vh - 64px)",
        background: "var(--color-surface)",
      }}
    >
      {/* ── Left Panel: Note List (280px) ── */}
      <div
        className="flex flex-col border-r border-border flex-shrink-0"
        style={{ width: 280 }}
      >
        {/* Panel header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-semibold text-ink">Notes</h1>
            <Link
              href="/dashboard/notes/new"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-small text-[12px] font-medium text-white transition-colors duration-150"
              style={{ background: "#5C7A6B" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#496158")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#5C7A6B")
              }
            >
              <Plus size={13} strokeWidth={2.5} />
              New Note
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-7 pr-3 text-[13px] rounded-small border border-border bg-bg placeholder-ink-tertiary text-ink focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-border flex-wrap">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setActiveFilter(f.key);
                if (f.key !== "by-client") setClientFilter("");
              }}
              className="px-2.5 py-1 rounded-pill text-[11px] font-medium transition-colors duration-150"
              style={
                activeFilter === f.key
                  ? {
                      background: "#EBF0EB",
                      color: "#5C7A6B",
                    }
                  : {
                      background: "transparent",
                      color: "var(--color-ink-secondary)",
                    }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Client picker for "By Client" filter */}
        {activeFilter === "by-client" && clientsData.length > 0 && (
          <div className="px-3 py-2 border-b border-border">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full h-8 px-2.5 text-[12px] rounded-small border border-border bg-bg text-ink focus:outline-none focus:border-primary-500 appearance-none"
            >
              <option value="">All clients</option>
              {clientsData.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Note count */}
        <div className="px-4 py-2">
          <span className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider">
            {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <FileText size={32} className="text-ink-tertiary mb-3" strokeWidth={1.5} />
              <p className="text-[13px] font-medium text-ink-secondary">
                {searchQuery
                  ? "No notes match your search"
                  : activeFilter === "drafts"
                  ? "No drafts"
                  : activeFilter === "this-week"
                  ? "No notes this week"
                  : "No notes yet"}
              </p>
              {activeFilter === "all" && !searchQuery && (
                <p className="text-[12px] text-ink-tertiary mt-1">
                  Notes are added from sessions
                </p>
              )}
            </div>
          ) : (
            filteredNotes.map((note: any) => {
              const sessions = note.sessions as {
                starts_at: string;
                client_id: string;
                clients: { full_name: string } | null;
              } | null;
              const clientName = sessions?.clients?.full_name ?? "Unknown";
              const template =
                NOTE_TEMPLATES[note.note_type as NoteTemplate];
              const preview =
                note.freeform_content || note.subjective || "";
              const hasRiskFlags =
                note.risk_flags && note.risk_flags.length > 0;
              const noteStatus = getNoteStatus(note);
              const dateStr = sessions?.starts_at ?? note.created_at;
              const isSelected = selectedNoteId === note.id;

              return (
                <button
                  key={note.id}
                  onClick={() =>
                    setSelectedNoteId(isSelected ? null : note.id)
                  }
                  className="w-full text-left px-4 py-3 border-b border-border/60 transition-colors duration-150 group"
                  style={{
                    background: isSelected ? "#EBF0EB" : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "#F9F8F5";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[12px] font-semibold"
                      style={{
                        background: "#EBF0EB",
                        color: "#5C7A6B",
                      }}
                    >
                      {clientName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[13px] font-medium text-ink truncate">
                          {clientName}
                        </span>
                        {/* Status badge */}
                        <span
                          className="flex-shrink-0 px-1.5 py-0.5 rounded-pill text-[10px] font-medium"
                          style={
                            noteStatus === "Final"
                              ? {
                                  background: "#EAF4F1",
                                  color: "#3D8B7A",
                                }
                              : {
                                  background: "#FBF0E8",
                                  color: "#B5733A",
                                }
                          }
                        >
                          {noteStatus}
                        </span>
                      </div>

                      {/* Preview */}
                      <p className="text-[11px] text-ink-tertiary leading-snug line-clamp-2">
                        {preview
                          ? preview.slice(0, 80) +
                            (preview.length > 80 ? "…" : "")
                          : `${template?.name ?? note.note_type} note`}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] text-ink-tertiary">
                          <Clock size={9} />
                          {new Date(dateStr).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            timeZone: "Asia/Kolkata",
                          })}
                        </span>
                        {hasRiskFlags && (
                          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "#C0705A" }}>
                            <AlertTriangle size={9} />
                            Risk
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: Note Viewer ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedNote ? (
          <NoteViewer note={selectedNote} />
        ) : (
          <NoteEmptyState />
        )}
      </div>
    </div>
  );
}

// ── Note Viewer ───────────────────────────────────────────────────────────────

function NoteViewer({ note }: { note: any }) {
  const sessions = note.sessions as {
    starts_at: string;
    client_id: string;
    clients: { full_name: string } | null;
  } | null;
  const clientName = sessions?.clients?.full_name ?? "Unknown";
  const template = NOTE_TEMPLATES[note.note_type as NoteTemplate];
  const noteStatus = getNoteStatus(note);
  const dateStr = sessions?.starts_at ?? note.created_at;
  const hasRiskFlags = note.risk_flags && note.risk_flags.length > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Viewer header */}
      <div className="px-8 py-5 border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold"
                style={{ background: "#EBF0EB", color: "#5C7A6B" }}
              >
                {clientName.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-[16px] font-semibold text-ink">
                {clientName}
              </h2>
              {/* Status badge */}
              <span
                className="px-2.5 py-0.5 rounded-pill text-[11px] font-medium"
                style={
                  noteStatus === "Final"
                    ? { background: "#EAF4F1", color: "#3D8B7A" }
                    : { background: "#FBF0E8", color: "#B5733A" }
                }
              >
                {noteStatus}
              </span>
              {hasRiskFlags && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium"
                  style={{ background: "#F9EDED", color: "#C0705A" }}
                >
                  <AlertTriangle size={10} />
                  Risk flags
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-[13px] text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(dateStr).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Kolkata",
                })}
              </span>
              {sessions && (
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  {new Date(sessions.starts_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Kolkata",
                  })}
                </span>
              )}
              <span
                className="px-2 py-0.5 rounded-pill text-[11px] font-medium"
                style={{ background: "#F4F1EC", color: "#5C5856" }}
              >
                {template?.name ?? note.note_type}
              </span>
            </div>
          </div>

          <Link
            href={`/dashboard/notes/${note.id}`}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-small text-[13px] font-medium text-white transition-colors"
            style={{ background: "#5C7A6B" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#496158")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#5C7A6B")
            }
          >
            Edit
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Note content */}
      <div className="flex-1 px-8 py-6">
        {note.note_type === "soap" ? (
          <SoapNoteView note={note} />
        ) : note.note_type === "dap" ? (
          <DapNoteView note={note} />
        ) : (
          <FreeformNoteView note={note} />
        )}

        {/* Techniques & Risk flags */}
        {((note.techniques_used?.length > 0) ||
          (note.risk_flags?.length > 0) ||
          note.homework) && (
          <div className="mt-8 pt-6 border-t border-border space-y-4">
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
                      className="px-2.5 py-0.5 rounded-pill text-[12px] font-medium"
                      style={{ background: "#EBF0EB", color: "#5C7A6B" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {note.homework && (
              <div>
                <p
                  className="text-[11px] font-medium uppercase tracking-wider mb-1.5"
                  style={{ color: "#8A8480" }}
                >
                  Homework / Between-Session Tasks
                </p>
                <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
                  {note.homework}
                </p>
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
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[12px] font-medium"
                      style={{ background: "#F9EDED", color: "#C0705A" }}
                    >
                      <AlertTriangle size={10} />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SOAP note layout ──────────────────────────────────────────────────────────

function SoapNoteView({ note }: { note: any }) {
  const sections = [
    { key: "subjective", label: "Subjective", value: note.subjective },
    { key: "objective", label: "Objective", value: note.objective },
    { key: "assessment", label: "Assessment", value: note.assessment },
    { key: "plan", label: "Plan", value: note.plan },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.key}>
          <p
            className="text-[11px] font-medium uppercase tracking-wider mb-2"
            style={{ color: "#8A8480" }}
          >
            {section.label}
          </p>
          {section.value ? (
            <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
              {section.value}
            </p>
          ) : (
            <p className="text-[13px] italic" style={{ color: "#C5BFB8" }}>
              Not filled
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── DAP note layout ───────────────────────────────────────────────────────────

function DapNoteView({ note }: { note: any }) {
  const sections = [
    { key: "subjective", label: "Data", value: note.subjective },
    { key: "objective", label: "Assessment", value: note.objective },
    { key: "plan", label: "Plan", value: note.plan },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.key}>
          <p
            className="text-[11px] font-medium uppercase tracking-wider mb-2"
            style={{ color: "#8A8480" }}
          >
            {section.label}
          </p>
          {section.value ? (
            <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
              {section.value}
            </p>
          ) : (
            <p className="text-[13px] italic" style={{ color: "#C5BFB8" }}>
              Not filled
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Freeform note layout ──────────────────────────────────────────────────────

function FreeformNoteView({ note }: { note: any }) {
  return (
    <div>
      {note.freeform_content ? (
        <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
          {note.freeform_content}
        </p>
      ) : (
        <p className="text-[13px] italic" style={{ color: "#C5BFB8" }}>
          No content yet
        </p>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function NoteEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-12 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: "#F4F1EC" }}
      >
        <FileText size={24} strokeWidth={1.5} style={{ color: "#C5BFB8" }} />
      </div>
      <p className="text-[16px] font-medium" style={{ color: "#5C5856" }}>
        Select a note to read it
      </p>
      <p className="text-[14px] mt-1" style={{ color: "#8A8480" }}>
        Choose a note from the list, or create a new one.
      </p>
      <Link
        href="/dashboard/notes/new"
        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-small text-[13px] font-medium text-white transition-colors"
        style={{ background: "#5C7A6B" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#496158")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#5C7A6B")}
      >
        <Plus size={14} />
        New Note
      </Link>
    </div>
  );
}
