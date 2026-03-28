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
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center gap-2.5 mb-8">
          <Settings size={22} className="text-sage" />
          <div className="h-7 w-32 bg-border rounded-lg animate-pulse" />
        </div>
        <div className="h-12 bg-border/50 rounded-xl mb-8 animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 bg-border/30 rounded-lg animate-pulse" />
          <div className="h-10 bg-border/30 rounded-lg animate-pulse" />
          <div className="h-10 bg-border/30 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (therapist.error || !therapist.data) {
    return (
      <div className="max-w-[900px] mx-auto">
        <div className="rounded-2xl border border-error/20 bg-error-bg p-8 text-center">
          <p className="text-error text-sm font-medium">
            Failed to load settings. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const t = therapist.data as any;

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <Settings size={22} className="text-sage" />
          <h1 className="text-2xl font-bold text-ink tracking-tight">Settings</h1>
        </div>
        <p className="text-[14px] text-ink-secondary mt-1 ml-[34px]">
          Manage your profile, availability, and practice preferences.
        </p>
      </div>

      {/* Layout: sidebar tabs on desktop, dropdown on mobile */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile: dropdown */}
        <div className="md:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabKey)}
            className="w-full h-11 px-4 rounded-xl border border-border bg-card text-ink text-[14px] font-semibold appearance-none cursor-pointer focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
          >
            {TABS.map((tab) => (
              <option key={tab.key} value={tab.key}>{tab.label}</option>
            ))}
          </select>
        </div>

        {/* Desktop: sidebar tabs */}
        <nav className="hidden md:flex flex-col gap-1 w-[200px] flex-shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] font-medium text-left transition-all duration-150 ${
                  isActive
                    ? "bg-sage/10 text-sage-dark font-semibold"
                    : "text-ink-secondary hover:text-ink hover:bg-border/20"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "text-sage" : "text-ink-tertiary"} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
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
    </div>
  );
}
