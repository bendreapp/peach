"use client";

import { useState } from "react";
import { useLeadsList, useUpdateLead } from "@/lib/api-hooks";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  ChevronDown,
} from "lucide-react";

type LeadStatus = "new" | "contacted" | "converted" | "declined";
type StatusFilter = LeadStatus | "all";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  declined: "Declined",
};

const statusBadge: Record<LeadStatus, string> = {
  new: "badge badge-teal",
  contacted: "badge badge-gold",
  converted: "badge badge-success",
  declined: "badge badge-error",
};

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  const params: Record<string, string> = { limit: "50", offset: "0" };
  if (statusFilter !== "all") {
    params.status = statusFilter;
  }

  const leads = useLeadsList(params);
  const updateLead = useUpdateLead();

  const leadsArray: any[] = Array.isArray(leads.data)
    ? leads.data
    : (leads.data?.data ?? []);

  const filtered = leadsArray.filter(
    (l: any) =>
      l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search)
  );

  function handleStatusChange(leadId: string, newStatus: string) {
    updateLead.mutate(
      { id: leadId, status: newStatus },
      {
        onSuccess: () => toast.success("Lead status updated"),
        onError: (err: any) => toast.error(err.message || "Failed to update"),
      }
    );
  }

  function handleSaveNotes(leadId: string) {
    updateLead.mutate(
      { id: leadId, notes: notesText },
      {
        onSuccess: () => {
          toast.success("Notes saved");
          setEditingNotes(null);
          setNotesText("");
        },
        onError: (err: any) => toast.error(err.message || "Failed to save notes"),
      }
    );
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (leads.isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-border rounded-small animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-card rounded-card border border-border animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">
          Leads
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          {leadsArray.length} lead{leadsArray.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 p-1 bg-bg rounded-small border border-border">
        {(["all", "new", "contacted", "converted", "declined"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                statusFilter === status
                  ? "bg-card text-ink shadow-card"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              {status === "all" ? "All" : STATUS_LABELS[status]}
            </button>
          )
        )}
      </div>

      {/* Search */}
      {leadsArray.length > 0 && (
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary"
          />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ui-input pl-11"
          />
        </div>
      )}

      {/* Lead list */}
      {filtered.length === 0 ? (
        <div className="ui-card text-center py-16">
          <div className="w-14 h-14 rounded-full bg-sage-bg mx-auto mb-4 flex items-center justify-center">
            <UserPlus size={22} className="text-sage" />
          </div>
          <p className="text-sm font-medium text-ink-secondary">
            {search ? "No leads match your search" : "No leads yet"}
          </p>
          <p className="text-xs text-ink-tertiary mt-1.5 max-w-xs mx-auto">
            {search
              ? "Try a different search term"
              : "Leads will appear here when potential clients reach out"}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-card border border-border shadow-card overflow-hidden divide-y divide-border">
          {filtered.map((lead: any) => (
            <div
              key={lead.id}
              className="px-6 py-4 hover:bg-bg transition-colors duration-150"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-sage">
                      {(lead.full_name || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink">
                        {lead.full_name || "Unknown"}
                      </span>
                      <span
                        className={
                          statusBadge[lead.status as LeadStatus] ??
                          "badge badge-sage"
                        }
                      >
                        {STATUS_LABELS[lead.status as LeadStatus] ??
                          lead.status}
                      </span>
                    </div>
                    <div className="text-xs text-ink-tertiary flex items-center gap-3 mt-1 flex-wrap">
                      {lead.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={11} />
                          {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={11} />
                          {lead.phone}
                        </span>
                      )}
                      {lead.source && (
                        <span className="text-ink-tertiary">
                          via {lead.source}
                        </span>
                      )}
                      {lead.created_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(lead.created_at)}
                        </span>
                      )}
                    </div>
                    {lead.reason && (
                      <p className="text-xs text-ink-secondary mt-1.5">
                        {lead.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="relative">
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        handleStatusChange(lead.id, e.target.value)
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs focus:outline-none focus:ring-[3px] focus:ring-sage/10 appearance-none pr-7"
                    >
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (editingNotes === lead.id) {
                        setEditingNotes(null);
                        setNotesText("");
                      } else {
                        setEditingNotes(lead.id);
                        setNotesText(lead.notes || "");
                      }
                    }}
                    className="p-1.5 rounded-lg text-ink-tertiary hover:text-ink hover:bg-bg transition-colors"
                    title="Add notes"
                  >
                    <MessageSquare size={14} />
                  </button>
                </div>
              </div>

              {/* Notes editor */}
              {editingNotes === lead.id && (
                <div className="mt-3 ml-14 animate-slide-up">
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Add notes about this lead..."
                    rows={3}
                    className="ui-input w-full resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleSaveNotes(lead.id)}
                      disabled={updateLead.isPending}
                      className="btn-primary btn-sm"
                    >
                      {updateLead.isPending ? "Saving..." : "Save Notes"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(null);
                        setNotesText("");
                      }}
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Existing notes display */}
              {lead.notes && editingNotes !== lead.id && (
                <div className="mt-2 ml-14 text-xs text-ink-tertiary bg-bg rounded-lg px-3 py-2">
                  {lead.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
