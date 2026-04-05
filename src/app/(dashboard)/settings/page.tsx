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
import CommsTemplates from "@/components/settings/CommsTemplates";
import {
  User,
  Clock,
  LayoutList,
  ClipboardList,
  Plug,
  ShieldCheck,
  Globe,
  Tags,
  MessageCircle,
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
  { key: "comms", label: "Comms", icon: MessageCircle },
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

  // Loading skeleton
  if (therapist.isLoading || availability.isLoading) {
    return (
      <div className="max-w-[1100px] mx-auto">
        {/* Page header skeleton */}
        <div className="mb-6">
          <div className="h-7 w-28 bg-border rounded-small animate-pulse mb-2" />
          <div className="h-4 w-64 bg-border/60 rounded animate-pulse" />
        </div>

        <div className="flex gap-6">
          {/* Left nav skeleton */}
          <div
            className="flex-shrink-0 bg-surface rounded-card border border-border shadow-card p-3 space-y-1"
            style={{ width: 180 }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div
                key={i}
                className="h-9 rounded-small animate-pulse"
                style={{ background: i % 3 === 0 ? "#E5E0D8" : "#F4F1EC" }}
              />
            ))}
          </div>

          {/* Content skeleton */}
          <div className="flex-1 bg-surface rounded-card border border-border shadow-card p-6 space-y-4">
            <div className="h-6 w-32 bg-border rounded animate-pulse" />
            <div className="h-10 bg-border/50 rounded-small animate-pulse" />
            <div className="h-10 bg-border/50 rounded-small animate-pulse" />
            <div className="h-10 bg-border/50 rounded-small animate-pulse" />
            <div className="h-10 bg-border/50 rounded-small animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (therapist.error || !therapist.data) {
    return (
      <div className="max-w-[1100px] mx-auto">
        <div
          className="rounded-card border p-8 text-center"
          style={{
            background: "#F9EDED",
            borderColor: "rgba(192,112,90,0.2)",
          }}
        >
          <p
            className="text-[14px] font-medium"
            style={{ color: "#A0504A" }}
          >
            Failed to load settings. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const t = therapist.data as any;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-ink tracking-tight">
          Settings
        </h1>
        <p className="text-[14px] text-ink-secondary mt-0.5">
          Manage your profile, availability, and practice preferences.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Mobile: dropdown ── */}
        <div className="md:hidden w-full mb-2">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabKey)}
            className="w-full h-10 px-3 rounded-small border border-border bg-surface text-ink text-[14px] font-medium appearance-none cursor-pointer focus:outline-none transition-colors"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238A8480' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            {TABS.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Desktop: Left sub-nav (180px) ── */}
        <nav
          className="hidden md:flex flex-col flex-shrink-0 bg-surface rounded-card border border-border shadow-card p-2"
          style={{ width: 180 }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-small text-[13px] font-medium text-left w-full transition-colors duration-150"
                style={
                  isActive
                    ? {
                        background: "#EBF0EB",
                        color: "#5C7A6B",
                      }
                    : {
                        background: "transparent",
                        color: "var(--color-ink-secondary)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "#F4F1EC";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon
                  size={15}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{
                    color: isActive
                      ? "#5C7A6B"
                      : "var(--color-ink-tertiary)",
                    flexShrink: 0,
                  }}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Right content panel ── */}
        <div className="flex-1 min-w-0">
          <div
            className="bg-surface rounded-card border border-border shadow-card overflow-hidden"
            style={{ minHeight: 480 }}
          >
            {/* Content panel inner padding */}
            <div className="p-6 md:p-8">
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
                <SessionTypesEditor />
              )}

              {activeTab === "intake-forms" && (
                <IntakeFormEditor />
              )}

              {activeTab === "availability" && (
                <AvailabilityEditor
                  availability={(availability.data as any) ?? []}
                />
              )}

              {activeTab === "booking" && <BookingPageSection />}

              {activeTab === "tags" && (
                <TagManager customTags={t.custom_tags} />
              )}

              {activeTab === "policies" && (
                <PoliciesForm
                  therapist={{
                    cancellation_policy: t.cancellation_policy,
                    late_policy: t.late_policy,
                    rescheduling_policy: t.rescheduling_policy,
                    cancellation_hours: t.cancellation_hours ?? 24,
                    min_booking_advance_hours:
                      t.min_booking_advance_hours ?? 24,
                    no_show_charge_percent: t.no_show_charge_percent ?? 100,
                    late_cancel_charge_percent:
                      t.late_cancel_charge_percent ?? 100,
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

              {activeTab === "comms" && <CommsTemplates />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
