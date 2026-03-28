"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientsList } from "@/lib/api-hooks";
import { api } from "@/lib/api";
import { MessageSquare, Search, Send } from "lucide-react";

// Unwrap API response: handles both flat arrays and { data: [...] }
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}




export default function MessagesPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  const clients = useClientsList();
  const qc = useQueryClient();

  const unreadCounts = useQuery({
    queryKey: ["messages", "unread-counts"],
    queryFn: () => api.message.unreadCounts(),
  });

  const messages = useQuery({
    queryKey: ["messages", "list", selectedClientId, 50],
    queryFn: () => api.message.list({ client_id: selectedClientId!, limit: 50 }),
    enabled: !!selectedClientId,
  });

  const markRead = useMutation({
    mutationFn: (clientId: string) => api.message.markRead({ client_id: clientId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", "unread-counts"] });
    },
  });

  const sendMessage = useMutation({
    mutationFn: (data: { client_id: string; content: string }) =>
      api.message.send(data),
    onMutate: async ({ client_id, content }) => {
      await qc.cancelQueries({ queryKey: ["messages", "list", client_id, 50] });
      const queryKey = ["messages", "list", client_id, 50];
      const previousData = qc.getQueryData(queryKey);
      const optimisticMessage = {
        id: `optimistic-${Date.now()}`,
        client_id,
        therapist_id: "",
        sender_type: "therapist" as const,
        content,
        read: true,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        // Messages come in descending order from API, so prepend
        return {
          ...old,
          messages: [optimisticMessage, ...old.messages],
        };
      });
      return { previousData, queryKey };
    },
    onSuccess: (_data, _vars, context) => {
      setMessageText("");
      // Full invalidate to get the real server data
      if (context?.queryKey) {
        qc.invalidateQueries({ queryKey: ["messages", "list"] });
      }
      qc.invalidateQueries({ queryKey: ["messages", "unread-counts"] });
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previousData !== undefined && context?.queryKey) {
        qc.setQueryData(context.queryKey, context.previousData);
      }
    },
  });

  // Mark messages as read when a client is selected
  useEffect(() => {
    if (selectedClientId && (unreadCounts.data as any)?.[selectedClientId]) {
      markRead.mutate(selectedClientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId || !messageText.trim()) return;
    sendMessage.mutate({
      client_id: selectedClientId,
      content: messageText.trim(),
    });
  }

  const filteredClients =
    toArray(clients.data)?.filter((c: any) =>
      c.full_name.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  // Sort clients: those with unread messages first, then alphabetically
  const sortedClients = [...filteredClients].sort((a: any, b: any) => {
    const aUnread = (unreadCounts.data as any)?.[a.id] ?? 0;
    const bUnread = (unreadCounts.data as any)?.[b.id] ?? 0;
    if (aUnread > 0 && bUnread === 0) return -1;
    if (bUnread > 0 && aUnread === 0) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const selectedClient = toArray(clients.data)?.find((c: any) => c.id === selectedClientId);

  // Messages come in descending order from API, reverse for display
  const displayMessages = [...((messages.data as any)?.messages ?? [])].reverse();

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) ===
      now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    if (isToday) {
      return date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (clients.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-border rounded-small animate-pulse" />
        <div className="h-[600px] bg-card rounded-card border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Messages</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Communicate with your clients
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="flex h-[calc(100vh-200px)] bg-card rounded-card border border-border shadow-card overflow-hidden">
        {/* Left panel -- client list */}
        <div className="w-[320px] flex-shrink-0 border-r border-border flex flex-col bg-bg">
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ui-input pl-10 py-2 text-sm"
              />
            </div>
          </div>

          {/* Client list */}
          <div className="flex-1 overflow-y-auto">
            {sortedClients.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-ink-tertiary">
                  {search ? "No clients match your search" : "No clients yet"}
                </p>
              </div>
            ) : (
              sortedClients.map((client: any) => {
                const unread = (unreadCounts.data as any)?.[client.id] ?? 0;
                const isActive = selectedClientId === client.id;
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-border/50 transition-all duration-150 ${
                      isActive
                        ? "bg-card border-l-2 border-l-sage"
                        : "hover:bg-card/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isActive ? "bg-sage text-white" : "bg-sage-50"
                      }`}>
                        <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-sage"}`}>
                          {client.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm truncate ${
                            isActive ? "font-semibold text-ink" : "font-medium text-ink"
                          }`}>
                            {client.full_name}
                          </span>
                          {unread > 0 && (
                            <span className="ml-2 bg-sage text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel -- message thread */}
        <div className="flex-1 flex flex-col min-w-0 bg-card">
          {!selectedClientId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-sage-bg mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare size={24} className="text-sage" />
                </div>
                <p className="text-sm font-medium text-ink-secondary">
                  Select a client to view messages
                </p>
                <p className="text-xs text-ink-tertiary mt-1">
                  Choose a client from the list to start a conversation
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sage-50 flex items-center justify-center">
                  <span className="text-sm font-semibold text-sage">
                    {selectedClient?.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-ink">
                    {selectedClient?.full_name}
                  </span>
                  {selectedClient?.email && (
                    <p className="text-xs text-ink-tertiary">{selectedClient.email}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                {messages.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2 text-sm text-ink-tertiary">
                      <div className="w-4 h-4 border-2 border-sage border-t-transparent rounded-full animate-spin" />
                      Loading messages...
                    </div>
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-sage-bg mx-auto mb-3 flex items-center justify-center">
                        <MessageSquare size={20} className="text-sage" />
                      </div>
                      <p className="text-sm font-medium text-ink-secondary">
                        No messages yet
                      </p>
                      <p className="text-xs text-ink-tertiary mt-1">
                        Start the conversation below
                      </p>
                    </div>
                  </div>
                ) : (
                  displayMessages.map((msg: any) => {
                    const isTherapist = msg.sender_type === "therapist";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isTherapist ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-card px-4 py-3 ${
                            isTherapist
                              ? "bg-sage text-white rounded-br-md"
                              : "bg-bg text-ink border border-border rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {msg.content as string}
                          </p>
                          <p
                            className={`text-[10px] mt-1.5 ${
                              isTherapist ? "text-white/60" : "text-ink-tertiary"
                            }`}
                          >
                            {formatTime(msg.created_at as string)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Input bar */}
              <form
                onSubmit={handleSend}
                className="px-5 py-4 border-t border-border flex items-end gap-3 bg-bg"
              >
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="ui-input resize-none max-h-32 py-2.5"
                />
                <button
                  type="submit"
                  disabled={sendMessage.isPending || !messageText.trim()}
                  className="btn-primary px-3.5 py-2.5 flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
