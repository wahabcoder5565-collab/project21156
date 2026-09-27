import Link from "next/link";

import { HeroSignIn } from "@/components/hero-signin";
import { Avatar, Pill, Progress, StatusBadge } from "@/components/ui";
import type { FeedPoll, PlatformStats, Profile } from "@/lib/types";
import { compactNumber, firstName, formatNumber } from "@/lib/utils";

function TrustPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-600">
      <svg
        viewBox="0 0 20 20"
        className="size-4 shrink-0 text-brand-600"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8.2 13.6L4.9 10.3l1.3-1.3 2 2 5.6-5.6 1.3 1.3z" />
      </svg>
      {children}
    </li>
  );
}

function StatBar({ stats }: { stats: PlatformStats }) {
  const items = [
    { label: "Live polls", value: compactNumber(stats.live_polls) },
    { label: "Answers recorded", value: compactNumber(stats.total_responses) },
    { label: "Panel members", value: compactNumber(stats.total_members) },
    { label: "Countries", value: compactNumber(stats.countries) },
  ];

  return (
    <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-200/80 bg-ink-200/70 sm:grid-cols-4 lg:mt-14">
      {items.map((item) => (
        <div key={item.label} className="bg-white/85 px-5 py-4 backdrop-blur">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-500">
            {item.label}
          </dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink-900">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function MemberPanel({
  profile,
  poll,
}: {
  profile: Profile;
  poll: FeedPoll | null;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-ink-100 bg-gradient-to-b from-white to-ink-50/60 px-5 py-4">
        <Avatar name={profile.full_name} src={profile.avatar_url} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">
            {profile.full_name ?? "YouPulse member"}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            {formatNumber(profile.reputation_points)} points ·{" "}
            {formatNumber(profile.polls_completed)} polls
            {profile.current_streak > 1 ? ` · ${profile.current_streak} day streak` : ""}
          </p>
        </div>
        <Link href="/profile" className="btn btn-ghost btn-sm">
          Profile
        </Link>
      </div>

      {poll ? (
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={poll.status} />
            <Pill>{poll.category}</Pill>
          </div>
          <p className="mt-3 font-display text-base font-semibold leading-snug text-ink-900">
            {poll.title}
          </p>
          {poll.subtitle ? (
            <p className="mt-1.5 line-clamp-2 text-sm text-ink-600">{poll.subtitle}</p>
          ) : null}
          <Progress
            value={poll.response_count}
            max={poll.target_responses ?? 0}
            className="mt-4"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
            <span className="tabular-nums">
              {formatNumber(poll.response_count)} answers
            </span>
            {poll.incentive_points > 0 ? (
              <span className="font-semibold text-brand-700">
                {poll.incentive_points} pts
              </span>
            ) : null}
          </div>
          <Link href={`/survey/${poll.slug}`} className="btn btn-primary mt-4 w-full">
            Answer this poll
          </Link>
        </div>
      ) : (
        <div className="p-5 text-sm text-ink-600">
          No polls are open for responses right now. Check back shortly.
        </div>
      )}
    </div>
  );
}

export function Hero({
  profile,
  stats,
  featuredPoll,
}: {
  profile: Profile | null;
  stats: PlatformStats;
  featuredPoll: FeedPoll | null;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-ink-200 bg-white">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(56rem 30rem at 12% -12%, var(--color-brand-100), transparent 62%), radial-gradient(38rem 22rem at 88% -4%, #dbeafe, transparent 58%)",
            opacity: 0.7,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-ink-200) 1px, transparent 1px), linear-gradient(to bottom, var(--color-ink-200) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            opacity: 0.45,
            maskImage:
              "radial-gradient(64rem 32rem at 50% 0%, black, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(64rem 32rem at 50% 0%, black, transparent 78%)",
          }}
        />
      </div>

      <div className="shell relative py-12 md:py-16 lg:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-14">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50/90 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-emerald-700">
              <span className="relative flex size-1.5" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              {stats.live_polls > 0
                ? `${formatNumber(stats.live_polls)} polls fielding now`
                : "Public opinion, measured daily"}
            </p>

            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.4rem]">
              {profile ? (
                <>
                  Welcome back, {firstName(profile.full_name)}.
                </>
              ) : (
                <>
                  What does the country{" "}
                  <span className="text-brand-600">actually think</span>?
                </>
              )}
            </h1>

            <p className="mt-5 text-base leading-relaxed text-ink-600 md:text-lg">
              {profile
                ? "Pick up a live poll, earn points, and watch the results move as people answer."
                : "Join thousands of members answering short polls on politics, technology, the economy and more. Every poll publishes results as they come in."}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={profile ? "/polls" : "/signup"}
                className="btn btn-primary"
              >
                {profile ? "Find a poll" : "Join the panel free"}
              </Link>
              <Link href="/polls" className="btn btn-ghost">
                Browse live polls
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              <TrustPoint>Free to join</TrustPoint>
              <TrustPoint>Two minutes per poll</TrustPoint>
              <TrustPoint>Points for every answer</TrustPoint>
            </ul>
          </div>

          <div className="lg:sticky lg:top-24">
            {profile ? (
              <MemberPanel profile={profile} poll={featuredPoll} />
            ) : (
              <HeroSignIn
                memberNext={featuredPoll ? `/survey/${featuredPoll.slug}` : "/polls"}
              />
            )}
          </div>
        </div>

        <StatBar stats={stats} />
      </div>
    </section>
  );
}
