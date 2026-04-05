"use client";

import { useState, useRef } from "react";
import { Send, ClipboardList, UserPlus, UserX, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useMessageTemplates, useUpdateMessageTemplate } from "@/lib/api-hooks";

// ─── Sample preview values ───────────────────────────────────────────────────

const PREVIEW_VARS: Record<string, string> = {
  "{client_name}": "Priya",
  "{therapist_name}": "Dr. Sharma",
  "{practice_name}": "Mindful Care",
  "{intake_link}": "https://bendre.app/intake/submit/abc123",
  "{portal_link}": "https://bendre.app/portal/claim/xyz789",
  "{booking_url}": "https://bendre.app/booking/your-slug",
  "{therapist_email}": "dr.sharma@example.com",
};

function substituteVars(text: string): string {
  return Object.entries(PREVIEW_VARS).reduce(
    (acc, [key, val]) => acc.replaceAll(key, val),
    text
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface MessageTemplate {
  id: string;
  therapist_id: string;
  template_key: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

// ─── Template Meta ────────────────────────────────────────────────────────────

const TEMPLATE_META: Record<
  string,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    variables: string[];
  }
> = {
  inquiry_ack: {
    label: "Inquiry Acknowledgment",
    description: "Auto-sent when someone submits the public booking form.",
    icon: Send,
    variables: [
      "{client_name}",
      "{therapist_name}",
      "{practice_name}",
      "{booking_url}",
    ],
  },
  intake_invite: {
    label: "Intake Form Invite",
    description: 'Sent when you click "Send Intake Form" on a lead.',
    icon: ClipboardList,
    variables: [
      "{client_name}",
      "{therapist_name}",
      "{practice_name}",
      "{intake_link}",
      "{booking_url}",
    ],
  },
  portal_invite: {
    label: "Portal Invite",
    description: 'Sent when you click "Send Portal Invite".',
    icon: UserPlus,
    variables: [
      "{client_name}",
      "{therapist_name}",
      "{practice_name}",
      "{portal_link}",
      "{booking_url}",
    ],
  },
  rejection: {
    label: "Not a Fit",
    description: 'Sent when you click "Mark Not a Fit" on a lead.',
    icon: UserX,
    variables: ["{client_name}", "{therapist_name}", "{practice_name}"],
  },
};

const KEY_ORDER = ["inquiry_ack", "intake_invite", "portal_invite", "rejection"];

// ─── Template Card ────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: MessageTemplate;
  meta: (typeof TEMPLATE_META)[string];
}

function TemplateCard({ template, meta }: TemplateCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Sample values for preview
  const previewSubject = substituteVars(subject);
  const previewBody = substituteVars(body);

  const update = useUpdateMessageTemplate();

  function handleEdit() {
    setSubject(template.subject);
    setBody(template.body);
    setIsEditing(true);
  }

  function handleCancel() {
    setSubject(template.subject);
    setBody(template.body);
    setIsEditing(false);
  }

  function handleSave() {
    if (!subject.trim()) {
      toast.error("Subject cannot be empty.");
      return;
    }
    if (!body.trim()) {
      toast.error("Body cannot be empty.");
      return;
    }
    update.mutate(
      { key: template.template_key, subject: subject.trim(), body: body.trim() },
      {
        onSuccess: () => {
          toast.success("Template saved.");
          setIsEditing(false);
        },
        onError: (err) => toast.error(err.message ?? "Failed to save template."),
      }
    );
  }

  function insertVariable(variable: string) {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + variable);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + variable + body.slice(end);
    setBody(next);
    // Restore cursor after inserted variable
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + variable.length;
      el.setSelectionRange(pos, pos);
    });
  }

  const Icon = meta.icon;

  return (
    <div
      className="rounded-card border border-border bg-surface overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {/* Card header */}
      <div
        className="px-5 py-4 flex items-start justify-between gap-4"
        style={{ borderBottom: isEditing ? "1.5px solid #E5E0D8" : "none" }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center mt-0.5"
            style={{ background: "#EBF0EB" }}
          >
            <Icon size={15} strokeWidth={1.5} style={{ color: "#5C7A6B" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-ink leading-tight">
              {meta.label}
            </p>
            <p className="text-[12px] text-ink-tertiary mt-0.5 leading-relaxed">
              {meta.description}
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={handleEdit}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors duration-150"
            style={{
              background: "#F4F1EC",
              color: "#5C5856",
              border: "1px solid #E5E0D8",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#EBF0EB";
              e.currentTarget.style.color = "#5C7A6B";
              e.currentTarget.style.borderColor = "#D4E0D4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F4F1EC";
              e.currentTarget.style.color = "#5C5856";
              e.currentTarget.style.borderColor = "#E5E0D8";
            }}
          >
            <Pencil size={12} strokeWidth={1.5} />
            Edit
          </button>
        )}
      </div>

      {/* Preview (collapsed) */}
      {!isEditing && (
        <div className="px-5 py-3.5" style={{ background: "#FAFAF8" }}>
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary mb-1.5">
            Subject
          </p>
          <p className="text-[13px] text-ink-secondary mb-3">{template.subject}</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary mb-1.5">
            Body
          </p>
          <p
            className="text-[13px] text-ink-secondary leading-relaxed whitespace-pre-wrap"
            style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
          >
            {template.body}
          </p>
        </div>
      )}

      {/* Inline editor (expanded) */}
      {isEditing && (
        <div className="px-5 pt-4 pb-5 space-y-4">
          {/* Edit / Preview toggle */}
          <div
            className="inline-flex items-center p-0.5 rounded-[8px]"
            style={{ background: "#F4F1EC" }}
          >
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-all cursor-pointer"
              style={{
                background: mode === "edit" ? "#FFFFFF" : "transparent",
                color: mode === "edit" ? "#1C1C1E" : "#8A8480",
                boxShadow: mode === "edit" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-all cursor-pointer"
              style={{
                background: mode === "preview" ? "#FFFFFF" : "transparent",
                color: mode === "preview" ? "#1C1C1E" : "#8A8480",
                boxShadow: mode === "preview" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}
            >
              Preview
            </button>
          </div>

          {/* Preview mode */}
          {mode === "preview" && (
            <div
              className="rounded-[10px] overflow-hidden"
              style={{ background: "#F4F1EC", padding: "20px", border: "1px solid #E5E0D8" }}
            >
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                {/* Email header */}
                <div
                  style={{
                    padding: "20px 28px 14px",
                    borderBottom: "1px solid #E5E0D8",
                  }}
                >
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1C1C1E",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Bendre
                  </div>
                </div>
                {/* Subject row */}
                <div
                  style={{
                    padding: "12px 28px",
                    background: "#FAFAF8",
                    borderBottom: "1px solid #E5E0D8",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "#8A8480",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 4,
                    }}
                  >
                    Subject
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#1C1C1E" }}>
                    {previewSubject || "(empty)"}
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: "24px 28px", background: "#FFFFFF" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "#1C1C1E",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {previewBody || <span style={{ color: "#C8C4BE" }}>(empty)</span>}
                  </div>
                </div>
                {/* Footer */}
                <div
                  style={{
                    padding: "14px 28px",
                    background: "#FAFAF8",
                    borderTop: "1px solid #E5E0D8",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#8A8480" }}>
                    Sent via Bendre — practice management for therapists.
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-ink-tertiary mt-3 text-center">
                Preview uses sample values — real emails fill in actual client data.
              </p>
            </div>
          )}

          {/* Edit mode */}
          {mode === "edit" && (<>
          {/* Subject */}
          <div>
            <label className="block text-[12px] font-medium text-ink-secondary mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-[8px] border border-border bg-surface focus:outline-none text-[13px] transition-shadow"
              style={{
                boxShadow: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#8FAF8A";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(92,122,107,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E5E0D8";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-[12px] font-medium text-ink-secondary mb-1.5">
              Body
            </label>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              maxLength={2000}
              className="w-full px-3.5 py-2.5 rounded-[8px] border border-border bg-surface focus:outline-none text-[13px] leading-relaxed resize-none transition-shadow"
              style={{ boxShadow: "none" }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#8FAF8A";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(92,122,107,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E5E0D8";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-ink-tertiary">
                {body.length}/2000 characters
              </span>
            </div>
          </div>

          {/* Variables */}
          <div>
            <p className="text-[11px] font-medium text-ink-tertiary mb-2">
              Available variables — click to insert at cursor:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meta.variables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="font-mono text-[11px] px-2.5 py-1 rounded-[6px] transition-colors duration-100"
                  style={{
                    background: "#EBF0EB",
                    color: "#5C7A6B",
                    border: "1px solid #D4E0D4",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#D4E0D4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#EBF0EB";
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          </>)}

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={update.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white transition-all duration-150 disabled:opacity-50"
              style={{ background: "#5C7A6B" }}
              onMouseEnter={(e) => {
                if (!update.isPending) e.currentTarget.style.background = "#496158";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#5C7A6B";
              }}
            >
              <Check size={13} strokeWidth={2} />
              {update.isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={update.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors duration-150 disabled:opacity-50"
              style={{
                background: "transparent",
                color: "#5C5856",
                border: "1.5px solid #E5E0D8",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F4F1EC";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X size={13} strokeWidth={1.5} />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CommsTemplatesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-card border border-border bg-surface"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
        >
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-border animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-40 bg-border rounded animate-pulse" />
                <div className="h-3 w-56 bg-border/60 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-7 w-14 bg-border/50 rounded animate-pulse" />
          </div>
          <div className="px-5 py-3 space-y-2" style={{ background: "#FAFAF8" }}>
            <div className="h-3 w-12 bg-border/40 rounded animate-pulse" />
            <div className="h-3.5 w-64 bg-border/60 rounded animate-pulse" />
            <div className="h-3 w-12 bg-border/40 rounded mt-2 animate-pulse" />
            <div className="h-3.5 w-full bg-border/50 rounded animate-pulse" />
            <div className="h-3.5 w-4/5 bg-border/40 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CommsTemplates() {
  const { data, isLoading, isError } = useMessageTemplates();

  const templates = data as MessageTemplate[] | undefined;

  // Build a map for O(1) lookup, then order by KEY_ORDER
  const templateMap = new Map<string, MessageTemplate>(
    (templates ?? []).map((t) => [t.template_key, t])
  );

  const orderedTemplates = KEY_ORDER.map((key) => {
    const meta = TEMPLATE_META[key];
    const template: MessageTemplate = templateMap.get(key) ?? {
      id: "",
      therapist_id: "",
      template_key: key,
      subject: "",
      body: "",
      created_at: "",
      updated_at: "",
    };
    return { key, meta, template };
  });

  return (
    <section>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[18px] font-bold text-ink leading-tight">
          Comms Templates
        </h2>
        <p className="text-[13px] text-ink-tertiary mt-1 leading-relaxed">
          Customize the emails sent to leads and clients at key points in their journey.
          Use variables like <code className="font-mono text-[11px] bg-[#EBF0EB] text-[#5C7A6B] px-1.5 py-0.5 rounded">{"{client_name}"}</code> to personalize messages.
        </p>
      </div>

      {/* Content */}
      {isLoading && <CommsTemplatesSkeleton />}

      {isError && (
        <div
          className="rounded-card border p-5 text-[13px] font-medium"
          style={{
            background: "#F9EDED",
            borderColor: "rgba(192,112,90,0.2)",
            color: "#A0504A",
          }}
        >
          Failed to load templates. Please refresh the page.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {orderedTemplates.map(({ key, meta, template }) => (
            <TemplateCard key={key} template={template} meta={meta} />
          ))}
        </div>
      )}
    </section>
  );
}
