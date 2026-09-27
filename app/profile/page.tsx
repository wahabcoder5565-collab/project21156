import type { Metadata } from "next";
import Link from "next/link";

import { ProfileForm } from "@/components/profile-form";
import {
  Avatar,
  EmptyState,
  Notice,
  Pill,
  SectionHeading,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { getMyActivity, getPlatformStats, requireProfile } from "@/lib/queries";
import { formatDate, formatDuration, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My profile",
};

export default async function ProfilePage() {
  const profile = await requireProfile("/profile");
  const [activity, stats] = await Promise.all([
    getMyActivity(),
    getPlatformStats(),
  ]);

  const completed = activity?.completed ?? [];
  const saved = activity?.saved ?? [];
  const pointsToNextReward = Math.max(0, 500 - (profile.reputation_points % 500));

  return (
    <div className="shell py-10">
      <header className="card card-pad flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name} src={profile.avatar_url} size={64} />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
              {profile.full_name ?? "YouPulse member"}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-600">
              <span>{profile.email}</span>
              {profile.role !== "member" ? (
                <Pill className="bg-ink-900 text-white">{profile.role}</Pill>
              ) : null}
              {profile.is_demo ? <Pill>Demo account</Pill> : null}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              Member since {formatDate(profile.created_at)}
              {profile.last_active_on
                ? ` · last active ${formatDate(profile.last_active_on)}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/polls" className="btn btn-primary btn-sm">
            Find a poll
          </Link>
          <Link href="/leaderboard" className="btn btn-ghost btn-sm">
            Leaderboard
          </Link>
        </div>
      </header>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Reputation points"
          value={formatNumber(profile.reputation_points)}
          hint={`${formatNumber(pointsToNextReward)} to the next 500`}
          accent
        />
        <StatCard
          label="Polls completed"
          value={formatNumber(profile.polls_completed)}
          hint={`of ${formatNumber(stats.total_responses)} platform responses`}
        />
        <StatCard
          label="Current streak"
          value={`${formatNumber(profile.current_streak)}d`}
          hint={`Longest ${formatNumber(profile.longest_streak)} days`}
        />
        <StatCard
          label="Panel rank"
          value={activity ? `#${formatNumber(activity.rank)}` : "—"}
          hint={`${formatNumber(stats.total_members)} members`}
        />
      </div>

      {profile.reputation_points === 0 ? (
        <div className="mt-4">
          <Notice tone="info" title="Complete your first poll to earn points.">
            Every poll pays a fixed number of points, and answering on consecutive
            days keeps your streak alive.
          </Notice>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-4">
          <SectionHeading
            eyebrow="History"
            title="Polls you have completed"
            description={`${formatNumber(completed.length)} recorded`}
          />
          {completed.length ? (
            <ul className="card divide-y divide-ink-100">
              {completed.map((item) => (
                <li key={`${item.poll_id}-${item.completed_at}`}>
                  <Link
                    href={`/polls/${item.slug}/results`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {item.category} · {formatDate(item.completed_at)}
                        {item.duration_seconds
                          ? ` · took ${formatDuration(item.duration_seconds)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold tabular-nums text-brand-700">
                        +{formatNumber(item.points_awarded)}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No completed polls yet"
              description="Once you finish a poll it will appear here, along with the points you earned."
              action={
                <Link href="/polls" className="btn btn-primary btn-sm">
                  Browse live polls
                </Link>
              }
            />
          )}

          <div className="pt-4">
            <SectionHeading
              eyebrow="Saved"
              title="Polls you saved for later"
              description={`${formatNumber(saved.length)} saved`}
            />
            {saved.length ? (
              <ul className="card mt-4 divide-y divide-ink-100">
                {saved.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/polls/${item.slug}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-ink-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {item.category} · saved {formatDate(item.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="card card-pad mt-4 text-sm text-ink-600">
                Nothing saved yet. Use the save button on any poll to keep it here.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div>
            <SectionHeading
              eyebrow="Demographics"
              title="Your profile details"
              description="Used to weight results so the panel reflects the population."
            />
            <div className="mt-4">
              <ProfileForm profile={profile} />
            </div>
          </div>

          <div className="card card-pad bg-ink-900 text-white">
            <p className="text-sm font-semibold">How points work</p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-300">
              <li>Each poll pays a fixed number of points on completion.</li>
              <li>Answering on consecutive days builds a streak.</li>
              <li>Points appear on the leaderboard and rank you among members.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
