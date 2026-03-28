"use client";

import { useState } from "react";
import { useCreateResource } from "@/lib/api-hooks";
import { useCustomTags } from "@/lib/use-custom-tags";
import { X, Upload, Link as LinkIcon, FileText } from "lucide-react";

interface AddResourceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const RESOURCE_TYPES = [
  { key: "file" as const, label: "File", icon: Upload },
  { key: "link" as const, label: "Link", icon: LinkIcon },
  { key: "worksheet" as const, label: "Worksheet", icon: FileText },
];

export default function AddResourceModal({ open, onClose, onCreated }: AddResourceModalProps) {
  const { modalities, categories } = useCustomTags();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<"file" | "link" | "worksheet">("worksheet");
  const [externalUrl, setExternalUrl] = useState("");
  const [modalityTags, setModalityTags] = useState<string[]>([]);
  const [categoryTags, setCategoryTags] = useState<string[]>([]);

  const create = useCreateResource();

  function resetForm() {
    setTitle("");
    setDescription("");
    setResourceType("worksheet");
    setExternalUrl("");
    setModalityTags([]);
    setCategoryTags([]);
  }

  function toggleTag(tag: string, list: string[], setter: (v: string[]) => void) {
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  }

  function handleSave() {
    create.mutate({
      title,
      description: description || null,
      resource_type: resourceType,
      external_url: externalUrl || null,
      file_url: null,
      modality_tags: modalityTags,
      category_tags: categoryTags,
    }, {
      onSuccess: () => {
        onCreated();
        onClose();
        resetForm();
      },
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-card border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-sans font-bold text-ink">Add Resource</h2>
          <button onClick={onClose} className="p-1 text-ink-tertiary hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Thought Record Worksheet"
              className="w-full px-3.5 py-2.5 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-2">Type</label>
            <div className="flex gap-2">
              {RESOURCE_TYPES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setResourceType(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-small text-xs font-medium transition-colors ${
                    resourceType === key
                      ? "bg-sage text-white shadow-sm"
                      : "bg-bg text-ink-tertiary hover:bg-border"
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* URL (for link/worksheet types) */}
          {(resourceType === "link" || resourceType === "worksheet") && (
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                URL <span className="text-ink-tertiary font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">
              Description <span className="text-ink-tertiary font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this resource..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-small border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm resize-none"
            />
          </div>

          {/* Modality tags */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-2">Modality tags</label>
            <div className="flex flex-wrap gap-1.5">
              {modalities.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggleTag(m.key, modalityTags, setModalityTags)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    modalityTags.includes(m.key)
                      ? "bg-sage text-white"
                      : "bg-bg text-ink-tertiary hover:bg-border"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Category tags */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-2">Category tags</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleTag(cat, categoryTags, setCategoryTags)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    categoryTags.includes(cat)
                      ? "bg-sage text-white"
                      : "bg-bg text-ink-tertiary hover:bg-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!title.trim() || create.isPending}
            className="bg-sage text-white px-5 py-2.5 rounded-small text-sm font-semibold hover:bg-sage-dark transition-all disabled:opacity-50 shadow-sage"
          >
            {create.isPending ? "Saving..." : "Add Resource"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-small text-sm font-medium text-ink-tertiary hover:bg-bg transition-colors"
          >
            Cancel
          </button>
          {create.error && (
            <span className="text-sm text-red-600 ml-auto">{create.error.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
