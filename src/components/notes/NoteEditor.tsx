"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useCreateNote, useUpdateNote } from "@/lib/api-hooks";
import { useCustomTags } from "@/lib/use-custom-tags";
import NoteTypeSelector, { type NoteTemplate } from "./NoteTypeSelector";
import {
  Save,
  AlertTriangle,
  Wrench,
  BookOpen,
  Check,
  Loader2,
} from "lucide-react";

// ── Inline constants (no @bendre/shared) ─────────────────────────────────────

const NOTE_TEMPLATES = {
  soap: {
    label: "SOAP Note",
    description: "Subjective, Objective, Assessment, Plan",
    fields: [
      {
        key: "subjective",
        label: "Subjective",
        placeholder:
          "What the client reports — their words, mood, presenting concerns...",
      },
      {
        key: "objective",
        label: "Objective",
        placeholder:
          "Observable data — affect, behavior, appearance, test results...",
      },
      {
        key: "assessment",
        label: "Assessment",
        placeholder:
          "Clinical formulation — diagnosis, progress, themes, patterns...",
      },
      {
        key: "plan",
        label: "Plan",
        placeholder:
          "Treatment plan, next steps, follow-up, referrals, homework...",
      },
    ],
  },
  dap: {
    label: "DAP Note",
    description: "Data, Assessment, Plan",
    fields: [
      {
        key: "subjective",
        label: "Data",
        placeholder:
          "Client report + clinician observations — what was said and observed...",
      },
      {
        key: "objective",
        label: "Assessment",
        placeholder:
          "Clinical interpretation — patterns, themes, diagnostic impressions...",
      },
      {
        key: "assessment",
        label: "Plan",
        placeholder:
          "Next steps, interventions, homework, follow-up schedule...",
      },
    ],
  },
  freeform: {
    label: "Free Form",
    description: "Open-ended clinical notes",
    fields: [
      {
        key: "freeform_content",
        label: "Notes",
        placeholder: "Write freely — no template required...",
      },
    ],
  },
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface NoteEditorProps {
  sessionId: string;
  existingNote?: {
    id: string;
    note_type: string;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    freeform_content: string | null;
    homework: string | null;
    techniques_used: string[];
    risk_flags: string[];
  };
  sessionInfo?: {
    clientName: string;
    startsAt: string;
  };
  onSaved?: () => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

// ── Chip input component ──────────────────────────────────────────────────────

function ChipInput({
  label,
  icon,
  available,
  selected,
  onToggle,
  activeStyle,
  activeChipStyle,
}: {
  label: string;
  icon: React.ReactNode;
  available: string[];
  selected: string[];
  onToggle: (item: string) => void;
  activeStyle: React.CSSProperties;
  activeChipStyle: React.CSSProperties;
}) {
  return (
    <div>
      <label
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider mb-2"
        style={{ color: "#8A8480" }}
      >
        {icon}
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {available.map((item) => {
          const isActive = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className="px-2.5 py-1 rounded-full text-[12px] font-medium transition-all duration-150 border"
              style={
                isActive
                  ? activeStyle
                  : {
                      background: "transparent",
                      color: "#8A8480",
                      borderColor: "#E5E0D8",
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#F4F1EC";
                  e.currentTarget.style.color = "#5C5856";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#8A8480";
                }
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
      {/* Selected chips shown separately if not in available list */}
      {selected.filter((s) => !available.includes(s)).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {selected
            .filter((s) => !available.includes(s))
            .map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onToggle(item)}
                className="px-2.5 py-1 rounded-full text-[12px] font-medium transition-all duration-150 border"
                style={activeChipStyle}
              >
                {item}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Main NoteEditor ───────────────────────────────────────────────────────────

export default function NoteEditor({
  sessionId,
  existingNote,
  sessionInfo,
  onSaved,
}: NoteEditorProps) {
  const { techniques: availableTechniques, riskFlags: availableRiskFlags } =
    useCustomTags();

  const [noteType, setNoteType] = useState<NoteTemplate>(
    (existingNote?.note_type as NoteTemplate) ?? "soap"
  );
  const [fields, setFields] = useState<Record<string, string>>({
    subjective: existingNote?.subjective ?? "",
    objective: existingNote?.objective ?? "",
    assessment: existingNote?.assessment ?? "",
    plan: existingNote?.plan ?? "",
    freeform_content: existingNote?.freeform_content ?? "",
  });
  const [homework, setHomework] = useState(existingNote?.homework ?? "");
  const [techniques, setTechniques] = useState<string[]>(
    existingNote?.techniques_used ?? []
  );
  const [riskFlags, setRiskFlags] = useState<string[]>(
    existingNote?.risk_flags ?? []
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  // ── Save logic ──────────────────────────────────────────────────────────────

  const buildPayload = useCallback(
    () => ({
      note_type: noteType,
      subjective: fields.subjective || null,
      objective: fields.objective || null,
      assessment: fields.assessment || null,
      plan: fields.plan || null,
      freeform_content: fields.freeform_content || null,
      homework: homework || null,
      techniques_used: techniques,
      risk_flags: riskFlags,
    }),
    [noteType, fields, homework, techniques, riskFlags]
  );

  const doSave = useCallback(
    (silent = false) => {
      if (!isDirtyRef.current && existingNote) return;
      setSaveState("saving");
      const payload = buildPayload();

      const onSuccess = () => {
        setSaveState("saved");
        isDirtyRef.current = false;
        if (!silent) toast.success("Note saved");
        onSaved?.();
        // Reset to idle after 3s
        setTimeout(() => setSaveState("idle"), 3000);
      };

      const onError = (err: Error) => {
        setSaveState("error");
        toast.error(err.message || "Failed to save note — try again");
      };

      if (existingNote) {
        updateNote.mutate(
          { noteId: existingNote.id, ...payload },
          { onSuccess, onError }
        );
      } else {
        createNote.mutate(
          { sessionId, ...payload },
          { onSuccess, onError }
        );
      }
    },
    [buildPayload, existingNote, sessionId, createNote, updateNote, onSaved]
  );

  // ── Auto-save: debounce 3s after last change ────────────────────────────────

  const scheduleAutoSave = useCallback(() => {
    isDirtyRef.current = true;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      doSave(true);
    }, 3000);
  }, [doSave]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // ── Field change handlers ────────────────────────────────────────────────────

  function handleFieldChange(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    scheduleAutoSave();
  }

  function handleHomeworkChange(value: string) {
    setHomework(value);
    scheduleAutoSave();
  }

  function toggleTechnique(t: string) {
    setTechniques((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
    scheduleAutoSave();
  }

  function toggleRiskFlag(f: string) {
    setRiskFlags((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
    scheduleAutoSave();
  }

  function handleNoteTypeChange(type: NoteTemplate) {
    setNoteType(type);
    scheduleAutoSave();
  }

  const template = NOTE_TEMPLATES[noteType];
  const isPending = createNote.isPending || updateNote.isPending;

  return (
    <div className="w-full max-w-[720px] mx-auto space-y-8">
      {/* Session context bar */}
      {sessionInfo && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg border"
          style={{
            background: "#F4F1EC",
            borderColor: "#E5E0D8",
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-semibold"
            style={{ background: "#EBF0EB", color: "#5C7A6B" }}
          >
            {sessionInfo.clientName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-medium text-ink">
              {sessionInfo.clientName}
            </div>
            <div className="text-[12px]" style={{ color: "#8A8480" }}>
              {new Date(sessionInfo.startsAt).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              })}{" "}
              &middot;{" "}
              {new Date(sessionInfo.startsAt).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Kolkata",
              })}
            </div>
          </div>
          {/* Save indicator in context bar */}
          <div className="flex-shrink-0">
            {saveState === "saving" && (
              <span
                className="flex items-center gap-1.5 text-[12px]"
                style={{ color: "#8A8480" }}
              >
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </span>
            )}
            {saveState === "saved" && (
              <span
                className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: "#5C7A6B" }}
              >
                <Check size={12} />
                Saved
              </span>
            )}
          </div>
        </div>
      )}

      {/* Note type selector */}
      <NoteTypeSelector selected={noteType} onChange={handleNoteTypeChange} />

      {/* Template fields */}
      <div className="space-y-6">
        {template.fields.map((field) => (
          <div key={field.key}>
            <label
              className="block text-[12px] font-medium mb-2"
              style={{ color: "#5C5856" }}
            >
              {field.label}
            </label>
            <textarea
              value={fields[field.key as keyof typeof fields] ?? ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={field.key === "freeform_content" ? 10 : 4}
              className="w-full px-4 py-3 rounded-lg border text-[14px] leading-relaxed resize-none transition-all duration-150 focus:outline-none"
              style={{
                background: "#FFFFFF",
                borderColor: "#E5E0D8",
                color: "#1C1C1E",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#8FAF8A";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(92,122,107,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E5E0D8";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #E5E0D8" }} />

      {/* Homework */}
      <div>
        <label
          className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider mb-2"
          style={{ color: "#8A8480" }}
        >
          <BookOpen size={13} strokeWidth={1.5} />
          Homework / Between-Session Tasks
        </label>
        <textarea
          value={homework}
          onChange={(e) => handleHomeworkChange(e.target.value)}
          placeholder="Worksheets, exercises, readings, practices to share with client..."
          rows={2}
          className="w-full px-4 py-3 rounded-lg border text-[14px] leading-relaxed resize-none transition-all duration-150 focus:outline-none"
          style={{
            background: "#FFFFFF",
            borderColor: "#E5E0D8",
            color: "#1C1C1E",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#8FAF8A";
            e.currentTarget.style.boxShadow =
              "0 0 0 3px rgba(92,122,107,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#E5E0D8";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Techniques used */}
      <ChipInput
        label="Techniques Used"
        icon={<Wrench size={13} strokeWidth={1.5} />}
        available={availableTechniques}
        selected={techniques}
        onToggle={toggleTechnique}
        activeStyle={{
          background: "#EBF0EB",
          color: "#5C7A6B",
          borderColor: "#5C7A6B",
        }}
        activeChipStyle={{
          background: "#EBF0EB",
          color: "#5C7A6B",
          borderColor: "#5C7A6B",
        }}
      />

      {/* Risk flags */}
      <ChipInput
        label="Risk Flags"
        icon={<AlertTriangle size={13} strokeWidth={1.5} />}
        available={availableRiskFlags}
        selected={riskFlags}
        onToggle={toggleRiskFlag}
        activeStyle={{
          background: "#F9EDED",
          color: "#C0705A",
          borderColor: "#C0705A",
        }}
        activeChipStyle={{
          background: "#F9EDED",
          color: "#C0705A",
          borderColor: "#C0705A",
        }}
      />

      {/* Save button row */}
      <div className="flex items-center gap-4 pt-2 pb-8">
        <button
          onClick={() => doSave(false)}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-150 disabled:opacity-50"
          style={{ background: "#5C7A6B" }}
          onMouseEnter={(e) => {
            if (!isPending) e.currentTarget.style.background = "#496158";
          }}
          onMouseLeave={(e) => {
            if (!isPending) e.currentTarget.style.background = "#5C7A6B";
          }}
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} strokeWidth={1.5} />
          )}
          {isPending
            ? "Saving..."
            : existingNote
            ? "Save Changes"
            : "Save Note"}
        </button>

        {/* Save state indicator (when no session bar visible) */}
        {!sessionInfo && (
          <>
            {saveState === "saving" && (
              <span
                className="flex items-center gap-1.5 text-[12px]"
                style={{ color: "#8A8480" }}
              >
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </span>
            )}
            {saveState === "saved" && (
              <span
                className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: "#5C7A6B" }}
              >
                <Check size={12} />
                Saved
              </span>
            )}
            {saveState === "error" && (
              <span
                className="text-[12px]"
                style={{ color: "#C0705A" }}
              >
                Didn't save — try again
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
