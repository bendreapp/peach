"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useClientDetail,
  useSendPortalInvite,
  useUpdateClientStatus,
  useUpdateClient,
  useClientSessionTypes,
  useSetDefaultClientSessionType,
  useUpdateClientSessionType,
} from "@/lib/api-hooks";
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
  Pause,
  Play,
  X,
  Layers,
  Star,
  ToggleRight,
  ToggleLeft,
  AlertTriangle,
} from "lucide-react";
import {
  ClientHeader,
  SessionsTab,
  NotesTab,
  TreatmentTab,
  ResourcesTab,
  IntakeTab,
  ClientSessionTypes,
} from "@/components/client-detail";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "sessions" | "notes" | "treatment" | "resources" | "intake" | "session-types";

const TABS: { key: Tab; label: string; icon: typeof CalendarDays }[] = [
  { key: "sessions", label: "Sessions", icon: CalendarDays },
  { key: "notes", label: "Notes", icon: FileText },
  { key: "treatment", label: "Treatment", icon: ClipboardList },
  { key: "intake", label: "Intake", icon: ClipboardList },
  { key: "resources", label: "Resources", icon: FolderOpen },
  { key: "session-types", label: "Session Types", icon: Layers },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const MODE_LABELS: Record<string, string> = {
  in_person: "In-person",
  online: "Online",
  group: "Group",
};

const MODE_STYLES: Record<string, { bg: string; text: string }> = {
  in_person: { bg: "#EAF4F1", text: "#3D8B7A" },
  online: { bg: "#EBF0EB", text: "#5C7A6B" },
  group: { bg: "#FBF0E8", text: "#B5733A" },
};

// ─── More Actions Menu ────────────────────────────────────────────────────────

function MoreActionsMenu({
  clientId,
  isActive,
  clientName,
}: {
  clientId: string;
  isActive: boolean;
  clientName: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const updateStatus = useUpdateClientStatus();

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  function handleToggleStatus() {
    const newStatus = isActive ? "inactive" : "active";
    updateStatus.mutate(
      { id: clientId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(isActive ? `${clientName} archived` : `${clientName} reactivated`);
          setOpen(false);
          if (isActive) router.push("/dashboard/clients");
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] bg-white border border-[#E5E0D8] text-[#1C1C1E] text-sm font-medium transition-all duration-150 hover:bg-[#F4F1EC] cursor-pointer"
      >
        <MoreHorizontal size={13} />
        More actions
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 bottom-full mb-1 rounded-[8px] py-1 z-50"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          }}
        >
          <button
            onClick={handleToggleStatus}
            disabled={updateStatus.isPending}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-100 hover:bg-[#F4F1EC] disabled:opacity-50 cursor-pointer"
            style={{ color: "#1C1C1E" }}
          >
            {isActive ? <Pause size={14} style={{ color: "#8A8480" }} /> : <Play size={14} style={{ color: "#8A8480" }} />}
            {isActive ? "Archive client" : "Reactivate client"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Client Labels ────────────────────────────────────────────────────────────

function ClientLabels({
  clientId,
  initialLabels,
}: {
  clientId: string;
  initialLabels: string[];
}) {
  const [labels, setLabels] = useState<string[]>(initialLabels);
  const [input, setInput] = useState("");
  const updateClient = useUpdateClient();

  // Sync when parent data changes (e.g., after refetch)
  useEffect(() => {
    setLabels(initialLabels);
  }, [JSON.stringify(initialLabels)]);

  function saveLabels(next: string[]) {
    setLabels(next);
    updateClient.mutate(
      { id: clientId, labels: next },
      {
        onError: (err: Error) => {
          toast.error(err.message || "Failed to save labels");
          setLabels(labels); // revert
        },
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = input.trim().replace(/,$/, "");
      if (!val) return;
      if (labels.includes(val)) {
        setInput("");
        return;
      }
      saveLabels([...labels, val]);
      setInput("");
    } else if (e.key === "Backspace" && !input && labels.length > 0) {
      saveLabels(labels.slice(0, -1));
    }
  }

  function removeLabel(label: string) {
    saveLabels(labels.filter((l) => l !== label));
  }

  return (
    <div className="mt-4 pt-4 border-t border-[#E5E0D8]">
      <p className="text-[10px] font-medium tracking-[0.06em] uppercase text-[#8A8480] mb-2">
        Labels
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {labels.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1"
            style={{
              background: "#EBF0EB",
              color: "#5C7A6B",
              border: "1px solid #D4E0D4",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
            }}
          >
            {label}
            <button
              onClick={() => removeLabel(label)}
              className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add label, press Enter"
        className="w-full h-8 px-2.5 rounded-[6px] text-xs text-[#1C1C1E] border border-[#E5E0D8] bg-white focus:outline-none focus:border-[#8FAF8A] transition-colors placeholder:text-[#C8C4BE]"
        style={{ fontFamily: "Satoshi" }}
      />
    </div>
  );
}

// ─── Portal Invite Modal ──────────────────────────────────────────────────────

function PortalInviteModal({
  clientId,
  clientName,
  clientEmail,
  onClose,
}: {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  onClose: () => void;
}) {
  const sessionTypesQuery = useClientSessionTypes(clientId);
  const sendPortalInvite = useSendPortalInvite();
  const setDefaultMutation = useSetDefaultClientSessionType();
  const updateMutation = useUpdateClientSessionType();

  const sessionTypes: any[] = (sessionTypesQuery.data as any) ?? [];
  const activeTypes = sessionTypes.filter((t: any) => t.is_active);
  const canSend = activeTypes.length > 0 && !!clientEmail;

  function handleSend() {
    sendPortalInvite.mutate(clientId, {
      onSuccess: () => {
        toast.success(`Portal invite sent to ${clientEmail}`);
        onClose();
      },
      onError: (err: Error) =>
        toast.error(err.message || "Failed to send invite — try again"),
    });
  }

  function handleToggleActive(item: any) {
    updateMutation.mutate(
      { clientId, id: item.id, is_active: !item.is_active },
      {
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  function handleSetDefault(item: any) {
    setDefaultMutation.mutate(
      { clientId, id: item.id },
      {
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-[14px] overflow-hidden"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E0D8",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#E5E0D8]">
          <div>
            <h2 className="text-base font-bold text-[#1C1C1E]">
              Invite {clientName} to Portal
            </h2>
            <p className="text-xs text-[#8A8480] mt-0.5">
              Send a portal access link to this client
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-[#8A8480] hover:bg-[#F4F1EC] hover:text-[#1C1C1E] transition-colors cursor-pointer mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-medium text-[#8A8480] mb-1.5">
              Invite email
            </label>
            <div
              className="h-10 px-3 flex items-center rounded-[8px] text-sm text-[#5C5856] border border-[#E5E0D8]"
              style={{ background: "#F9F7F4" }}
            >
              {clientEmail ? (
                <>
                  <Mail size={13} className="mr-2 text-[#8A8480]" />
                  {clientEmail}
                </>
              ) : (
                <span className="text-[#C0705A] text-xs">
                  No email on file — add one before sending the invite
                </span>
              )}
            </div>
          </div>

          {/* Session types */}
          <div>
            <label className="block text-[11px] font-medium text-[#8A8480] mb-1.5">
              Session types
            </label>

            {sessionTypesQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-[8px] bg-[#F4F1EC] animate-pulse" />
                ))}
              </div>
            ) : sessionTypes.length === 0 ? (
              <div
                className="flex items-start gap-2.5 p-3 rounded-[8px]"
                style={{ background: "#FBF0E8", border: "1px solid #E8C9A0" }}
              >
                <AlertTriangle size={14} style={{ color: "#B5733A", flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs text-[#B5733A] leading-relaxed">
                  No session types configured for this client. Add at least one
                  session type before sending the invite.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {sessionTypes.map((item: any) => {
                  const modeStyle = item.mode ? MODE_STYLES[item.mode] : null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] border"
                      style={{
                        background: item.is_active ? "#FFFFFF" : "#F9F7F4",
                        borderColor: item.is_default ? "#8FAF8A" : "#E5E0D8",
                        opacity: item.is_active ? 1 : 0.65,
                      }}
                    >
                      {/* Default radio */}
                      <button
                        onClick={() => !item.is_default && handleSetDefault(item)}
                        disabled={item.is_default || setDefaultMutation.isPending}
                        title={item.is_default ? "Default" : "Make default"}
                        className="flex-shrink-0 transition-opacity disabled:opacity-100 cursor-pointer"
                      >
                        <Star
                          size={13}
                          fill={item.is_default ? "#5C7A6B" : "none"}
                          style={{
                            color: item.is_default ? "#5C7A6B" : "#C8C4BE",
                          }}
                        />
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-[#1C1C1E] truncate">
                            {item.name}
                          </span>
                          {item.is_default && (
                            <span className="text-[10px] font-medium text-[#5C7A6B] bg-[#EBF0EB] px-1.5 py-0.5 rounded-[999px]">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-[#5C5856]">
                            {item.duration_mins} min
                          </span>
                          <span className="text-[#D4D0CB] text-[10px]">·</span>
                          <span className="text-[11px] font-medium text-[#1C1C1E]">
                            ₹{item.rate_inr.toLocaleString("en-IN")}
                          </span>
                          {item.mode && modeStyle && (
                            <>
                              <span className="text-[#D4D0CB] text-[10px]">·</span>
                              <span
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-[999px]"
                                style={{
                                  background: modeStyle.bg,
                                  color: modeStyle.text,
                                }}
                              >
                                {MODE_LABELS[item.mode]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggleActive(item)}
                        disabled={updateMutation.isPending}
                        title={item.is_active ? "Deactivate" : "Activate"}
                        className="flex-shrink-0 transition-opacity disabled:opacity-50 cursor-pointer"
                      >
                        {item.is_active ? (
                          <ToggleRight size={16} style={{ color: "#5C7A6B" }} />
                        ) : (
                          <ToggleLeft size={16} style={{ color: "#8A8480" }} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E5E0D8] bg-[#F9F7F4]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] text-sm font-medium text-[#5C5856] bg-white border border-[#E5E0D8] hover:bg-[#F4F1EC] transition-all duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend || sendPortalInvite.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold text-white bg-[#5C7A6B] hover:bg-[#496158] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send size={13} />
            {sendPortalInvite.isPending ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [showPortalModal, setShowPortalModal] = useState(false);

  const client = useClientDetail(id);

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
  const clientLabels: string[] = Array.isArray(c.labels) ? c.labels : [];

  return (
    <div className="space-y-5">
      {/* Portal invite modal */}
      {showPortalModal && (
        <PortalInviteModal
          clientId={c.id}
          clientName={c.full_name}
          clientEmail={c.email}
          onClose={() => setShowPortalModal(false)}
        />
      )}

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

            {/* Labels */}
            <ClientLabels clientId={c.id} initialLabels={clientLabels} />
          </div>

          {/* Quick actions card */}
          <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-4 space-y-2">
            {!c.user_id && (
              <button
                onClick={() => setShowPortalModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] bg-[#EBF0EB] text-[#5C7A6B] text-sm font-medium transition-all duration-150 hover:bg-[#D6E7E2] cursor-pointer"
              >
                <Send size={13} />
                Invite to Portal
              </button>
            )}
            {c.user_id && (
              <div className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] bg-[#F4F1EC] text-[#8A8480] text-xs font-medium">
                <Send size={11} />
                Portal access active
              </div>
            )}
            <MoreActionsMenu
              clientId={c.id}
              isActive={c.status === "active"}
              clientName={c.full_name}
            />
          </div>
        </div>

        {/* ─── Right column: tabbed interface ─── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Client header (quick edit) */}
          <ClientHeader clientId={id} client={c} />

          {/* Tabs */}
          <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex border-b border-[#E5E0D8] px-2 pt-2 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-[8px] transition-all duration-150 relative -mb-px whitespace-nowrap ${
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
              {activeTab === "session-types" && (
                <ClientSessionTypes clientId={id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
