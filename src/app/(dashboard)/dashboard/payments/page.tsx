"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {


  IndianRupee,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  Ban,
  Receipt,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

// Unwrap API response: handles both flat arrays and { data: [...] }
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}


type StatusFilter = "all" | "unpaid" | "paid" | "refunded";

type DateRange = "this_month" | "last_month" | "all_time";

function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatDateIST(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function getMonthRange(offset: number): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("this_month");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const queryParams = statusFilter === "all"
    ? { limit: 100 }
    : { status: statusFilter, limit: 100 };

  // Fetch all invoices (we filter client-side for date range and search)
  const invoices = useQuery({
    queryKey: ["payments", "list", queryParams],
    queryFn: () => api.payment.list(queryParams),
  });

  const markPaid = useMutation({
    mutationFn: ({ invoice_id, razorpay_payment_id }: { invoice_id: string; razorpay_payment_id: string }) =>
      api.payment.markPaid(invoice_id, { razorpay_payment_id }),
    onMutate: async ({ invoice_id }) => {
      await qc.cancelQueries({ queryKey: ["payments", "list"] });
      const previousData = qc.getQueryData(["payments", "list", queryParams]);
      qc.setQueryData(["payments", "list", queryParams], (old: any) => {
        if (!old) return old;
        return old.map((inv: any) =>
          inv.id === invoice_id
            ? { ...inv, status: "paid" as const, paid_at: new Date().toISOString() }
            : inv
        );
      });
      return { previousData };
    },
    onSuccess: () => toast.success("Invoice marked as paid"),
    onError: (err: any, _vars, context: any) => {
      if (context?.previousData) {
        qc.setQueryData(["payments", "list", queryParams], context.previousData);
      }
      toast.error(err.message || "Failed to mark as paid");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["payments", "list"] }),
  });

  // Client-side filtering by date range and search
  const filtered = useMemo(() => {
    if (!invoices.data) return [];

    let items = invoices.data as any[];

    // Date range filter
    if (dateRange !== "all_time") {
      const offset = dateRange === "this_month" ? 0 : -1;
      const { start, end } = getMonthRange(offset);
      items = items.filter((inv: any) => {
        const d = new Date(inv.created_at);
        return d >= start && d <= end;
      });
    }

    // Search by client name
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((inv: any) => {
        const client = inv.clients as { full_name: string; email: string | null } | null;
        return (
          client?.full_name?.toLowerCase().includes(q) ||
          client?.email?.toLowerCase().includes(q) ||
          inv.invoice_number?.toLowerCase().includes(q)
        );
      });
    }

    return items;
  }, [invoices.data, dateRange, search]);

  // Summary stats
  const stats = useMemo(() => {
    if (!invoices.data) return { totalRevenue: 0, pendingAmount: 0, thisMonth: 0 };

    const { start: monthStart, end: monthEnd } = getMonthRange(0);

    let totalRevenue = 0;
    let pendingAmount = 0;
    let thisMonth = 0;

    for (const inv of invoices.data as any[]) {
      if (inv.status === "paid") {
        totalRevenue += inv.total_inr;
        const d = new Date(inv.paid_at || inv.created_at);
        if (d >= monthStart && d <= monthEnd) {
          thisMonth += inv.total_inr;
        }
      } else if (inv.status === "unpaid") {
        pendingAmount += inv.total_inr;
      }
    }

    return { totalRevenue, pendingAmount, thisMonth };
  }, [invoices.data]);

  function handleMarkPaid(invoiceId: string) {
    const paymentId = prompt("Enter Razorpay Payment ID (or any reference):");
    if (!paymentId) return;
    markPaid.mutate({ invoice_id: invoiceId, razorpay_payment_id: paymentId });
  }

  const statusBadgeClass: Record<string, string> = {
    paid: "badge badge-success",
    unpaid: "badge badge-warning",
    refunded: "badge badge-gold",
  };

  const statusLabels: Record<string, string> = {
    paid: "Paid",
    unpaid: "Unpaid",
    refunded: "Refunded",
  };

  if (invoices.isLoading) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="h-8 w-40 bg-border rounded-small animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-card rounded-card border border-border animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-card rounded-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Payments</h1>
        <p className="text-sm text-ink-secondary mt-1">
          {toArray(invoices.data)?.length ?? 0} invoice{(toArray(invoices.data)?.length ?? 0) !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ui-card group">
          <div className="flex items-center justify-between mb-3">
            <span className="ui-section-label">Total Revenue</span>
            <div className="w-9 h-9 rounded-small bg-success-bg flex items-center justify-center">
              <TrendingUp size={16} className="text-success" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-ink tracking-tight">{formatPaise(stats.totalRevenue)}</p>
        </div>

        <div className="ui-card group">
          <div className="flex items-center justify-between mb-3">
            <span className="ui-section-label">Pending</span>
            <div className="w-9 h-9 rounded-small bg-warning-bg flex items-center justify-center">
              <Clock size={16} className="text-warning" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-ink tracking-tight">{formatPaise(stats.pendingAmount)}</p>
        </div>

        <div className="ui-card group">
          <div className="flex items-center justify-between mb-3">
            <span className="ui-section-label">This Month</span>
            <div className="w-9 h-9 rounded-small bg-sage-bg flex items-center justify-center">
              <ArrowUpRight size={16} className="text-sage" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-ink tracking-tight">{formatPaise(stats.thisMonth)}</p>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Date range toggle */}
        <div className="flex items-center gap-1 p-1 bg-bg rounded-small border border-border">
          {(
            [
              { key: "this_month", label: "This Month" },
              { key: "last_month", label: "Last Month" },
              { key: "all_time", label: "All Time" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateRange(key)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                dateRange === key
                  ? "bg-card text-ink shadow-card"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter toggle */}
        <div className="flex items-center gap-1 p-1 bg-bg rounded-small border border-border">
          {(["all", "paid", "unpaid", "refunded"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                statusFilter === status
                  ? "bg-card text-ink shadow-card"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              {status === "all" ? "All" : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary" />
        <input
          type="text"
          placeholder="Search by client name or invoice number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ui-input pl-11"
        />
      </div>

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <div className="ui-card text-center py-16">
          <div className="w-14 h-14 rounded-full bg-sage-bg mx-auto mb-4 flex items-center justify-center">
            <Receipt size={22} className="text-sage" />
          </div>
          <p className="text-sm font-medium text-ink-secondary">
            {search || statusFilter !== "all" || dateRange !== "all_time"
              ? "No invoices match your filters"
              : "No invoices yet"}
          </p>
          <p className="text-xs text-ink-tertiary mt-1.5 max-w-xs mx-auto">
            {search
              ? "Try a different search term"
              : "Invoices will appear here when created for sessions"}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-card border border-border shadow-card overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_100px_100px_120px] gap-4 px-6 py-3.5 border-b border-border bg-bg">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-tertiary">Invoice</span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-tertiary">Client</span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-tertiary">Amount</span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-tertiary">Status</span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-tertiary text-right">Action</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-border">
            {filtered.map((inv: any) => {
              const client = inv.clients as { full_name: string; email: string | null } | null;
              return (
                <div
                  key={inv.id}
                  className="px-6 py-4 sm:grid sm:grid-cols-[1fr_1fr_100px_100px_120px] sm:gap-4 sm:items-center hover:bg-bg transition-colors duration-150 space-y-2 sm:space-y-0"
                >
                  {/* Invoice number + date */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{inv.invoice_number}</p>
                    <p className="text-xs text-ink-tertiary mt-0.5">{formatDateIST(inv.created_at)}</p>
                  </div>

                  {/* Client */}
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{client?.full_name ?? "Unknown"}</p>
                    {client?.email && (
                      <p className="text-xs text-ink-tertiary truncate mt-0.5">{client.email}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <p className="text-sm font-semibold text-ink">{formatPaise(inv.total_inr)}</p>
                    {inv.gst_amount_inr > 0 && (
                      <p className="text-[10px] text-ink-tertiary mt-0.5">
                        incl. GST {formatPaise(inv.gst_amount_inr)}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div>
                    <span className={statusBadgeClass[inv.status] ?? "badge badge-warning"}>
                      {inv.status === "paid" && <CheckCircle2 size={11} />}
                      {inv.status === "unpaid" && <Clock size={11} />}
                      {inv.status === "refunded" && <RotateCcw size={11} />}
                      {statusLabels[inv.status] ?? inv.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end">
                    {inv.status === "unpaid" && (
                      <button
                        onClick={() => handleMarkPaid(inv.id)}
                        disabled={markPaid.isPending}
                        className="btn-ghost btn-sm"
                      >
                        <CheckCircle2 size={13} />
                        Mark Paid
                      </button>
                    )}
                    {inv.status === "paid" && (
                      <span className="text-xs text-ink-tertiary flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-success" />
                        {inv.paid_at ? formatDateIST(inv.paid_at) : "Paid"}
                      </span>
                    )}
                    {inv.status === "refunded" && (
                      <span className="text-xs text-ink-tertiary flex items-center gap-1.5">
                        <Ban size={12} />
                        Refunded
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
