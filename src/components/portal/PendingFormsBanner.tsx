"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

interface PendingForm {
  id: string;
  access_token: string;
  status: string;
  expires_at: string;
}

interface PendingFormsBannerProps {
  forms: PendingForm[];
}

export default function PendingFormsBanner({ forms }: PendingFormsBannerProps) {
  if (forms.length === 0) return null;

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
          {forms.length === 1
            ? "1 intake form to complete"
            : `${forms.length} intake forms to complete`}
        </h3>
      </div>
      <div className="space-y-2">
        {forms.map((form) =>
          form.access_token ? (
            <Link
              key={form.id}
              href={`/intake/${form.access_token}`}
              className="block rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              style={{
                background: "white",
                border: "1px solid #E8C9A8",
                color: "#B5733A",
              }}
            >
              Fill intake form &rarr;
            </Link>
          ) : (
            <p
              key={form.id}
              className="text-sm px-4 py-2"
              style={{ color: "#B5733A" }}
            >
              Your therapist will share an intake form link with you.
            </p>
          )
        )}
      </div>
    </div>
  );
}
