"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Star,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Layers,
  AlertTriangle,
} from "lucide-react";
import {
  useClientSessionTypes,
  useCreateClientSessionType,
  useUpdateClientSessionType,
  useDeleteClientSessionType,
  useSetDefaultClientSessionType,
  useTherapistMe,
} from "@/lib/api-hooks";
import { Select } from "@/components/ui/Select";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientSessionType {
  id: string;
  client_id: string;
  name: string;
  duration_mins: number;
  rate_inr: number;
  mode: "in_person" | "online" | "group" | null;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "50", label: "50 min" },
  { value: "60", label: "60 min" },
  { value: "75", label: "75 min" },
  { value: "90", label: "90 min" },
  { value: "120", label: "120 min" },
];

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

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  duration_mins: string;
  rate_inr: string;
  mode: "in_person" | "online" | "group" | "";
  description: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  duration_mins: "50",
  rate_inr: "",
  mode: "",
  description: "",
};

// ─── Mode Picker ──────────────────────────────────────────────────────────────

function ModePicker({
  value,
  onChange,
}: {
  value: "in_person" | "online" | "group" | "";
  onChange: (v: "in_person" | "online" | "group" | "") => void;
}) {
  const modes: Array<{ key: "in_person" | "online" | "group"; label: string }> = [
    { key: "in_person", label: "In-person" },
    { key: "online", label: "Online" },
    { key: "group", label: "Group" },
  ];
  return (
    <div className="flex gap-2">
      {modes.map((m) => {
        const active = value === m.key;
        const s = MODE_STYLES[m.key];
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(active ? "" : m.key)}
            className="px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150 border cursor-pointer"
            style={
              active
                ? { background: s.bg, color: s.text, borderColor: s.text + "40" }
                : {
                    background: "#FFFFFF",
                    color: "#8A8480",
                    borderColor: "#E5E0D8",
                  }
            }
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Session Type Form ────────────────────────────────────────────────────────

function SessionTypeForm({
  initial,
  clientId,
  onCancel,
  onSaved,
  practiceSessionTypes,
}: {
  initial?: ClientSessionType;
  clientId: string;
  onCancel: () => void;
  onSaved: () => void;
  practiceSessionTypes?: any[];
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          name: initial.name,
          duration_mins: String(initial.duration_mins),
          rate_inr: String(initial.rate_inr),
          mode: initial.mode ?? "",
          description: initial.description ?? "",
        }
      : EMPTY_FORM
  );
  const [showTemplates, setShowTemplates] = useState(false);

  const createMutation = useCreateClientSessionType();
  const updateMutation = useUpdateClientSessionType();

  const isPending = createMutation.isPending || updateMutation.isPending;

  function applyTemplate(t: any) {
    setForm({
      name: t.name ?? "",
      duration_mins: String(t.duration_mins ?? 50),
      rate_inr: String(t.rate_inr ?? t.rate ?? ""),
      mode: t.mode ?? "",
      description: t.description ?? "",
    });
    setShowTemplates(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.rate_inr || isNaN(Number(form.rate_inr))) {
      toast.error("A valid rate is required");
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      duration_mins: Number(form.duration_mins),
      rate_inr: Number(form.rate_inr),
      mode: form.mode || null,
      description: form.description.trim() || null,
    };

    if (initial) {
      updateMutation.mutate(
        { clientId, id: initial.id, ...payload },
        {
          onSuccess: () => {
            toast.success("Session type updated");
            onSaved();
          },
          onError: (err: Error) => toast.error(err.message),
        }
      );
    } else {
      createMutation.mutate(
        { clientId, ...payload },
        {
          onSuccess: () => {
            toast.success("Session type added");
            onSaved();
          },
          onError: (err: Error) => toast.error(err.message),
        }
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[10px] border border-[#E5E0D8] bg-[#F9F7F4] p-4 space-y-4"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-[#1C1C1E]">
          {initial ? "Edit session type" : "New session type"}
        </span>
        {!initial && practiceSessionTypes && practiceSessionTypes.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-[#5C7A6B] font-medium hover:text-[#496158] transition-colors cursor-pointer"
            >
              <Layers size={12} />
              Copy from template
            </button>
            {showTemplates && (
              <div
                className="absolute right-0 top-full mt-1 z-50 rounded-[8px] overflow-hidden"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E0D8",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  minWidth: 220,
                }}
              >
                {practiceSessionTypes.map((t: any) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-[#F4F1EC] transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-medium text-[#1C1C1E]">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-[#8A8480]">
                        {t.duration_mins} min &middot; ₹
                        {(t.rate_inr ?? t.rate ?? 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-[11px] font-medium text-[#5C5856] mb-1.5">
          Name <span className="text-[#C0705A]">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Standard 50min"
          className="w-full h-10 px-3 rounded-[8px] text-sm text-[#1C1C1E] border border-[#E5E0D8] bg-white focus:outline-none transition-all duration-150 placeholder:text-[#8A8480]"
          style={{ fontFamily: "Satoshi" }}
        />
      </div>

      {/* Duration + Rate */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-[#5C5856] mb-1.5">
            Duration <span className="text-[#C0705A]">*</span>
          </label>
          <Select
            value={form.duration_mins}
            onChange={(v) => setForm((f) => ({ ...f, duration_mins: v }))}
            options={DURATION_OPTIONS}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#5C5856] mb-1.5">
            Rate (₹) <span className="text-[#C0705A]">*</span>
          </label>
          <input
            type="number"
            min={0}
            value={form.rate_inr}
            onChange={(e) => setForm((f) => ({ ...f, rate_inr: e.target.value }))}
            placeholder="e.g. 3500"
            className="w-full h-11 px-3 rounded-[8px] text-sm text-[#1C1C1E] border border-[#E5E0D8] bg-white focus:outline-none transition-all duration-150 placeholder:text-[#8A8480]"
            style={{ fontFamily: "Satoshi" }}
          />
        </div>
      </div>

      {/* Mode */}
      <div>
        <label className="block text-[11px] font-medium text-[#5C5856] mb-1.5">
          Mode
        </label>
        <ModePicker
          value={form.mode}
          onChange={(v) => setForm((f) => ({ ...f, mode: v }))}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] font-medium text-[#5C5856] mb-1.5">
          Description{" "}
          <span className="font-normal text-[#8A8480]">(optional)</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value.slice(0, 200) }))
          }
          placeholder="Brief description…"
          rows={2}
          className="w-full px-3 py-2 rounded-[8px] text-sm text-[#1C1C1E] border border-[#E5E0D8] bg-white focus:outline-none transition-all duration-150 resize-none placeholder:text-[#8A8480]"
          style={{ fontFamily: "Satoshi" }}
        />
        <div className="text-right text-[10px] text-[#8A8480] mt-0.5">
          {form.description.length}/200
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 rounded-[8px] text-sm font-medium text-[#5C5856] bg-white border border-[#E5E0D8] hover:bg-[#F4F1EC] transition-all duration-150 disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-[8px] text-sm font-semibold text-white bg-[#5C7A6B] hover:bg-[#496158] transition-all duration-150 disabled:opacity-60 cursor-pointer"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  name,
  onConfirm,
  onCancel,
  isPending,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
    >
      <div
        className="w-full max-w-sm rounded-[12px] p-6"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E0D8",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#F9EDED" }}
          >
            <AlertTriangle size={16} style={{ color: "#C0705A" }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1C1C1E]">
              Delete session type?
            </h3>
            <p className="text-xs text-[#5C5856] mt-1">
              <span className="font-medium">&ldquo;{name}&rdquo;</span> will be
              permanently removed.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-[8px] text-sm font-medium text-[#5C5856] bg-white border border-[#E5E0D8] hover:bg-[#F4F1EC] transition-all duration-150 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-[8px] text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60 cursor-pointer"
            style={{ background: "#C0705A" }}
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Session Type Card ────────────────────────────────────────────────────────

function SessionTypeCard({
  item,
  clientId,
  onEdit,
  onDeleteRequest,
}: {
  item: ClientSessionType;
  clientId: string;
  onEdit: () => void;
  onDeleteRequest: () => void;
}) {
  const updateMutation = useUpdateClientSessionType();
  const setDefaultMutation = useSetDefaultClientSessionType();

  const modeStyle = item.mode ? MODE_STYLES[item.mode] : null;

  function handleToggleActive() {
    updateMutation.mutate(
      { clientId, id: item.id, is_active: !item.is_active },
      {
        onSuccess: () =>
          toast.success(item.is_active ? "Deactivated" : "Activated"),
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  function handleSetDefault() {
    setDefaultMutation.mutate(
      { clientId, id: item.id },
      {
        onSuccess: () => toast.success("Set as default"),
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-[10px] border transition-all duration-150"
      style={{
        background: item.is_active ? "#FFFFFF" : "#F9F7F4",
        borderColor: item.is_default ? "#8FAF8A" : "#E5E0D8",
        boxShadow: item.is_default
          ? "0 0 0 1px #8FAF8A20"
          : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.02)",
        opacity: item.is_active ? 1 : 0.65,
      }}
    >
      {/* Default star */}
      <div className="mt-0.5 flex-shrink-0">
        {item.is_default ? (
          <Star
            size={14}
            fill="#5C7A6B"
            style={{ color: "#5C7A6B" }}
          />
        ) : (
          <button
            onClick={handleSetDefault}
            disabled={setDefaultMutation.isPending}
            title="Make default"
            className="text-[#C8C4BE] hover:text-[#5C7A6B] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Star size={14} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span
            className="text-sm font-semibold text-[#1C1C1E] truncate"
            style={{ opacity: item.is_active ? 1 : 0.6 }}
          >
            {item.name}
          </span>
          {item.is_default && (
            <span className="text-[10px] font-medium text-[#5C7A6B] bg-[#EBF0EB] px-2 py-0.5 rounded-[999px]">
              Default
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs text-[#5C5856]">
            {item.duration_mins} min
          </span>
          <span className="text-[#D4D0CB]">·</span>
          <span className="text-xs font-medium text-[#1C1C1E]">
            ₹{item.rate_inr.toLocaleString("en-IN")}
          </span>
          {item.mode && modeStyle && (
            <>
              <span className="text-[#D4D0CB]">·</span>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-[999px]"
                style={{ background: modeStyle.bg, color: modeStyle.text }}
              >
                {MODE_LABELS[item.mode]}
              </span>
            </>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-[#8A8480] mt-1 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        {/* Toggle active */}
        <button
          onClick={handleToggleActive}
          disabled={updateMutation.isPending}
          title={item.is_active ? "Deactivate" : "Activate"}
          className="p-1.5 rounded-[6px] transition-colors disabled:opacity-50 cursor-pointer hover:bg-[#F4F1EC]"
        >
          {item.is_active ? (
            <ToggleRight size={16} style={{ color: "#5C7A6B" }} />
          ) : (
            <ToggleLeft size={16} style={{ color: "#8A8480" }} />
          )}
        </button>
        {/* Edit */}
        <button
          onClick={onEdit}
          title="Edit"
          className="p-1.5 rounded-[6px] text-[#8A8480] hover:text-[#1C1C1E] hover:bg-[#F4F1EC] transition-colors cursor-pointer"
        >
          <Pencil size={13} />
        </button>
        {/* Delete */}
        <button
          onClick={onDeleteRequest}
          title="Delete"
          className="p-1.5 rounded-[6px] text-[#8A8480] hover:text-[#C0705A] hover:bg-[#F9EDED] transition-colors cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ClientSessionTypesProps {
  clientId: string;
}

export default function ClientSessionTypes({
  clientId,
}: ClientSessionTypesProps) {
  const query = useClientSessionTypes(clientId);
  const therapistMe = useTherapistMe();
  const deleteMutation = useDeleteClientSessionType();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientSessionType | null>(
    null
  );

  const sessionTypes: ClientSessionType[] = (query.data as any) ?? [];
  const practiceSessionTypes: any[] =
    (therapistMe.data as any)?.session_types ?? [];

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { clientId, id: deleteTarget.id },
      {
        onSuccess: () => {
          toast.success(`"${deleteTarget.name}" deleted`);
          setDeleteTarget(null);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  }

  return (
    <>
      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteMutation.isPending}
        />
      )}

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1C1C1E]">
            Session Types
          </h2>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold text-white bg-[#5C7A6B] hover:bg-[#496158] transition-all duration-150 cursor-pointer"
            >
              <Plus size={12} />
              Add Session Type
            </button>
          )}
        </div>

        {/* Add form */}
        {showForm && !editingId && (
          <SessionTypeForm
            clientId={clientId}
            practiceSessionTypes={practiceSessionTypes}
            onCancel={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        )}

        {/* Loading */}
        {query.isLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-[10px] bg-[#F4F1EC] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!query.isLoading && sessionTypes.length === 0 && !showForm && (
          <div className="py-8 text-center rounded-[10px] border border-dashed border-[#E5E0D8]">
            <Layers size={18} className="mx-auto mb-2 text-[#C8C4BE]" />
            <p className="text-sm text-[#8A8480] mb-1">No session types yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-medium text-[#5C7A6B] hover:text-[#496158] transition-colors cursor-pointer"
            >
              Add one
            </button>
          </div>
        )}

        {/* List */}
        {!query.isLoading && sessionTypes.length > 0 && (
          <div className="space-y-2">
            {sessionTypes.map((item) =>
              editingId === item.id ? (
                <SessionTypeForm
                  key={item.id}
                  initial={item}
                  clientId={clientId}
                  practiceSessionTypes={practiceSessionTypes}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              ) : (
                <SessionTypeCard
                  key={item.id}
                  item={item}
                  clientId={clientId}
                  onEdit={() => {
                    setShowForm(false);
                    setEditingId(item.id);
                  }}
                  onDeleteRequest={() => setDeleteTarget(item)}
                />
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}
