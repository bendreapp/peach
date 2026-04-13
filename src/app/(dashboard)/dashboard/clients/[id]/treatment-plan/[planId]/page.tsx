"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import PlanEditor from "@/components/treatment-plan/PlanEditor";
interface SubGoal {
  id: string;
  title: string;
  status: "not_started" | "in_progress" | "completed";
}

interface Goal {
  id: string;
  title: string;
  modality?: string;
  status: "not_started" | "in_progress" | "completed";
  sub_goals?: SubGoal[];
}
import { ArrowLeft, ClipboardList } from "lucide-react";

export default function EditTreatmentPlanPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>;
}) {
  const { id, planId } = use(params);
  const plan = useQuery({
    queryKey: ["treatment-plans", planId],
    queryFn: () => api.treatmentPlan.getById(planId),
    enabled: !!planId,
  });

  if (plan.isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-6 w-24 bg-border rounded-lg animate-pulse" />
        <div className="bg-surface rounded-card border border-border shadow-sm p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-border rounded-small animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (plan.error || !plan.data) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/dashboard/clients/${id}`} className="inline-flex items-center gap-1 text-sm text-sage hover:text-sage-600 transition-colors">
          <ArrowLeft size={14} /> Back to client
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-small p-6 text-center">
          <p className="text-red-700 text-sm">Treatment plan not found</p>
        </div>
      </div>
    );
  }

  const p = plan.data as any;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/dashboard/clients/${id}`} className="inline-flex items-center gap-1 text-sm text-sage hover:text-sage-600 transition-colors">
        <ArrowLeft size={14} /> Back to client
      </Link>

      <div className="flex items-center gap-2">
        <ClipboardList size={22} className="text-sage" />
        <h1 className="text-2xl font-sans font-bold text-ink">Edit Treatment Plan</h1>
      </div>

      <div className="bg-surface rounded-card border border-border shadow-sm p-6">
        <PlanEditor
          clientId={id}
          existingPlan={{
            id: p.id,
            title: p.title,
            modality: p.modality,
            modality_other: p.modality_other,
            presenting_concerns: p.presenting_concerns,
            diagnosis: p.diagnosis,
            goals: (p.goals as Goal[]) ?? [],
            status: p.status,
            start_date: p.start_date,
            target_end_date: p.target_end_date,
            notes: p.notes,
          }}
        />
      </div>
    </div>
  );
}
