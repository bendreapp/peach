"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import NoteEditor from "@/components/notes/NoteEditor";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

function NewNoteContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  // Check if a note already exists for this session
  const existingNote = useQuery({
    queryKey: ["notes", "by-session", sessionId],
    queryFn: () => api.session.getNote(sessionId!),
    enabled: !!sessionId,
  });

  if (!sessionId) {
    return (
      <div className="ui-card text-center py-16">
        <div className="w-14 h-14 rounded-full bg-sage-bg mx-auto mb-4 flex items-center justify-center">
          <FileText size={22} className="text-sage" />
        </div>
        <p className="text-sm font-medium text-ink-secondary">No session selected</p>
        <p className="text-xs text-ink-tertiary mt-1.5 max-w-xs mx-auto">
          Add notes from the schedule page by clicking the note icon on a session
        </p>
      </div>
    );
  }

  if (existingNote.isLoading) {
    return (
      <div className="bg-card rounded-card border border-border shadow-card p-7 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-bg rounded-small animate-pulse" />
        ))}
      </div>
    );
  }

  const note = existingNote.data as any;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">
          {note ? "Edit Note" : "New Note"}
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          {note ? "Update the session note below" : "Create a new session note"}
        </p>
      </div>

      <div className="bg-card rounded-card border border-border shadow-card p-7">
        <NoteEditor
          sessionId={sessionId}
          existingNote={note ? {
            id: note.id,
            note_type: note.note_type,
            subjective: note.subjective,
            objective: note.objective,
            assessment: note.assessment,
            plan: note.plan,
            freeform_content: note.freeform_content,
            homework: note.homework,
            techniques_used: note.techniques_used,
            risk_flags: note.risk_flags,
          } : undefined}
        />
      </div>
    </>
  );
}

export default function NewNotePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/notes" className="btn-ghost btn-sm inline-flex">
        <ArrowLeft size={14} />
        Back to notes
      </Link>

      <Suspense fallback={
        <div className="bg-card rounded-card border border-border shadow-card p-7 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-bg rounded-small animate-pulse" />
          ))}
        </div>
      }>
        <NewNoteContent />
      </Suspense>
    </div>
  );
}
