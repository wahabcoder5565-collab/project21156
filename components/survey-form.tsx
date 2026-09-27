"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";

import { submitResponse } from "@/app/actions/polls";
import { cn, optionColor, QUESTION_TYPE_LABEL } from "@/lib/utils";
import type {
  Poll,
  PollQuestion,
  SubmitResult,
  SurveyAnswer,
} from "@/lib/types";

type Props = {
  poll: Poll;
  questions: PollQuestion[];
  totalResponses: number;
  targetResponses: number | null;
};

type Draft = {
  optionIds: string[];
  numericValue: number | null;
  textValue: string;
};

const emptyDraft: Draft = { optionIds: [], numericValue: null, textValue: "" };

function isExclusive(label: string) {
  return /^(none of|no |neither|none$)/i.test(label.trim());
}

function scaleValues(question: PollQuestion) {
  const min = question.scale_min ?? 0;
  const max = question.scale_max ?? 10;
  const out: number[] = [];
  for (let v = min; v <= max; v += 1) out.push(v);
  return out;
}

export function SurveyForm({
  poll,
  questions,
  totalResponses,
  targetResponses,
}: Props) {
  const [step, setStep] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef<number | null>(null);

  const question = questions[step];
  const draft = question ? (drafts[question.id] ?? emptyDraft) : emptyDraft;
  const isLast = step === questions.length - 1;

  const answered = useCallback((target: PollQuestion, state: Draft) => {
    if (target.question_type === "single_choice" || target.question_type === "multiple_choice") {
      return state.optionIds.length > 0;
    }
    if (target.question_type === "scale") return state.numericValue !== null;
    return state.textValue.trim().length > 0;
  }, []);

  const validate = (target: PollQuestion, state: Draft): string | null => {
    if (target.question_type === "multiple_choice") {
      const count = state.optionIds.length;
      if (target.is_required && count === 0) return "Please choose at least one option.";
      if (target.min_selections && count > 0 && count < target.min_selections) {
        return `Please choose at least ${target.min_selections} option${target.min_selections === 1 ? "" : "s"}.`;
      }
      if (target.max_selections && count > target.max_selections) {
        return `Please choose no more than ${target.max_selections} options.`;
      }
      return null;
    }
    if (target.is_required && !answered(target, state)) {
      return target.question_type === "text"
        ? "Please write an answer."
        : "Please answer this question.";
    }
    return null;
  };

  const update = (id: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? emptyDraft), ...patch } }));
    setError(null);
  };

  const toggleOption = (target: PollQuestion, optionId: string, label: string) => {
    const current = drafts[target.id] ?? emptyDraft;
    if (target.question_type === "single_choice") {
      update(target.id, { optionIds: [optionId] });
      return;
    }
    const selected = current.optionIds.includes(optionId);
    let next: string[];
    if (selected) {
      next = current.optionIds.filter((id) => id !== optionId);
    } else if (isExclusive(label)) {
      next = [optionId];
    } else {
      const withoutExclusive = current.optionIds.filter((id) => {
        const match = target.options.find((option) => option.id === id);
        return match ? !isExclusive(match.label) : true;
      });
      next = [...withoutExclusive, optionId];
    }
    update(target.id, { optionIds: next });
  };

  const goNext = () => {
    if (!question) return;
    const message = validate(question, draft);
    if (message) {
      setError(message);
      return;
    }
    setStep((s) => Math.min(s + 1, questions.length - 1));
    setError(null);
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!question) return;
    const message = validate(question, draft);
    if (message) {
      setError(message);
      return;
    }

    const payload: SurveyAnswer[] = questions.map((item) => {
      const state = drafts[item.id] ?? emptyDraft;
      const base: SurveyAnswer = { questionId: item.id };
      if (item.question_type === "single_choice" || item.question_type === "multiple_choice") {
        if (state.optionIds.length) base.optionIds = state.optionIds;
      } else if (item.question_type === "scale") {
        if (state.numericValue !== null) base.numericValue = state.numericValue;
      } else if (state.textValue.trim()) {
        base.textValue = state.textValue.trim();
      }
      return base;
    });

    const started = startedAt.current ?? Date.now();
    startedAt.current = started;
    const duration = Math.max(1, Math.round((Date.now() - started) / 1000));

    startTransition(async () => {
      const outcome = await submitResponse({
        pollId: poll.id,
        slug: poll.slug,
        answers: payload,
        durationSeconds: duration,
      });
      if (outcome.ok) {
        setResult(outcome.result);
      } else {
        setError(outcome.error);
      }
    });
  };

  const progress = ((step + 1) / questions.length) * 100;
  const completion = useMemo(() => {
    if (!targetResponses) return null;
    return Math.min(100, Math.round((100 * (totalResponses + 1)) / targetResponses));
  }, [targetResponses, totalResponses]);

  if (result) {
    return (
      <div className="card card-pad text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink-900">
          Thanks for taking part
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Your answers to “{poll.title}” have been recorded.
        </p>

        <dl className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3">
          {[
            { label: "Points earned", value: `+${result.points_awarded}` },
            { label: "Total points", value: String(result.total_points) },
            { label: "Day streak", value: String(result.streak) },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-ink-50 px-3 py-3">
              <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-500">
                {item.label}
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums text-ink-900">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          {result.results_visible ? (
            <Link href={`/polls/${poll.slug}/results`} className="btn btn-primary">
              See the results
            </Link>
          ) : null}
          <Link href="/polls" className="btn btn-ghost">
            Find another poll
          </Link>
          <Link href="/profile" className="btn btn-ghost">
            My profile
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <form onSubmit={onSubmit} className="card overflow-hidden">
      <div className="border-b border-ink-100 px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-4 text-xs text-ink-500">
          <span>
            Question {step + 1} of {questions.length}
          </span>
          <span>{poll.incentive_points} points on completion</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-5 py-7 sm:px-7">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-500">
          {QUESTION_TYPE_LABEL[question.question_type]}
          {question.is_required ? " · Required" : " · Optional"}
        </p>
        <h1 className="mt-2 font-display text-xl font-semibold leading-snug text-ink-900 sm:text-2xl">
          {question.prompt}
        </h1>
        {question.help_text ? (
          <p className="mt-2 text-sm text-ink-500">{question.help_text}</p>
        ) : null}

        <div className="mt-6">
          {question.question_type === "single_choice" ? (
            <ul className="space-y-2.5">
              {question.options.map((option, index) => {
                const active = draft.optionIds.includes(option.id);
                return (
                  <li key={option.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition",
                        active
                          ? "border-brand-500 bg-brand-50/70 ring-1 ring-brand-500"
                          : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50",
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        value={option.id}
                        checked={active}
                        onChange={() => toggleOption(question, option.id, option.label)}
                        className="size-4 accent-[var(--color-brand-600)]"
                      />
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: optionColor(option, index) }}
                        aria-hidden
                      />
                      <span className="text-[0.9375rem] font-medium text-ink-800">
                        {option.label}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {question.question_type === "multiple_choice" ? (
            <>
              <p className="hint mb-3">
                Choose
                {question.min_selections
                  ? ` between ${question.min_selections} and ${question.max_selections ?? question.min_selections}`
                  : question.max_selections
                    ? ` up to ${question.max_selections}`
                    : " as many as you like"}
                .
              </p>
              <ul className="space-y-2.5">
                {question.options.map((option, index) => {
                  const active = draft.optionIds.includes(option.id);
                  return (
                    <li key={option.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition",
                          active
                            ? "border-brand-500 bg-brand-50/70 ring-1 ring-brand-500"
                            : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50",
                        )}
                      >
                        <input
                          type="checkbox"
                          value={option.id}
                          checked={active}
                          onChange={() => toggleOption(question, option.id, option.label)}
                          className="size-4 accent-[var(--color-brand-600)]"
                        />
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: optionColor(option, index) }}
                          aria-hidden
                        />
                        <span className="text-[0.9375rem] font-medium text-ink-800">
                          {option.label}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {question.question_type === "scale" ? (
            <div>
              <div className="flex flex-wrap gap-2">
                {scaleValues(question).map((value) => {
                  const active = draft.numericValue === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update(question.id, { numericValue: value })}
                      aria-pressed={active}
                      className={cn(
                        "size-11 rounded-xl border text-sm font-semibold tabular-nums transition",
                        active
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
                <span>{question.scale_min_label ?? question.scale_min}</span>
                <span>{question.scale_max_label ?? question.scale_max}</span>
              </div>
            </div>
          ) : null}

          {question.question_type === "text" ? (
            <div>
              <textarea
                rows={4}
                value={draft.textValue}
                onChange={(event) =>
                  update(question.id, { textValue: event.target.value.slice(0, 1000) })
                }
                placeholder="Type your answer…"
                className="field resize-y"
              />
              <p className="hint mt-1.5">
                {draft.textValue.length}/1000 characters. Shown anonymously with
                your age band and country.
              </p>
            </div>
          ) : null}
        </div>

        <p
          role="alert"
          className={cn("mt-4 text-sm text-brand-700", !error && "sr-only")}
        >
          {error}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-5 py-4 sm:px-7">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0 || pending}
          className="btn btn-ghost btn-sm"
        >
          Back
        </button>
        {isLast ? (
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Submitting…" : "Submit answers"}
          </button>
        ) : (
          <button type="button" onClick={goNext} className="btn btn-primary">
            Next question
          </button>
        )}
      </div>

      {completion !== null ? (
        <p className="border-t border-ink-100 px-5 py-3 text-center text-xs text-ink-500 sm:px-7">
          {totalResponses.toLocaleString("en-GB")} responses collected · your
          answer takes this poll to {completion}% of target
        </p>
      ) : null}
    </form>
  );
}
