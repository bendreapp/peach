"use client";

import { useState } from "react";
import Link from "next/link";
import { useNotesList, useClientsList } from "@/lib/api-hooks";
import { NOTE_TEMPLATES } from "@bendre/shared";
import { FileText, Clock, AlertTriangle, ChevronRight } from "lucide-react";

// Unwrap API response: handles both flat arrays and { data: [...] }
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}




type NoteTemplate = keyof typeof NOTE_TEMPLATES;

export default function NotesPage() {
  const [clientFilter, setClientFilter] = useState<string>("");

  const notes = useNotesList({
    limit: 50,
    ...(clientFilter ? { client_id: clientFilter } : {}),
  });
  const clients = useClientsList();

  if (notes.isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-border rounded-small animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-card rounded-card border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  const notesData = toArray(notes.data);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Session Notes</h1>
          <p className="text-sm text-ink-secondary mt-1">
            {notesData.length} note{notesData.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Client filter */}
      {(toArray(clients.data)?.length ?? 0) > 0 && (
        <div>
          <label className="ui-label">Filter by client</label>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="ui-input"
          >
            <option value="">All clients</option>
            {toArray(clients.data)?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Notes list */}
      {notesData.length === 0 ? (
        <div className="ui-card text-center py-16">
          <div className="w-14 h-14 rounded-full bg-sage-bg mx-auto mb-4 flex items-center justify-center">
            <FileText size={22} className="text-sage" />
          </div>
          <p className="text-sm font-medium text-ink-secondary">No session notes yet</p>
          <p className="text-xs text-ink-tertiary mt-1.5 max-w-xs mx-auto">
            Add notes from the schedule page after completing a session
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-card border border-border shadow-card overflow-hidden divide-y divide-border">
          {notesData.map((note: any) => {
            const sessions = note.sessions as { starts_at: string; client_id: string; clients: { full_name: string } | null } | null;
            const clientName = sessions?.clients?.full_name ?? "Unknown";
            const template = NOTE_TEMPLATES[note.note_type as NoteTemplate];
            const preview = note.freeform_content || note.subjective || "";
            const hasRiskFlags = note.risk_flags && note.risk_flags.length > 0;

            return (
              <Link
                key={note.id}
                href={`/dashboard/notes/${note.id}`}
                className="flex items-start gap-4 px-6 py-5 hover:bg-bg transition-colors duration-150 group"
              >
                <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-sage">
                    {clientName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink">{clientName}</span>
                    <span className="badge badge-sage">
                      {template?.name ?? note.note_type}
                    </span>
                    {hasRiskFlags && (
                      <span className="badge badge-error">
                        <AlertTriangle size={10} className="mr-0.5" />
                        Risk
                      </span>
                    )}
                  </div>
                  {preview && (
                    <p className="text-xs text-ink-tertiary mt-1.5 line-clamp-2 leading-relaxed">
                      {preview.slice(0, 160)}{preview.length > 160 ? "..." : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-tertiary">
                    <Clock size={11} />
                    {sessions
                      ? new Date(sessions.starts_at).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          timeZone: "Asia/Kolkata",
                        })
                      : new Date(note.created_at).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          timeZone: "Asia/Kolkata",
                        })
                    }
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-tertiary opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
