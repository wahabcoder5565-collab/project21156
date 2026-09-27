import Link from "next/link";

import { Hero } from "@/components/hero";
import { PollCard } from "@/components/poll-card";
import { SectionHeading } from "@/components/ui";
import {
  getLeaderboard,
  getPlatformStats,
  getPollCategories,
  getPollFeed,
  getProfile,
} from "@/lib/queries";
import { formatNumber } from "@/lib/utils";

export default async function HomePage() {
  const [profile, stats, live, categories, leaders] = await Promise.all([
    getProfile(),
    getPlatformStats(),
    getPollFeed({ status: "fielding", limit: 6 }),
    getPollCategories(),
    getLeaderboard(5),
  ]);

  const featured = live.filter((poll) => poll.is_featured).slice(0, 2);
  const rest = live.filter((poll) => !featured.includes(poll)).slice(0, 6);
  const spotlight = [...featured, ...rest].slice(0, 6);

  return (
    <>
      <Hero profile={profile} stats={stats} featuredPoll={spotlight[0] ?? null} />

      <div className="shell space-y-14 py-14">
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Live now"
            title="Polls open for responses"
            description="Fieldwork is open on these polls. Take part to earn points towards your next reward."
            action={
              <Link href="/polls" className="btn btn-ghost btn-sm">
                View all polls
              </Link>
            }
          />
          {spotlight.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {spotlight.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          ) : (
            <div className="card card-pad py-12 text-center text-sm text-ink-600">
              No polls are open for responses right now. Check back shortly.
            </div>
          )}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Explore"
              title="Browse by topic"
              description="Follow the subjects you care about and see every poll in one place."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <Link
                  key={category.category}
                  href={`/polls?category=${encodeURIComponent(category.category)}`}
                  className="card flex items-center justify-between px-4 py-3.5 transition hover:shadow-lift"
                >
                  <span className="font-medium text-ink-800">
                    {category.category}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-ink-500">
                    {formatNumber(category.poll_count)}
                    <svg
                      viewBox="0 0 20 20"
                      className="size-4"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M7.5 4.5L13 10l-5.5 5.5z" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeading
              eyebrow="Leaderboard"
              title="Top contributors"
              action={
                <Link href="/leaderboard" className="btn btn-ghost btn-sm">
                  Full board
                </Link>
              }
            />
            <ol className="card divide-y divide-ink-100">
              {leaders.map((row, index) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span
                    className={`w-5 text-center text-sm font-bold tabular-nums ${
                      index < 3 ? "text-brand-600" : "text-ink-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {row.full_name ?? "Anonymous member"}
                    </p>
                    <p className="text-xs text-ink-500">
                      {row.polls_completed} polls
                      {row.current_streak > 1 ? ` · ${row.current_streak} day streak` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink-700">
                    {formatNumber(row.reputation_points)}
                  </span>
                </li>
              ))}
              {!leaders.length ? (
                <li className="px-4 py-6 text-sm text-ink-500">
                  Leaderboard is empty.
                </li>
              ) : null}
            </ol>

            {!profile ? (
              <div className="card card-pad bg-ink-900 text-white">
                <p className="text-sm font-semibold">Earn points every poll</p>
                <p className="mt-1.5 text-sm text-ink-300">
                  Members build reputation points, unlock perks, and climb the
                  leaderboard by taking part in fieldwork.
                </p>
                <Link href="/signup" className="btn btn-primary btn-sm mt-4">
                  Create your account
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="card card-pad grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Answer in two minutes",
              body: "Short, focused polls on one clear topic. No surveys that take an evening.",
            },
            {
              title: "See results instantly",
              body: "Live charts update as fieldwork progresses, with crosstabs by age, gender and region.",
            },
            {
              title: "Points that add up",
              body: "Each poll pays a fixed number of points, with streaks for answering day after day.",
            },
            {
              title: "Researcher tooling",
              body: "Staff can create polls, add questions, publish, and track response targets in the studio.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-base font-semibold text-ink-900">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.body}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
