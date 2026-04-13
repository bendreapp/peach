"use client";

import { FileText } from "lucide-react";

const NOTE_TEMPLATES = {
  soap: {
    label: "SOAP Note",
    description: "Subjective, Objective, Assessment, Plan",
    fields: ["subjective", "objective", "assessment", "plan"],
  },
  dap: {
    label: "DAP Note",
    description: "Data, Assessment, Plan",
    fields: ["subjective", "objective", "assessment"],
  },
  freeform: {
    label: "Free Form",
    description: "Open-ended clinical notes",
    fields: ["freeform_content"],
  },
} as const;

export type NoteTemplate = keyof typeof NOTE_TEMPLATES;

interface NoteTypeSelectorProps {
  selected: NoteTemplate;
  onChange: (type: NoteTemplate) => void;
}

export default function NoteTypeSelector({
  selected,
  onChange,
}: NoteTypeSelectorProps) {
  const types = Object.entries(NOTE_TEMPLATES) as [
    NoteTemplate,
    (typeof NOTE_TEMPLATES)[NoteTemplate]
  ][];

  return (
    <div>
      <label
        className="block text-[11px] font-medium uppercase tracking-wider mb-2"
        style={{ color: "#8A8480" }}
      >
        Note format
      </label>
      <div className="flex flex-wrap gap-2">
        {types.map(([key, template]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 flex items-center gap-1.5 border"
            style={
              selected === key
                ? {
                    background: "#5C7A6B",
                    color: "#FFFFFF",
                    borderColor: "#5C7A6B",
                  }
                : {
                    background: "transparent",
                    color: "#5C5856",
                    borderColor: "#E5E0D8",
                  }
            }
            onMouseEnter={(e) => {
              if (selected !== key) {
                e.currentTarget.style.background = "#F4F1EC";
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== key) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <FileText size={13} strokeWidth={1.5} />
            {template.label}
          </button>
        ))}
      </div>
      <p
        className="text-[11px] mt-1.5"
        style={{ color: "#8A8480" }}
      >
        {NOTE_TEMPLATES[selected].description}
      </p>
    </div>
  );
}
