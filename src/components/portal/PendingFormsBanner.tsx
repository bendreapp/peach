"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

interface PendingForm {
  id: string;
  title: string;
  access_token: string;
  submitted: boolean;
}

interface PendingFormsBannerProps {
  forms: PendingForm[];
}

export default function PendingFormsBanner({ forms }: PendingFormsBannerProps) {
  const unsubmitted = forms.filter((f) => !f.submitted);
  if (unsubmitted.length === 0) return null;

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{
        background: "#FBF0E8",
        borderColor: "#E8C9A8",
      }}
    >
      <div className="flex items-center gap-2">
        <FileText size={18} strokeWidth={1.5} style={{ color: "#B5733A" }} />
        <h3 className="text-sm font-semibold" style={{ color: "#8A5520" }}>
          {unsubmitted.length === 1
            ? "1 intake form to complete"
            : `${unsubmitted.length} intake forms to complete`}
        </h3>
      </div>
      <div className="space-y-2">
        {unsubmitted.map((form) => (
          <Link
            key={form.id}
            href={`/intake/${form.access_token}`}
            className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors"
            style={{
              background: "white",
              border: "1px solid #E8C9A8",
              color: "#B5733A",
            }}
          >
            <span>{form.title}</span>
            <span>&rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
