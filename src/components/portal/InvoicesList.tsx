"use client";

import { Receipt, Send, Copy } from "lucide-react";
import { useState } from "react";
import { usePortalInvoices } from "@/lib/api-hooks";

interface PortalInvoice {
  id: string;
  invoice_number: string;
  amount_inr: number;
  gst_amount_inr: number;
  total_inr: number;
  status: "paid" | "unpaid" | "overdue" | string;
  paid_at: string | null;
  created_at: string;
  therapist_upi_id: string | null;
  therapist_name: string;
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

function formatRupees(inr: number): string {
  return `₹${inr.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}

/// Build a `upi://pay?…` deeplink. On mobile this opens GPay / PhonePe / Paytm
/// pre-filled with the therapist's VPA, the invoice amount, and a note.
function buildUpiDeeplink(invoice: PortalInvoice): string | null {
  if (!invoice.therapist_upi_id) return null;
  const params = new URLSearchParams({
    pa: invoice.therapist_upi_id,
    pn: invoice.therapist_name,
    am: String(invoice.total_inr),
    tn: `Invoice ${invoice.invoice_number}`,
    cu: "INR",
  });
  return `upi://pay?${params.toString()}`;
}

interface InvoicesListProps {
  clientId: string;
}

export default function InvoicesList({ clientId }: InvoicesListProps) {
  const { data, isLoading } = usePortalInvoices(clientId);
  const invoices: PortalInvoice[] = (data as PortalInvoice[] | undefined) ?? [];
  const [copiedUpiFor, setCopiedUpiFor] = useState<string | null>(null);

  async function copyUpi(invoice: PortalInvoice) {
    if (!invoice.therapist_upi_id) return;
    try {
      await navigator.clipboard.writeText(invoice.therapist_upi_id);
      setCopiedUpiFor(invoice.id);
      setTimeout(() => setCopiedUpiFor((cur) => (cur === invoice.id ? null : cur)), 1800);
    } catch {
      // clipboard unavailable; silent
    }
  }

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
        const upiLink = invoice.status !== "paid" ? buildUpiDeeplink(invoice) : null;

        return (
          <div
            key={invoice.id}
            className="rounded-xl border border-[#E5E0D8] px-4 py-3 flex flex-col gap-2"
            style={{
              background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>
                  {invoice.invoice_number}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#736E6A" }}>
                  {formatDate(invoice.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: "#1C1C1E" }}
                >
                  {formatRupees(invoice.total_inr)}
                </span>
                <span
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                  style={{ background: status.bg, color: status.text }}
                >
                  {status.label}
                </span>
              </div>
            </div>

            {/* UPI payment row — only for unpaid invoices where therapist set a UPI ID.
                Touch targets sized to 44px iOS minimum since clients open the
                portal on phones. Helper text always visible (no sm:hidden) so
                mobile users see the UTR-handoff instruction. */}
            {upiLink && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F0EDE7]">
                <a
                  href={upiLink}
                  aria-label={`Pay ${formatRupees(invoice.total_inr)} via UPI to ${invoice.therapist_name}`}
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-[#5C7A6B] text-white px-4 py-2.5 rounded-md hover:bg-[#4A6557] transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7A6B] focus-visible:ring-offset-2"
                >
                  <Send size={14} aria-hidden="true" />
                  Pay {formatRupees(invoice.total_inr)} via UPI
                </a>
                <button
                  type="button"
                  onClick={() => copyUpi(invoice)}
                  aria-label={`Copy UPI ID ${invoice.therapist_upi_id ?? ""}`}
                  className="inline-flex items-center justify-center gap-1.5 text-sm text-[#5C5856] hover:text-[#1C1C1E] transition-colors px-3 py-2.5 rounded-md hover:bg-[#F4F1EC] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7A6B]"
                >
                  <Copy size={13} aria-hidden="true" />
                  {copiedUpiFor === invoice.id ? "Copied" : "Copy UPI"}
                </button>
                <p className="text-[12px] text-[#736E6A] w-full mt-1 leading-snug">
                  After paying, share the UTR with your therapist on WhatsApp so they can mark this invoice as paid.
                </p>
              </div>
            )}
            {invoice.status !== "paid" && !invoice.therapist_upi_id && (
              <div className="text-[12px] text-[#736E6A] pt-3 border-t border-[#F0EDE7] leading-snug">
                Your therapist hasn't set up a UPI ID yet — please reach out to them to pay.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
