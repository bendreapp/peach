"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientsList, useCreateClient, useSendPortalInvite } from "@/lib/api-hooks";
import { api } from "@/lib/api";
import { CLIENT_STATUSES, CLIENT_CATEGORIES } from "@bendre/shared";
import {
  Users,
  Search,
  UserPlus,
  MoreHorizontal,
  ExternalLink,
  Archive,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "inactive" | "on_hold";

type SortKey = "full_name" | "last_session" | "next_session" | "session_count";
type SortDir = "asc" | "desc";

interface Client {
  id: string;
  full_name: string;
  status: string;
  email?: string | null;
  phone?: string | null;
  user_id?: string | null;
  category?: string;
  client_type?: string;
  session_count?: number;
  last_session_at?: string | null;
  next_session_at?: string | null;
  tags?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "#EAF4F1", text: "#3D8B7A", label: "Active" },
    inactive: { bg: "#F0EFED", text: "#6B6460", label: "Inactive" },
    on_hold: { bg: "#FBF0E8", text: "#B5733A", label: "On Hold" },
    terminated: { bg: "#F9EDED", text: "#A0504A", label: "Terminated" },
  };
  const s = map[status] ?? { bg: "#F0EFED", text: "#6B6460", label: status };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-pill"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white select-none"
      style={{ backgroundColor: "#5C7A6B" }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div
      className="rounded-card overflow-hidden border"
      style={{
        background: "#FFFFFF",
        borderColor: "#E5E0D8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header row */}
      <div
        className="grid px-6 py-3 border-b"
        style={{
          borderColor: "#E5E0D8",
          gridTemplateColumns: "2fr 120px 80px 140px 140px 1fr 120px",
          gap: "16px",
        }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-pill animate-pulse"
            style={{ backgroundColor: "#F0EFED", width: "60%" }}
          />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="grid px-6 items-center border-b last:border-b-0"
          style={{
            height: "56px",
            borderColor: "#E5E0D8",
            gridTemplateColumns: "2fr 120px 80px 140px 140px 1fr 120px",
            gap: "16px",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full animate-pulse flex-shrink-0"
              style={{ backgroundColor: "#F0EFED" }}
            />
            <div
              className="h-3 rounded-pill animate-pulse"
              style={{ backgroundColor: "#F0EFED", width: "140px" }}
            />
          </div>
          {Array.from({ length: 6 }).map((_, j) => (
            <div
              key={j}
              className="h-3 rounded-pill animate-pulse"
              style={{ backgroundColor: "#F0EFED", width: `${50 + j * 8}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── 3-dot row menu ───────────────────────────────────────────────────────────

function RowMenu({
  client,
  onArchive,
  onDelete,
  onSendInvite,
}: {
  client: Client;
  onArchive: () => void;
  onDelete: () => void;
  onSendInvite: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-8 h-8 flex items-center justify-center rounded-small transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        style={{ color: "#8A8480" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#F4F1EC")
        }
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        aria-label="Row actions"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-44 rounded-card py-1 z-50"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          }}
        >
          <Link
            href={`/dashboard/clients/${client.id}`}
            className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-100"
            style={{ color: "#1C1C1E" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#F4F1EC")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "")
            }
            onClick={() => setOpen(false)}
          >
            <ExternalLink size={14} style={{ color: "#8A8480" }} />
            View Profile
          </Link>
          {!client.user_id && (
            <button
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-100"
              style={{ color: "#5C7A6B" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#EBF0EB")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "")
              }
              onClick={() => {
                setOpen(false);
                onSendInvite();
              }}
            >
              <Send size={14} />
              Send Portal Invite
            </button>
          )}
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-100"
            style={{ color: "#1C1C1E" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#F4F1EC")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "")
            }
            onClick={() => {
              setOpen(false);
              onArchive();
            }}
          >
            <Archive size={14} style={{ color: "#8A8480" }} />
            Archive
          </button>
          <div style={{ height: "1px", backgroundColor: "#E5E0D8", margin: "4px 0" }} />
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-100"
            style={{ color: "#C0705A" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#FBF0ED")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "")
            }
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  description,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(28,28,30,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[480px] p-8 rounded-modal"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: "#1C1C1E" }}>
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-small transition-colors"
            style={{ color: "#8A8480" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#F4F1EC")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm mb-8" style={{ color: "#5C5856" }}>
          {description}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button className="btn-secondary btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={danger ? "btn-danger" : "btn-primary"}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Client Modal ─────────────────────────────────────────────────────────

function AddClientModal({
  onClose,
  onCreate,
  isPending,
  error,
}: {
  onClose: () => void;
  onCreate: (data: {
    full_name: string;
    email: string | null;
    phone: string | null;
    category: string;
    client_type: string;
  }) => void;
  isPending: boolean;
  error?: Error | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("indian");
  const [clientType, setClientType] = useState("irregular");

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate({
      full_name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      category,
      client_type: clientType,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(28,28,30,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-modal p-8"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: "#1C1C1E" }}>
            Add Client
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-small transition-colors"
            style={{ color: "#8A8480" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#F4F1EC")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="ui-label">Full name *</label>
            <input
              type="text"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="ui-input"
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="ui-input"
              />
            </div>
          </div>

          {/* Category + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ui-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="ui-input"
              >
                {Object.entries(CLIENT_CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {(val as { label: string }).label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ui-label">Session type</label>
              <select
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
                className="ui-input"
              >
                <option value="irregular">Irregular</option>
                <option value="regular">Regular (fixed slot)</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm" style={{ color: "#C0705A" }}>
              {error.message ?? "That didn't go through — try again or contact support."}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isPending || !name.trim()}>
              {isPending ? "Adding…" : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortableHeader({
  label,
  sortKey,
  currentKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  direction: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = currentKey === sortKey;
  return (
    <button
      className="flex items-center gap-1 text-left group focus:outline-none"
      onClick={() => onSort(sortKey)}
    >
      <span
        className="text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors"
        style={{ color: active ? "#5C7A6B" : "#8A8480" }}
      >
        {label}
      </span>
      <span
        className="transition-opacity"
        style={{ opacity: active ? 1 : 0, color: "#5C7A6B" }}
      >
        {active && direction === "asc" ? (
          <ChevronUp size={12} />
        ) : (
          <ChevronDown size={12} />
        )}
      </span>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const qc = useQueryClient();

  // Filter + search + sort state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    type: "archive" | "delete";
    client: Client;
  } | null>(null);

  // Data
  const clientsQuery = useClientsList(
    statusFilter === "all" ? undefined : { status: statusFilter }
  );

  const createClient = useCreateClient();
  const sendPortalInvite = useSendPortalInvite();

  const deactivate = useMutation({
    mutationFn: (id: string) => api.clients.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client archived.");
    },
    onError: () => {
      toast.error("That didn't go through — try again.");
    },
  });

  // Normalise data
  const rawClients: Client[] = Array.isArray(clientsQuery.data)
    ? clientsQuery.data
    : (clientsQuery.data as { data?: Client[] })?.data ?? [];

  // Search filter
  const searched = rawClients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  // Sort
  const sorted = [...searched].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";
    if (sortKey === "full_name") {
      aVal = a.full_name.toLowerCase();
      bVal = b.full_name.toLowerCase();
    } else if (sortKey === "session_count") {
      aVal = a.session_count ?? 0;
      bVal = b.session_count ?? 0;
    } else if (sortKey === "last_session") {
      aVal = a.last_session_at ?? "";
      bVal = b.last_session_at ?? "";
    } else if (sortKey === "next_session") {
      aVal = a.next_session_at ?? "";
      bVal = b.next_session_at ?? "";
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleSendInvite(client: Client) {
    if (!client.email) {
      toast.error("This client has no email address — add one first");
      return;
    }
    sendPortalInvite.mutate(client.id, {
      onSuccess: () => {
        toast.success(`Portal invite sent to ${client.email}`);
      },
      onError: (err: Error) =>
        toast.error(err.message || "Failed to send invite — try again"),
    });
  }

  function handleCreate(data: {
    full_name: string;
    email: string | null;
    phone: string | null;
    category: string;
    client_type: string;
  }) {
    createClient.mutate(
      {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        category: data.category as "indian" | "nri" | "couple" | "other",
        client_type: data.client_type as "regular" | "irregular",
      },
      {
        onSuccess: () => {
          setShowAddModal(false);
          toast.success(`${data.full_name} added to your practice.`);
        },
      }
    );
  }

  const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "on_hold", label: "On Hold" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1200px] space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1C1C1E", lineHeight: "1.2" }}>
            Clients
          </h1>
          {!clientsQuery.isLoading && (
            <p className="text-sm mt-1" style={{ color: "#8A8480" }}>
              {rawClients.length} client{rawClients.length !== 1 ? "s" : ""} in your practice
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={15} />
          Add Client
        </button>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div
        className="rounded-card px-5 py-4 flex flex-wrap items-center gap-4"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {/* Status tabs */}
        <div className="flex items-center gap-1 p-1 rounded-small" style={{ backgroundColor: "#F4F1EC" }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className="px-3 py-1.5 rounded-[6px] text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              style={
                statusFilter === tab.value
                  ? {
                      background: "#FFFFFF",
                      color: "#1C1C1E",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                    }
                  : { color: "#8A8480" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#8A8480" }}
          />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ui-input pl-9 pr-3 text-sm"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setSearch("")}
              style={{ color: "#8A8480" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {clientsQuery.isLoading ? (
        <TableSkeleton />
      ) : sorted.length === 0 ? (
        /* ── Empty state ────────────────────────────────────────────────── */
        <div
          className="rounded-card py-20 flex flex-col items-center justify-center text-center"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <Users
            size={40}
            strokeWidth={1.5}
            style={{ color: "#C5BFB8", marginBottom: "16px" }}
          />
          <p className="text-base font-medium" style={{ color: "#5C5856" }}>
            {search
              ? "No clients match your search"
              : statusFilter !== "all"
              ? `No ${statusFilter.replace("_", " ")} clients`
              : "No clients yet"}
          </p>
          <p className="text-sm mt-2 max-w-xs" style={{ color: "#8A8480" }}>
            {search
              ? "Try a different name or email address."
              : "Clients are added automatically when they book, or you can add them manually."}
          </p>
          {!search && statusFilter === "all" && (
            <button
              className="btn-primary mt-6"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus size={15} />
              Add your first client
            </button>
          )}
        </div>
      ) : (
        /* ── Populated table ─────────────────────────────────────────────── */
        <div
          className="rounded-card"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          {/* Table header */}
          <div
            className="grid px-6 py-3 border-b"
            style={{
              borderColor: "#E5E0D8",
              gridTemplateColumns: "2fr 120px 80px 140px 140px 1fr 120px",
              gap: "16px",
              backgroundColor: "#FAFAF8",
            }}
          >
            <SortableHeader
              label="Client"
              sortKey="full_name"
              currentKey={sortKey}
              direction={sortDir}
              onSort={handleSort}
            />
            <span
              className="text-[11px] font-semibold tracking-[0.08em] uppercase"
              style={{ color: "#8A8480" }}
            >
              Status
            </span>
            <SortableHeader
              label="Sessions"
              sortKey="session_count"
              currentKey={sortKey}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortableHeader
              label="Last Session"
              sortKey="last_session"
              currentKey={sortKey}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortableHeader
              label="Next Session"
              sortKey="next_session"
              currentKey={sortKey}
              direction={sortDir}
              onSort={handleSort}
            />
            <span
              className="text-[11px] font-semibold tracking-[0.08em] uppercase"
              style={{ color: "#8A8480" }}
            >
              Tags
            </span>
            <span
              className="text-[11px] font-semibold tracking-[0.08em] uppercase text-right"
              style={{ color: "#8A8480" }}
            >
              Actions
            </span>
          </div>

          {/* Table rows */}
          <div className="divide-y" style={{ borderColor: "#E5E0D8" }}>
            {sorted.map((client) => (
              <div
                key={client.id}
                className="grid px-6 items-center transition-colors duration-100 group"
                style={{
                  height: "56px",
                  gridTemplateColumns: "2fr 120px 80px 140px 140px 1fr 120px",
                  gap: "16px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#F9F8F5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "")
                }
              >
                {/* Avatar + Name */}
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="flex items-center gap-3 min-w-0"
                >
                  <Avatar name={client.full_name} />
                  <span
                    className="text-sm font-medium truncate transition-colors"
                    style={{ color: "#1C1C1E" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#5C7A6B")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#1C1C1E")
                    }
                  >
                    {client.full_name}
                  </span>
                </Link>

                {/* Status */}
                <div>
                  <StatusBadge status={client.status} />
                </div>

                {/* Sessions count */}
                <span className="text-sm" style={{ color: "#5C5856" }}>
                  {client.session_count ?? "—"}
                </span>

                {/* Last session */}
                <span className="text-sm" style={{ color: "#8A8480" }}>
                  {formatDate(client.last_session_at)}
                </span>

                {/* Next session */}
                <span
                  className="text-sm"
                  style={{
                    color: client.next_session_at ? "#5C7A6B" : "#8A8480",
                  }}
                >
                  {formatDate(client.next_session_at)}
                </span>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {client.client_type === "regular" && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-pill"
                      style={{ backgroundColor: "#EBF0EB", color: "#5C7A6B" }}
                    >
                      Regular
                    </span>
                  )}
                  {client.category && client.category !== "indian" && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-pill"
                      style={{ backgroundColor: "#F0EFED", color: "#6B6460" }}
                    >
                      {(CLIENT_CATEGORIES as Record<string, { label: string }>)[client.category]?.label ?? client.category}
                    </span>
                  )}
                  {(!client.client_type || client.client_type !== "regular") &&
                    (!client.category || client.category === "indian") && (
                      <span style={{ color: "#8A8480" }}>—</span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-small border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 opacity-0 group-hover:opacity-100 whitespace-nowrap"
                    style={{
                      color: "#5C7A6B",
                      borderColor: "#E5E0D8",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#5C7A6B";
                      e.currentTarget.style.backgroundColor = "#EBF0EB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E5E0D8";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    View Profile
                  </Link>
                  <RowMenu
                    client={client}
                    onArchive={() =>
                      setConfirmModal({ type: "archive", client })
                    }
                    onDelete={() =>
                      setConfirmModal({ type: "delete", client })
                    }
                    onSendInvite={() => handleSendInvite(client)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add client modal ──────────────────────────────────────────────── */}
      {showAddModal && (
        <AddClientModal
          onClose={() => {
            setShowAddModal(false);
            createClient.reset();
          }}
          onCreate={handleCreate}
          isPending={createClient.isPending}
          error={createClient.error as Error | null}
        />
      )}

      {/* ── Confirm modal ─────────────────────────────────────────────────── */}
      {confirmModal && (
        <ConfirmModal
          title={
            confirmModal.type === "delete"
              ? `Delete ${confirmModal.client.full_name}?`
              : `Archive ${confirmModal.client.full_name}?`
          }
          description={
            confirmModal.type === "delete"
              ? `This will permanently remove ${confirmModal.client.full_name} and all their records from your practice. This cannot be undone.`
              : `${confirmModal.client.full_name} will be marked inactive and hidden from your active client list.`
          }
          confirmLabel={
            confirmModal.type === "delete" ? "Delete Client" : "Archive Client"
          }
          danger={confirmModal.type === "delete"}
          loading={deactivate.isPending}
          onConfirm={() => {
            deactivate.mutate(confirmModal.client.id, {
              onSuccess: () => setConfirmModal(null),
            });
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
