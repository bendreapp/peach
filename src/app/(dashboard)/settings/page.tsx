"use client";

import { useState } from "react";
import {
  useTherapistMe,
  useTherapistAvailability,
} from "@/lib/api-hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ProfileForm from "@/components/settings/ProfileForm";
import SessionTypesEditor from "@/components/settings/SessionTypesEditor";
import AvailabilityEditor from "@/components/settings/AvailabilityEditor";
import IntegrationCards from "@/components/settings/IntegrationCards";
import BookingPageSection from "@/components/settings/BookingPageSection";
import PoliciesForm from "@/components/settings/PoliciesForm";
import TagManager from "@/components/settings/TagManager";
import IntakeFormEditor from "@/components/settings/IntakeFormEditor";
import {
  Settings,
  User,
  Clock,
  LayoutList,
  ClipboardList,
  Plug,
  ShieldCheck,
  Globe,
  Tags,
} from "lucide-react";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "availability", label: "Availability", icon: Clock },
  { key: "session-types", label: "Session Types", icon: LayoutList },
  { key: "intake-forms", label: "Intake Forms", icon: ClipboardList },
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "policies", label: "Policies", icon: ShieldCheck },
  { key: "booking", label: "Booking Page", icon: Globe },
  { key: "tags", label: "Tags", icon: Tags },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const therapist = useTherapistMe();
  const availability = useTherapistAvailability();
  const integrations = useQuery({
    queryKey: ["integration", "status"],
    queryFn: () => api.integration.status(),
    retry: false,
  });

  if (therapist.isLoading || availability.isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-sage" />
          <h1 className="text-2xl font-semibold text-ink">Settings</h1>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-card shadow-card p-7 space-y-4"
          >
            <div className="h-5 w-32 bg-bg rounded-small animate-pulse" />
            <div className="h-3 w-64 bg-bg rounded-small animate-pulse" />
            <div className="space-y-3">
              <div className="h-10 bg-bg rounded-small animate-pulse" />
              <div className="h-10 bg-bg rounded-small animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (therapist.error || !therapist.data) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-error-bg border border-error/15 rounded-card p-7 text-center">
          <p className="text-error text-sm font-medium">
            Failed to load settings. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const t = therapist.data as any;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-sage" />
          <h1 className="text-2xl font-semibold text-ink">Settings</h1>
        </div>
        <p className="text-sm text-ink-secondary mt-1">
          Manage your profile, availability, and practice preferences.
        </p>
      </div>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-1.5 border-b border-border pb-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-small text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sage text-white shadow-sage"
                  : "text-ink-secondary hover:bg-bg hover:text-ink"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "profile" && (
          <ProfileForm
            therapist={{
              full_name: t.full_name,
              display_name: t.display_name,
              slug: t.slug,
              bio: t.bio,
              qualifications: t.qualifications,
              phone: t.phone,
              gstin: t.gstin,
            }}
          />
        )}

        {activeTab === "session-types" && (
          <SessionTypesEditor
            sessionTypes={t.session_types ?? []}
            bufferMins={t.buffer_mins}
          />
        )}

        {activeTab === "intake-forms" && (
          <IntakeFormEditor sessionTypes={t.session_types ?? []} />
        )}

        {activeTab === "availability" && (
          <AvailabilityEditor availability={(availability.data as any) ?? []} />
        )}

        {activeTab === "booking" && (
          <BookingPageSection
            slug={t.slug}
            bookingPageActive={t.booking_page_active}
          />
        )}

        {activeTab === "tags" && <TagManager customTags={t.custom_tags} />}

        {activeTab === "policies" && (
          <PoliciesForm
            therapist={{
              cancellation_policy: t.cancellation_policy,
              late_policy: t.late_policy,
              rescheduling_policy: t.rescheduling_policy,
              cancellation_hours: t.cancellation_hours ?? 24,
              min_booking_advance_hours: t.min_booking_advance_hours ?? 24,
              no_show_charge_percent: t.no_show_charge_percent ?? 100,
              late_cancel_charge_percent: t.late_cancel_charge_percent ?? 100,
            }}
          />
        )}

        {activeTab === "integrations" && (
          <IntegrationCards
            zoomConnected={(integrations.data as any)?.zoom ?? false}
            googleConnected={
              (integrations.data as any)?.google_calendar ?? false
            }
          />
        )}
      </div>
    </div>
  );
}
