"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePracticeMe, useOnboardingTokens } from "@/lib/api-hooks";
const PRACTICE_ROLES: Record<string, { label: string; description: string }> = {
  owner: { label: "Owner", description: "Full access" },
  admin: { label: "Admin", description: "Manage team and settings" },
  therapist: { label: "Therapist", description: "Client and session access" },
  intern: { label: "Intern", description: "Limited access" },
};
import { toast } from "sonner";
import {
  UsersRound,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Link as LinkIcon,
  X,
  UserPlus,
  ChevronDown,
} from "lucide-react";

const ROLE_ICONS = {
  owner: ShieldCheck,
  therapist: Shield,
  admin: ShieldAlert,
} as const;

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  owner: { bg: "#EBF0EB", text: "#5C7A6B" },
  admin: { bg: "#FBF0E8", text: "#B5733A" },
  therapist: { bg: "#EAF4F1", text: "#3D8B7A" },
  intern: { bg: "#F0EFED", text: "#6B6460" },
};

function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamPage() {
  const practice = usePracticeMe();
  const qc = useQueryClient();

  const practiceId = (practice.data as any)?.[0]?.id || (practice.data as any)?.id;
  const members = useQuery({
    queryKey: ["practice", "members", practiceId],
    queryFn: () => api.practice.listMembers(practiceId),
    enabled: !!practiceId,
  });
  const invitations = useQuery({
    queryKey: ["practice", "invitations"],
    queryFn: () => api.practice.listInvitations(),
    enabled: !!practice.data,
  });
  const onboardingTokens = useOnboardingTokens();

  const [practiceName, setPracticeName] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"therapist" | "admin">("therapist");
  const [inviteNotesAccess, setInviteNotesAccess] = useState(false);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [onboardingLabel, setOnboardingLabel] = useState("");
  const [showPastInvites, setShowPastInvites] = useState(false);

  const createPractice = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.practice.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice", "me"] });
      qc.invalidateQueries({ queryKey: ["practice", "members"] });
      toast.success("Practice created");
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    const pendingName = localStorage.getItem("bendre_pending_practice");
    if (pendingName && !practice.data && !practice.isLoading) {
      localStorage.removeItem("bendre_pending_practice");
      createPractice.mutate({ name: pendingName });
    }
  }, [practice.data, practice.isLoading]);

  const updateMember = useMutation({
    mutationFn: ({
      member_id,
      ...data
    }: { member_id: string } & Record<string, unknown>) =>
      api.practice.updateMember(member_id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice", "members"] });
      toast.success("Member updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMember = useMutation({
    mutationFn: ({ member_id }: { member_id: string }) =>
      api.practice.removeMember(member_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice", "members"] });
      toast.success("Member removed");
    },
    onError: (err) => toast.error(err.message),
  });

  const createInvitation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.practice.createInvitation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice", "invitations"] });
      setShowInviteForm(false);
      setInviteEmail("");
      setInviteRole("therapist");
      setInviteNotesAccess(false);
      toast.success("Invitation created");
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeInvitation = useMutation({
    mutationFn: ({ invitation_id }: { invitation_id: string }) =>
      api.practice.revokeInvitation(invitation_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice", "invitations"] });
      toast.success("Invitation revoked");
    },
    onError: (err) => toast.error(err.message),
  });

  const createOnboardingToken = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.onboarding.createToken(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding", "tokens"] });
      setShowOnboardingForm(false);
      setOnboardingLabel("");
      toast.success("Onboarding link created");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleOnboardingToken = useMutation({
    mutationFn: ({
      token_id,
      is_active,
    }: {
      token_id: string;
      is_active: boolean;
    }) => api.onboarding.toggleToken(token_id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding", "tokens"] });
    },
    onError: (err) => toast.error(err.message),
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  // Loading skeleton
  if (practice.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-7 w-24 bg-[#E5E0D8] rounded-[8px] animate-pulse" />
            <div className="h-4 w-64 bg-[#E5E0D8] rounded-[6px] animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-[#E5E0D8] rounded-[8px] animate-pulse" />
        </div>
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[72px] px-6 border-b border-[#E5E0D8] last:border-b-0 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#E5E0D8] animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-[#E5E0D8] rounded animate-pulse" />
                <div className="h-3 w-48 bg-[#E5E0D8] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const practiceData = practice.data as any;

  // No practice yet
  if (!practiceData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Team</h1>
          <p className="text-sm text-[#5C5856] mt-1">
            Create a practice to invite therapists and admin staff.
          </p>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-[#F4F1EC] flex items-center justify-center mb-4">
            <UsersRound size={24} className="text-[#C5BFB8]" />
          </div>
          <p className="text-base font-medium text-[#5C5856]">
            You don&apos;t have a practice yet
          </p>
          <p className="text-sm text-[#8A8480] mt-1 max-w-sm">
            Create one to start managing a team. You&apos;ll be the owner with full access.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!practiceName.trim()) return;
              createPractice.mutate({ name: practiceName.trim() });
            }}
            className="flex items-center gap-2 max-w-sm mx-auto mt-6"
          >
            <input
              type="text"
              value={practiceName}
              onChange={(e) => setPracticeName(e.target.value)}
              placeholder="Practice name"
              required
              className="flex-1 px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] placeholder:text-[#8A8480] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
            />
            <button
              type="submit"
              disabled={createPractice.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#5C7A6B] text-white text-sm font-medium transition-all duration-150 hover:bg-[#496158] disabled:opacity-60 whitespace-nowrap"
            >
              <Plus size={14} />
              {createPractice.isPending ? "Creating..." : "Create"}
            </button>
          </form>
        </div>

        <OnboardingSection
          tokens={toArray(onboardingTokens.data)}
          showForm={showOnboardingForm}
          label={onboardingLabel}
          onLabelChange={setOnboardingLabel}
          onToggleForm={() => setShowOnboardingForm(!showOnboardingForm)}
          onCreate={() =>
            createOnboardingToken.mutate({
              label: onboardingLabel.trim() || undefined,
            })
          }
          onToggle={(id, active) =>
            toggleOnboardingToken.mutate({ token_id: id, is_active: active })
          }
          onCopy={copyToClipboard}
          creating={createOnboardingToken.isPending}
        />
      </div>
    );
  }

  const isOwner = practiceData.role === "owner";
  const invitationsData = toArray(invitations.data);
  const pendingInvitations = invitationsData.filter((i) => i.status === "pending");
  const pastInvitations = invitationsData.filter((i) => i.status !== "pending");
  const membersData = toArray(members.data);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Team</h1>
          <p className="text-sm text-[#5C5856] mt-1">
            {practiceData.name} — manage your team members and their access.
          </p>
        </div>
        {isOwner && !showInviteForm && (
          <button
            type="button"
            onClick={() => setShowInviteForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#5C7A6B] text-white text-sm font-medium transition-all duration-150 hover:bg-[#496158] min-h-[36px]"
          >
            <UserPlus size={14} />
            Invite Member
          </button>
        )}
      </div>

      {/* Invite form */}
      {isOwner && showInviteForm && (
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-[#1C1C1E]">
              Invite a team member
            </h3>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="p-1.5 rounded-[6px] text-[#8A8480] hover:text-[#1C1C1E] hover:bg-[#F4F1EC] transition-all duration-150"
            >
              <X size={16} />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createInvitation.mutate({
                email: inviteEmail.trim() || undefined,
                role: inviteRole,
                can_view_notes: inviteNotesAccess,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[13px] font-medium text-[#5C5856] mb-1.5">
                Email{" "}
                <span className="text-[#8A8480] font-normal">
                  (optional — leave blank for open link)
                </span>
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="therapist@example.com"
                className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] placeholder:text-[#8A8480] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-[13px] font-medium text-[#5C5856] mb-1.5">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "therapist" | "admin")
                  }
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
                >
                  <option value="therapist">Therapist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={inviteNotesAccess}
                  onChange={(e) => setInviteNotesAccess(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E0D8] text-[#5C7A6B] focus:ring-[rgba(74,111,165,0.15)] focus:ring-offset-0"
                />
                <span className="text-sm text-[#5C5856] font-medium">
                  Can view notes
                </span>
              </label>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={createInvitation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#5C7A6B] text-white text-sm font-medium transition-all duration-150 hover:bg-[#496158] disabled:opacity-60 min-h-[36px]"
              >
                {createInvitation.isPending ? "Creating..." : "Create Invitation"}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2.5 rounded-[8px] bg-white border border-[#E5E0D8] text-[#1C1C1E] text-sm font-medium transition-all duration-150 hover:bg-[#F4F1EC] min-h-[36px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480]">
            Pending Invitations
          </p>
          <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-[#E5E0D8]">
            {pendingInvitations.map((inv: any) => {
              const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inv.token}`;
              return (
                <div
                  key={inv.id}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#FBF0E8] flex items-center justify-center flex-shrink-0">
                      <UserPlus size={14} className="text-[#B5733A]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#1C1C1E] truncate">
                        {inv.email || "Open invitation"}
                      </div>
                      <div className="text-xs text-[#5C5856] capitalize">
                        {inv.role} · Expires{" "}
                        {new Date(inv.expires_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-[999px] bg-[#FBF0E8] text-[#B5733A] text-[11px] font-medium">
                      Pending
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inviteUrl)}
                      className="p-2 rounded-[6px] text-[#8A8480] hover:text-[#5C7A6B] hover:bg-[#EBF0EB] transition-all duration-150"
                      title="Copy invite link"
                    >
                      <Copy size={14} />
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() =>
                          revokeInvitation.mutate({ invitation_id: inv.id })
                        }
                        className="p-2 rounded-[6px] text-[#8A8480] hover:text-[#C0705A] hover:bg-[#F9EDED] transition-all duration-150"
                        title="Revoke invitation"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480]">
          Team Members
        </p>
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#E5E0D8] bg-[#F4F1EC]">
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480]">
              Member
            </span>
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480] w-24">
              Role
            </span>
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480] w-28">
              Notes Access
            </span>
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480] w-20">
              Actions
            </span>
          </div>

          {membersData.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <UsersRound size={40} className="text-[#C5BFB8] mb-4" strokeWidth={1.5} />
              <p className="text-base font-medium text-[#5C5856]">No team members yet</p>
              <p className="text-sm text-[#8A8480] mt-1">
                Invite colleagues to collaborate on your practice.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E0D8]">
              {membersData.map((m: any) => {
                const therapistInfo = m.therapists as {
                  full_name: string;
                  email: string | null;
                  avatar_url: string | null;
                } | null;
                const RoleIcon =
                  ROLE_ICONS[m.role as keyof typeof ROLE_ICONS] ?? Shield;
                const roleInfo =
                  PRACTICE_ROLES[m.role as keyof typeof PRACTICE_ROLES];
                const roleColor = ROLE_COLORS[m.role] ?? ROLE_COLORS.therapist;
                const name = therapistInfo?.full_name ?? "Invited member";

                return (
                  <div
                    key={m.id}
                    className="grid grid-cols-[1fr] md:grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-[#F9F8F5] transition-colors duration-150"
                  >
                    {/* Member info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                        style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
                      >
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#1C1C1E] truncate">
                          {name}
                        </div>
                        {therapistInfo?.email && (
                          <div className="text-xs text-[#8A8480] truncate">
                            {therapistInfo.email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="w-24">
                      {isOwner && m.role !== "owner" ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            updateMember.mutate({
                              member_id: m.id,
                              role: e.target.value as "therapist" | "admin",
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
                        >
                          <option value="therapist">Therapist</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[999px] text-[11px] font-medium"
                          style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
                        >
                          <RoleIcon size={10} />
                          {roleInfo?.label ?? m.role}
                        </span>
                      )}
                    </div>

                    {/* Notes access */}
                    <div className="w-28">
                      {isOwner && m.role !== "owner" ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateMember.mutate({
                              member_id: m.id,
                              can_view_notes: !m.can_view_notes,
                            })
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[999px] text-[11px] font-medium transition-all duration-150 ${
                            m.can_view_notes
                              ? "bg-[#EAF4F1] text-[#3D8B7A] hover:bg-[#D3EBE5]"
                              : "bg-[#F0EFED] text-[#6B6460] hover:bg-[#E5E0D8]"
                          }`}
                        >
                          {m.can_view_notes ? (
                            <Eye size={10} />
                          ) : (
                            <EyeOff size={10} />
                          )}
                          {m.can_view_notes ? "Can view" : "No access"}
                        </button>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[999px] text-[11px] font-medium ${
                          m.can_view_notes ? "bg-[#EAF4F1] text-[#3D8B7A]" : "bg-[#F0EFED] text-[#6B6460]"
                        }`}>
                          {m.can_view_notes ? <Eye size={10} /> : <EyeOff size={10} />}
                          {m.can_view_notes ? "Can view" : "No access"}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="w-20 flex justify-end">
                      {isOwner && m.role !== "owner" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Remove this member from the practice?")) {
                              removeMember.mutate({ member_id: m.id });
                            }
                          }}
                          className="p-2 rounded-[6px] text-[#8A8480] hover:text-[#C0705A] hover:bg-[#F9EDED] transition-all duration-150"
                          title="Remove member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Past invitations (collapsible) */}
      {pastInvitations.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowPastInvites(!showPastInvites)}
            className="flex items-center gap-2 text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480] hover:text-[#5C5856] transition-colors"
          >
            <ChevronDown
              size={12}
              className={`transition-transform duration-150 ${showPastInvites ? "rotate-180" : ""}`}
            />
            Past Invitations ({pastInvitations.length})
          </button>
          {showPastInvites && (
            <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-[#E5E0D8] animate-fade-in">
              {pastInvitations.map((inv: any) => (
                <div
                  key={inv.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <span className="text-sm text-[#5C5856]">
                    {inv.email || "Open link"}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-[999px] text-[11px] font-medium ${
                      inv.status === "accepted"
                        ? "bg-[#EAF4F1] text-[#3D8B7A]"
                        : inv.status === "revoked"
                          ? "bg-[#F9EDED] text-[#A0504A]"
                          : "bg-[#F0EFED] text-[#6B6460]"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Client onboarding links */}
      <OnboardingSection
        tokens={toArray(onboardingTokens.data)}
        showForm={showOnboardingForm}
        label={onboardingLabel}
        onLabelChange={setOnboardingLabel}
        onToggleForm={() => setShowOnboardingForm(!showOnboardingForm)}
        onCreate={() =>
          createOnboardingToken.mutate({
            label: onboardingLabel.trim() || undefined,
          })
        }
        onToggle={(id, active) =>
          toggleOnboardingToken.mutate({ token_id: id, is_active: active })
        }
        onCopy={copyToClipboard}
        creating={createOnboardingToken.isPending}
      />

      {/* Role permissions reference */}
      <div className="bg-[#EBF0EB] rounded-[12px] border border-[#5C7A6B]/10 p-5">
        <p className="text-sm font-semibold text-[#1C1C1E] mb-3">Role permissions</p>
        <div className="space-y-1.5">
          {Object.entries(PRACTICE_ROLES).map(([key, val]) => (
            <p key={key} className="text-xs text-[#5C5856]">
              <span className="font-medium capitalize text-[#1C1C1E]">{val.label}</span>
              {" — "}
              {val.description}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Client onboarding tokens section
interface OnboardingToken {
  id: string;
  token: string;
  label: string | null;
  is_active: boolean;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

function OnboardingSection({
  tokens,
  showForm,
  label,
  onLabelChange,
  onToggleForm,
  onCreate,
  onToggle,
  onCopy,
  creating,
}: {
  tokens: OnboardingToken[];
  showForm: boolean;
  label: string;
  onLabelChange: (v: string) => void;
  onToggleForm: () => void;
  onCreate: () => void;
  onToggle: (id: string, active: boolean) => void;
  onCopy: (text: string) => void;
  creating: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1C1C1E] flex items-center gap-2">
            <LinkIcon size={14} className="text-[#5C7A6B]" />
            Client onboarding links
          </h3>
          <p className="text-xs text-[#8A8480] mt-0.5">
            Share these links so clients can register themselves.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleForm}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#5C7A6B] hover:bg-[#EBF0EB] transition-all duration-150 border border-transparent hover:border-[#5C7A6B]/20"
        >
          <Plus size={12} />
          Create link
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-4 flex items-center gap-3 animate-slide-up">
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="Label (e.g. Website, WhatsApp group)"
            className="flex-1 px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] placeholder:text-[#8A8480] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
          />
          <button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#5C7A6B] text-white text-sm font-medium transition-all duration-150 hover:bg-[#496158] disabled:opacity-60 whitespace-nowrap"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {tokens.length > 0 && (
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-[#E5E0D8]">
          {tokens.map((t) => {
            const url = `${typeof window !== "undefined" ? window.location.origin : ""}/onboard/${t.token}`;
            return (
              <div
                key={t.id}
                className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#F9F8F5] transition-colors duration-150"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#1C1C1E] truncate">
                    {t.label || "Onboarding link"}
                  </div>
                  <div className="text-xs text-[#8A8480]">
                    {t.use_count} registered
                    {t.max_uses && ` / ${t.max_uses} max`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCopy(url)}
                    className="p-2 rounded-[6px] text-[#8A8480] hover:text-[#5C7A6B] hover:bg-[#EBF0EB] transition-all duration-150"
                    title="Copy link"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(t.id, !t.is_active)}
                    className={`inline-flex items-center px-2.5 py-1 rounded-[999px] text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                      t.is_active
                        ? "bg-[#EAF4F1] text-[#3D8B7A] hover:bg-[#D3EBE5]"
                        : "bg-[#F0EFED] text-[#6B6460] hover:bg-[#E5E0D8]"
                    }`}
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
