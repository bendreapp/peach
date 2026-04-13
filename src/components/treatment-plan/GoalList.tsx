"use client";

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
import { Plus, X, ChevronDown, ChevronRight, Check } from "lucide-react";

interface GoalListProps {
  goals: Goal[];
  onChange: (goals: Goal[]) => void;
}

export default function GoalList({ goals, onChange }: GoalListProps) {
  function addGoal() {
    onChange([
      ...goals,
      { id: crypto.randomUUID(), title: "", sub_goals: [], completed: false },
    ]);
  }

  function updateGoal(id: string, updates: Partial<Goal>) {
    onChange(goals.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }

  function removeGoal(id: string) {
    onChange(goals.filter((g) => g.id !== id));
  }

  function addSubGoal(goalId: string) {
    onChange(
      goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              sub_goals: [
                ...g.sub_goals,
                { id: crypto.randomUUID(), title: "", completed: false },
              ],
            }
          : g
      )
    );
  }

  function updateSubGoal(goalId: string, subId: string, updates: Partial<SubGoal>) {
    onChange(
      goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              sub_goals: g.sub_goals.map((s: any) =>
                s.id === subId ? { ...s, ...updates } : s
              ),
            }
          : g
      )
    );
  }

  function removeSubGoal(goalId: string, subId: string) {
    onChange(
      goals.map((g) =>
        g.id === goalId
          ? { ...g, sub_goals: g.sub_goals.filter((s: any) => s.id !== subId) }
          : g
      )
    );
  }

  return (
    <div className="space-y-3">
      {goals.map((goal, idx) => (
        <div key={goal.id} className="border border-border rounded-small p-4 space-y-3">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => updateGoal(goal.id, { completed: !goal.completed })}
              className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                goal.completed
                  ? "bg-sage border-sage text-white"
                  : "border-border hover:border-sage"
              }`}
            >
              {goal.completed && <Check size={12} />}
            </button>
            <input
              type="text"
              value={goal.title}
              onChange={(e) => updateGoal(goal.id, { title: e.target.value })}
              placeholder={`Goal ${idx + 1}`}
              className={`flex-1 px-3 py-1.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-sm transition-shadow ${
                goal.completed ? "line-through text-ink-tertiary" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => removeGoal(goal.id)}
              className="p-1 text-ink-tertiary hover:text-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Sub-goals */}
          {goal.sub_goals.length > 0 && (
            <div className="ml-7 space-y-2">
              {goal.sub_goals.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateSubGoal(goal.id, sub.id, { completed: !sub.completed })}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      sub.completed
                        ? "bg-sage border-sage text-white"
                        : "border-border hover:border-sage"
                    }`}
                  >
                    {sub.completed && <Check size={10} />}
                  </button>
                  <input
                    type="text"
                    value={sub.title}
                    onChange={(e) => updateSubGoal(goal.id, sub.id, { title: e.target.value })}
                    placeholder="Sub-goal"
                    className={`flex-1 px-2.5 py-1 rounded-lg border border-border/50 bg-bg focus:outline-none focus:ring-[3px] focus:ring-sage/10 focus:border-sage text-xs transition-shadow ${
                      sub.completed ? "line-through text-ink-tertiary" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSubGoal(goal.id, sub.id)}
                    className="p-0.5 text-ink-tertiary hover:text-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => addSubGoal(goal.id)}
            className="ml-7 text-[11px] text-sage hover:text-sage-600 font-medium flex items-center gap-1 transition-colors"
          >
            <Plus size={11} />
            Add sub-goal
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addGoal}
        className="w-full py-2.5 border-2 border-dashed border-border rounded-small text-sm text-ink-tertiary hover:text-sage hover:border-sage transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus size={14} />
        Add goal
      </button>
    </div>
  );
}
