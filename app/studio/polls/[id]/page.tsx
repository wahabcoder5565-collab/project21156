import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QuestionEditor } from "@/components/question-editor";
import { StatusControls } from "@/components/status-controls";
import { MetaRow, Notice, Progress, StatusBadge } from "@/components/ui";
import {
  getPollById,
  getPollBySlug,
  getPollResults,
  requireStaff,
} from "@/lib/queries";
import { formatDateTime, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Edit poll",
};

export default async function EditPollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStaff(`/studio/polls/${id}`);

  const poll = await getPollById(id);
  if (!poll) notFound();

  const detail = await getPollBySlug(poll.slug);
  if (!detail) notFound();
  if (!detail.can_manage) {
    return (
      <div className="shell py-12">
        <Notice tone="error" title="You cannot manage this poll.">
          Only the creator or a member of staff can edit it.{" "}
          <Link href="/studio" className="link">
            Back to the studio
          </Link>
        </Notice>
      </div>
    );
  }

  const results = await getPollResults(poll.id, false);
  const target = poll.target_responses ?? 0;

  return (
    <div className="shell py-8">
      <nav className="text-xs text-ink-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/studio" className="hover:text-ink-800">
              Studio
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="truncate text-ink-700">{poll.title}</li>
        </ol>
      </nav>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={poll.status} />
            {poll.is_featured ? (
              <span className="chip bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/20">
                Featured
              </span>
            ) : null}
          </div>
          <h1 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-ink-900">
            {poll.title}
          </h1>
          {poll.subtitle ? (
            <p className="mt-1 text-sm text-ink-600">{poll.subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/polls/${poll.slug}`} className="btn btn-ghost btn-sm">
            View public page
          </Link>
          <Link href={`/polls/${poll.slug}/results`} className="btn btn-ghost btn-sm">
            Results
          </Link>
        </div>
      </header>

      <div className="mt-5">
        <StatusControls
          pollId={poll.id}
          slug={poll.slug}
          status={poll.status}
          questionCount={detail.questions.length}
        />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
            Questionnaire
          </h2>
          <QuestionEditor pollId={poll.id} questions={detail.questions} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card card-pad">
            <h2 className="text-sm font-semibold text-ink-900">Fieldwork</h2>
            <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink-500">Responses</span>
              <span className="font-semibold tabular-nums text-ink-900">
                {formatNumber(results?.total_responses ?? 0)}
                {target ? ` / ${formatNumber(target)}` : ""}
              </span>
            </div>
            {target ? (
              <Progress
                value={results?.total_responses ?? 0}
                max={target}
                className="mt-2"
              />
            ) : null}
            <div className="mt-4 border-t border-ink-100 pt-4">
              <MetaRow
                items={[
                  { label: "Category", value: poll.category },
                  { label: "Geography", value: poll.geography ?? "Global" },
                  { label: "Audience", value: poll.audience ?? "Adults 18+" },
                  { label: "Incentive", value: `${poll.incentive_points} pts` },
                  { label: "Opens", value: formatDateTime(poll.opens_at) },
                  { label: "Closes", value: formatDateTime(poll.closes_at) },
                ]}
              />
            </div>
          </div>

          <div className="card card-pad bg-ink-50">
            <h2 className="text-sm font-semibold text-ink-900">How editing works</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-600">
              <li>Question wording, type and scale bounds can be edited at any time.</li>
              <li>Option labels save when you leave the field.</li>
              <li>Deleting a question removes its answers and changes every result.</li>
              <li>Publishing requires at least one question.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
