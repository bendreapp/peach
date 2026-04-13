"use client";

import { useTherapistMe } from "@/lib/api-hooks";

// Default techniques list (inline — no @bendre/shared dependency)
export const DEFAULT_TECHNIQUES: string[] = [
  "CBT",
  "DBT",
  "ACT",
  "EMDR",
  "Mindfulness",
  "Exposure therapy",
  "Motivational interviewing",
  "Psychoeducation",
  "Somatic techniques",
  "Narrative therapy",
  "Solution-focused therapy",
  "Thought records",
  "Behavioral activation",
  "Relaxation training",
  "Cognitive restructuring",
];

// Default risk flags list (inline — no @bendre/shared dependency)
export const DEFAULT_RISK_FLAGS: string[] = [
  "Suicidal ideation",
  "Self-harm",
  "Homicidal ideation",
  "Substance abuse",
  "Child safety concern",
  "Domestic violence",
  "Psychosis",
  "Eating disorder",
  "Non-compliance",
  "Crisis episode",
];

export const DEFAULT_CATEGORIES = [
  "Homework",
  "Psychoeducation",
  "Self-assessment",
  "Coping skills",
  "Journaling",
  "Relaxation",
  "Thought records",
  "Behavioral activation",
  "Mindfulness",
];

export function useCustomTags() {
  const { data } = useTherapistMe();
  const ct = (data as any)?.custom_tags;

  return {
    techniques: (ct?.techniques as string[]) ?? DEFAULT_TECHNIQUES,
    categories: (ct?.categories as string[]) ?? DEFAULT_CATEGORIES,
    riskFlags: (ct?.risk_flags as string[]) ?? DEFAULT_RISK_FLAGS,
  };
}
