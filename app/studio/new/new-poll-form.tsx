"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { draftPoll } from "@/app/actions/ai";
import { createPoll } from "@/app/actions/studio";
import { CATEGORIES, GEOGRAPHIES } from "@/lib/utils";

export function NewPollForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: CATEGORIES[0] as string,
    geography: "Global" as string,
    audience: "Adults 18+",
    sponsor: "",
    targetResponses: 150,
    fieldingDays: 14,
    incentivePoints: 15,
    showResultsLive: true,
    hideResultsUntilComplete: false,
    allowTextAnswers: true,
    isAnonymous: false,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const runAiDraft = () => {
    setAiError(null);
    setAiBusy(true);
    startTransition(async () => {
      const outcome = await draftPoll(aiTopic);
      if (outcome.ok) {
        setForm((prev) => ({ ...prev, ...outcome.draft }));
        setAiOpen(false);
        setAiTopic("");
      } else {
        setAiError(outcome.error);
      }
      setAiBusy(false);
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const outcome = await createPoll(form);
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      if (outcome.pollId) router.push(`/studio/polls/${outcome.pollId}`);
      else router.push("/studio");
    });
  };

  const toggle = (
    key: "showResultsLive" | "hideResultsUntilComplete" | "allowTextAnswers" | "isAnonymous",
    label: string,
    hint: string,
  ) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 bg-white p-3.5 transition hover:bg-ink-50">
      <input
        type="checkbox"
        checked={form[key]}
        onChange={(event) => set(key, event.target.checked)}
        className="mt-0.5 size-4 accent-[var(--color-brand-600)]"
      />
      <span>
        <span className="block text-sm font-semibold text-ink-900">{label}</span>
        <span className="mt-0.5 block text-xs text-ink-500">{hint}</span>
      </span>
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="card card-pad">
        {!aiOpen ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-ink-900">
                Draft with AI
              </h2>
              <p className="mt-1 text-sm text-ink-600">
                Describe a topic and get a neutral poll question, framing and
                background you can edit before saving.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="btn btn-ghost btn-sm"
            >
              Draft with AI
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h2 className="font-display text-base font-semibold text-ink-900">
                Draft with AI
              </h2>
              <p className="mt-1 text-sm text-ink-600">
                e.g. &ldquo;how much people trust AI advice in health decisions&rdquo;.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={aiTopic}
                onChange={(event) => setAiTopic(event.target.value)}
                placeholder="What should this poll ask?"
                className="field flex-1"
                maxLength={400}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={runAiDraft}
                  disabled={aiBusy || aiTopic.trim().length < 3}
                  className="btn btn-dark btn-sm"
                >
                  {aiBusy ? "Drafting…" : "Generate"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAiOpen(false);
                    setAiError(null);
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
            {aiError ? (
              <p role="alert" className="text-sm text-brand-700">
                {aiError}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="card card-pad space-y-4">
        <div>
          <label className="label" htmlFor="title">
            Poll question
          </label>
          <input
            id="title"
            required
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="How worried are you that AI will reduce the number of jobs?"
            className="field"
          />
          <p className="hint mt-1">
            Write it as a question members will see first.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="subtitle">
            Subtitle
          </label>
          <input
            id="subtitle"
            value={form.subtitle}
            onChange={(event) => set("subtitle", event.target.value)}
            placeholder="Global tracker, wave 3 of 2026"
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            placeholder="Background members need before answering."
            className="field resize-y"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(event) => set("category", event.target.value)}
              className="field"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="geography">
              Geography
            </label>
            <select
              id="geography"
              value={form.geography}
              onChange={(event) => set("geography", event.target.value)}
              className="field"
            >
              {GEOGRAPHIES.map((geo) => (
                <option key={geo} value={geo}>
                  {geo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="audience">
              Audience
            </label>
            <input
              id="audience"
              value={form.audience}
              onChange={(event) => set("audience", event.target.value)}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="sponsor">
              Sponsor
            </label>
            <input
              id="sponsor"
              value={form.sponsor}
              onChange={(event) => set("sponsor", event.target.value)}
              placeholder="YouPulse Insights"
              className="field"
            />
          </div>
        </div>
      </section>

      <section className="card card-pad">
        <h2 className="font-display text-base font-semibold text-ink-900">
          Fieldwork settings
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="targetResponses">
              Response target
            </label>
            <input
              id="targetResponses"
              type="number"
              min={1}
              value={form.targetResponses}
              onChange={(event) => set("targetResponses", Number(event.target.value))}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="fieldingDays">
              Fielding days
            </label>
            <input
              id="fieldingDays"
              type="number"
              min={1}
              value={form.fieldingDays}
              onChange={(event) => set("fieldingDays", Number(event.target.value))}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="incentivePoints">
              Points per response
            </label>
            <input
              id="incentivePoints"
              type="number"
              min={0}
              value={form.incentivePoints}
              onChange={(event) => set("incentivePoints", Number(event.target.value))}
              className="field"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {toggle(
            "showResultsLive",
            "Show results live",
            "Members see charts update as responses arrive.",
          )}
          {toggle(
            "hideResultsUntilComplete",
            "Hide results until complete",
            "Members can only see results after finishing the poll.",
          )}
          {toggle(
            "allowTextAnswers",
            "Allow open text answers",
            "Adds a free-text question to the questionnaire.",
          )}
          {toggle(
            "isAnonymous",
            "Anonymous poll",
            "Suppresses open text answers in published results.",
          )}
        </div>
      </section>

      {error ? (
        <p role="alert" className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900 ring-1 ring-inset ring-brand-600/25">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Creating…" : "Create draft poll"}
        </button>
        <Link href="/studio" className="btn btn-ghost">
          Cancel
        </Link>
        <p className="text-xs text-ink-500">
          Polls are created as drafts so you can add questions before publishing.
        </p>
      </div>
    </form>
  );
}
