"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useClientDetail } from "@/lib/api-hooks";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  ClipboardList,
  FolderOpen,
} from "lucide-react";
import {
  ClientHeader,
  SessionsTab,
  NotesTab,
  TreatmentTab,
  ResourcesTab,
  IntakeTab,
} from "@/components/client-detail";

type Tab = "sessions" | "notes" | "treatment" | "resources" | "intake";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  const client = useClientDetail(id);

  if (client.isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="h-5 w-28 bg-border rounded-lg animate-pulse" />
        <div className="h-36 bg-card rounded-card border border-border animate-pulse" />
        <div className="h-12 bg-card rounded-card border border-border animate-pulse" />
        <div className="h-72 bg-card rounded-card border border-border animate-pulse" />
      </div>
    );
  }

  if (client.error || !client.data) {
    return (
      <div className="max-w-4xl space-y-6">
        <Link href="/dashboard/clients" className="btn-ghost btn-sm">
          <ArrowLeft size={14} /> Back to clients
        </Link>
        <div className="bg-error-bg border border-error/15 rounded-card p-8 text-center">
          <p className="text-error text-sm font-medium">Client not found</p>
          <p className="text-xs text-ink-tertiary mt-1">This client may have been removed or does not exist.</p>
        </div>
      </div>
    );
  }

  const c = client.data as any;

  const tabs: { key: Tab; label: string; icon: typeof CalendarDays }[] = [
    { key: "sessions", label: "Sessions", icon: CalendarDays },
    { key: "notes", label: "Notes", icon: FileText },
    { key: "treatment", label: "Treatment", icon: ClipboardList },
    { key: "intake", label: "Intake", icon: ClipboardList },
    { key: "resources", label: "Resources", icon: FolderOpen },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back link */}
      <Link href="/dashboard/clients" className="btn-ghost btn-sm inline-flex">
        <ArrowLeft size={14} /> Back to clients
      </Link>

      {/* Client header */}
      <ClientHeader clientId={id} client={c} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg rounded-small border border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-card text-ink shadow-card"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "sessions" && <SessionsTab clientId={id} />}
      {activeTab === "notes" && <NotesTab clientId={id} />}
      {activeTab === "treatment" && <TreatmentTab clientId={id} />}
      {activeTab === "resources" && <ResourcesTab clientId={id} clientName={c.full_name} />}
      {activeTab === "intake" && <IntakeTab clientId={id} />}
    </div>
  );
}
