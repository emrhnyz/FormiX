"use client";

import { useState } from "react";
import {
  createEmptyQuestion,
  QUESTION_TYPE_LABELS,
  type FormKind,
  type FormSchema,
  type Question,
  type QuestionType,
} from "@/lib/schema";

type FormBuilderProps = {
  value: FormSchema;
  onChange: (schema: FormSchema) => void;
};

export function FormBuilder({ value, onChange }: FormBuilderProps) {
  const update = (patch: Partial<FormSchema>) => onChange({ ...value, ...patch });

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    onChange({
      ...value,
      questions: value.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    });
  };

  const addQuestion = (type: QuestionType) => {
    onChange({ ...value, questions: [...value.questions, createEmptyQuestion(type)] });
  };

  const removeQuestion = (id: string) => {
    onChange({ ...value, questions: value.questions.filter((q) => q.id !== id) });
  };

  const moveQuestion = (index: number, dir: -1 | 1) => {
    const next = [...value.questions];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...value, questions: next });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="font-display text-lg font-semibold text-white">General</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Title" value={value.title} onChange={(v) => update({ title: v })} />
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Type</label>
            <select
              value={value.kind}
              onChange={(e) => update({ kind: e.target.value as FormKind })}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              <option value="form">Form (questions + polls)</option>
              <option value="poll">Poll / vote</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Field
            label="Description"
            value={value.description}
            onChange={(v) => update({ description: v })}
            multiline
          />
        </div>
        {value.kind === "poll" && (
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3">
            <input
              type="checkbox"
              checked={value.showLiveResults}
              onChange={(e) => update({ showLiveResults: e.target.checked })}
              className="h-4 w-4 accent-violet-500"
            />
            <span className="text-sm text-slate-300">
              Show live result percentages to voters
            </span>
          </label>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Rewards (Fill-to-Earn)</h2>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={value.reward.enabled}
              onChange={(e) =>
                update({ reward: { ...value.reward, enabled: e.target.checked } })
              }
              className="accent-fuchsia-500"
            />
            Enable rewards
          </label>
        </div>
        {value.reward.enabled && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field
              label="Reward per response (ETH)"
              value={value.reward.amountEth}
              onChange={(v) => update({ reward: { ...value.reward, amountEth: v } })}
            />
            <Field
              label="Max recipients"
              value={String(value.reward.maxRecipients)}
              onChange={(v) =>
                update({ reward: { ...value.reward, maxRecipients: Number(v) || 0 } })
              }
            />
            <Field
              label="Initial bounty (ETH)"
              value={value.reward.initialBountyEth}
              onChange={(v) => update({ reward: { ...value.reward, initialBountyEth: v } })}
            />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-white">Questions</h2>
          <QuestionTypePicker onAdd={addQuestion} />
        </div>
        {value.questions.map((q, index) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={index}
            total={value.questions.length}
            onChange={(patch) => updateQuestion(q.id, patch)}
            onRemove={() => removeQuestion(q.id)}
            onMove={(dir) => moveQuestion(index, dir)}
          />
        ))}
        {value.questions.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-500">
            No questions yet. Add a question type above.
          </p>
        )}
      </section>
    </div>
  );
}

function QuestionTypePicker({ onAdd }: { onAdd: (t: QuestionType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
      >
        + Add question
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 py-2 shadow-xl">
          {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => (
            <button
              key={type}
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              onClick={() => {
                onAdd(type);
                setOpen(false);
              }}
            >
              {QUESTION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  question: Question;
  index: number;
  total: number;
  onChange: (p: Partial<Question>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const needsOptions = question.type === "poll" || question.type === "singleChoice" || question.type === "multipleChoice";
  const isFhe = question.type === "poll" || question.type === "singleChoice";

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-300">
            {index + 1}
          </span>
          <span className="text-xs text-slate-400">{QUESTION_TYPE_LABELS[question.type]}</span>
          {isFhe && (
            <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs text-fuchsia-300">
              FHE
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <IconBtn label="Up" onClick={() => onMove(-1)} disabled={index === 0} />
          <IconBtn label="Down" onClick={() => onMove(1)} disabled={index === total - 1} />
          <IconBtn label="Delete" onClick={onRemove} danger />
        </div>
      </div>
      <div className="grid gap-3">
        <Field label="Question" value={question.title} onChange={(v) => onChange({ title: v })} />
        <Field
          label="Description (optional)"
          value={question.description ?? ""}
          onChange={(v) => onChange({ description: v })}
          multiline
        />
        {(question.type === "shortText" || question.type === "longText") && (
          <Field
            label="Placeholder"
            value={question.placeholder ?? ""}
            onChange={(v) => onChange({ placeholder: v })}
          />
        )}
        {needsOptions && (
          <OptionsEditor
            options={question.options ?? []}
            maxOptions={question.type === "multipleChoice" ? 8 : 4}
            hint={
              question.type === "multipleChoice"
                ? undefined
                : "FHE: short text ~16 chars, long text ~32 chars (4–8 chunks)."
            }
            onChange={(options) => onChange({ options })}
          />
        )}
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) => onChange({ required: e.target.checked })}
            className="accent-violet-500"
          />
          Required
        </label>
      </div>
    </article>
  );
}

function OptionsEditor({
  options,
  maxOptions = 8,
  hint,
  onChange,
}: {
  options: string[];
  maxOptions?: number;
  hint?: string;
  onChange: (o: string[]) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Options</p>
      {hint && <p className="mt-1 text-xs text-amber-400/90">{hint}</p>}
      <div className="mt-2 space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={opt}
              onChange={(e) => {
                const next = [...options];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => onChange(options.filter((_, j) => j !== i))}
              className="text-xs text-rose-400"
            >
              Remove
            </button>
          </div>
        ))}
        {options.length < maxOptions && (
          <button
            type="button"
            onClick={() => onChange([...options, `Option ${options.length + 1}`])}
            className="text-xs text-violet-400"
          >
            + Option
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
        />
      )}
    </label>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-2 py-1 text-xs ${danger ? "text-rose-400" : "text-slate-400"} disabled:opacity-30`}
    >
      {label}
    </button>
  );
}
