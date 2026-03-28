"use client";

import { use } from "react";
import { useNoteById } from "@/lib/api-hooks";
import NoteEditor from "@/components/notes/NoteEditor";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, User } from "lucide-react";

export default function EditNotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params);
  const note = useNoteById(noteId);

  if (note.isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-5 w-28 bg-border rounded-lg animate-pulse" />
        <div className="h-8 w-40 bg-border rounded-lg animate-pulse" />
        <div className="bg-card rounded-card border border-border shadow-card p-7 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-bg rounded-small animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (note.error || !note.data) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/dashboard/notes" className="btn-ghost btn-sm inline-flex">
          <ArrowLeft size={14} />
          Back to notes
        </Link>
        <div className="bg-error-bg border border-error/15 rounded-card p-8 text-center">
          <p className="text-error text-sm font-medium">Note not found</p>
          <p className="text-xs text-ink-tertiary mt-1">This note may have been deleted or does not exist.</p>
        </div>
      </div>
    );
  }

  const n = note.data as any;
  const sessions = n.sessions as { starts_at: string; ends_at: string; client_id: string; clients: { full_name: string } | null } | null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/notes" className="btn-ghost btn-sm inline-flex">
        <ArrowLeft size={14} />
        Back to notes
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Edit Note</h1>
        {sessions && (
          <div className="flex items-center gap-4 mt-2 text-sm text-ink-secondary">
            <span className="inline-flex items-center gap-1.5">
              <User size={13} className="text-sage" />
              {sessions.clients?.full_name ?? "Unknown"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} className="text-sage" />
              {new Date(sessions.starts_at).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              })}
            </span>
          </div>
        )}
      </div>

      <div className="bg-card rounded-card border border-border shadow-card p-7">
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
            techniques_used: n.techniques_used,
            risk_flags: n.risk_flags,
          }}
          sessionInfo={sessions ? {
            clientName: sessions.clients?.full_name ?? "Unknown",
            startsAt: sessions.starts_at,
          } : undefined}
        />
      </div>
    </div>
  );
}
