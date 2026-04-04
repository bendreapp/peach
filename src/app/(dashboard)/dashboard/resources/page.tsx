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
  Search,
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

const TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  file: { bg: "#EBF0EB", text: "#5C7A6B", icon: "#5C7A6B" },
  link: { bg: "#FBF4EE", text: "#B5733A", icon: "#B5733A" },
  worksheet: { bg: "#EAF4F1", text: "#3D8B7A", icon: "#3D8B7A" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default function ResourcesPage() {
  const { modalities } = useCustomTags();
  const [showAdd, setShowAdd] = useState(false);
  const [filterModality, setFilterModality] = useState<string>("");
  const [search, setSearch] = useState("");

  const resources = useResourcesList();
  const qc = useQueryClient();
  const deleteResource = useMutation({
    mutationFn: ({ resource_id }: { resource_id: string }) =>
      api.resource.delete(resource_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });

  const resourcesData = toArray(resources.data);

  const filteredResources = resourcesData.filter((r: any) => {
    const matchesModality = filterModality
      ? (r.modality_tags ?? []).includes(filterModality)
      : true;
    const matchesSearch = search
      ? r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesModality && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Resources</h1>
          <p className="text-sm text-[#5C5856] mt-1">
            Worksheets, links, and files to share with clients.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#5C7A6B] text-white text-sm font-medium transition-all duration-150 hover:bg-[#496158] min-h-[36px]"
        >
          <Plus size={14} />
          Add Resource
        </button>
      </div>

      {/* Filter + search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8480] pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] placeholder:text-[#8A8480] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterModality("")}
            className={`px-3.5 py-2 rounded-[8px] text-xs font-medium transition-all duration-150 min-h-[36px] ${
              !filterModality
                ? "bg-[#EBF0EB] text-[#5C7A6B] border border-[#5C7A6B]/20"
                : "bg-white border border-[#E5E0D8] text-[#5C5856] hover:bg-[#F4F1EC] hover:text-[#1C1C1E]"
            }`}
          >
            All
          </button>
          {modalities.map((m) => (
            <button
              key={m.key}
              onClick={() => setFilterModality(m.key)}
              className={`px-3.5 py-2 rounded-[8px] text-xs font-medium transition-all duration-150 min-h-[36px] ${
                filterModality === m.key
                  ? "bg-[#EBF0EB] text-[#5C7A6B] border border-[#5C7A6B]/20"
                  : "bg-white border border-[#E5E0D8] text-[#5C5856] hover:bg-[#F4F1EC] hover:text-[#1C1C1E]"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resource grid */}
      {resources.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] animate-pulse"
            />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-16 flex flex-col items-center justify-center text-center">
          <FolderOpen size={40} className="text-[#C5BFB8] mb-4" strokeWidth={1.5} />
          <p className="text-base font-medium text-[#5C5856]">
            {search || filterModality
              ? "No resources match your search"
              : "Your resource library is empty"}
          </p>
          <p className="text-sm text-[#8A8480] mt-1">
            {search || filterModality
              ? "Try adjusting your filters"
              : "Add worksheets, links, and files to share with clients"}
          </p>
          {!search && !filterModality && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#5C7A6B] text-white text-sm font-medium transition-all duration-150 hover:bg-[#496158]"
            >
              <Plus size={14} />
              Add your first resource
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((r: any) => {
            const Icon = TYPE_ICONS[r.resource_type] ?? FileText;
            const typeColor = TYPE_COLORS[r.resource_type] ?? TYPE_COLORS.worksheet;
            const mods = (r.modality_tags ?? [])
              .map(
                (t: string) => modalities.find((m) => m.key === t)?.name ?? t
              )
              .filter(Boolean);
            const categories = r.category_tags ?? [];

            return (
              <div
                key={r.id}
                className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5 transition-all duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 group"
              >
                {/* Card top row: icon + type badge + delete */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: typeColor.bg }}
                  >
                    <Icon size={18} style={{ color: typeColor.icon }} />
                  </div>
                  <button
                    onClick={() => deleteResource.mutate({ resource_id: r.id })}
                    className="p-1.5 rounded-[6px] text-[#8A8480] opacity-0 group-hover:opacity-100 hover:text-[#C0705A] hover:bg-[#F9EDED] transition-all duration-150"
                    title="Delete resource"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-[#1C1C1E] leading-snug mb-1 line-clamp-2">
                  {r.title}
                </h3>

                {/* Type badge */}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[999px] text-[11px] font-medium mb-2"
                  style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                >
                  <Icon size={9} />
                  {r.resource_type}
                </span>

                {/* Description */}
                {r.description && (
                  <p className="text-xs text-[#5C5856] mb-2.5 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                )}

                {/* External link */}
                {r.external_url && (
                  <a
                    href={r.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#5C7A6B] font-medium hover:text-[#496158] transition-colors mb-2.5"
                  >
                    <ExternalLink size={10} />
                    Open link
                  </a>
                )}

                {/* Tags */}
                {(mods.length > 0 || categories.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {mods.map((m: string) => (
                      <span
                        key={m}
                        className="text-[10px] px-2 py-0.5 bg-[#F4F1EC] text-[#5C5856] rounded-[999px] font-medium"
                      >
                        {m}
                      </span>
                    ))}
                    {categories.map((c: string) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 bg-[#EAF4F1] text-[#3D8B7A] rounded-[999px] font-medium inline-flex items-center gap-0.5"
                      >
                        <Tag size={8} />
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Date footer */}
                <div className="text-[10px] text-[#8A8480] mt-3 pt-3 border-t border-[#E5E0D8]">
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
