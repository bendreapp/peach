"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { useClientDetail, useSendPortalInvite } from "@/lib/api-hooks";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  ClipboardList,
  FolderOpen,
  Mail,
  Phone,
  Clock,
  User,
  Repeat,
  Send,
  MoreHorizontal,
} from "lucide-react";
import {
  ClientHeader,
  SessionsTab,
  NotesTab,
  TreatmentTab,
  ResourcesTab,
  IntakeTab,
} from "@/components/client-detail";

type Tab = "sessions" | "notes" | "treatment" | "resources" | "intake";

const TABS: { key: Tab; label: string; icon: typeof CalendarDays }[] = [
  { key: "sessions", label: "Sessions", icon: CalendarDays },
  { key: "notes", label: "Notes", icon: FileText },
  { key: "treatment", label: "Treatment", icon: ClipboardList },
  { key: "intake", label: "Intake", icon: ClipboardList },
  { key: "resources", label: "Resources", icon: FolderOpen },
];

function getStatusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "#EAF4F1", text: "#3D8B7A", label: "Active" },
    inactive: { bg: "#F0EFED", text: "#6B6460", label: "Inactive" },
    terminated: { bg: "#F9EDED", text: "#A0504A", label: "Terminated" },
    "on-hold": { bg: "#FBF0E8", text: "#B5733A", label: "On Hold" },
  };
  return map[status] ?? map.active;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  const client = useClientDetail(id);
  const sendPortalInvite = useSendPortalInvite();

  const handleSendInvite = useCallback(() => {
    const c = client.data as any;
    if (!c?.email) {
      toast.error("This client has no email address — add one first");
      return;
    }
    sendPortalInvite.mutate(id, {
      onSuccess: () => {
        toast.success(`Portal invite sent to ${c.email}`);
      },
      onError: (err: Error) =>
        toast.error(err.message || "Failed to send invite — try again"),
    });
  }, [client.data, id, sendPortalInvite]);

  // Skeleton loading state
  if (client.isLoading) {
    return (
      <div className="flex gap-6">
        {/* Left column skeleton */}
        <div className="w-[300px] flex-shrink-0 space-y-4">
          <div className="h-4 w-28 bg-[#E5E0D8] rounded animate-pulse" />
          <div className="bg-white rounded-[12px] border border-[#E5E0D8] p-6 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-[#E5E0D8] animate-pulse" />
              <div className="h-5 w-32 bg-[#E5E0D8] rounded animate-pulse" />
              <div className="h-4 w-20 bg-[#E5E0D8] rounded animate-pulse" />
            </div>
            <div className="space-y-2 pt-2 border-t border-[#E5E0D8]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-[#E5E0D8] rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        {/* Right column skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-11 bg-white rounded-[12px] border border-[#E5E0D8] animate-pulse" />
          <div className="h-72 bg-white rounded-[12px] border border-[#E5E0D8] animate-pulse" />
        </div>
      </div>
    );
  }

  if (client.error || !client.data) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm text-[#5C7A6B] hover:text-[#496158] font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          Back to clients
        </Link>
        <div className="bg-[#F9EDED] border border-[#C0705A]/20 rounded-[12px] p-8 text-center">
          <p className="text-sm font-medium text-[#A0504A]">Client not found</p>
          <p className="text-xs text-[#8A8480] mt-1">
            This client may have been removed or does not exist.
          </p>
        </div>
      </div>
    );
  }

  const c = client.data as any;
  const statusBadge = getStatusBadge(c.status);
  const initials = getInitials(c.full_name);

  return (
    <div className="space-y-5">
      {/* Back navigation */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-2 text-sm text-[#5C5856] hover:text-[#1C1C1E] font-medium transition-colors"
      >
        <ArrowLeft size={14} />
        All clients
      </Link>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* ─── Left column: client sidebar ─── */}
        <div className="w-[300px] flex-shrink-0 space-y-4">
          {/* Identity card */}
          <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 pb-5 border-b border-[#E5E0D8]">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                style={{ backgroundColor: "#5C7A6B" }}
              >
                {initials}
              </div>
              <div className="text-center">
                <h1 className="text-lg font-bold text-[#1C1C1E] leading-tight">
                  {c.full_name}
                </h1>
                <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-[999px] text-[11px] font-medium"
                    style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                  >
                    {statusBadge.label}
                  </span>
                  {c.client_type === "regular" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[999px] text-[11px] font-medium bg-[#EBF0EB] text-[#5C7A6B]">
                      <Repeat size={9} />
                      Regular
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="py-4 space-y-2.5 border-b border-[#E5E0D8]">
              {c.email && (
                <div className="flex items-center gap-2.5 text-sm text-[#5C5856]">
                  <Mail size={13} className="text-[#8A8480] flex-shrink-0" />
                  <span className="truncate">{c.email}</span>
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2.5 text-sm text-[#5C5856]">
                  <Phone size={13} className="text-[#8A8480] flex-shrink-0" />
                  <span>{c.phone}</span>
                </div>
              )}
              {!c.email && !c.phone && (
                <p className="text-xs text-[#8A8480]">No contact info added</p>
              )}
            </div>

            {/* Stats */}
            <div className="py-4 grid grid-cols-2 gap-3 border-b border-[#E5E0D8]">
              <div className="bg-[#F4F1EC] rounded-[8px] p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-[#8A8480] mb-1">
                  <CalendarDays size={10} />
                  Sessions
                </div>
                <div className="text-xl font-bold text-[#1C1C1E]">
                  {c.session_count ?? 0}
                </div>
              </div>
              <div className="bg-[#F4F1EC] rounded-[8px] p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-[#8A8480] mb-1">
                  <Clock size={10} />
                  Last seen
                </div>
                <div className="text-xs font-medium text-[#1C1C1E] leading-tight">
                  {c.last_session
                    ? new Date(c.last_session.starts_at).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }
                      )
                    : "Never"}
                </div>
              </div>
            </div>

            {/* Client since */}
            <div className="pt-4 flex items-center gap-2 text-xs text-[#8A8480]">
              <User size={11} />
              Client since{" "}
              {new Date(c.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              })}
            </div>

            {/* Recurring reservations */}
            {c.recurring_reservations && c.recurring_reservations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E5E0D8]">
                <p className="text-[10px] font-medium tracking-[0.06em] uppercase text-[#8A8480] mb-2">
                  Fixed weekly slots
                </p>
                <div className="space-y-1.5">
                  {c.recurring_reservations.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 text-xs text-[#5C5856] bg-[#EBF0EB] rounded-[6px] px-2.5 py-1.5"
                    >
                      <CalendarDays size={10} className="text-[#5C7A6B]" />
                      <span>
                        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][r.day_of_week]}{" "}
                        {r.start_time}–{r.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick actions card */}
          <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-4 space-y-2">
            {!c.user_id && (
              <button
                onClick={handleSendInvite}
                disabled={sendPortalInvite.isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] bg-[#EBF0EB] text-[#5C7A6B] text-sm font-medium transition-all duration-150 hover:bg-[#D6E7E2] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send size={13} />
                {sendPortalInvite.isPending ? "Sending…" : "Invite to Portal"}
              </button>
            )}
            {c.user_id && (
              <div className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] bg-[#F4F1EC] text-[#8A8480] text-xs font-medium">
                <Send size={11} />
                Portal access active
              </div>
            )}
            <button className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] bg-white border border-[#E5E0D8] text-[#1C1C1E] text-sm font-medium transition-all duration-150 hover:bg-[#F4F1EC]">
              <MoreHorizontal size={13} />
              More actions
            </button>
          </div>
        </div>

        {/* ─── Right column: tabbed interface ─── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Client header (quick edit) */}
          <ClientHeader clientId={id} client={c} />

          {/* Tabs */}
          <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex border-b border-[#E5E0D8] px-2 pt-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-[8px] transition-all duration-150 relative -mb-px ${
                      isActive
                        ? "text-[#5C7A6B] border-b-2 border-[#5C7A6B] bg-[#EBF0EB]/50"
                        : "text-[#8A8480] hover:text-[#5C5856] hover:bg-[#F4F1EC] border-b-2 border-transparent"
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-5">
              {activeTab === "sessions" && <SessionsTab clientId={id} />}
              {activeTab === "notes" && <NotesTab clientId={id} />}
              {activeTab === "treatment" && <TreatmentTab clientId={id} />}
              {activeTab === "resources" && (
                <ResourcesTab clientId={id} clientName={c.full_name} />
              )}
              {activeTab === "intake" && <IntakeTab clientId={id} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
