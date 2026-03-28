"use client";

import Link from "next/link";
import { useSessionsByClient } from "@/lib/api-hooks";
import { formatDate, formatTime } from "./utils";
import {
  CalendarDays,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface SessionsTabProps {
  clientId: string;
}

export default function SessionsTab({ clientId }: SessionsTabProps) {
  const sessions = useSessionsByClient(clientId);

  return (
    <div className="bg-surface rounded-card border border-border shadow-sm overflow-hidden">
      {sessions.isLoading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-border rounded-small animate-pulse" />
          ))}
        </div>
      ) : (sessions.data?.length ?? 0) === 0 ? (
        <div className="p-10 text-center">
          <CalendarDays size={20} className="mx-auto text-ink-tertiary mb-2" />
          <p className="text-sm text-ink-tertiary">No sessions yet</p>
        </div>
      ) : (
        <div className="divide-y divide-cream-300">
          {sessions.data?.map((session: any) => (
            <div key={session.id} className="px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-xs text-ink-tertiary w-6 text-center font-medium">
                  #{session.session_number ?? "\u2014"}
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">
                    {formatDate(session.starts_at)}
                  </div>
                  <div className="text-xs text-ink-tertiary flex items-center gap-1">
                    <Clock size={10} />
                    {formatTime(session.starts_at)} &middot; {session.duration_mins} min
                    {session.is_late_cancellation && (
                      <span className="ml-1 text-red-600 font-medium">Late cancel</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/notes/new?session_id=${session.id}`}
                  className="p-1.5 rounded-lg text-ink-tertiary hover:bg-bg hover:text-sage transition-colors"
                >
                  <FileText size={14} />
                </Link>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium ${
                  session.status === "completed"
                    ? "bg-sage-50 text-sage"
                    : session.status === "scheduled"
                    ? "bg-blue-50 text-blue-600"
                    : session.status === "pending_approval"
                    ? "bg-amber-50 text-amber"
                    : "bg-border text-ink-tertiary"
                }`}>
                  {session.status === "completed" && <CheckCircle2 size={10} />}
                  {session.status === "pending_approval" && <AlertCircle size={10} />}
                  {session.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
