import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ExportButtons } from "@/components/export-buttons";
import { ResponseTrend } from "@/components/response-trend";
import { TrendChart } from "@/components/trend-chart";
import {
  MetaRow,
  Notice,
  Pill,
  Progress,
  SectionHeading,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import {
  getCrosstab,
  getPollBySlug,
  getPollResults,
  getPollTrend,
} from "@/lib/queries";
import type { ResultQuestion } from "@/lib/types";
import {
  formatDateTime,
  formatNumber,
  optionColor,
  QUESTION_TYPE_LABEL,
} from "@/lib/utils";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DIMENSIONS = [
  { value: "age_band", label: "Age band" },
  { value: "gender", label: "Gender" },
  { value: "country", label: "Country" },
  { value: "region", label: "Region" },
  { value: "employment", label: "Employment" },
] as const;

export const metadata: Metadata = {
  title: "Results",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function OptionBars({ question }: { question: ResultQuestion }) {
  return (
    <ul className="space-y-3.5">
      {question.options.map((option, index) => (
        <li key={option.id}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="flex items-center gap-2 text-sm font-medium text-ink-800">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: optionColor(option, index) }}
                aria-hidden
              />
              {option.label}
            </span>
            <span className="shrink-0 text-sm tabular-nums text-ink-600">
              <span className="font-semibold text-ink-900">{option.pct}%</span>{" "}
              · {formatNumber(option.votes)}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(option.pct, option.votes > 0 ? 1.5 : 0)}%`,
                backgroundColor: optionColor(option, index),
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ScaleBars({ question }: { question: ResultQuestion }) {
  const max = Math.max(
    1,
    ...question.scale_distribution.map((bucket) => bucket.votes),
  );
  return (
    <div>
      <div className="flex items-end gap-1.5">
        {question.scale_distribution.map((bucket) => (
          <div key={bucket.value} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[0.6875rem] tabular-nums text-ink-500">
              {bucket.votes || ""}
            </span>
            <div
              className="w-full rounded-t bg-brand-500/85"
              style={{ height: `${(bucket.votes / max) * 96}px` }}
              title={`${bucket.value}: ${bucket.votes} votes`}
            />
            <span className="text-[0.6875rem] tabular-nums text-ink-500">
              {bucket.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
        <span>{question.scale_min_label ?? question.scale_min}</span>
        <span>
          Mean {question.mean ?? "—"} out of {question.scale_max}
        </span>
        <span className="text-right">{question.scale_max_label ?? question.scale_max}</span>
      </div>
    </div>
  );
}

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug);
  const detail = await getPollBySlug(cleanSlug);
  if (!detail) notFound();

  const query = await searchParams;
  const dimension = first(query.dimension) || "age_band";

  const results = await getPollResults(detail.poll.id, true);
  if (!results || !results.visible) {
    return (
      <div className="shell py-12">
        <Notice tone="warning" title="Results are not published yet.">
          This poll hides its results until fieldwork reaches the target, or until
          you have completed the poll yourself.{" "}
          {detail.poll.status === "fielding" ? (
            <Link href={`/polls/${detail.poll.slug}`} className="link">
              Take the poll
            </Link>
          ) : null}
        </Notice>
      </div>
    );
  }

  const crosstab = await getCrosstab(detail.poll.id, dimension);
  const trend = await getPollTrend(detail.poll.id);
  const target = detail.poll.target_responses ?? 0;
  const trendByQuestion = new Map(
    (trend?.questions ?? []).map((t) => [t.question_id, t]),
  );
  const trendDays = (trend?.days ?? []).map((d) => d.day);

  return (
    <div className="shell py-8">
      <nav className="text-xs text-ink-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/polls" className="hover:text-ink-800">
              Polls
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/polls/${detail.poll.slug}`} className="hover:text-ink-800">
              {detail.poll.title}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-700">Results</li>
        </ol>
      </nav>

      <header className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={results.poll.status ?? detail.poll.status} />
            <Pill>{results.poll.category ?? detail.poll.category}</Pill>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-900">
            {results.poll.title}
          </h1>
          {results.poll.subtitle ? (
            <p className="mt-1.5 text-ink-600">{results.poll.subtitle}</p>
          ) : null}
        </div>
        <ExportButtons results={results} slug={detail.poll.slug} />
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Responses"
          value={formatNumber(results.total_responses)}
          hint={target ? `Target ${formatNumber(target)}` : undefined}
          accent
        />
        <StatCard
          label="Completion"
          value={results.completion_rate !== null ? `${results.completion_rate}%` : "—"}
          hint="Of the response target"
        />
        <StatCard
          label="Questions"
          value={formatNumber(results.questions.length)}
          hint="In this poll"
        />
        <StatCard
          label="Open responses"
          value={formatNumber(results.text_responses.length)}
          hint="Verbatim answers"
        />
      </div>

      {target ? (
        <div className="card card-pad mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink-800">Fieldwork progress</span>
            <span className="tabular-nums text-ink-600">
              {formatNumber(results.total_responses)} of {formatNumber(target)} responses
            </span>
          </div>
          <Progress value={results.total_responses} max={target} className="mt-2.5" />
          {trend?.days.length ? (
            <div className="mt-4 border-t border-ink-100 pt-3">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-500">
                Responses over time
              </p>
              <ResponseTrend days={trend.days} target={target} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 space-y-5">
        {results.questions.map((question) => (
          <section key={question.id} className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-3xl">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-500">
                  Question {question.position} ·{" "}
                  {QUESTION_TYPE_LABEL[question.question_type]}
                </p>
                <h2 className="mt-1.5 font-display text-lg font-semibold text-ink-900">
                  {question.prompt}
                </h2>
                {question.help_text ? (
                  <p className="mt-1 text-sm text-ink-500">{question.help_text}</p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm text-ink-500">
                {formatNumber(question.responses)} answers
                {question.question_type === "multiple_choice"
                  ? " · multiple choice"
                  : ""}
              </p>
            </div>

            <div className="mt-5">
              {question.options.length ? (
                <OptionBars question={question} />
              ) : question.scale_distribution.length ? (
                <ScaleBars question={question} />
              ) : question.question_type === "text" ? (
                <p className="text-sm text-ink-500">
                  Open responses are listed with the other open answers below.
                </p>
              ) : (
                <p className="text-sm text-ink-500">No data yet.</p>
              )}
            </div>

            {(() => {
              const series = trendByQuestion.get(question.id);
              if (!series || !series.series.length) return null;
              return (
                <div className="mt-6 border-t border-ink-100 pt-5">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-500">
                    Over time
                  </p>
                  <TrendChart question={series} days={trendDays} />
                </div>
              );
            })()}
          </section>
        ))}
      </div>

      {results.text_responses.length ? (
        <section className="card card-pad mt-5">
          <SectionHeading
            eyebrow="Verbatim"
            title="What people said"
            description="Open text answers, shown with age band and country only."
          />
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {results.text_responses.map((item, index) => (
              <li
                key={`${item.created_at}-${index}`}
                className="rounded-xl border border-ink-200 bg-ink-50/60 p-4"
              >
                <p className="text-sm leading-relaxed text-ink-800">“{item.body}”</p>
                <p className="mt-2 text-xs text-ink-500">
                  {[item.age_band, item.country].filter(Boolean).join(" · ") ||
                    "No profile data"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card card-pad mt-5">
        <SectionHeading
          eyebrow="Crosstabs"
          title="How answers split by group"
          description="Share of respondents in each group choosing each option."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {DIMENSIONS.map((item) => (
            <Link
              key={item.value}
              href={`/polls/${detail.poll.slug}/results?dimension=${item.value}`}
              className={`btn btn-sm ${dimension === item.value ? "btn-dark" : "btn-ghost"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {crosstab?.rows.length ? (
          <div className="mt-6 space-y-6">
            {Object.entries(
              crosstab.rows.reduce<Record<string, typeof crosstab.rows>>(
                (acc, row) => {
                  (acc[row.question_id] ??= []).push(row);
                  return acc;
                },
                {},
              ),
            ).map(([questionId, rows]) => {
              const question = results.questions.find((q) => q.id === questionId);
              if (!question) return null;
              return (
                <div key={questionId}>
                  <h3 className="text-sm font-semibold text-ink-900">
                    {question.prompt}
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-ink-200 text-left">
                          <th className="py-2 pr-4 font-semibold text-ink-600">
                            {DIMENSIONS.find((d) => d.value === dimension)?.label}
                          </th>
                          {question.options.slice(0, 5).map((option) => (
                            <th
                              key={option.id}
                              className="py-2 pr-4 text-right font-semibold text-ink-600"
                            >
                              {option.label.length > 18
                                ? `${option.label.slice(0, 18)}…`
                                : option.label}
                            </th>
                          ))}
                          <th className="py-2 text-right font-semibold text-ink-600">n</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.group} className="border-b border-ink-100 last:border-0">
                            <th className="py-2 pr-4 text-left font-medium text-ink-800">
                              {row.group || "Not stated"}
                            </th>
                            {question.options.slice(0, 5).map((option) => {
                              const cell = row.options.find(
                                (o) => o.option_id === option.id,
                              );
                              return (
                                <td
                                  key={option.id}
                                  className="py-2 pr-4 text-right tabular-nums text-ink-700"
                                >
                                  {cell ? `${cell.pct}%` : "—"}
                                </td>
                              );
                            })}
                            <td className="py-2 text-right tabular-nums text-ink-500">
                              {formatNumber(row.group_size)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 text-sm text-ink-500">
            Not enough data to break these answers down by {dimension.replace("_", " ")} yet.
          </p>
        )}
      </section>

      <div className="card card-pad mt-5">
        <MetaRow
          items={[
            { label: "Sponsor", value: detail.poll.sponsor ?? "YouPulse Insights" },
            { label: "Geography", value: detail.poll.geography ?? "Global" },
            { label: "Published", value: formatDateTime(detail.poll.published_at) },
            { label: "Closes", value: formatDateTime(detail.poll.closes_at) },
          ]}
        />
        <p className="mt-4 text-xs leading-relaxed text-ink-500">
          Percentages show the share of respondents who answered each question. On
          multiple choice questions the total can exceed 100% because people may
          pick more than one option.
        </p>
      </div>
    </div>
  );
}
