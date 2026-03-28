"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useClientsList } from "@/lib/api-hooks";
import { toast } from "sonner";
import {


  Megaphone,
  Send,
  Mail,
  MessageCircle,
  CheckCircle2,
  Users,
} from "lucide-react";

// Unwrap API response: handles both flat arrays and { data: [...] }
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}


type Channel = "whatsapp" | "email" | "both";

export default function BroadcastPage() {
  const clients = useClientsList({ includeAll: true } as any);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<Channel>("both");

  const send = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.broadcast.send(data),
    onSuccess: (data: any) => {
      toast.success(
        `Sent to ${data.total_clients} client${data.total_clients > 1 ? "s" : ""}`
      );
      setSelectedIds([]);
      setSubject("");
      setMessage("");
    },
    onError: (err) => toast.error(err.message),
  });

  const clientsData = toArray(clients.data);

  function toggleClient(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    if (selectedIds.length === clientsData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(clientsData.map((c) => c.id));
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.error("Select at least one client");
      return;
    }
    send.mutate({
      subject: subject || undefined,
      message,
      channel,
      client_ids: selectedIds,
    });
  }

  if (clients.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-48 bg-bg rounded-small animate-pulse" />
        <div className="h-40 bg-card rounded-card border border-border shadow-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <Megaphone size={22} className="text-sage" />
          <h1 className="text-2xl font-semibold text-ink">Broadcast</h1>
        </div>
        <p className="text-sm text-ink-secondary mt-1">
          Send a message to multiple clients at once via WhatsApp or email.
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-5">
        {/* Channel selector */}
        <div className="bg-card rounded-card border border-border shadow-card p-7 space-y-4">
          <h3 className="ui-section-label">Channel</h3>
          <div className="flex gap-2">
            {(
              [
                { value: "both", label: "Both", icon: Send },
                { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                { value: "email", label: "Email", icon: Mail },
              ] as const
            ).map((ch) => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setChannel(ch.value)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-small text-sm font-medium transition-all duration-200 ${
                    channel === ch.value
                      ? "bg-sage text-white shadow-sage"
                      : "bg-bg text-ink-secondary hover:text-ink border border-border hover:border-border-hover"
                  }`}
                >
                  <Icon size={14} />
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Client selection */}
        <div className="bg-card rounded-card border border-border shadow-card p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Users size={14} className="text-sage" />
              Recipients ({selectedIds.length} selected)
            </h3>
            <button
              type="button"
              onClick={selectAll}
              className="btn-ghost btn-sm"
            >
              {selectedIds.length === clientsData.length
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {clientsData.map((c: any) => (
              <label
                key={c.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-small hover:bg-bg cursor-pointer transition-colors duration-200"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleClient(c.id)}
                  className="rounded border-border text-sage focus:ring-sage/20 focus:ring-offset-0"
                />
                <span className="text-sm text-ink">{c.full_name}</span>
                {c.email && (
                  <span className="text-xs text-ink-tertiary">{c.email}</span>
                )}
              </label>
            ))}
            {clientsData.length === 0 && (
              <p className="text-sm text-ink-tertiary text-center py-4">
                No clients yet
              </p>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="bg-card rounded-card border border-border shadow-card p-7 space-y-4">
          {(channel === "email" || channel === "both") && (
            <div>
              <label className="ui-label">
                Subject{" "}
                <span className="text-ink-tertiary font-normal">
                  (email only)
                </span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Schedule update"
                maxLength={200}
                className="ui-input"
              />
            </div>
          )}
          <div>
            <label className="ui-label">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              maxLength={5000}
              placeholder="Type your message here..."
              className="ui-input resize-none"
            />
            <p className="text-[10px] text-ink-tertiary mt-1.5 text-right">
              {message.length}/5000
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={send.isPending || selectedIds.length === 0 || !message}
          className="btn-primary"
        >
          {send.isPending ? (
            "Sending..."
          ) : (
            <>
              <Send size={14} /> Send to {selectedIds.length} client
              {selectedIds.length !== 1 ? "s" : ""}
            </>
          )}
        </button>

        {send.isSuccess && send.data && (
          <div className="bg-success-bg border border-success/15 rounded-card p-5 flex items-start gap-3 animate-fade-in">
            <CheckCircle2 size={18} className="text-success mt-0.5" />
            <div className="text-sm text-ink">
              <p className="font-medium">Broadcast sent</p>
              <p className="text-xs text-ink-secondary mt-0.5">
                {(send.data as any).email_sent > 0 &&
                  `${(send.data as any).email_sent} email${(send.data as any).email_sent > 1 ? "s" : ""} sent. `}
                {(send.data as any).whatsapp_sent > 0 &&
                  `${(send.data as any).whatsapp_sent} WhatsApp message${(send.data as any).whatsapp_sent > 1 ? "s" : ""} sent.`}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
