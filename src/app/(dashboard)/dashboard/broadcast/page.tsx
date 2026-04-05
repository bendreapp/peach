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
  Search,
  X,
} from "lucide-react";

// Unwrap API response: handles both flat arrays and { data: [...] }
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

type Channel = "whatsapp" | "email" | "both";

const CHANNELS = [
  { value: "both" as const, label: "Both", icon: Send },
  { value: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
  { value: "email" as const, label: "Email", icon: Mail },
];

export default function BroadcastPage() {
  const clients = useClientsList({ includeAll: true } as any);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<Channel>("both");
  const [recipientSearch, setRecipientSearch] = useState("");

  const send = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.broadcast.send(data),
    onSuccess: (data: any) => {
      toast.success(
        `Sent to ${data.total_clients} client${data.total_clients > 1 ? "s" : ""}`
      );
      setSelectedIds([]);
      setSubject("");
      setMessage("");
      setRecipientSearch("");
    },
    onError: (err) => toast.error(err.message),
  });

  const clientsData = toArray(clients.data);
  const filteredClients = recipientSearch
    ? clientsData.filter(
        (c: any) =>
          c.full_name?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
          c.email?.toLowerCase().includes(recipientSearch.toLowerCase())
      )
    : clientsData;

  function toggleClient(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    if (selectedIds.length === clientsData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(clientsData.map((c: any) => c.id));
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
      body: message,
      channel,
      client_ids: selectedIds,
    });
  }

  // Skeleton loading state
  if (clients.isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-[#E5E0D8] rounded-[8px] animate-pulse" />
          <div className="h-4 w-64 bg-[#E5E0D8] rounded-[6px] animate-pulse" />
        </div>
        <div className="h-24 bg-white rounded-[12px] border border-[#E5E0D8] animate-pulse" />
        <div className="h-52 bg-white rounded-[12px] border border-[#E5E0D8] animate-pulse" />
        <div className="h-40 bg-white rounded-[12px] border border-[#E5E0D8] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Broadcast</h1>
        <p className="text-sm text-[#5C5856] mt-1">
          Send a message to one or more clients via WhatsApp or email.
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        {/* Channel selector */}
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5">
          <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480] mb-3">
            Channel
          </p>
          <div className="flex gap-2">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const isActive = channel === ch.value;
              return (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setChannel(ch.value)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-150 min-h-[36px] ${
                    isActive
                      ? "bg-[#EBF0EB] text-[#5C7A6B] border border-[#5C7A6B]/20"
                      : "bg-[#F4F1EC] text-[#5C5856] border border-[#E5E0D8] hover:border-[#5C7A6B]/30 hover:text-[#1C1C1E]"
                  }`}
                >
                  <Icon size={14} />
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipients */}
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480] flex items-center gap-2">
              <Users size={12} className="text-[#8A8480]" />
              To:
              {selectedIds.length > 0 && (
                <span className="bg-[#EBF0EB] text-[#5C7A6B] px-2 py-0.5 rounded-[999px] text-[11px] font-medium normal-case tracking-normal">
                  {selectedIds.length} selected
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-medium text-[#5C7A6B] hover:text-[#496158] transition-colors"
            >
              {selectedIds.length === clientsData.length
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>

          {/* Selected client tags */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedIds.map((id) => {
                const c = clientsData.find((c: any) => c.id === id);
                if (!c) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[999px] bg-[#EBF0EB] text-[#5C7A6B] text-xs font-medium"
                  >
                    {c.full_name}
                    <button
                      type="button"
                      onClick={() => toggleClient(id)}
                      className="hover:text-[#C0705A] transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-2">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8480] pointer-events-none"
            />
            <input
              type="text"
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-[#F4F1EC] text-[#1C1C1E] placeholder:text-[#8A8480] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] focus:bg-white transition-all"
            />
          </div>

          {/* Client list */}
          <div className="max-h-44 overflow-y-auto -mx-1">
            {filteredClients.length === 0 ? (
              <p className="text-sm text-[#8A8480] text-center py-4">
                {clientsData.length === 0 ? "No clients yet" : "No clients match your search"}
              </p>
            ) : (
              filteredClients.map((c: any) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-[8px] hover:bg-[#F4F1EC] cursor-pointer transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggleClient(c.id)}
                    className="w-4 h-4 rounded border-[#E5E0D8] text-[#5C7A6B] focus:ring-[rgba(74,111,165,0.15)] focus:ring-offset-0 transition-colors"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-[#1C1C1E] font-medium truncate block">
                      {c.full_name}
                    </span>
                    {c.email && (
                      <span className="text-xs text-[#8A8480] truncate block">
                        {c.email}
                      </span>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Message compose */}
        <div className="bg-white rounded-[12px] border border-[#E5E0D8] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5 space-y-4">
          <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#8A8480]">
            Message
          </p>

          {(channel === "email" || channel === "both") && (
            <div>
              <label className="block text-[13px] font-medium text-[#5C5856] mb-1.5">
                Subject{" "}
                <span className="text-[#8A8480] font-normal">(email only)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Schedule update"
                maxLength={200}
                className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] placeholder:text-[#8A8480] focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#5C5856] mb-1.5">
              Message body *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              maxLength={5000}
              placeholder="Type your message here..."
              className="w-full px-3 py-2.5 text-sm rounded-[8px] border border-[#E5E0D8] bg-white text-[#1C1C1E] placeholder:text-[#8A8480] resize-none focus:outline-none focus:border-[#5C7A6B] focus:ring-[3px] focus:ring-[rgba(74,111,165,0.15)] transition-all leading-relaxed"
            />
            <p className="text-[11px] text-[#8A8480] mt-1.5 text-right">
              {message.length} / 5000
            </p>
          </div>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={send.isPending || selectedIds.length === 0 || !message}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] bg-[#5C7A6B] text-white text-sm font-medium transition-all duration-150 hover:bg-[#496158] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {send.isPending ? (
            "Sending..."
          ) : (
            <>
              <Send size={14} />
              {selectedIds.length === 0
                ? "Select recipients to send"
                : `Send to ${selectedIds.length} client${selectedIds.length !== 1 ? "s" : ""}`}
            </>
          )}
        </button>

        {/* Success confirmation */}
        {send.isSuccess && send.data && (
          <div className="bg-[#EAF4F1] border border-[#7BAF9E]/20 rounded-[12px] p-5 flex items-start gap-3 animate-fade-in">
            <CheckCircle2 size={18} className="text-[#3D8B7A] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#1C1C1E]">Broadcast sent successfully</p>
              <p className="text-xs text-[#5C5856] mt-0.5">
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
