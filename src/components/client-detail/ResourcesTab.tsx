"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSharedResources, useUnshareResource } from "@/lib/api-hooks";
import ShareResourceModal from "@/components/resources/ShareResourceModal";
import { formatDate } from "./utils";
import {
  FileText,
  FolderOpen,
  Upload,
  Link as LinkIcon,
  Send,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface ResourcesTabProps {
  clientId: string;
  clientName: string;
}

export default function ResourcesTab({ clientId, clientName }: ResourcesTabProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const qc = useQueryClient();

  const sharedResources = useSharedResources(clientId);
  const unshare = useUnshareResource();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Shared Resources</h2>
        <button
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage text-white text-xs font-medium hover:bg-sage-dark transition-colors shadow-sm"
        >
          <Send size={12} /> Share Resource
        </button>
      </div>

      {sharedResources.isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-surface rounded-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (sharedResources.data?.length ?? 0) === 0 ? (
        <div className="bg-surface rounded-card border border-border shadow-sm p-10 text-center">
          <FolderOpen size={20} className="mx-auto text-ink-tertiary mb-2" />
          <p className="text-sm text-ink-tertiary">No shared resources</p>
          <p className="text-xs text-ink-tertiary/60 mt-1">
            Share worksheets and resources from your library
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sharedResources.data?.map((sr: any) => {
            const r = sr.resources as { id: string; title: string; resource_type: string; description: string | null; external_url: string | null; modality_tags: string[] } | null;
            if (!r) return null;
            const TypeIcon = r.resource_type === "file" ? Upload : r.resource_type === "link" ? LinkIcon : FileText;
            const typeColor = r.resource_type === "file" ? "bg-blue-50 text-blue-600" : r.resource_type === "link" ? "bg-amber-50 text-amber" : "bg-sage-50 text-sage";

            return (
              <div
                key={sr.id}
                className="bg-surface rounded-card border border-border shadow-sm p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium ${typeColor}`}>
                      <TypeIcon size={11} /> {r.resource_type}
                    </span>
                    <h3 className="text-sm font-semibold text-ink truncate">{r.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {r.external_url && (
                      <a
                        href={r.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-ink-tertiary hover:text-sage transition-colors"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => unshare.mutate({ id: r.id, clientId })}
                      className="p-1 text-ink-tertiary hover:text-red-600 transition-colors"
                      title="Unshare"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {sr.note && (
                  <p className="text-xs text-ink-tertiary mt-1.5 ml-[70px]">{sr.note}</p>
                )}
                <div className="text-[10px] text-ink-tertiary/60 mt-1.5">
                  Shared {formatDate(sr.shared_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ShareResourceModal
        open={showShareModal}
        clientId={clientId}
        clientName={clientName}
        onClose={() => setShowShareModal(false)}
        onShared={() => qc.invalidateQueries({ queryKey: ["resources", "shared", clientId] })}
      />
    </div>
  );
}
