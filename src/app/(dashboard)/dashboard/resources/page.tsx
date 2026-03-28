"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useResourcesList } from "@/lib/api-hooks";
import { useCustomTags } from "@/lib/use-custom-tags";
import AddResourceModal from "@/components/resources/AddResourceModal";
import {


  FolderOpen,
  Plus,
  FileText,
  Link as LinkIcon,
  Upload,
  ExternalLink,
  Trash2,
  Tag,
} from "lucide-react";

// Unwrap API response: handles both flat arrays and { data: [...] }
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}


const TYPE_ICONS: Record<string, typeof FileText> = {
  file: Upload,
  link: LinkIcon,
  worksheet: FileText,
};

const TYPE_BADGE: Record<string, string> = {
  file: "badge-teal",
  link: "badge-gold",
  worksheet: "badge-sage",
};

export default function ResourcesPage() {
  const { modalities } = useCustomTags();
  const [showAdd, setShowAdd] = useState(false);
  const [filterModality, setFilterModality] = useState<string>("");

  const resources = useResourcesList();
  const qc = useQueryClient();
  const deleteResource = useMutation({
    mutationFn: ({ resource_id }: { resource_id: string }) =>
      api.resource.delete(resource_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });

  const resourcesData = toArray(resources.data);

  const filteredResources = filterModality
    ? resourcesData.filter((r: any) =>
        (r.modality_tags ?? []).includes(filterModality)
      )
    : resourcesData;

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <FolderOpen size={22} className="text-sage" />
            <h1 className="text-2xl font-semibold text-ink">Resources</h1>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            Worksheets, links, and files to share with clients.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={14} /> Add Resource
        </button>
      </div>

      {/* Modality filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterModality("")}
          className={`px-3.5 py-1.5 rounded-small text-xs font-medium transition-all duration-200 ${
            !filterModality
              ? "bg-sage text-white shadow-sage"
              : "text-ink-secondary hover:bg-bg hover:text-ink"
          }`}
        >
          All
        </button>
        {modalities.map((m) => (
          <button
            key={m.key}
            onClick={() => setFilterModality(m.key)}
            className={`px-3.5 py-1.5 rounded-small text-xs font-medium transition-all duration-200 ${
              filterModality === m.key
                ? "bg-sage text-white shadow-sage"
                : "text-ink-secondary hover:bg-bg hover:text-ink"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Resource grid */}
      {resources.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-card rounded-card border border-border shadow-card animate-pulse"
            />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-card rounded-card border border-border shadow-card p-12 text-center">
          <FolderOpen size={28} className="mx-auto text-ink-tertiary mb-3" />
          <p className="text-sm text-ink-secondary font-medium">
            {filterModality
              ? "No resources match this filter"
              : "Your resource library is empty"}
          </p>
          <p className="text-xs text-ink-tertiary mt-1">
            Add worksheets, links, and files to share with clients
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((r: any) => {
            const Icon = TYPE_ICONS[r.resource_type] ?? FileText;
            const badgeClass = TYPE_BADGE[r.resource_type] ?? "badge-sage";
            const mods = (r.modality_tags ?? [])
              .map(
                (t: string) => modalities.find((m) => m.key === t)?.name ?? t
              )
              .filter(Boolean);
            const categories = r.category_tags ?? [];

            return (
              <div
                key={r.id}
                className="bg-card rounded-card border border-border shadow-card p-5 transition-all duration-200 hover:border-border-hover hover:shadow-card-hover hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`badge ${badgeClass} inline-flex items-center gap-1`}
                    >
                      <Icon size={11} /> {r.resource_type}
                    </span>
                    <h3 className="text-sm font-semibold text-ink truncate">
                      {r.title}
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      deleteResource.mutate({ resource_id: r.id })
                    }
                    className="p-1.5 rounded-small text-ink-tertiary hover:text-error hover:bg-error-bg transition-all duration-200 flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {r.description && (
                  <p className="text-xs text-ink-secondary mb-2.5 line-clamp-2">
                    {r.description}
                  </p>
                )}

                {r.external_url && (
                  <a
                    href={r.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sage font-medium hover:text-sage-dark transition-colors mb-2.5"
                  >
                    <ExternalLink size={11} /> Open link
                  </a>
                )}

                {(mods.length > 0 || categories.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {mods.map((m: string) => (
                      <span
                        key={m}
                        className="text-[10px] px-2 py-0.5 bg-bg text-ink-secondary rounded-md font-medium"
                      >
                        {m}
                      </span>
                    ))}
                    {categories.map((c: string) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 bg-sage-bg text-sage rounded-md font-medium flex items-center gap-0.5"
                      >
                        <Tag size={8} /> {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-ink-tertiary mt-2.5">
                  Added {formatDate(r.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddResourceModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ["resources"] })}
      />
    </div>
  );
}
