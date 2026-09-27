"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { removeOption, removeQuestion, saveOption, saveQuestion } from "@/app/actions/studio";
import { CHART_PALETTE, cn, optionColor, QUESTION_TYPE_LABEL } from "@/lib/utils";
import type { PollQuestion, QuestionType } from "@/lib/types";

type Props = {
  pollId: string;
  questions: PollQuestion[];
};

type OptionDraft = { id: string | null; label: string; color: string | null };

type QuestionDraft = {
  questionId: string | null;
  prompt: string;
  helpText: string;
  questionType: QuestionType;
  isRequired: boolean;
  minSelections: number | null;
  maxSelections: number | null;
  scaleMin: number;
  scaleMax: number;
  scaleMinLabel: string;
  scaleMaxLabel: string;
  options: OptionDraft[];
};

function blankQuestion(): QuestionDraft {
  return {
    questionId: null,
    prompt: "",
    helpText: "",
    questionType: "single_choice",
    isRequired: true,
    minSelections: 1,
    maxSelections: 3,
    scaleMin: 0,
    scaleMax: 10,
    scaleMinLabel: "",
    scaleMaxLabel: "",
    options: [
      { id: null, label: "", color: CHART_PALETTE[0] },
      { id: null, label: "", color: CHART_PALETTE[1] },
    ],
  };
}

function toDraft(question: PollQuestion): QuestionDraft {
  return {
    questionId: question.id,
    prompt: question.prompt,
    helpText: question.help_text ?? "",
    questionType: question.question_type,
    isRequired: question.is_required,
    minSelections: question.min_selections,
    maxSelections: question.max_selections,
    scaleMin: question.scale_min ?? 0,
    scaleMax: question.scale_max ?? 10,
    scaleMinLabel: question.scale_min_label ?? "",
    scaleMaxLabel: question.scale_max_label ?? "",
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      color: option.color,
    })),
  };
}

const TYPES: QuestionType[] = [
  "single_choice",
  "multiple_choice",
  "scale",
  "text",
];

