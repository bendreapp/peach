"use client";

import { useTherapistMe } from "@/lib/api-hooks";
import { THERAPY_MODALITIES, COMMON_TECHNIQUES, RISK_FLAGS } from "@bendre/shared";
import type { CustomTags } from "@bendre/shared";

export interface ModalityTag {
  key: string;
  name: string;
  fullName: string;
}

export const DEFAULT_MODALITIES: ModalityTag[] = Object.entries(THERAPY_MODALITIES).map(
  ([key, val]) => ({ key, name: (val as any).name, fullName: (val as any).fullName })
);

export const DEFAULT_TECHNIQUES: string[] = [...COMMON_TECHNIQUES];

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

export const DEFAULT_RISK_FLAGS: string[] = [...RISK_FLAGS];

export function useCustomTags() {
  const { data } = useTherapistMe();
  const ct = data?.custom_tags as CustomTags | undefined;

  return {
    modalities: ct?.modalities ?? DEFAULT_MODALITIES,
    techniques: ct?.techniques ?? DEFAULT_TECHNIQUES,
    categories: ct?.categories ?? DEFAULT_CATEGORIES,
    riskFlags: ct?.risk_flags ?? DEFAULT_RISK_FLAGS,
  };
}
