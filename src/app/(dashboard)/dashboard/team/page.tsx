"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePracticeMe, useOnboardingTokens } from "@/lib/api-hooks";
import { PRACTICE_ROLES } from "@bendre/shared";
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
} from "lucide-react";

const ROLE_ICONS = {
  owner: ShieldCheck,
  therapist: Shield,
  admin: ShieldAlert,
} as const;

function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
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
  const [inviteRole, setInviteRole] = useState<"therapist" | "admin">(
    "therapist"
  );
  const [inviteNotesAccess, setInviteNotesAccess] = useState(false);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [onboardingLabel, setOnboardingLabel] = useState("");

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

  if (practice.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-48 bg-bg rounded-small animate-pulse" />
        <div className="h-40 bg-card rounded-card border border-border shadow-card animate-pulse" />
      </div>
    );
  }

  const practiceData = practice.data as any;

  // No practice yet
  if (!practiceData) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <UsersRound size={22} className="text-sage" />
            <h1 className="text-2xl font-semibold text-ink">Team</h1>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            Create a practice to invite therapists and admin staff.
          </p>
        </div>

        <div className="bg-card rounded-card border border-border shadow-card p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-bg mx-auto flex items-center justify-center">
            <UsersRound size={24} className="text-ink-tertiary" />
          </div>
          <div>
            <p className="text-sm text-ink font-medium">
              You don&apos;t have a practice yet
            </p>
            <p className="text-xs text-ink-secondary mt-1">
              Create one to start managing a team. You&apos;ll be the owner with
              full access.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!practiceName.trim()) return;
              createPractice.mutate({ name: practiceName.trim() });
            }}
            className="flex items-center gap-2 max-w-sm mx-auto"
          >
            <input
              type="text"
              value={practiceName}
              onChange={(e) => setPracticeName(e.target.value)}
              placeholder="Practice name"
              required
              className="ui-input"
            />
            <button
              type="submit"
              disabled={createPractice.isPending}
              className="btn-primary"
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
  const pendingInvitations = invitationsData.filter(
    (i) => i.status === "pending"
  );
  const pastInvitations = invitationsData.filter(
    (i) => i.status !== "pending"
  );
  const membersData = toArray(members.data);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <UsersRound size={22} className="text-sage" />
          <h1 className="text-2xl font-semibold text-ink">Team</h1>
        </div>
        <p className="text-sm text-ink-secondary mt-1">
          {practiceData.name} -- manage your team members and their access.
        </p>
      </div>

      {/* Invite button */}
      {isOwner && (
        <div>
          {showInviteForm ? (
            <div className="bg-card rounded-card border border-border shadow-card p-7 space-y-5 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">
                  Create invitation
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="p-1.5 rounded-small text-ink-tertiary hover:text-ink hover:bg-bg transition-all duration-200"
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
                  <label className="ui-label">
                    Email{" "}
                    <span className="text-ink-tertiary font-normal">
                      (optional -- leave blank for open link)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="therapist@example.com"
                    className="ui-input"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="ui-label">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) =>
                        setInviteRole(
                          e.target.value as "therapist" | "admin"
                        )
                      }
                      className="ui-input"
                    >
                      <option value="therapist">Therapist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-5">
                    <input
                      type="checkbox"
                      checked={inviteNotesAccess}
                      onChange={(e) =>
                        setInviteNotesAccess(e.target.checked)
                      }
                      className="rounded border-border text-sage focus:ring-sage/20 focus:ring-offset-0"
                    />
                    <span className="text-xs text-ink-secondary font-medium">
                      Notes access
                    </span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={createInvitation.isPending}
                  className="btn-primary"
                >
                  {createInvitation.isPending
                    ? "Creating..."
                    : "Create Invitation"}
                </button>
              </form>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowInviteForm(true)}
              className="btn-primary"
            >
              <UserPlus size={14} />
              Invite team member
            </button>
          )}
        </div>
      )}

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="ui-section-label">Pending invitations</h3>
          <div className="bg-card rounded-card border border-border shadow-card overflow-hidden divide-y divide-border">
            {pendingInvitations.map((inv: any) => {
              const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inv.token}`;
              return (
                <div
                  key={inv.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-ink font-medium truncate">
                      {inv.email || "Open invitation"}
                    </div>
                    <div className="text-xs text-ink-secondary capitalize">
                      {inv.role} &middot; Expires{" "}
                      {new Date(inv.expires_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inviteUrl)}
                      className="p-2 rounded-small text-ink-tertiary hover:text-sage hover:bg-sage-bg transition-all duration-200"
                      title="Copy invite link"
                    >
                      <Copy size={14} />
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() =>
                          revokeInvitation.mutate({
                            invitation_id: inv.id,
                          })
                        }
                        className="p-2 rounded-small text-ink-tertiary hover:text-error hover:bg-error-bg transition-all duration-200"
                        title="Revoke"
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

      {/* Members list */}
      <div className="bg-card rounded-card border border-border shadow-card overflow-hidden divide-y divide-border">
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

          return (
            <div
              key={m.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-bg transition-colors duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-sage-bg flex items-center justify-center flex-shrink-0">
                  <RoleIcon size={16} className="text-sage" />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">
                    {therapistInfo?.full_name ?? "Invited member"}
                  </div>
                  <div className="text-xs text-ink-secondary flex items-center gap-2.5 mt-0.5">
                    <span className="capitalize">
                      {roleInfo?.label ?? m.role}
                    </span>
                    <span className="text-border">|</span>
                    <span className="inline-flex items-center gap-1">
                      {m.can_view_notes ? (
                        <>
                          <Eye size={10} /> Can view notes
                        </>
                      ) : (
                        <>
                          <EyeOff size={10} /> No notes access
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {isOwner && m.role !== "owner" && (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) =>
                      updateMember.mutate({
                        member_id: m.id,
                        role: e.target.value as "therapist" | "admin",
                      })
                    }
                    className="text-xs px-2.5 py-1.5 rounded-small border border-border bg-surface text-ink focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage/10 transition-all duration-200"
                  >
                    <option value="therapist">Therapist</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      updateMember.mutate({
                        member_id: m.id,
                        can_view_notes: !m.can_view_notes,
                      })
                    }
                    title={
                      m.can_view_notes
                        ? "Revoke notes access"
                        : "Grant notes access"
                    }
                    className={`p-2 rounded-small transition-all duration-200 ${
                      m.can_view_notes
                        ? "text-sage hover:bg-sage-bg"
                        : "text-ink-tertiary hover:bg-bg"
                    }`}
                  >
                    {m.can_view_notes ? (
                      <Eye size={14} />
                    ) : (
                      <EyeOff size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm("Remove this member from the practice?")
                      ) {
                        removeMember.mutate({ member_id: m.id });
                      }
                    }}
                    className="p-2 rounded-small text-ink-tertiary hover:text-error hover:bg-error-bg transition-all duration-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {membersData.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-ink-secondary">No team members yet</p>
          </div>
        )}
      </div>

      {/* Past invitations */}
      {pastInvitations.length > 0 && (
        <details className="group">
          <summary className="ui-section-label cursor-pointer list-none flex items-center gap-1.5">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform group-open:rotate-90"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Past invitations ({pastInvitations.length})
          </summary>
          <div className="mt-2.5 bg-card rounded-card border border-border shadow-card overflow-hidden divide-y divide-border">
            {pastInvitations.map((inv: any) => (
              <div
                key={inv.id}
                className="px-5 py-3 flex items-center justify-between text-xs"
              >
                <span className="text-ink-secondary">
                  {inv.email || "Open link"}
                </span>
                <span
                  className={`badge ${
                    inv.status === "accepted"
                      ? "badge-success"
                      : inv.status === "revoked"
                        ? "badge-error"
                        : "badge-sage"
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </details>
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

      {/* Info card */}
      <div className="bg-sage-bg rounded-card p-5 text-xs text-ink-secondary space-y-1.5">
        <p className="font-medium text-ink text-sm">Role permissions</p>
        {Object.entries(PRACTICE_ROLES).map(([key, val]) => (
          <p key={key}>
            <span className="font-medium capitalize">{val.label}</span> --{" "}
            {val.description}
          </p>
        ))}
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
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <LinkIcon size={14} className="text-sage" />
            Client onboarding links
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Share these links with clients so they can register themselves.
          </p>
        </div>
        <button type="button" onClick={onToggleForm} className="btn-ghost btn-sm">
          <Plus size={12} />
          Create link
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-card border border-border shadow-card p-5 flex items-center gap-3 animate-slide-up">
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="Label (e.g. Website, WhatsApp group)"
            className="ui-input"
          />
          <button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className="btn-primary btn-sm whitespace-nowrap"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {tokens.length > 0 && (
        <div className="bg-card rounded-card border border-border shadow-card overflow-hidden divide-y divide-border">
          {tokens.map((t) => {
            const url = `${typeof window !== "undefined" ? window.location.origin : ""}/onboard/${t.token}`;
            return (
              <div
                key={t.id}
                className="px-5 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink truncate">
                    {t.label || "Onboarding link"}
                  </div>
                  <div className="text-xs text-ink-secondary">
                    {t.use_count} registered
                    {t.max_uses && ` / ${t.max_uses} max`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCopy(url)}
                    className="p-2 rounded-small text-ink-tertiary hover:text-sage hover:bg-sage-bg transition-all duration-200"
                    title="Copy link"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(t.id, !t.is_active)}
                    className={`badge ${
                      t.is_active ? "badge-success" : "badge-sage"
                    } cursor-pointer transition-all duration-200`}
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
