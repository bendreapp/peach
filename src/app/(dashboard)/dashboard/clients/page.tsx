"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientsList, useCreateClient } from "@/lib/api-hooks";
import { api } from "@/lib/api";
import { CLIENT_STATUSES, CLIENT_CATEGORIES } from "@bendre/shared";
import {
  Users,
  Search,
  UserPlus,
  X,
  Mail,
  Phone,
  Trash2,
  ChevronRight,
} from "lucide-react";

type StatusFilter = "active" | "inactive" | "terminated" | "all";

export default function ClientsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const qc = useQueryClient();

  const clients = useClientsList(
    statusFilter === "all"
      ? { status: undefined }
      : statusFilter === "active"
      ? undefined
      : { status: statusFilter }
  );

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newCategory, setNewCategory] = useState<string>("indian");
  const [newClientType, setNewClientType] = useState<string>("irregular");
  const [search, setSearch] = useState("");

  const create = useCreateClient();

  function handleCreateSuccess() {
    setShowForm(false);
    setName("");
    setEmail("");
    setPhone("");
    setNewCategory("indian");
    setNewClientType("irregular");
  }

  const deactivate = useMutation({
    mutationFn: (id: string) => api.clients.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      {
        full_name: name,
        email: email || null,
        phone: phone || null,
        category: newCategory as "indian" | "nri" | "couple" | "other",
        client_type: newClientType as "regular" | "irregular",
      },
      { onSuccess: handleCreateSuccess }
    );
  }

  const clientsArray = Array.isArray(clients.data) ? clients.data : (clients.data?.data ?? []);
  const filtered = clientsArray.filter((c: any) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (clients.isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-border rounded-small animate-pulse" />
          <div className="h-10 w-28 bg-border rounded-small animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-card rounded-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statusBadge: Record<string, string> = {
    active: "badge badge-success",
    inactive: "badge badge-gold",
    terminated: "badge badge-error",
  };

  const categoryBadge: Record<string, string> = {
    indian: "badge badge-sage",
    nri: "badge badge-teal",
    couple: "badge badge-warning",
    other: "badge badge-gold",
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Clients</h1>
          <p className="text-sm text-ink-secondary mt-1">
            {clientsArray.length ?? 0} client{(clientsArray.length ?? 0) !== 1 ? "s" : ""} in your practice
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? "btn-secondary btn-sm" : "btn-primary"}
        >
          {showForm ? (
            <>
              <X size={14} />
              Cancel
            </>
          ) : (
            <>
              <UserPlus size={15} />
              Add Client
            </>
          )}
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 p-1 bg-bg rounded-small border border-border">
        {(["active", "inactive", "terminated", "all"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              statusFilter === status
                ? "bg-card text-ink shadow-card"
                : "text-ink-tertiary hover:text-ink-secondary"
            }`}
          >
            {status === "all" ? "All" : CLIENT_STATUSES[status]?.label ?? status}
          </button>
        ))}
      </div>

      {/* Add client form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="ui-card space-y-5 animate-slide-up"
        >
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={16} className="text-sage" />
            <h3 className="text-sm font-semibold text-ink">New Client</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="ui-label">Full name *</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label">Email</label>
              <input
                type="email"
                placeholder="client@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label">Phone</label>
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="ui-input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ui-label">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="ui-input"
              >
                {Object.entries(CLIENT_CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ui-label">Type</label>
              <select
                value={newClientType}
                onChange={(e) => setNewClientType(e.target.value)}
                className="ui-input"
              >
                <option value="irregular">Irregular</option>
                <option value="regular">Regular (fixed slot)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={create.isPending}
              className="btn-primary"
            >
              {create.isPending ? "Adding..." : "Add Client"}
            </button>
            {create.error && (
              <span className="text-sm text-error">{create.error.message}</span>
            )}
          </div>
        </form>
      )}

      {/* Search */}
      {(clientsArray.length ?? 0) > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ui-input pl-11"
          />
        </div>
      )}

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="ui-card text-center py-16">
          <div className="w-14 h-14 rounded-full bg-sage-bg mx-auto mb-4 flex items-center justify-center">
            <Users size={22} className="text-sage" />
          </div>
          <p className="text-sm font-medium text-ink-secondary">
            {search ? "No clients match your search" : "No clients yet"}
          </p>
          <p className="text-xs text-ink-tertiary mt-1.5 max-w-xs mx-auto">
            {search ? "Try a different search term" : "Clients are added automatically when they book a session, or add one manually"}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-card border border-border shadow-card overflow-hidden divide-y divide-border">
          {filtered.map((client: any) => (
            <div
              key={client.id}
              className="flex items-center justify-between hover:bg-bg transition-colors duration-150 group"
            >
              <Link
                href={`/dashboard/clients/${client.id}`}
                className="flex items-center gap-4 flex-1 min-w-0 px-6 py-4"
              >
                <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-sage">
                    {client.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink">
                      {client.full_name}
                    </span>
                    <span className={statusBadge[client.status] ?? "badge badge-sage"}>
                      {CLIENT_STATUSES[client.status as keyof typeof CLIENT_STATUSES]?.label ?? client.status}
                    </span>
                    {client.category && client.category !== "indian" && (
                      <span className={categoryBadge[client.category] ?? "badge badge-gold"}>
                        {CLIENT_CATEGORIES[client.category as keyof typeof CLIENT_CATEGORIES]?.label ?? client.category}
                      </span>
                    )}
                    {client.client_type === "regular" && (
                      <span className="badge badge-teal">Regular</span>
                    )}
                  </div>
                  <div className="text-xs text-ink-tertiary flex items-center gap-3 mt-1">
                    {client.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={11} />
                        {client.email}
                      </span>
                    )}
                    {client.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={11} />
                        {client.phone}
                      </span>
                    )}
                    {!client.email && !client.phone && "No contact info"}
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </Link>
              <button
                onClick={() => {
                  if (confirm(`Remove ${client.full_name} from your client list?`)) {
                    deactivate.mutate(client.id);
                  }
                }}
                className="text-xs text-ink-tertiary hover:text-error transition-colors flex items-center gap-1 mr-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
