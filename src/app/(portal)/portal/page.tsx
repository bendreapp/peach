"use client";

import { useState } from "react";
import {
  usePortalMe,
  usePortalUpcomingSessions,
  usePortalPastSessions,
  usePortalResources,
  usePortalIntakeForms,
} from "@/lib/api-hooks";
import PortalHeader from "@/components/portal/PortalHeader";
import PendingFormsBanner from "@/components/portal/PendingFormsBanner";
import UpcomingSessionsList from "@/components/portal/UpcomingSessionsList";
import PastSessionsList from "@/components/portal/PastSessionsList";
import SharedResourcesCard from "@/components/portal/SharedResourcesCard";
import InvoicesList from "@/components/portal/InvoicesList";
import TherapistSwitcher from "@/components/portal/TherapistSwitcher";
import Link from "next/link";
import { UserCircle } from "lucide-react";

export default function PortalPage() {
  const [pastPage, setPastPage] = useState(1);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const PER_PAGE = 5;

  const me = usePortalMe();

  const profiles = me.data ?? [];
  const hasMultipleTherapists = profiles.length > 1;

  // Active profile based on switcher selection
  const profile = profiles[selectedProfileIndex] ?? profiles[0] ?? null;
  const clientId = profile?.id ?? "";

  const upcoming = usePortalUpcomingSessions(clientId);
  const past = usePortalPastSessions(clientId, {
    page: pastPage,
    per_page: PER_PAGE,
  });
  const resources = usePortalResources(clientId);
  const intakeForms = usePortalIntakeForms(clientId);

  // Derive client name
  const clientName = profile?.full_name?.split(" ")[0] ?? "there";

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
        <p className="text-[#736E6A] text-sm">
          Unable to load your profile. Please try signing in again.
        </p>
      </div>
    );
  }

  // Pending forms: fetch real forms and filter to only unsubmitted ones
  const allForms = (intakeForms.data as Array<{ id: string; title: string; access_token: string; submitted: boolean }>) ?? [];
  const pendingForms = allForms.filter((f) => !f.submitted);

  const pastSessions = (past.data as any)?.data ?? [];
  const pastTotal = (past.data as any)?.total ?? 0;
  const hasMorePast = pastPage * PER_PAGE < pastTotal;

  return (
    <div className="space-y-8">
      {/* Therapist switcher (only if client has multiple therapists) */}
      {hasMultipleTherapists && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#736E6A" }}>
            Viewing records for
          </p>
          <TherapistSwitcher
            profiles={profiles}
            selectedIndex={selectedProfileIndex}
            onChange={(idx) => {
              setSelectedProfileIndex(idx);
              setPastPage(1);
            }}
          />
        </div>
      )}

      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <PortalHeader name={clientName} email={profile.email ?? undefined} />
        <Link
          href="/portal/profile"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
          style={{
            color: "#5C7A6B",
            border: "1px solid #E5E0D8",
            background: "white",
          }}
        >
          <UserCircle size={14} strokeWidth={1.5} />
          Edit profile
        </Link>
      </div>

      {/* Pending intake forms banner */}
      <PendingFormsBanner forms={pendingForms} />

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

      {/* Invoices */}
      <section>
        <h2
          className="text-lg font-bold mb-3"
          style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}
        >
          Invoices
        </h2>
        <InvoicesList clientId={clientId} />
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
          resources={(resources.data as any) ?? []}
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
        <p className="text-sm" style={{ color: "#736E6A" }}>
          Need to book another session?
        </p>
        <p className="text-xs mt-1" style={{ color: "#736E6A" }}>
          Use the booking link shared by your therapist.
        </p>
      </div>
    </div>
  );
}
