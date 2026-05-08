"use client";

import { Receipt } from "lucide-react";
import { usePortalInvoices } from "@/lib/api-hooks";

interface Invoice {
  id: string;
  invoice_number: string;
  issued_at: string;
  amount_paise: number;
  status: "paid" | "unpaid" | "overdue";
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: "#EAF4F1", text: "#3D8B7A", label: "Paid" },
  unpaid: { bg: "#FBF0E8", text: "#B5733A", label: "Unpaid" },
  overdue: { bg: "#F9EDED", text: "#A0504A", label: "Overdue" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}

interface InvoicesListProps {
  clientId: string;
}

export default function InvoicesList({ clientId }: InvoicesListProps) {
  const { data, isLoading } = usePortalInvoices(clientId);
  const invoices: Invoice[] = (data as any) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E5E0D8] px-4 py-3 flex items-center justify-between gap-4 animate-pulse"
            style={{ background: "white" }}
          >
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-[#E5E0D8] rounded w-1/4" />
              <div className="h-3 bg-[#E5E0D8] rounded w-1/3" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 bg-[#E5E0D8] rounded w-16" />
              <div className="h-5 bg-[#E5E0D8] rounded-full w-14" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div
        className="rounded-xl border border-[#E5E0D8] p-8 text-center"
        style={{
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: "#F4F1EC" }}
        >
          <Receipt size={20} strokeWidth={1.5} style={{ color: "#C5BFB8" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "#5C5856" }}>
          No invoices yet
        </p>
        <p className="text-xs mt-1" style={{ color: "#736E6A" }}>
          Invoices from your therapist will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invoices.map((invoice) => {
        const status = STATUS_CONFIG[invoice.status] ?? {
          bg: "#F0EFED",
          text: "#6B6460",
          label: invoice.status,
        };

        return (
          <div
            key={invoice.id}
            className="rounded-xl border border-[#E5E0D8] px-4 py-3 flex items-center justify-between gap-4"
            style={{
              background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>
                {invoice.invoice_number}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#736E6A" }}>
                {formatDate(invoice.issued_at)}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold tabular-nums" style={{ color: "#1C1C1E" }}>
                {formatAmount(invoice.amount_paise)}
              </span>
              <span
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: status.bg, color: status.text }}
              >
                {status.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