export function QuestionEditor({ pollId, questions }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<QuestionDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isChoice =
    draft?.questionType === "single_choice" || draft?.questionType === "multiple_choice";

  const patch = (next: Partial<QuestionDraft>) =>
    setDraft((prev) => (prev ? { ...prev, ...next } : prev));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const outcome = await saveQuestion({
        pollId,
        questionId: draft.questionId,
        prompt: draft.prompt,
        questionType: draft.questionType,
        helpText: draft.helpText,
        isRequired: draft.isRequired,
        minSelections:
          draft.questionType === "multiple_choice" ? draft.minSelections : null,
        maxSelections:
          draft.questionType === "multiple_choice" ? draft.maxSelections : null,
        scaleMin: draft.questionType === "scale" ? draft.scaleMin : null,
        scaleMax: draft.questionType === "scale" ? draft.scaleMax : null,
        scaleMinLabel: draft.questionType === "scale" ? draft.scaleMinLabel : "",
        scaleMaxLabel: draft.questionType === "scale" ? draft.scaleMaxLabel : "",
        options: draft.options.map((option) => ({
          label: option.label,
          color: option.color,
        })),
      });
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setDraft(null);
      router.refresh();
    });
  };

  const saveExistingOption = (option: OptionDraft) => {
    if (!option.id || !option.label.trim()) return;
    startTransition(async () => {
      await saveOption({
        questionId: draft?.questionId ?? "",
        optionId: option.id,
        label: option.label.trim(),
        color: option.color,
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <article key={question.id} className="card card-pad">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-500">
                Q{question.position} · {QUESTION_TYPE_LABEL[question.question_type]}
                {question.is_required ? " · Required" : " · Optional"}
                {question.question_type === "multiple_choice" && question.max_selections
                  ? ` · max ${question.max_selections}`
                  : ""}
              </p>
              <h3 className="mt-1.5 font-display text-base font-semibold text-ink-900">
                {question.prompt}
              </h3>
              {question.help_text ? (
                <p className="mt-1 text-sm text-ink-500">{question.help_text}</p>
              ) : null}
              {question.question_type === "scale" ? (
                <p className="mt-1.5 text-xs text-ink-500">
                  Scale {question.scale_min}–{question.scale_max}
                  {question.scale_min_label ? ` (${question.scale_min_label})` : ""}
                  {question.scale_max_label ? ` to ${question.scale_max_label}` : ""}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setDraft(toDraft(question));
                }}
                className="btn btn-ghost btn-sm"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Delete this question and its answers?")) return;
                  startTransition(async () => {
                    await removeQuestion(question.id);
                    router.refresh();
                  });
                }}
                className="btn btn-ghost btn-sm text-brand-700"
              >
                Delete
              </button>
            </div>
          </div>

          {question.options.length ? (
            <ul className="mt-4 space-y-1.5">
              {question.options.map((option, optionIndex) => (
                <li key={option.id} className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: optionColor(option, optionIndex) }}
                    aria-hidden
                  />
                  <input
                    defaultValue={option.label}
                    aria-label={`Option ${optionIndex + 1}`}
                    onBlur={(event) => {
                      const next = event.target.value.trim();
                      if (!next || next === option.label) return;
                      void saveExistingOption({
                        id: option.id,
                        label: next,
                        color: option.color,
                      });
                    }}
                    className="field flex-1 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm("Delete this option?")) return;
                      startTransition(async () => {
                        await removeOption(option.id);
                        router.refresh();
                      });
                    }}
                    className="btn btn-ghost btn-sm shrink-0"
                    aria-label={`Delete option ${option.label}`}
                  >
                    &times;
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await saveOption({
                        questionId: question.id,
                        label: "New option",
                        color: CHART_PALETTE[question.options.length % CHART_PALETTE.length],
                      });
                      router.refresh();
                    });
                  }}
                  className="btn btn-ghost btn-sm mt-1"
                >
                  + Add option
                </button>
              </li>
            </ul>
          ) : null}
        </article>
      ))}

      {draft ? (
        <form onSubmit={submit} className="card card-pad space-y-4 border-brand-300">
          <h3 className="font-display text-base font-semibold text-ink-900">
            {draft.questionId ? `Edit question ${indexOf(questions, draft.questionId) + 1}` : "New question"}
          </h3>

          <div>
            <label className="label" htmlFor="q-prompt">
              Question
            </label>
            <input
              id="q-prompt"
              value={draft.prompt}
              onChange={(event) => patch({ prompt: event.target.value })}
              className="field"
              placeholder="How worried are you…"
            />
          </div>

          <div>
            <label className="label" htmlFor="q-help">
              Help text
            </label>
            <input
              id="q-help"
              value={draft.helpText}
              onChange={(event) => patch({ helpText: event.target.value })}
              className="field"
              placeholder="Optional context for respondents"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="q-type">
                Type
              </label>
              <select
                id="q-type"
                value={draft.questionType}
                onChange={(event) =>
                  patch({ questionType: event.target.value as QuestionType })
                }
                className="field"
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {QUESTION_TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </div>
            <label className="mt-6 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={draft.isRequired}
                onChange={(event) => patch({ isRequired: event.target.checked })}
                className="size-4 accent-[var(--color-brand-600)]"
              />
              <span className="text-sm font-medium text-ink-800">Required</span>
            </label>
          </div>

          {draft.questionType === "multiple_choice" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="q-min">
                  Minimum selections
                </label>
                <input
                  id="q-min"
                  type="number"
                  min={1}
                  value={draft.minSelections ?? 1}
                  onChange={(event) =>
                    patch({ minSelections: Number(event.target.value) })
                  }
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="q-max">
                  Maximum selections
                </label>
                <input
                  id="q-max"
                  type="number"
                  min={1}
                  value={draft.maxSelections ?? 3}
                  onChange={(event) =>
                    patch({ maxSelections: Number(event.target.value) })
                  }
                  className="field"
                />
              </div>
            </div>
          ) : null}

          {draft.questionType === "scale" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="q-scale-min">
                    Min
                  </label>
                  <input
                    id="q-scale-min"
                    type="number"
                    value={draft.scaleMin}
                    onChange={(event) => patch({ scaleMin: Number(event.target.value) })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="q-scale-max">
                    Max
                  </label>
                  <input
                    id="q-scale-max"
                    type="number"
                    value={draft.scaleMax}
                    onChange={(event) => patch({ scaleMax: Number(event.target.value) })}
                    className="field"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label" htmlFor="q-min-label">
                    Low label
                  </label>
                  <input
                    id="q-min-label"
                    value={draft.scaleMinLabel}
                    onChange={(event) => patch({ scaleMinLabel: event.target.value })}
                    className="field"
                    placeholder="Not at all likely"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="q-max-label">
                    High label
                  </label>
                  <input
                    id="q-max-label"
                    value={draft.scaleMaxLabel}
                    onChange={(event) => patch({ scaleMaxLabel: event.target.value })}
                    className="field"
                    placeholder="Extremely likely"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {isChoice ? (
            <div>
              <p className="label">
                Options{draft.questionId ? " (edit these in the list above)" : ""}
              </p>
              <ul className="space-y-2">
                {draft.options.map((option, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          option.color ?? CHART_PALETTE[index % CHART_PALETTE.length],
                      }}
                      aria-hidden
                    />
                    <input
                      value={option.label}
                      disabled={!!draft.questionId}
                      onChange={(event) => {
                        const label = event.target.value;
                        patch({
                          options: draft.options.map((item, i) =>
                            i === index ? { ...item, label } : item,
                          ),
                        });
                      }}
                      className="field flex-1 py-1.5 text-sm"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          options: draft.options.filter((_, i) => i !== index),
                        })
                      }
                      className="btn btn-ghost btn-sm shrink-0"
                      aria-label={`Remove option ${index + 1}`}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() =>
                  patch({
                    options: [
                      ...draft.options,
                      {
                        id: null,
                        label: "",
                        color: CHART_PALETTE[draft.options.length % CHART_PALETTE.length],
                      },
                    ],
                  })
                }
                className="btn btn-ghost btn-sm mt-2"
              >
                + Add option
              </button>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-brand-700">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-2 border-t border-ink-100 pt-4">
            <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
              {pending ? "Saving…" : "Save question"}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDraft(blankQuestion());
          }}
          className={cn("btn btn-dark w-full")}
        >
          + Add question
        </button>
      )}
    </div>
  );
}

function indexOf(questions: PollQuestion[], id: string) {
  return questions.findIndex((question) => question.id === id);
}
