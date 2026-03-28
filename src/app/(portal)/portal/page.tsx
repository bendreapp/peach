"use client";

import { useState } from "react";
import {
  usePortalMe,
  usePortalUpcomingSessions,
  usePortalPendingIntakeForms,
  usePortalPastSessions,
} from "@/lib/api-hooks";
import PortalHeader from "@/components/portal/PortalHeader";
import PendingFormsBanner from "@/components/portal/PendingFormsBanner";
import UpcomingSessionsList from "@/components/portal/UpcomingSessionsList";
import PastSessionsList from "@/components/portal/PastSessionsList";

export default function PortalPage() {
  const [pastCursor, setPastCursor] = useState(0);
  const PAST_LIMIT = 20;

  const me = usePortalMe();
  const upcoming = usePortalUpcomingSessions();
  const pendingForms = usePortalPendingIntakeForms();
  const clientId = (me.data as any)?.id || (me.data as any)?.[0]?.id || "";
  const past = usePortalPastSessions(clientId, {
    limit: PAST_LIMIT,
    offset: pastCursor,
  });

  // Derive client name
  const clientName =
    me.data?.clients?.[0]?.full_name ??
    me.data?.email?.split("@")[0] ??
    "there";

  if (me.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-border rounded-lg w-48" />
        <div className="h-24 bg-border rounded-card" />
        <div className="h-16 bg-border rounded-small" />
        <div className="h-16 bg-border rounded-small" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PortalHeader name={clientName} email={me.data?.email} />

      <PendingFormsBanner forms={pendingForms.data ?? []} />

      <div className="space-y-3">
        <h2 className="text-lg font-sans font-semibold text-ink">
          Upcoming sessions
        </h2>
        <UpcomingSessionsList
          sessions={upcoming.data ?? []}
          loading={upcoming.isLoading}
        />
      </div>

      <PastSessionsList
        sessions={past.data?.sessions ?? []}
        hasMore={past.data?.hasMore ?? false}
        loading={past.isLoading}
        onLoadMore={() => setPastCursor((c) => c + PAST_LIMIT)}
      />

      {/* Booking links */}
      {me.data?.clients && me.data.clients.length > 0 && (
        <div className="bg-surface rounded-small border border-border p-6 text-center space-y-2">
          <p className="text-sm text-ink-tertiary">
            Need to book another session?
          </p>
          <p className="text-xs text-ink-tertiary">
            Use the booking link shared by your therapist.
          </p>
        </div>
      )}
    </div>
  );
}
