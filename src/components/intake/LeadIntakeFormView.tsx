"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, AlertCircle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface IntakeQuestion {
  id: string;
  therapist_id: string;
  question_text: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
}

interface PublicFormData {
  therapist_id: string;
  therapist_display_name: string;
  questions: IntakeQuestion[];
  already_submitted: boolean;
}

type FieldValue = string | string[] | null;

// ── Field Renderer ──────────────────────────────────────────────────────────

function FieldRenderer({
  question,
  value,
  onChange,
  error,
}: {
  question: IntakeQuestion;
  value: FieldValue;
  onChange: (val: FieldValue) => void;
  error?: string;
}) {
  const inputCls = [
    "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all",
    error
      ? "border-[1.5px] border-red-300"
      : "border-[1.5px] border-[#E5E0D8]",
    "bg-white focus:border-[#5C7A6B]",
  ].join(" ");

  switch (question.field_type) {
    case "short_text":
      return (
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#1C1C1E" }}>
            {question.question_text}
            {question.is_required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
            style={{ color: "#1C1C1E" }}
          />
          {error && <p className="text-xs mt-1" style={{ color: "#C0705A" }}>{error}</p>}
        </div>
      );

    case "long_text":
      return (
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#1C1C1E" }}>
            {question.question_text}
            {question.is_required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className={`${inputCls} resize-none`}
            style={{ color: "#1C1C1E" }}
          />
          {error && <p className="text-xs mt-1" style={{ color: "#C0705A" }}>{error}</p>}
        </div>
      );

    case "radio": {
      const opts = question.options ?? [];
      return (
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: "#1C1C1E" }}>
            {question.question_text}
            {question.is_required && <span className="text-red-400 ml-0.5">*</span>}
          </p>
          <div className="space-y-2">
            {opts.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2.5 cursor-pointer text-sm"
                style={{ color: "#5C5856" }}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="text-[#5C7A6B] focus:ring-[#5C7A6B]"
                />
                {opt}
              </label>
            ))}
          </div>
          {error && <p className="text-xs mt-1" style={{ color: "#C0705A" }}>{error}</p>}
        </div>
      );
    }

    case "checkbox": {
      const opts = question.options ?? [];
      const selected = Array.isArray(value) ? value : [];
      return (
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: "#1C1C1E" }}>
            {question.question_text}
            {question.is_required && <span className="text-red-400 ml-0.5">*</span>}
          </p>
          <div className="space-y-2">
            {opts.map((opt) => {
              const isChecked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2.5 cursor-pointer text-sm"
                  style={{ color: "#5C5856" }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const next = isChecked
                        ? selected.filter((v) => v !== opt)
                        : [...selected, opt];
                      onChange(next.length > 0 ? next : null);
                    }}
                    className="rounded text-[#5C7A6B] focus:ring-[#5C7A6B]"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
          {error && <p className="text-xs mt-1" style={{ color: "#C0705A" }}>{error}</p>}
        </div>
      );
    }

    case "dropdown": {
      const opts = question.options ?? [];
      return (
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#1C1C1E" }}>
            {question.question_text}
            {question.is_required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
            style={{ color: "#1C1C1E" }}
          >
            <option value="">Select an option…</option>
            {opts.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {error && <p className="text-xs mt-1" style={{ color: "#C0705A" }}>{error}</p>}
        </div>
      );
    }

    case "date":
      return (
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#1C1C1E" }}>
            {question.question_text}
            {question.is_required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
            style={{ color: "#1C1C1E" }}
          />
          {error && <p className="text-xs mt-1" style={{ color: "#C0705A" }}>{error}</p>}
        </div>
      );

    case "yes_no":
      return (
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: "#1C1C1E" }}>
            {question.question_text}
            {question.is_required && <span className="text-red-400 ml-0.5">*</span>}
          </p>
          <div className="flex gap-2">
            {["Yes", "No"].map((opt) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(opt)}
                  className="px-6 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isSelected ? "#5C7A6B" : "#F4F1EC",
                    color: isSelected ? "#FFFFFF" : "#5C5856",
                    border: `1.5px solid ${isSelected ? "#5C7A6B" : "#E5E0D8"}`,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {error && <p className="text-xs mt-1" style={{ color: "#C0705A" }}>{error}</p>}
        </div>
      );

    default:
      return null;
  }
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function LeadIntakeFormView({ token }: { token: string }) {
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const formQuery = useQuery<PublicFormData>({
    queryKey: ["lead-intake-public", token],
    queryFn: () => api.leadIntake.getPublicForm(token),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (responses: unknown) =>
      api.leadIntake.submitPublicForm(token, responses),
    onSuccess: () => setSubmitted(true),
  });

  function setValue(questionId: string, val: FieldValue) {
    setValues((prev) => ({ ...prev, [questionId]: val }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const questions = formQuery.data?.questions ?? [];
    const errors: Record<string, string> = {};

    for (const q of questions) {
      if (!q.is_required) continue;
      const val = values[q.id];
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0)
      ) {
        errors[q.id] = `"${q.question_text}" is required`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Build responses array
    const responses = questions.map((q) => ({
      question_id: q.id,
      question_text: q.question_text,
      field_type: q.field_type,
      answer: values[q.id] ?? null,
    }));

    submitMutation.mutate(responses);
  }

  // Loading state
  if (formQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 rounded-lg animate-pulse" style={{ background: "#E5E0D8" }} />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "#E5E0D8" }} />
          ))}
        </div>
      </div>
    );
  }

  // Already submitted (backend returned 410 or data says so)
  const alreadySubmitted =
    (formQuery.data as PublicFormData & { already_submitted?: boolean })?.already_submitted === true ||
    formQuery.error?.message?.includes("already been submitted") ||
    (formQuery.error as { status?: number } | null)?.status === 409;

  if (alreadySubmitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: "#EAF4F1" }}
        >
          <CheckCircle2 size={28} style={{ color: "#5C7A6B" }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "#1C1C1E" }}>
          Already Submitted
        </h2>
        <p className="text-sm" style={{ color: "#8A8480" }}>
          This form has already been submitted. Thank you!
        </p>
      </div>
    );
  }

  // Error / not found
  if (formQuery.error || !formQuery.data) {
    return (
      <div className="text-center py-12 space-y-4">
        <div
          className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
          style={{ background: "#F4F1EC" }}
        >
          <ClipboardList size={24} style={{ color: "#8A8480" }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: "#1C1C1E" }}>
          Form Not Found
        </h2>
        <p className="text-sm" style={{ color: "#8A8480" }}>
          This intake form link is invalid or has expired.
        </p>
      </div>
    );
  }

  // Just submitted
  if (submitted) {
    const therapistName = formQuery.data.therapist_display_name;
    return (
      <div className="text-center py-12 space-y-4">
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: "#EAF4F1" }}
        >
          <CheckCircle2 size={28} style={{ color: "#5C7A6B" }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: "#1C1C1E" }}>
          Thank you!
        </h2>
        <p className="text-sm" style={{ color: "#5C5856" }}>
          {therapistName && therapistName !== "Your therapist"
            ? `${therapistName} will review your responses shortly.`
            : "Your therapist will review your responses shortly."}
        </p>
      </div>
    );
  }

  const { questions } = formQuery.data;
  const sortedQuestions = [...questions].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#1C1C1E" }}>
          Intake Form
        </h2>
        <p className="text-sm mt-1" style={{ color: "#8A8480" }}>
          Please fill out this form before your first session.
        </p>
      </div>

      {/* Questions */}
      {sortedQuestions.map((q) => (
        <FieldRenderer
          key={q.id}
          question={q}
          value={values[q.id] ?? null}
          onChange={(val) => setValue(q.id, val)}
          error={validationErrors[q.id]}
        />
      ))}

      {/* Submit error */}
      {submitMutation.error && (
        <div
          className="flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm"
          style={{ background: "#F9EDED", color: "#C0705A" }}
        >
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span>{submitMutation.error.message || "Something went wrong. Please try again."}</span>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={submitMutation.isPending}
        className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "#5C7A6B" }}
        onMouseEnter={(e) => {
          if (!submitMutation.isPending)
            (e.currentTarget as HTMLButtonElement).style.background = "#496158";
        }}
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "#5C7A6B")
        }
      >
        {submitMutation.isPending ? "Submitting…" : "Submit Intake Form"}
      </button>
    </form>
  );
}
