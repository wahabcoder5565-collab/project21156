import type { Metadata } from "next";
import Link from "next/link";

import {
  EmptyState,
  Progress,
  SectionHeading,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { getStudioDashboard, requireStaff } from "@/lib/queries";
import { formatDuration, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Studio",
};

export default async function StudioPage() {
  const profile = await requireStaff("/studio");
  const dashboard = await getStudioDashboard();

  if (!dashboard) {
    return (
      <div className="shell py-12">
        <EmptyState
          title="Could not load your studio"
          description="The dashboard RPC rejected this request. Make sure your account has a researcher or admin role."
        />
      </div>
    );
  }

  const { polls, totals } = dashboard;

  return (
    <div className="shell py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Researcher tools</p>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink-900">
            Poll studio
          </h1>
          <p className="mt-1.5 text-sm text-ink-600">
            Signed in as {profile.full_name} ({profile.role}). You see polls you
            created plus, as staff, everything else.
          </p>
        </div>
        <Link href="/studio/new" className="btn btn-primary">
          <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden>
            <path d="M9 4h2v5h5v2h-5v5H9v-5H4V9h5z" />
          </svg>
          New poll
        </Link>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="All polls" value={formatNumber(totals.polls)} />
        <StatCard label="Live" value={formatNumber(totals.live)} accent />
        <StatCard label="Drafts" value={formatNumber(totals.drafts)} />
        <StatCard label="Responses" value={formatNumber(totals.responses)} />
        <StatCard
          label="Points paid"
          value={formatNumber(totals.points_paid)}
          hint="Panel incentives to date"
        />
      </div>

      <div className="mt-8">
        <SectionHeading
          eyebrow="Fieldwork"
          title="Your polls"
          description="Open a poll to edit its questions, or review live results."
        />
      </div>

      {polls.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/70 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-ink-600">
                  Poll
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-ink-600">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-ink-600">
                  Questions
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-ink-600">
                  Responses
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-ink-600">
                  Avg time
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-ink-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll) => {
                const target = poll.target_responses ?? 0;
                return (
                  <tr key={poll.id} className="border-b border-ink-100 align-middle last:border-0">
                    <td className="max-w-[320px] px-4 py-3">
                      <p className="truncate font-semibold text-ink-900">
                        <Link href={`/polls/${poll.slug}`} className="hover:underline">
                          {poll.title}
                        </Link>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {poll.category} · {poll.incentive_points} pts
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={poll.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                      {formatNumber(poll.question_count)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="tabular-nums text-ink-900">
                        {formatNumber(poll.response_count)}
                      </span>
                      {target ? (
                        <span className="block text-xs text-ink-500">
                          of {formatNumber(target)}
                        </span>
                      ) : null}
                      {target ? (
                        <Progress
                          value={poll.response_count}
                          max={target}
                          className="mt-1.5 w-20"
                          tone="ink"
                        />
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                      {poll.avg_seconds ? formatDuration(poll.avg_seconds) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/studio/polls/${poll.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/polls/${poll.slug}/results`}
                          className="btn btn-ghost btn-sm"
                        >
                          Results
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="No polls yet"
            description="Create your first poll, add questions, then publish it to start collecting responses."
            action={
              <Link href="/studio/new" className="btn btn-primary btn-sm">
                Create a poll
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
