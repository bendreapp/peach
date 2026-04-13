"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import NoteEditor from "@/components/notes/NoteEditor";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

// ── New Note Content (reads query params) ─────────────────────────────────────

function NewNoteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  // Check if a note already exists for this session
  const existingNoteQuery = useQuery({
    queryKey: ["notes", "by-session", sessionId],
    queryFn: () => api.session.getNote(sessionId!),
    enabled: !!sessionId,
    retry: false,
  });

  // No session selected state
  if (!sessionId) {
    return (
      <div
        className="rounded-xl border p-12 text-center"
        style={{
          background: "#FFFFFF",
          borderColor: "#E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "#F4F1EC" }}
        >
          <FileText size={22} strokeWidth={1.5} style={{ color: "#C5BFB8" }} />
        </div>
        <p className="text-[15px] font-medium" style={{ color: "#5C5856" }}>
          No session selected
        </p>
        <p
          className="text-[13px] mt-1.5 max-w-xs mx-auto leading-relaxed"
          style={{ color: "#8A8480" }}
        >
          Notes are linked to sessions. Open a session from the Schedule page
          and click &ldquo;Add Note&rdquo; to start writing.
        </p>
        <Link
          href="/dashboard/schedule"
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-colors duration-150"
          style={{ background: "#5C7A6B" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#496158")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "#5C7A6B")
          }
        >
          Go to Schedule
        </Link>
      </div>
    );
  }

  // Loading skeleton
  if (existingNoteQuery.isLoading) {
    return (
      <div
        className="rounded-xl border p-8 space-y-6"
        style={{
          background: "#FFFFFF",
          borderColor: "#E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg animate-pulse"
            style={{ background: "#F4F1EC" }}
          />
        ))}
      </div>
    );
  }

  const note = existingNoteQuery.data as any;

  return (
    <div
      className="rounded-xl border p-8"
      style={{
        background: "#FFFFFF",
        borderColor: "#E5E0D8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <NoteEditor
        sessionId={sessionId}
        existingNote={
          note
            ? {
                id: note.id,
                note_type: note.note_type,
                subjective: note.subjective,
                objective: note.objective,
                assessment: note.assessment,
                plan: note.plan,
                freeform_content: note.freeform_content,
                homework: note.homework,
                techniques_used: note.techniques_used ?? [],
                risk_flags: note.risk_flags ?? [],
              }
            : undefined
        }
        onSaved={() => router.push("/dashboard/notes")}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewNotePage() {
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

      {/* Page heading */}
      <div>
        <h1
          className="text-[24px] font-bold tracking-tight"
          style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}
        >
          New Note
        </h1>
        <p className="text-[14px] mt-1" style={{ color: "#8A8480" }}>
          Write your clinical notes below. Changes are auto-saved.
        </p>
      </div>

      <Suspense
        fallback={
          <div
            className="rounded-xl border p-8 space-y-6"
            style={{
              background: "#FFFFFF",
              borderColor: "#E5E0D8",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-lg animate-pulse"
                style={{ background: "#F4F1EC" }}
              />
            ))}
          </div>
        }
      >
        <NewNoteContent />
      </Suspense>
    </div>
  );
}
