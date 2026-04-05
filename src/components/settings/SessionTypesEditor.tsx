"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Clock,
  Video,
  Users,
  MapPin,
  IndianRupee,
  Layers,
} from "lucide-react";
import { Select } from "@/components/ui/Select";

// ─── Constants ───────────────────────────────────────────────────────────────

const SESSION_DURATIONS = [15, 30, 45, 50, 60, 75, 90, 120];

const DURATION_OPTIONS = SESSION_DURATIONS.map((d) => ({
  value: String(d),
  label: `${d} min`,
}));

type SessionMode = "in-person" | "online" | "group";

const SESSION_MODES: { value: SessionMode; label: string }[] = [
  { value: "in-person", label: "In-person" },
  { value: "online", label: "Online" },
  { value: "group", label: "Group" },
];

// ─── Mode encoding helpers ────────────────────────────────────────────────────
// Mode is stored as a prefix in the description field: "[mode:online] text"
// This keeps the backend schema unchanged while surfacing a clean mode concept.

function encodeDescription(mode: SessionMode, description: string): string | null {
  const prefix = `[mode:${mode}]`;
  const text = description.trim();
  if (text) return `${prefix} ${text}`;
  return prefix;
}

function decodeDescription(raw: string | null | undefined): {
  mode: SessionMode;
  description: string;
} {
  if (!raw) return { mode: "in-person", description: "" };
  const match = raw.match(/^\[mode:(in-person|online|group)\]\s*/);
  if (match) {
    return {
      mode: match[1] as SessionMode,
      description: raw.slice(match[0].length),
    };
  }
  // Legacy: no mode prefix, treat as in-person
  return { mode: "in-person", description: raw };
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface BackendSessionType {
  id: string;
  therapist_id: string;
  name: string;
  duration_mins: number;
  rate_inr: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  intake_form_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SessionTypeFormData {
  name: string;
  duration_mins: number;
  rate_inr: number;
  mode: SessionMode;
  description: string;
  is_active: boolean;
}

const emptyForm: SessionTypeFormData = {
  name: "",
  duration_mins: 50,
  rate_inr: 0,
  mode: "in-person",
  description: "",
  is_active: true,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toArray(d: unknown): BackendSessionType[] {
  if (Array.isArray(d)) return d as BackendSessionType[];
  if (d && typeof d === "object" && Array.isArray((d as { data?: unknown }).data))
    return (d as { data: BackendSessionType[] }).data;
  return [];
}

function formatRupees(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Mode styles ─────────────────────────────────────────────────────────────

type ModeStyle = {
  bg: string;
  text: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const MODE_STYLES: Record<SessionMode, ModeStyle> = {
  "in-person": { bg: "#EAF4F1", text: "#3D8B7A", Icon: MapPin },
  online:      { bg: "#EBF0EB", text: "#5C7A6B", Icon: Video },
  group:       { bg: "#FBF0E8", text: "#B5733A", Icon: Users },
};

// ─── Mode pill component ──────────────────────────────────────────────────────

function ModePill({ mode, label }: { mode: SessionMode; label: string }) {
  const { bg, text, Icon } = MODE_STYLES[mode];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: bg, color: text }}
    >
      <Icon size={11} strokeWidth={1.5} />
      {label}
    </span>
  );
}

// ─── Mode selector for the form ───────────────────────────────────────────────

function ModeSelector({
  value,
  onChange,
}: {
  value: SessionMode;
  onChange: (mode: SessionMode) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {SESSION_MODES.map((m) => {
        const { bg, text, Icon } = MODE_STYLES[m.value];
        const isActive = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 cursor-pointer"
            style={{
              background: isActive ? bg : "#F4F1EC",
              color: isActive ? text : "#8A8480",
              border: `1.5px solid ${isActive ? text + "40" : "#E5E0D8"}`,
              boxShadow: isActive ? `0 0 0 2px ${text}18` : "none",
            }}
          >
            <Icon size={12} strokeWidth={1.5} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SessionTypesEditor() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionTypeFormData>({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SessionTypeFormData, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<BackendSessionType | null>(null);

  const qc = useQueryClient();

  // ── Query ──
  const sessionTypesQuery = useQuery({
    queryKey: ["session-types", "list"],
    queryFn: () => api.sessionType.list(),
  });
  const sessionTypes = toArray(sessionTypesQuery.data);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.sessionType.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session-types"] });
      toast.success("Session type created");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.sessionType.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session-types"] });
      toast.success("Session type updated");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => api.sessionType.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session-types"] });
      toast.success("Session type deleted");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Keyboard: close modals on Escape ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteTarget) setDeleteTarget(null);
        else if (showModal) closeModal();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showModal, deleteTarget]);

  // ── Handlers ──
  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormErrors({});
  }

  function openCreate() {
    setForm({ ...emptyForm, duration_mins: 50 });
    setEditingId(null);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(st: BackendSessionType) {
    const { mode, description } = decodeDescription(st.description);
    setForm({
      name: st.name,
      duration_mins: st.duration_mins,
      rate_inr: st.rate_inr,
      mode,
      description,
      is_active: st.is_active,
    });
    setEditingId(st.id);
    setFormErrors({});
    setShowModal(true);
  }

  function validateForm(): boolean {
    const errors: Partial<Record<keyof SessionTypeFormData, string>> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (form.rate_inr < 0) errors.rate_inr = "Rate cannot be negative";
    if (form.description.length > 200)
      errors.description = "Description must be 200 characters or less";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSave() {
    if (!validateForm()) return;

    const encodedDescription = encodeDescription(form.mode, form.description);

    const payload = {
      name: form.name.trim(),
      duration_mins: form.duration_mins,
      rate_inr: form.rate_inr,
      description: encodedDescription,
      is_active: form.is_active,
      sort_order: editingId
        ? (sessionTypes.find((s) => s.id === editingId)?.sort_order ?? 0)
        : sessionTypes.length,
      intake_form_id: null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function updateField<K extends keyof SessionTypeFormData>(
    key: K,
    value: SessionTypeFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── Render ──
  return (
    <section className="bg-surface rounded-card border border-border shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={18} strokeWidth={1.5} className="text-sage" />
            <h2 className="text-lg font-sans font-semibold text-ink">Session Types</h2>
          </div>
          <p className="text-sm text-ink-tertiary">
            Define the types of sessions you offer, with durations and rates.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 shrink-0 bg-sage text-white px-4 py-2 rounded-small text-sm font-semibold hover:bg-sage-dark transition-all shadow-sage"
        >
          <Plus size={15} strokeWidth={2} />
          Add Session Type
        </button>
      </div>

      {/* Loading skeleton */}
      {sessionTypesQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-small border border-border bg-bg/50 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-border rounded-md" />
                  <div className="h-3 w-24 bg-border rounded-md" />
                </div>
                <div className="h-8 w-20 bg-border rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!sessionTypesQuery.isLoading && sessionTypes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: "#F4F1EC" }}
          >
            <Layers size={24} strokeWidth={1.5} style={{ color: "#C5BFB8" }} />
          </div>
          <p className="text-[15px] font-medium text-ink-secondary mb-1">
            No session types yet
          </p>
          <p className="text-sm text-ink-tertiary mb-4">
            Add your first session type to get started.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-sage text-white px-4 py-2 rounded-small text-sm font-semibold hover:bg-sage-dark transition-all shadow-sage"
          >
            <Plus size={15} strokeWidth={2} />
            Add session type
          </button>
        </div>
      )}

      {/* Session type cards */}
      {!sessionTypesQuery.isLoading && sessionTypes.length > 0 && (
        <div className="space-y-3">
          {sessionTypes.map((st) => {
            const { mode, description } = decodeDescription(st.description);
            const modeLabel = SESSION_MODES.find((m) => m.value === mode)?.label ?? "In-person";
            return (
              <div
                key={st.id}
                className={`rounded-small border bg-surface overflow-hidden transition-all ${
                  st.is_active
                    ? "border-border"
                    : "border-border/40 opacity-60"
                }`}
                style={{
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center justify-between px-5 py-4 gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <h3 className="text-[15px] font-semibold text-ink leading-tight">
                        {st.name}
                      </h3>
                      {!st.is_active && (
                        <span className="text-[10px] font-medium text-ink-tertiary bg-bg border border-border px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-[13px] text-ink-secondary">
                        <Clock size={12} strokeWidth={1.5} />
                        {st.duration_mins} min
                      </span>
                      <span className="flex items-center gap-1 text-[13px] font-medium text-ink">
                        <IndianRupee size={12} strokeWidth={1.5} />
                        {formatRupees(st.rate_inr).replace("₹", "")}
                      </span>
                      <ModePill mode={mode} label={modeLabel} />
                    </div>
                    {description && (
                      <p className="mt-1.5 text-[12px] text-ink-tertiary leading-relaxed line-clamp-1">
                        {description}
                      </p>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(st)}
                      className="p-2 text-ink-tertiary hover:text-sage hover:bg-bg transition-colors rounded-lg"
                      title="Edit"
                      aria-label={`Edit ${st.name}`}
                    >
                      <Pencil size={15} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(st)}
                      className="p-2 text-ink-tertiary hover:text-danger hover:bg-bg transition-colors rounded-lg"
                      title="Delete"
                      aria-label={`Delete ${st.name}`}
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(28,28,30,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Delete ${deleteTarget.name}`}
            className="bg-surface rounded-[16px] w-full max-w-sm mx-4 p-8"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
          >
            <h3 className="text-[20px] font-bold text-ink mb-2">
              Delete &ldquo;{deleteTarget.name}&rdquo;?
            </h3>
            <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
              This can&rsquo;t be undone. Sessions that were booked under this type
              won&rsquo;t be affected, but it will no longer appear as a booking option.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-small text-sm font-medium text-ink-secondary border border-border hover:bg-bg transition-colors"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate({ id: deleteTarget.id })}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-small text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "#C0705A" }}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete session type"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(28,28,30,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? "Edit session type" : "Add session type"}
            className="bg-surface rounded-[16px] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border">
              <h3 className="text-[20px] font-bold text-ink">
                {editingId ? "Edit Session Type" : "Add Session Type"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="p-2 text-ink-tertiary hover:text-ink hover:bg-bg transition-colors rounded-lg"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-8 py-6 space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="st-name"
                  className="block text-[13px] font-medium text-ink-secondary mb-1.5"
                >
                  Name
                </label>
                <input
                  id="st-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  onBlur={() => {
                    if (!form.name.trim())
                      setFormErrors((p) => ({ ...p, name: "Name is required" }));
                  }}
                  placeholder="e.g. Individual Therapy"
                  className={`w-full px-3.5 py-2.5 rounded-small border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow ${
                    formErrors.name ? "border-danger" : "border-border"
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[12px] mt-1" style={{ color: "#C0705A" }}>
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Duration + Rate row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="st-duration"
                    className="block text-[13px] font-medium text-ink-secondary mb-1.5"
                  >
                    Duration
                  </label>
                  <Select
                    id="st-duration"
                    value={String(form.duration_mins)}
                    onChange={(v) => updateField("duration_mins", Number(v))}
                    options={DURATION_OPTIONS}
                    ariaLabel="Duration"
                  />
                </div>
                <div>
                  <label
                    htmlFor="st-rate"
                    className="block text-[13px] font-medium text-ink-secondary mb-1.5"
                  >
                    Rate (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee
                      size={14}
                      strokeWidth={1.5}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "#8A8480" }}
                    />
                    <input
                      id="st-rate"
                      type="number"
                      min="0"
                      step="100"
                      value={form.rate_inr === 0 ? "" : form.rate_inr}
                      onChange={(e) =>
                        updateField("rate_inr", parseInt(e.target.value || "0", 10))
                      }
                      placeholder="0"
                      className={`w-full h-11 pl-8 pr-3 rounded-[8px] border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow ${
                        formErrors.rate_inr ? "border-danger" : "border-border"
                      }`}
                    />
                  </div>
                  {form.rate_inr === 0 && (
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: "#5C7A6B" }}>
                      Free / no charge
                    </p>
                  )}
                  {formErrors.rate_inr && (
                    <p className="text-[12px] mt-1" style={{ color: "#C0705A" }}>
                      {formErrors.rate_inr}
                    </p>
                  )}
                </div>
              </div>

              {/* Mode selector */}
              <div>
                <label className="block text-[13px] font-medium text-ink-secondary mb-2">
                  Session mode
                </label>
                <ModeSelector
                  value={form.mode}
                  onChange={(m) => updateField("mode", m)}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="st-description"
                  className="block text-[13px] font-medium text-ink-secondary mb-1.5"
                >
                  Description{" "}
                  <span className="font-normal text-ink-tertiary">(optional)</span>
                </label>
                <textarea
                  id="st-description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  onBlur={() => {
                    if (form.description.length > 200)
                      setFormErrors((p) => ({
                        ...p,
                        description: "Description must be 200 characters or less",
                      }));
                  }}
                  placeholder="Brief description shown on your booking page…"
                  rows={2}
                  maxLength={210}
                  className={`w-full px-3.5 py-2.5 rounded-small border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow resize-none ${
                    formErrors.description ? "border-danger" : "border-border"
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {formErrors.description ? (
                    <p className="text-[12px]" style={{ color: "#C0705A" }}>
                      {formErrors.description}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-ink-tertiary">
                    {form.description.length}/200
                  </span>
                </div>
              </div>

              {/* Active toggle — edit only */}
              {editingId && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => updateField("is_active", e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-sage"
                  />
                  <span className="text-sm text-ink-secondary">Active</span>
                  <span className="text-[12px] text-ink-tertiary">
                    (inactive types won&rsquo;t appear on the booking page)
                  </span>
                </label>
              )}
            </div>

            {/* Modal footer */}
            <div
              className="flex items-center justify-between px-8 py-5 border-t border-border rounded-b-[16px]"
              style={{ background: "#FAFAF8" }}
            >
              <div>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = sessionTypes.find((s) => s.id === editingId);
                      if (target) {
                        closeModal();
                        setDeleteTarget(target);
                      }
                    }}
                    className="text-[13px] font-medium transition-colors"
                    style={{ color: "#C0705A" }}
                  >
                    Delete this type
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-small text-sm font-medium text-ink-secondary border border-border bg-surface hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-small text-sm font-semibold text-white bg-sage hover:bg-sage-dark transition-all disabled:opacity-50 shadow-sage"
                >
                  {isSaving
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
