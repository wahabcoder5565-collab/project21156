import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SurveyForm } from "@/components/survey-form";
import { Notice } from "@/components/ui";
import { getPollBySlug, requireProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Take part",
};

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug);

  await requireProfile(`/survey/${cleanSlug}`);

  const detail = await getPollBySlug(cleanSlug);
  if (!detail) notFound();

  const { poll, questions } = detail;

  if (poll.status !== "fielding") {
    redirect(`/polls/${poll.slug}?notice=not-open`);
  }

  if (detail.has_completed) {
    redirect(`/polls/${poll.slug}/results`);
  }

  if (!questions.length) {
    return (
      <div className="shell py-12">
        <Notice tone="warning" title="This poll has no questions yet.">
          The researcher is still building the questionnaire.{" "}
          <Link href={`/polls/${poll.slug}`} className="link">
            Back to the poll
          </Link>
        </Notice>
      </div>
    );
  }

  return (
    <div className="shell max-w-3xl py-8">
      <nav className="text-xs text-ink-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/polls" className="hover:text-ink-800">
              Polls
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="truncate text-ink-700">{poll.title}</li>
        </ol>
      </nav>

      <header className="mt-4">
        <p className="eyebrow">You are taking part</p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink-900">
          {poll.title}
        </h1>
        <p className="mt-1.5 text-sm text-ink-600">
          {poll.sponsor ?? "YouPulse Insights"} · {poll.geography ?? "Global"} · about{" "}
          {detail.estimated_minutes} minutes
        </p>
      </header>

      <div className="mt-6">
        <SurveyForm
          poll={poll}
          questions={questions}
          totalResponses={detail.total_responses}
          targetResponses={poll.target_responses}
        />
      </div>

      <p className="mt-4 text-center text-xs text-ink-500">
        You can only complete this poll once. Answers are validated again on the
        server before they are stored.
      </p>
    </div>
  );
}
