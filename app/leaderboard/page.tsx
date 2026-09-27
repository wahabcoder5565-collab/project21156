import type { Metadata } from "next";
import Link from "next/link";

import { Avatar, Pill, SectionHeading } from "@/components/ui";
import { getLeaderboard, getMyActivity, getUser } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See the most active YouPulse panel members and their reputation points.",
};

export default async function LeaderboardPage() {
  const [rows, user, activity] = await Promise.all([
    getLeaderboard(50),
    getUser(),
    getMyActivity(),
  ]);

  const myId = user?.id;
  const myRow = myId ? rows.find((row) => row.id === myId) : undefined;

  return (
    <div className="shell py-10">
      <SectionHeading
        eyebrow="Community"
        title="Panel leaderboard"
        description="Members earn reputation points for every completed poll, with bonus streaks for answering on consecutive days."
      />

      {myId && activity ? (
        <div className="card card-pad mt-6 flex flex-wrap items-center justify-between gap-4 bg-ink-900 text-white">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-400">
              Your standing
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">
              Rank #{formatNumber(activity.rank)}
            </p>
            <p className="mt-0.5 text-sm text-ink-300">
              {formatNumber(activity.profile?.reputation_points ?? 0)} points ·{" "}
              {formatNumber(activity.profile?.polls_completed ?? 0)} polls completed
              {activity.profile?.current_streak
                ? ` · ${activity.profile.current_streak} day streak`
                : ""}
            </p>
          </div>
          {!myRow ? (
            <p className="max-w-xs text-sm text-ink-300">
              You are outside the top 50. Complete a few more polls to climb.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="card card-pad mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink-700">
            Sign in to see your rank and reputation points.
          </p>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Join the panel
          </Link>
        </div>
      )}

      <div className="card mt-6 overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Top 50 members by reputation points
          </caption>
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50/70 text-left">
              <th scope="col" className="px-4 py-3 font-semibold text-ink-600">
                #
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-ink-600">
                Member
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-ink-600">
                Country
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold text-ink-600">
                Polls
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold text-ink-600">
                Streak
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold text-ink-600">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isMe = row.id === myId;
              return (
                <tr
                  key={row.id}
                  className={`border-b border-ink-100 last:border-0 ${
                    isMe ? "bg-brand-50/60" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold tabular-nums ${
                        index < 3 ? "text-brand-600" : "text-ink-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={row.full_name} src={row.avatar_url} size={32} />
                      <span className="font-medium text-ink-900">
                        {row.full_name ?? "Anonymous member"}
                      </span>
                      {isMe ? <Pill className="bg-brand-600 text-white">You</Pill> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{row.country ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                    {formatNumber(row.polls_completed)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                    {row.current_streak > 0 ? `${row.current_streak}d` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink-900">
                    {formatNumber(row.reputation_points)}
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                  The leaderboard is empty right now.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
