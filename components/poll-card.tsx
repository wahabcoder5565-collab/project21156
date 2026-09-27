import Link from "next/link";

import { Pill, Progress, StatusBadge } from "@/components/ui";
import type { FeedPoll } from "@/lib/types";
import { closesLabel, compactNumber, formatNumber } from "@/lib/utils";

export function PollCard({ poll }: { poll: FeedPoll }) {
  const target = poll.target_responses ?? 0;
  const progress = target > 0 ? Math.min(100, (100 * poll.response_count) / target) : 0;

  return (
    <article className="card group relative flex flex-col transition hover:shadow-lift">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={poll.status} />
          <Pill>{poll.category}</Pill>
          {poll.is_featured ? <Pill className="bg-brand-50 text-brand-700">Featured</Pill> : null}
          {poll.has_completed ? (
            <Pill className="bg-emerald-50 text-emerald-700">Completed</Pill>
          ) : null}
        </div>

        <h3 className="mt-3 font-display text-[1.0625rem] font-semibold leading-snug text-ink-900">
          <Link href={`/polls/${poll.slug}`} className="after:absolute after:inset-0">
            {poll.title}
          </Link>
        </h3>

        {poll.subtitle ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-600">{poll.subtitle}</p>
        ) : null}

        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-500">
          <div className="flex gap-1">
            <dt className="sr-only">Questions</dt>
            <dd>{formatNumber(poll.question_count)} questions</dd>
          </div>
          <div className="flex gap-1">
            <dt className="sr-only">Responses</dt>
            <dd>{compactNumber(poll.response_count)} responses</dd>
          </div>
          {poll.incentive_points > 0 ? (
            <div className="flex gap-1">
              <dt className="sr-only">Points</dt>
              <dd className="font-semibold text-brand-700">
                {poll.incentive_points} pts
              </dd>
            </div>
          ) : null}
          {poll.geography ? (
            <div className="flex gap-1">
              <dt className="sr-only">Geography</dt>
              <dd>{poll.geography}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="border-t border-ink-100 px-5 py-3.5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-ink-600">
            {closesLabel(poll.closes_at)}
          </span>
          {target > 0 ? (
            <span className="tabular-nums text-ink-500">
              {Math.round(progress)}% of target
            </span>
          ) : null}
        </div>
        {target > 0 ? (
          <Progress value={poll.response_count} max={target} className="mt-2" />
        ) : null}
      </div>
    </article>
  );
}
