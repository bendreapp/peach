"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Select } from "@/components/ui/Select";
import {
  useIntakeFormQuestions,
  useCreateIntakeQuestion,
  useUpdateIntakeQuestion,
  useDeleteIntakeQuestion,
  useReorderIntakeQuestions,
} from "@/lib/api-hooks";

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldType =
  | "short_text"
  | "long_text"
  | "radio"
  | "checkbox"
  | "dropdown"
  | "date"
  | "yes_no";

interface IntakeQuestion {
  id: string;
  therapist_id: string;
  question_text: string;
  field_type: FieldType;
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FIELD_TYPE_OPTIONS = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "radio", label: "Multiple choice" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "dropdown", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "yes_no", label: "Yes / No" },
];

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  radio: "Multiple choice",
  checkbox: "Checkboxes",
  dropdown: "Dropdown",
  date: "Date",
  yes_no: "Yes / No",
};

const NEEDS_OPTIONS: FieldType[] = ["radio", "checkbox", "dropdown"];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function IntakeFormEditor() {
  const { data, isLoading } = useIntakeFormQuestions();
  const createQuestion = useCreateIntakeQuestion();
  const updateQuestion = useUpdateIntakeQuestion();
  const deleteQuestion = useDeleteIntakeQuestion();
  const reorderQuestions = useReorderIntakeQuestions();

  const questions: IntakeQuestion[] = Array.isArray(data) ? data : [];

  function handleAddQuestion() {
    createQuestion.mutate(
      {
        question_text: "New question",
        field_type: "short_text",
        is_required: false,
      },
      {
        onSuccess: () => toast.success("Question added"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleMoveUp(idx: number) {
    if (idx === 0) return;
    const ids = questions.map((q) => q.id);
    [ids[idx - 1], ids[idx]] = [ids[idx]!, ids[idx - 1]!];
    reorderQuestions.mutate(ids, {
      onError: (err) => toast.error(err.message),
    });
  }

  function handleMoveDown(idx: number) {
    if (idx === questions.length - 1) return;
    const ids = questions.map((q) => q.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1]!, ids[idx]!];
    reorderQuestions.mutate(ids, {
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <section
      className="bg-white rounded-[12px] border border-[#E5E0D8] p-6 space-y-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={18} className="text-[#5C7A6B]" />
            <h2 className="text-lg font-semibold text-[#1C1C1E]" style={{ fontFamily: "Satoshi" }}>
              Intake Form
            </h2>
          </div>
          <p className="text-sm text-[#8A8480]" style={{ fontFamily: "Satoshi" }}>
            Build the questions your clients fill out before their first session.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddQuestion}
          disabled={createQuestion.isPending}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[8px] text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "#5C7A6B", fontFamily: "Satoshi", boxShadow: "0 1px 3px rgba(92,122,107,0.3)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#496158"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#5C7A6B"; }}
        >
          <Plus size={14} />
          Add Question
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#F4F1EC] rounded-[8px] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && questions.length === 0 && (
        <div className="text-center py-10">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: "#E5E0D8" }}
          >
            <ClipboardList size={20} className="text-[#8A8480]" />
          </div>
          <p className="text-sm text-[#8A8480]" style={{ fontFamily: "Satoshi" }}>
            No questions yet
          </p>
          <p className="text-xs text-[#8A8480]/70 mt-1" style={{ fontFamily: "Satoshi" }}>
            Click "Add Question" to start building your intake form.
          </p>
        </div>
      )}

      {/* Questions list */}
      {!isLoading && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((question, idx) => (
            <QuestionCard
              key={question.id}
              question={question}
              idx={idx}
              total={questions.length}
              onMoveUp={() => handleMoveUp(idx)}
              onMoveDown={() => handleMoveDown(idx)}
              onUpdate={(data) =>
                updateQuestion.mutate(
                  { id: question.id, ...data },
                  {
                    onSuccess: () => toast.success("Saved"),
                    onError: (err) => toast.error(err.message),
                  }
                )
              }
              onDelete={() =>
                deleteQuestion.mutate(question.id, {
                  onSuccess: () => toast.success("Question deleted"),
                  onError: (err) => toast.error(err.message),
                })
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  idx,
  total,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onDelete,
}: {
  question: IntakeQuestion;
  idx: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [questionText, setQuestionText] = useState(question.question_text);
  const [fieldType, setFieldType] = useState<FieldType>(question.field_type as FieldType);
  const [options, setOptions] = useState<string[]>(
    Array.isArray(question.options) ? question.options : []
  );
  const [isRequired, setIsRequired] = useState(question.is_required);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function saveText(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate({ question_text: value });
    }, 600);
  }

  function handleTypeChange(newType: string) {
    const t = newType as FieldType;
    setFieldType(t);
    const newOptions = NEEDS_OPTIONS.includes(t) && options.length === 0
      ? ["Option 1", "Option 2"]
      : NEEDS_OPTIONS.includes(t) ? options : [];
    setOptions(newOptions);
    onUpdate({
      field_type: t,
      options: NEEDS_OPTIONS.includes(t) ? newOptions : null,
    });
  }

  function handleRequiredToggle() {
    const next = !isRequired;
    setIsRequired(next);
    onUpdate({ is_required: next });
  }

  function handleOptionChange(optIdx: number, value: string) {
    const next = [...options];
    next[optIdx] = value;
    setOptions(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate({ options: next });
    }, 600);
  }

  function handleAddOption() {
    const next = [...options, ""];
    setOptions(next);
    onUpdate({ options: next });
  }

  function handleRemoveOption(optIdx: number) {
    const next = options.filter((_, i) => i !== optIdx);
    setOptions(next);
    onUpdate({ options: next });
  }

  function handleTextBlur() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onUpdate({ question_text: questionText });
  }

  const showOptions = NEEDS_OPTIONS.includes(fieldType);

  return (
    <div
      className="flex gap-3 p-4 rounded-[8px]"
      style={{ background: "#F4F1EC", border: "1px solid #E5E0D8" }}
    >
      {/* Reorder controls */}
      <div className="flex flex-col items-center gap-0.5 pt-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={idx === 0}
          className="p-0.5 rounded transition-colors disabled:opacity-30"
          style={{ color: "#8A8480" }}
          title="Move up"
        >
          <ChevronUp size={14} />
        </button>
        <GripVertical size={12} style={{ color: "#C5C0B8" }} />
        <button
          type="button"
          onClick={onMoveDown}
          disabled={idx === total - 1}
          className="p-0.5 rounded transition-colors disabled:opacity-30"
          style={{ color: "#8A8480" }}
          title="Move down"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Card body */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Question number + type row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-[999px]"
            style={{ background: "#E5E0D8", color: "#5C5856", fontFamily: "Satoshi" }}
          >
            Q{idx + 1}
          </span>
          <div className="w-40">
            <Select
              value={fieldType}
              onChange={handleTypeChange}
              options={FIELD_TYPE_OPTIONS}
              ariaLabel="Question type"
            />
          </div>
          <span
            className="text-[10px] font-medium ml-auto text-[#8A8480]"
            style={{ fontFamily: "Satoshi" }}
          >
            {FIELD_TYPE_LABELS[fieldType]}
          </span>
        </div>

        {/* Question text */}
        <input
          type="text"
          value={questionText}
          onChange={(e) => {
            setQuestionText(e.target.value);
            saveText(e.target.value);
          }}
          onBlur={handleTextBlur}
          placeholder="Question text..."
          className="w-full px-3 py-2 rounded-[8px] text-sm transition-all focus:outline-none"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            color: "#1C1C1E",
            fontFamily: "Satoshi",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#8FAF8A"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(143,175,138,0.15)"; }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = "#E5E0D8"; e.currentTarget.style.boxShadow = "none"; }}
        />

        {/* Options (for radio/checkbox/dropdown) */}
        {showOptions && (
          <div className="space-y-1.5 pl-1">
            {options.map((opt, optIdx) => (
              <div key={optIdx} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ border: "1.5px solid #8A8480" }}
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                  placeholder={`Option ${optIdx + 1}`}
                  className="flex-1 px-2.5 py-1.5 rounded-[6px] text-xs transition-all focus:outline-none"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E0D8",
                    color: "#1C1C1E",
                    fontFamily: "Satoshi",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#8FAF8A"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E0D8"; }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(optIdx)}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: "#8A8480" }}
                  title="Remove option"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddOption}
              className="text-xs font-medium transition-colors"
              style={{ color: "#5C7A6B", fontFamily: "Satoshi" }}
            >
              + Add option
            </button>
          </div>
        )}
      </div>

      {/* Right-side controls */}
      <div className="flex flex-col items-end justify-between gap-3 flex-shrink-0">
        {/* Required toggle */}
        <button
          type="button"
          onClick={handleRequiredToggle}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: isRequired ? "#5C7A6B" : "#8A8480", fontFamily: "Satoshi" }}
          title={isRequired ? "Required (click to make optional)" : "Optional (click to make required)"}
        >
          {isRequired ? (
            <ToggleRight size={18} style={{ color: "#5C7A6B" }} />
          ) : (
            <ToggleLeft size={18} style={{ color: "#C5C0B8" }} />
          )}
          <span className="font-medium">{isRequired ? "Required" : "Optional"}</span>
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete this question?")) onDelete();
          }}
          className="transition-colors"
          style={{ color: "#C5C0B8" }}
          title="Delete question"
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#C0705A"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#C5C0B8"; }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
