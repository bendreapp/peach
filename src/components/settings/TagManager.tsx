"use client";

import { useState } from "react";
import { useUpdateTherapist } from "@/lib/api-hooks";
import {
  DEFAULT_TECHNIQUES,
  DEFAULT_RISK_FLAGS,
  DEFAULT_CATEGORIES,
} from "@/lib/use-custom-tags";
import { Tags, X, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

// Modality type (inline — no @bendre/shared)
interface ModalityTag {
  key: string;
  name: string;
  fullName: string;
}

const DEFAULT_MODALITIES: ModalityTag[] = [
  { key: "cbt", name: "CBT", fullName: "Cognitive Behavioral Therapy" },
  { key: "dbt", name: "DBT", fullName: "Dialectical Behavior Therapy" },
  { key: "act", name: "ACT", fullName: "Acceptance and Commitment Therapy" },
  { key: "emdr", name: "EMDR", fullName: "Eye Movement Desensitization and Reprocessing" },
  { key: "psychodynamic", name: "Psychodynamic", fullName: "Psychodynamic Therapy" },
  { key: "humanistic", name: "Humanistic", fullName: "Humanistic Therapy" },
  { key: "systemic", name: "Systemic", fullName: "Systemic / Family Therapy" },
];

// CustomTags shape (inline — no @bendre/shared)
interface CustomTags {
  modalities?: ModalityTag[];
  techniques?: string[];
  categories?: string[];
  risk_flags?: string[];
}

interface TagManagerProps {
  customTags: CustomTags | undefined;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function TagManager({ customTags }: TagManagerProps) {
  const [modalities, setModalities] = useState<ModalityTag[]>(
    customTags?.modalities ?? DEFAULT_MODALITIES
  );
  const [techniques, setTechniques] = useState<string[]>(
    customTags?.techniques ?? [...DEFAULT_TECHNIQUES]
  );
  const [categories, setCategories] = useState<string[]>(
    customTags?.categories ?? DEFAULT_CATEGORIES
  );
  const [riskFlags, setRiskFlags] = useState<string[]>(
    customTags?.risk_flags ?? [...DEFAULT_RISK_FLAGS]
  );

  const [newModality, setNewModality] = useState("");
  const [newTechnique, setNewTechnique] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRiskFlag, setNewRiskFlag] = useState("");

  const update = useUpdateTherapist();

  function save(
    mods: ModalityTag[],
    techs: string[],
    cats: string[],
    flags: string[]
  ) {
    update.mutate(
      {
        custom_tags: {
          modalities: mods,
          techniques: techs,
          categories: cats,
          risk_flags: flags,
        },
      },
      {
        onSuccess: () => toast.success("Tags updated"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  /* -- Modality handlers -- */
  function addModality() {
    const name = newModality.trim();
    if (!name || modalities.some((m) => m.name.toLowerCase() === name.toLowerCase()))
      return;
    const key = slugify(name);
    const next = [...modalities, { key, name, fullName: name }];
    setModalities(next);
    setNewModality("");
    save(next, techniques, categories, riskFlags);
  }

  function removeModality(key: string) {
    const next = modalities.filter((m) => m.key !== key);
    setModalities(next);
    save(next, techniques, categories, riskFlags);
  }

  function resetModalities() {
    setModalities(DEFAULT_MODALITIES);
    save(DEFAULT_MODALITIES, techniques, categories, riskFlags);
  }

  /* -- Generic string-tag handlers -- */
  function addStringTag(
    value: string,
    list: string[],
    setter: (v: string[]) => void,
    inputSetter: (v: string) => void,
    field: "techniques" | "categories" | "risk_flags"
  ) {
    const v = value.trim();
    if (!v || list.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    const next = [...list, v];
    setter(next);
    inputSetter("");
    const payload = {
      modalities,
      techniques: field === "techniques" ? next : techniques,
      categories: field === "categories" ? next : categories,
      risk_flags: field === "risk_flags" ? next : riskFlags,
    };
    save(payload.modalities, payload.techniques, payload.categories, payload.risk_flags);
  }

  function removeStringTag(
    value: string,
    list: string[],
    setter: (v: string[]) => void,
    field: "techniques" | "categories" | "risk_flags"
  ) {
    const next = list.filter((t) => t !== value);
    setter(next);
    const payload = {
      modalities,
      techniques: field === "techniques" ? next : techniques,
      categories: field === "categories" ? next : categories,
      risk_flags: field === "risk_flags" ? next : riskFlags,
    };
    save(payload.modalities, payload.techniques, payload.categories, payload.risk_flags);
  }

  function resetStringTags(
    defaults: readonly string[] | string[],
    setter: (v: string[]) => void,
    field: "techniques" | "categories" | "risk_flags"
  ) {
    const arr = [...defaults];
    setter(arr);
    const payload = {
      modalities,
      techniques: field === "techniques" ? arr : techniques,
      categories: field === "categories" ? arr : categories,
      risk_flags: field === "risk_flags" ? arr : riskFlags,
    };
    save(payload.modalities, payload.techniques, payload.categories, payload.risk_flags);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-base font-bold" style={{ color: "#1C1C1E" }}>
          <Tags size={18} style={{ color: "#5C7A6B" }} />
          Customize Tags
        </h3>
        <p className="text-xs mt-1" style={{ color: "#8A8480" }}>
          Add or remove tags used across resources, notes, and treatment plans
        </p>
      </div>

      <TagGroup
        label="Therapy Modalities"
        pills={modalities.map((m) => ({ id: m.key, label: m.name }))}
        onRemove={removeModality}
        inputValue={newModality}
        onInputChange={setNewModality}
        onAdd={addModality}
        onReset={resetModalities}
        placeholder="e.g., Narrative Therapy"
      />

      <TagGroup
        label="Techniques"
        pills={techniques.map((t) => ({ id: t, label: t }))}
        onRemove={(id) => removeStringTag(id, techniques, setTechniques, "techniques")}
        inputValue={newTechnique}
        onInputChange={setNewTechnique}
        onAdd={() =>
          addStringTag(newTechnique, techniques, setTechniques, setNewTechnique, "techniques")
        }
        onReset={() => resetStringTags(DEFAULT_TECHNIQUES, setTechniques, "techniques")}
        placeholder="e.g., Sand Tray Therapy"
      />

      <TagGroup
        label="Resource Categories"
        pills={categories.map((c) => ({ id: c, label: c }))}
        onRemove={(id) => removeStringTag(id, categories, setCategories, "categories")}
        inputValue={newCategory}
        onInputChange={setNewCategory}
        onAdd={() =>
          addStringTag(newCategory, categories, setCategories, setNewCategory, "categories")
        }
        onReset={() => resetStringTags(DEFAULT_CATEGORIES, setCategories, "categories")}
        placeholder="e.g., Worksheets"
      />

      <TagGroup
        label="Risk Flags"
        pills={riskFlags.map((f) => ({ id: f, label: f }))}
        onRemove={(id) => removeStringTag(id, riskFlags, setRiskFlags, "risk_flags")}
        inputValue={newRiskFlag}
        onInputChange={setNewRiskFlag}
        onAdd={() =>
          addStringTag(newRiskFlag, riskFlags, setRiskFlags, setNewRiskFlag, "risk_flags")
        }
        onReset={() => resetStringTags(DEFAULT_RISK_FLAGS, setRiskFlags, "risk_flags")}
        placeholder="e.g., Eating disorder"
        variant="danger"
      />

      {update.isPending && (
        <p className="text-xs animate-pulse" style={{ color: "#8A8480" }}>Saving...</p>
      )}
    </div>
  );
}

/* -- Reusable tag group -- */

function TagGroup({
  label,
  pills,
  onRemove,
  inputValue,
  onInputChange,
  onAdd,
  onReset,
  placeholder,
  variant,
}: {
  label: string;
  pills: { id: string; label: string }[];
  onRemove: (id: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onReset: () => void;
  placeholder: string;
  variant?: "danger";
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: "#5C5856" }}>{label}</label>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
          style={{ color: "#8A8480" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#5C7A6B"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#8A8480"; }}
        >
          <RotateCcw size={10} /> Reset defaults
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {pills.map((pill) => (
          <span
            key={pill.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-medium"
            style={{
              background: variant === "danger" ? "#F9EDED" : "#EBF0EB",
              color: variant === "danger" ? "#A0504A" : "#5C7A6B",
              border: `1px solid ${variant === "danger" ? "#E8C0B8" : "#D4E0D4"}`,
            }}
          >
            {pill.label}
            <button
              type="button"
              onClick={() => onRemove(pill.id)}
              className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-[8px] text-xs outline-none transition-colors"
          style={{
            border: "1.5px solid #E5E0D8",
            background: "#FFFFFF",
            color: "#1C1C1E",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#8FAF8A"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E0D8"; }}
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1.5 rounded-[8px] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          style={{ background: "#EBF0EB", color: "#5C7A6B" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#D4E0D4"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#EBF0EB"; }}
        >
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}
