"use client";

import Link from "next/link";
import { useNotesList } from "@/lib/api-hooks";
const NOTE_TEMPLATES: Record<string, { name: string; fields: string[] }> = {
  soap: { name: "SOAP Note", fields: ["subjective", "objective", "assessment", "plan"] },
  dap: { name: "DAP Note", fields: ["subjective", "objective", "assessment"] },
  freeform: { name: "Free Form", fields: ["freeform_content"] },
};
import { formatDate } from "./utils";
import {
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";

type NoteTemplate = keyof typeof NOTE_TEMPLATES;

interface NotesTabProps {
  clientId: string;
}

export default function NotesTab({ clientId }: NotesTabProps) {
  const notes = useNotesList({ client_id: clientId, limit: 50 });

  return (
    <div className="bg-surface rounded-card border border-border shadow-sm overflow-hidden">
      {notes.isLoading ? (
        <div className="p-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-border rounded-small animate-pulse" />
          ))}
        </div>
      ) : (notes.data?.length ?? 0) === 0 ? (
        <div className="p-10 text-center">
          <FileText size={20} className="mx-auto text-ink-tertiary mb-2" />
          <p className="text-sm text-ink-tertiary">No notes yet</p>
          <p className="text-xs text-ink-tertiary/60 mt-1">
            Add notes from the sessions tab
          </p>
        </div>
      ) : (
        <div className="divide-y divide-cream-300">
          {notes.data?.map((note: any) => {
            const sessions = note.sessions as { starts_at: string } | null;
            const template = NOTE_TEMPLATES[note.note_type as NoteTemplate];
            const preview = note.freeform_content || note.subjective || "";
            const hasRiskFlags = note.risk_flags && note.risk_flags.length > 0;

            return (
              <Link
                key={note.id}
                href={`/dashboard/notes/${note.id}`}
                className="block px-6 py-4 hover:bg-bg transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-bg text-ink-tertiary">
                    <FileText size={10} />
                    {template?.name ?? note.note_type}
                  </span>
                  {hasRiskFlags && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill text-[10px] font-medium bg-red-50 text-red-600">
                      <AlertTriangle size={9} /> Risk
                    </span>
                  )}
                  <span className="text-[11px] text-ink-tertiary flex items-center gap-1">
                    <Clock size={10} />
                    {sessions
                      ? formatDate(sessions.starts_at)
                      : formatDate(note.created_at)}
                  </span>
                </div>
                {preview && (
                  <p className="text-xs text-ink-tertiary truncate">
                    {preview.slice(0, 150)}{preview.length > 150 ? "..." : ""}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
