"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  IndianRupee,
  FileText,
  ArrowUpRight,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  FileX,
  Settings,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = "paid" | "overdue" | "draft" | "sent";

interface Invoice {
  id: string;
  invoice_number?: string;
  client_name?: string;
  client?: { full_name?: string; name?: string };
  issued_at?: string;
  created_at?: string;
  due_date?: string;
  amount_paise?: number;
  amount?: number;
  status: InvoiceStatus;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function getAmount(inv: Invoice): number {
  if (typeof inv.amount_paise === "number") return inv.amount_paise;
  if (typeof inv.amount === "number") return inv.amount * 100;
  return 0;
}

function getClientName(inv: Invoice): string {
  if (inv.client_name) return inv.client_name;
  if (inv.client?.full_name) return inv.client.full_name;
  if (inv.client?.name) return inv.client.name;
  return "—";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInvoiceNumber(inv: Invoice): string {
  return inv.invoice_number ?? `INV-${inv.id.slice(0, 6).toUpperCase()}`;
}

function getIssueDate(inv: Invoice): string {
  return formatDate(inv.issued_at ?? inv.created_at);
}

// ── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  paid: {
    label: "Paid",
    bg: "#EAF4F1",
    text: "#3D8B7A",
    icon: <CheckCircle2 size={11} />,
  },
  overdue: {
    label: "Overdue",
    bg: "#F9EDED",
    text: "#A0504A",
    icon: <AlertCircle size={11} />,
  },
  draft: {
    label: "Draft",
    bg: "#F0EFED",
    text: "#6B6460",
    icon: <FileText size={11} />,
  },
  sent: {
    label: "Sent",
    bg: "#EBF0EB",
    text: "#5C7A6B",
    icon: <Send size={11} />,
  },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ── Client Initials Avatar ───────────────────────────────────────────────────

function ClientAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold flex-shrink-0"
      style={{ background: "#EBF0EB", color: "#5C7A6B" }}
    >
      {initials || "?"}
    </span>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-card p-5 animate-pulse"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E0D8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div className="h-3 w-20 rounded bg-[#E5E0D8] mb-4" />
      <div className="h-7 w-28 rounded bg-[#E5E0D8] mb-2" />
      <div className="h-3 w-16 rounded bg-[#E5E0D8]" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#E5E0D8]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-3.5 rounded bg-[#E5E0D8] animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ── Summary Cards ─────────────────────────────────────────────────────────────

function SummaryCards({ invoices }: { invoices: Invoice[] }) {
  const totalBilled = invoices.reduce((s, inv) => s + getAmount(inv), 0);
  const collected = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((s, inv) => s + getAmount(inv), 0);
  const outstanding = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((s, inv) => s + getAmount(inv), 0);

  const hasOutstanding = outstanding > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Billed */}
      <div
        className="rounded-card p-5"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-small flex items-center justify-center"
            style={{ background: "rgba(74,111,165,0.08)" }}
          >
            <FileText size={16} style={{ color: "#5C7A6B" }} />
          </div>
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "#8A8480", letterSpacing: "0.06em" }}
          >
            Total Billed
          </span>
        </div>
        <div
          className="text-2xl font-bold"
          style={{ color: "#1C1C1E", fontFamily: "Satoshi, sans-serif" }}
        >
          {formatINR(totalBilled)}
        </div>
        <div className="text-xs mt-1" style={{ color: "#8A8480" }}>
          {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Collected */}
      <div
        className="rounded-card p-5"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-small flex items-center justify-center"
            style={{ background: "#EAF4F1" }}
          >
            <CheckCircle2 size={16} style={{ color: "#3D8B7A" }} />
          </div>
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "#8A8480", letterSpacing: "0.06em" }}
          >
            Collected
          </span>
        </div>
        <div
          className="text-2xl font-bold"
          style={{ color: "#1C1C1E", fontFamily: "Satoshi, sans-serif" }}
        >
          {formatINR(collected)}
        </div>
        <div className="text-xs mt-1" style={{ color: "#8A8480" }}>
          {invoices.filter((i) => i.status === "paid").length} paid
        </div>
      </div>

      {/* Outstanding */}
      <div
        className="rounded-card p-5"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${hasOutstanding ? "#D4956A" : "#E5E0D8"}`,
          borderLeft: hasOutstanding ? "3px solid #D4956A" : "1px solid #E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-small flex items-center justify-center"
            style={{
              background: hasOutstanding
                ? "rgba(212,149,106,0.10)"
                : "rgba(74,111,165,0.08)",
            }}
          >
            <Clock
              size={16}
              style={{ color: hasOutstanding ? "#D4956A" : "#8A8480" }}
            />
          </div>
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "#8A8480", letterSpacing: "0.06em" }}
          >
            Outstanding
          </span>
        </div>
        <div
          className="text-2xl font-bold"
          style={{
            color: hasOutstanding ? "#D4956A" : "#1C1C1E",
            fontFamily: "Satoshi, sans-serif",
          }}
        >
          {formatINR(outstanding)}
        </div>
        <div className="text-xs mt-1" style={{ color: "#8A8480" }}>
          {
            invoices.filter(
              (i) => i.status === "sent" || i.status === "overdue"
            ).length
          }{" "}
          unpaid
        </div>
      </div>
    </div>
  );
}

// ── Invoice Table ─────────────────────────────────────────────────────────────

function InvoiceActionMenu({
  invoice,
  onMarkPaid,
}: {
  invoice: Invoice;
  onMarkPaid: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="w-8 h-8 rounded-small flex items-center justify-center transition-colors"
        style={{ color: "#8A8480" }}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-20 rounded-card py-1 min-w-[150px]"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          }}
        >
          {invoice.status !== "paid" && (
            <button
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[#F4F1EC] transition-colors"
              style={{ color: "#3D8B7A" }}
              onClick={() => {
                onMarkPaid(invoice.id);
                setOpen(false);
              }}
            >
              <CheckCircle2 size={14} />
              Mark as Paid
            </button>
          )}
          <button
            className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[#F4F1EC] transition-colors"
            style={{ color: "#5C5856" }}
            onClick={() => setOpen(false)}
          >
            <ArrowUpRight size={14} />
            View Invoice
          </button>
        </div>
      )}
    </div>
  );
}

function InvoicesTab({ invoices, isLoading, onMarkPaid }: {
  invoices: Invoice[];
  isLoading: boolean;
  onMarkPaid: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      search === "" ||
      getClientName(inv).toLowerCase().includes(search.toLowerCase()) ||
      getInvoiceNumber(inv).toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search by client or invoice #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-3 py-2 text-sm rounded-small outline-none transition-all"
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #E5E0D8",
              color: "#1C1C1E",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#5C7A6B";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(74,111,165,0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E5E0D8";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-small outline-none cursor-pointer transition-all"
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #E5E0D8",
              color: "#1C1C1E",
            }}
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="sent">Sent</option>
            <option value="overdue">Overdue</option>
            <option value="draft">Draft</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#8A8480" }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-card overflow-hidden"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E0D8" }}>
                {["Invoice #", "Client", "Date", "Amount", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium uppercase"
                      style={{
                        color: "#8A8480",
                        letterSpacing: "0.06em",
                        background: "#FAFAF8",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div
                        className="w-12 h-12 rounded-card flex items-center justify-center mb-4"
                        style={{ background: "#F4F1EC" }}
                      >
                        <FileX size={24} style={{ color: "#C5BFB8" }} />
                      </div>
                      <p
                        className="text-base font-medium mb-1"
                        style={{ color: "#5C5856" }}
                      >
                        {search || statusFilter !== "all"
                          ? "No invoices match your filters"
                          : "No invoices yet"}
                      </p>
                      <p className="text-sm" style={{ color: "#8A8480" }}>
                        {search || statusFilter !== "all"
                          ? "Try adjusting your search or filter"
                          : "Invoices you create will appear here"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid #E5E0D8" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F9F8F5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td className="px-4 py-4">
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#5C7A6B" }}
                      >
                        {getInvoiceNumber(inv)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <ClientAvatar name={getClientName(inv)} />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#1C1C1E" }}
                        >
                          {getClientName(inv)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm" style={{ color: "#5C5856" }}>
                        {getIssueDate(inv)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "#1C1C1E" }}
                      >
                        {formatINR(getAmount(inv))}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <InvoiceActionMenu
                        invoice={inv}
                        onMarkPaid={onMarkPaid}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Transactions Tab ──────────────────────────────────────────────────────────

function TransactionsTab() {
  return (
    <div
      className="rounded-card p-16 text-center"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E0D8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="w-12 h-12 rounded-card flex items-center justify-center mx-auto mb-4"
        style={{ background: "#F4F1EC" }}
      >
        <CreditCard size={22} style={{ color: "#C5BFB8" }} />
      </div>
      <p className="text-base font-medium mb-1" style={{ color: "#5C5856" }}>
        Transaction history coming soon
      </p>
      <p className="text-sm" style={{ color: "#8A8480" }}>
        Once Razorpay is connected, payment transactions will appear here
      </p>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

function PaymentSettingsTab() {
  return (
    <div
      className="rounded-card p-8"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E0D8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <h3
        className="text-base font-semibold mb-1"
        style={{ color: "#1C1C1E" }}
      >
        Payment Settings
      </h3>
      <p className="text-sm mb-6" style={{ color: "#8A8480" }}>
        Configure your payment gateway and invoice preferences
      </p>
      <div
        className="rounded-small p-4 flex items-start gap-3"
        style={{
          background: "#FBF4EE",
          border: "1px solid rgba(212,149,106,0.25)",
        }}
      >
        <AlertCircle size={16} style={{ color: "#D4956A", marginTop: 2 }} />
        <div>
          <p className="text-sm font-medium" style={{ color: "#B5733A" }}>
            Razorpay integration pending
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#8A8480" }}>
            Online payment collection with auto-invoicing and GST will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "invoices" | "transactions" | "settings";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("invoices");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.payment.list(),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => api.payment.markPaid(id),
    onSuccess: () => {
      toast.success("Invoice marked as paid");
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => {
      toast.error("That didn't go through — try again or contact support");
    },
  });

  const invoices: Invoice[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];

  const tabs: { key: Tab; label: string }[] = [
    { key: "invoices", label: "Invoices" },
    { key: "transactions", label: "Transactions" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <IndianRupee size={20} style={{ color: "#5C7A6B" }} />
            <h1
              className="text-2xl font-bold"
              style={{ color: "#1C1C1E", fontFamily: "Satoshi, sans-serif" }}
            >
              Payments
            </h1>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "#8A8480" }}>
            Track billing, invoices, and payment activity
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <SummaryCards invoices={invoices} />
      )}

      {/* Tab Bar */}
      <div
        className="flex gap-1 p-1 rounded-small w-fit"
        style={{ background: "#F4F1EC" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-1.5 rounded-small text-sm font-medium transition-all duration-150"
            style={
              activeTab === tab.key
                ? {
                    background: "#FFFFFF",
                    color: "#1C1C1E",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }
                : {
                    background: "transparent",
                    color: "#8A8480",
                  }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "invoices" && (
        <InvoicesTab
          invoices={invoices}
          isLoading={isLoading}
          onMarkPaid={(id) => markPaid.mutate(id)}
        />
      )}
      {activeTab === "transactions" && <TransactionsTab />}
      {activeTab === "settings" && <PaymentSettingsTab />}
    </div>
  );
}
