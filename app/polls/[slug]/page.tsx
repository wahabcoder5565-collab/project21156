import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentForm } from "@/components/comment-form";
import { SaveButton } from "@/components/save-button";
import {
  Avatar,
  MetaRow,
  Notice,
  Pill,
  Progress,
  SectionHeading,
  StatusBadge,
} from "@/components/ui";
import {
  getPollBySlug,
  getPollComments,
  getPollResults,
  getUser,
} from "@/lib/queries";
import {
  closesLabel,
  formatDateTime,
  formatNumber,
  optionColor,
  QUESTION_TYPE_LABEL,
} from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPollBySlug(decodeURIComponent(slug));
  if (!detail) return { title: "Poll not found" };
  return {
    title: detail.poll.title,
    description:
      detail.poll.subtitle ??
      detail.poll.description ??
      "Take part in this YouPulse poll and see the results.",
  };
}

export default async function PollPage({ params }: { params: Params }) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug);
  const detail = await getPollBySlug(cleanSlug);
  if (!detail) notFound();

  const { poll, questions } = detail;
  const user = await getUser();
  const isStaff = detail.can_manage;
  const isLive = poll.status === "fielding";
  const results = detail.results_visible
    ? await getPollResults(poll.id, false)
    : null;
  const comments = await getPollComments(poll.id, 20);

  const target = poll.target_responses ?? 0;
  const preview = results?.questions?.[0] ?? null;

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
            <Link
              href={`/polls?category=${encodeURIComponent(poll.category)}`}
              className="hover:text-ink-800"
            >
              {poll.category}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="truncate text-ink-700">{poll.title}</li>
        </ol>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <header className="card card-pad">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={poll.status} />
              <Pill>{poll.category}</Pill>
              {poll.is_featured ? (
                <Pill className="bg-brand-50 text-brand-700">Featured</Pill>
              ) : null}
              {detail.has_completed ? (
                <Pill className="bg-emerald-50 text-emerald-700">You took part</Pill>
              ) : null}
            </div>

            <h1 className="mt-3.5 font-display text-[1.75rem] font-bold leading-tight tracking-tight text-ink-900 md:text-4xl">
              {poll.title}
            </h1>
            {poll.subtitle ? (
              <p className="mt-2 text-base text-ink-600">{poll.subtitle}</p>
            ) : null}
            {poll.description ? (
              <p className="mt-3.5 text-[0.9375rem] leading-relaxed text-ink-700">
                {poll.description}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {isLive && !detail.has_completed ? (
                <Link
                  href={
                    user ? `/survey/${poll.slug}` : `/login?next=${encodeURIComponent(`/survey/${poll.slug}`)}`
                  }
                  className="btn btn-primary"
                >
                  {user ? "Take part" : "Sign in to take part"}
                </Link>
              ) : null}
              {detail.has_completed ? (
                <span className="btn btn-ghost cursor-default">
                  Thanks for taking part
                </span>
              ) : null}
              {detail.results_visible ? (
                <Link href={`/polls/${poll.slug}/results`} className="btn btn-ghost">
                  {isLive ? "See live results" : "View results"}
                </Link>
              ) : null}
              <SaveButton
                pollId={poll.id}
                slug={poll.slug}
                initialSaved={detail.is_saved}
                signedIn={!!user}
              />
            </div>

            {!isLive ? (
              <div className="mt-5">
                <Notice tone="warning" title={`This poll is ${poll.status}.`}>
                  {poll.status === "draft"
                    ? "Fieldwork has not started. Results will appear once the poll is published."
                    : `Fieldwork closed${poll.closed_at ? ` on ${formatDateTime(poll.closed_at)}` : ""}. Final results are below.`}
                </Notice>
              </div>
            ) : null}
          </header>

          <section className="card card-pad">
            <SectionHeading
              eyebrow="What we are asking"
              title={`${questions.length} question${questions.length === 1 ? "" : "s"}`}
              description={`About ${detail.estimated_minutes} minutes. ${
                poll.incentive_points > 0
                  ? `Earns ${poll.incentive_points} reputation points.`
                  : "No points for this poll."
              }`}
            />
            <ol className="mt-5 space-y-5">
              {questions.map((question, index) => (
                <li key={question.id} className="border-t border-ink-100 pt-5 first:border-0 first:pt-0">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-900">{question.prompt}</p>
                      {question.help_text ? (
                        <p className="mt-1 text-sm text-ink-500">
                          {question.help_text}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-xs text-ink-500">
                        {QUESTION_TYPE_LABEL[question.question_type]}
                        {question.is_required ? " · Required" : " · Optional"}
                        {question.max_selections && question.question_type === "multiple_choice"
                          ? ` · Choose up to ${question.max_selections}`
                          : ""}
                        {question.question_type === "scale"
                          ? ` · ${question.scale_min} to ${question.scale_max}`
                          : ""}
                      </p>
                      {question.options.length ? (
                        <ul className="mt-2.5 flex flex-wrap gap-1.5">
                          {question.options.map((option, optionIndex) => (
                            <li key={option.id}>
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-700">
                                <span
                                  className="size-2 rounded-full"
                                  style={{
                                    backgroundColor: optionColor(option, optionIndex),
                                  }}
                                  aria-hidden
                                />
                                {option.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            {isLive && !detail.has_completed ? (
              <div className="mt-6 border-t border-ink-100 pt-5">
                <Link
                  href={
                    user ? `/survey/${poll.slug}` : `/login?next=${encodeURIComponent(`/survey/${poll.slug}`)}`
                  }
                  className="btn btn-primary"
                >
                  Start the survey
                </Link>
              </div>
            ) : null}
          </section>

          {preview && preview.options.length ? (
            <section className="card card-pad">
              <SectionHeading
                eyebrow="Early results"
                title={preview.prompt}
                description={`Based on ${formatNumber(preview.responses)} responses so far.`}
                action={
                  <Link
                    href={`/polls/${poll.slug}/results`}
                    className="btn btn-ghost btn-sm"
                  >
                    Full results
                  </Link>
                }
              />
              <ul className="mt-5 space-y-3">
                {preview.options.slice(0, 5).map((option, index) => (
                  <li key={option.id}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-ink-800">{option.label}</span>
                      <span className="tabular-nums text-ink-600">
                        {option.pct}% · {formatNumber(option.votes)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(option.pct, 1.5)}%`,
                          backgroundColor: optionColor(option, index),
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="card card-pad" id="discussion">
            <SectionHeading
              eyebrow="Discussion"
              title={`${formatNumber(comments.length)} comment${comments.length === 1 ? "" : "s"}`}
              description="Members can discuss the question. Keep it civil and on topic."
            />
            <div className="mt-5 space-y-4">
              {user ? (
                <CommentForm pollId={poll.id} slug={poll.slug} />
              ) : (
                <Notice tone="info">
                  <Link href="/login" className="link">
                    Sign in
                  </Link>{" "}
                  to join the discussion.
                </Notice>
              )}

              <ul className="space-y-4">
                {comments.map((comment) => (
                  <li key={comment.id} className="flex gap-3">
                    <Avatar
                      name={comment.author_name}
                      src={comment.author_avatar}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold text-ink-900">
                          {comment.author_name ?? "Deleted member"}
                        </span>
                        <span className="ml-2 text-xs text-ink-500">
                          {formatDateTime(comment.created_at)} ·{" "}
                          {formatNumber(comment.author_points)} pts
                        </span>
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-700">
                        {comment.body}
                      </p>
                      {comment.reply_count > 0 ? (
                        <p className="mt-1.5 text-xs text-ink-500">
                          {formatNumber(comment.reply_count)} replies
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
                {!comments.length ? (
                  <li className="text-sm text-ink-500">
                    No comments yet. Be the first to post.
                  </li>
                ) : null}
              </ul>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card card-pad">
            <h2 className="text-sm font-semibold text-ink-900">Fieldwork</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Responses</span>
                <span className="font-semibold tabular-nums text-ink-900">
                  {formatNumber(detail.total_responses)}
                  {target ? ` / ${formatNumber(target)}` : ""}
                </span>
              </div>
              {target ? (
                <Progress value={detail.total_responses} max={target} />
              ) : null}
              <p className="text-xs text-ink-500">{closesLabel(poll.closes_at)}</p>
            </div>
            <div className="mt-4 border-t border-ink-100 pt-4">
              <MetaRow
                items={[
                  { label: "Sponsor", value: poll.sponsor ?? "YouPulse Insights" },
                  { label: "Geography", value: poll.geography ?? "Global" },
                  { label: "Audience", value: poll.audience ?? "Adults 18+" },
                  {
                    label: "Published",
                    value: poll.published_at
                      ? formatDateTime(poll.published_at)
                      : "Not yet",
                  },
                  {
                    label: "Closes",
                    value: poll.closes_at ? formatDateTime(poll.closes_at) : "Open-ended",
                  },
                  {
                    label: "Incentive",
                    value: `${formatNumber(poll.incentive_points)} pts`,
                  },
                ]}
              />
            </div>
          </div>

          {detail.creator ? (
            <div className="card card-pad">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-500">
                Commissioned by
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <Avatar name={detail.creator.full_name} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {detail.creator.full_name ?? "YouPulse Research"}
                  </p>
                  <p className="text-xs capitalize text-ink-500">
                    {detail.creator.role}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isStaff ? (
            <div className="card card-pad">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-500">
                Researcher tools
              </p>
              <div className="mt-2.5 space-y-2 text-sm">
                <Link
                  href={`/studio/polls/${poll.id}`}
                  className="block font-medium text-brand-700 hover:underline"
                >
                  Edit questions and options
                </Link>
                <Link
                  href={`/polls/${poll.slug}/results`}
                  className="block font-medium text-brand-700 hover:underline"
                >
                  Full results and crosstabs
                </Link>
              </div>
            </div>
          ) : null}

          <div className="card card-pad bg-ink-50">
            <p className="text-sm font-semibold text-ink-900">
              How results work
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              Percentages are the share of people who answered each question. On
              multiple choice questions you can pick more than one option, so the
              bars add up to more than 100%.
            </p>
            <p className="mt-2 text-xs text-ink-500">
              Members cannot see results until they finish the poll.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
