"use client";

import { useState } from "react";
import {
  usePortalMe,
  usePortalUpcomingSessions,
  usePortalPastSessions,
  usePortalResources,
} from "@/lib/api-hooks";
import PortalHeader from "@/components/portal/PortalHeader";
import PendingFormsBanner from "@/components/portal/PendingFormsBanner";
import UpcomingSessionsList from "@/components/portal/UpcomingSessionsList";
import PastSessionsList from "@/components/portal/PastSessionsList";
import SharedResourcesCard from "@/components/portal/SharedResourcesCard";

export default function PortalPage() {
  const [pastPage, setPastPage] = useState(1);
  const PER_PAGE = 5;

  const me = usePortalMe();

  // Take the first profile (a client may have multiple therapists in future)
  const profile = me.data?.[0] ?? null;
  const clientId = profile?.id ?? "";

  const upcoming = usePortalUpcomingSessions(clientId);
  const past = usePortalPastSessions(clientId, {
    page: pastPage,
    per_page: PER_PAGE,
  });
  const resources = usePortalResources(clientId);

  // Derive client name
  const clientName =
    profile?.full_name?.split(" ")[0] ??
    "there";

  if (me.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-[#E5E0D8] rounded-lg w-48 animate-pulse" />
        <div className="h-6 bg-[#E5E0D8] rounded w-64 animate-pulse" />
        <div className="h-32 bg-[#E5E0D8] rounded-xl animate-pulse" />
        <div className="h-24 bg-[#E5E0D8] rounded-xl animate-pulse" />
        <div className="h-24 bg-[#E5E0D8] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (me.isError || !profile) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-8 text-center">
        <p className="text-[#8A8480] text-sm">
          Unable to load your profile. Please try signing in again.
        </p>
      </div>
    );
  }

  // Build pending forms from profile intake status
  // The portal reports pending forms through the intake_completed flag
  const pendingForms = !profile.intake_completed
    ? [{ id: profile.id, access_token: "", status: "pending", expires_at: "" }]
    : [];

  const pastSessions = (past.data as any)?.data ?? [];
  const pastTotal = (past.data as any)?.total ?? 0;
  const hasMorePast = pastPage * PER_PAGE < pastTotal;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <PortalHeader name={clientName} email={profile.email ?? undefined} />

      {/* Pending intake forms banner */}
      <PendingFormsBanner forms={pendingForms as any} />

      {/* Upcoming sessions */}
      <section>
        <h2
          className="text-lg font-bold mb-3"
          style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}
        >
          Upcoming sessions
        </h2>
        <UpcomingSessionsList
          sessions={(upcoming.data as any) ?? []}
          loading={upcoming.isLoading}
        />
      </section>

      {/* Past sessions */}
      <section>
        <h2
          className="text-lg font-bold mb-3"
          style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}
        >
          Past sessions
        </h2>
        <PastSessionsList
          sessions={pastSessions}
          hasMore={hasMorePast}
          loading={past.isLoading}
          onLoadMore={() => setPastPage((p) => p + 1)}
        />
      </section>

      {/* Shared resources */}
      <section>
        <h2
          className="text-lg font-bold mb-3"
          style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}
        >
          Resources
        </h2>
        <SharedResourcesCard
          resources={(resources.data as any)?.data ?? []}
          loading={resources.isLoading}
        />
      </section>

      {/* Booking prompt */}
      <div
        className="rounded-xl border p-6 text-center"
        style={{
          background: "white",
          borderColor: "#E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <p className="text-sm" style={{ color: "#8A8480" }}>
          Need to book another session?
        </p>
        <p className="text-xs mt-1" style={{ color: "#8A8480" }}>
          Use the booking link shared by your therapist.
        </p>
      </div>
    </div>
  );
}
