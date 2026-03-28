import { NOTE_TEMPLATES, type NoteTemplate } from "@bendre/shared";
import { FileText } from "lucide-react";

interface NoteTypeSelectorProps {
  selected: NoteTemplate;
  onChange: (type: NoteTemplate) => void;
}

export default function NoteTypeSelector({ selected, onChange }: NoteTypeSelectorProps) {
  const types = Object.entries(NOTE_TEMPLATES) as [NoteTemplate, (typeof NOTE_TEMPLATES)[NoteTemplate]][];

  return (
    <div>
      <label className="block text-xs font-medium text-ink-secondary mb-2">Note format</label>
      <div className="flex flex-wrap gap-2">
        {types.map(([key, template]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`px-3.5 py-2 rounded-small text-sm font-medium transition-all flex items-center gap-1.5 ${
              selected === key
                ? "bg-sage text-white shadow-sage"
                : "bg-bg text-ink-tertiary hover:bg-border/20"
            }`}
          >
            <FileText size={13} />
            {template.name}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-ink-tertiary mt-1.5">
        {NOTE_TEMPLATES[selected].description}
      </p>
    </div>
  );
}
