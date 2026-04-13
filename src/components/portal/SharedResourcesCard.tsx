"use client";

import { FileText, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  resource_type?: string;
  created_at?: string;
}

interface SharedResourcesCardProps {
  resources: Resource[];
  loading: boolean;
}

export default function SharedResourcesCard({
  resources,
  loading,
}: SharedResourcesCardProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E5E0D8] p-4 animate-pulse"
            style={{ background: "white" }}
          >
            <div className="h-4 bg-[#E5E0D8] rounded w-1/2 mb-2" />
            <div className="h-3 bg-[#E5E0D8] rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div
        className="rounded-xl border border-[#E5E0D8] p-8 text-center"
        style={{
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: "#F4F1EC" }}
        >
          <FileText size={20} strokeWidth={1.5} style={{ color: "#C5BFB8" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "#5C5856" }}>
          No resources shared yet
        </p>
        <p className="text-xs mt-1" style={{ color: "#8A8480" }}>
          Your therapist will share worksheets and resources here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <div
          key={resource.id}
          className="rounded-xl border border-[#E5E0D8] p-4 flex items-start justify-between gap-4 transition-shadow hover:shadow-md"
          style={{
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#EBF0EB" }}
            >
              <FileText
                size={16}
                strokeWidth={1.5}
                style={{ color: "#5C7A6B" }}
              />
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "#1C1C1E" }}
              >
                {resource.title}
              </p>
              {resource.description && (
                <p
                  className="text-xs mt-0.5 line-clamp-2"
                  style={{ color: "#8A8480" }}
                >
                  {resource.description}
                </p>
              )}
              {resource.resource_type && (
                <span
                  className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "#EBF0EB",
                    color: "#5C7A6B",
                  }}
                >
                  {resource.resource_type}
                </span>
              )}
            </div>
          </div>
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium flex-shrink-0 transition-colors"
              style={{ color: "#5C7A6B" }}
            >
              <ExternalLink size={14} strokeWidth={1.5} />
              Open
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
