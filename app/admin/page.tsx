import type { Metadata } from "next";
import Link from "next/link";

import { ModerateButtons, RoleFilter, RoleSelect } from "@/components/admin-controls";
import {
  Avatar,
  EmptyState,
  Notice,
  Pill,
  SectionHeading,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { getAdminOverview, requireStaff } from "@/lib/queries";
import type { MemberRole } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await requireStaff("/admin");
  const params = await searchParams;
  const roleFilter =
    Array.isArray(params.role) ? (params.role[0] ?? "") : (params.role ?? "");

  const overview = await getAdminOverview();

  if (!overview) {
    return (
      <div className="shell py-12">
        <Notice tone="error" title="Could not load the admin overview.">
          The overview RPC rejected this request. Only admins and researchers can
          read it.
        </Notice>
      </div>
    );
  }

  const { stats, members, polls } = overview;
  const roleCounts = (["admin", "researcher", "member"] as MemberRole[]).map(
    (role) => ({ role, count: members.filter((m) => m.role === role).length }),
  );
  const visibleMembers = roleFilter
    ? members.filter((member) => member.role === roleFilter)
    : members;

  const draftCount = polls.filter((poll) => poll.status === "draft").length;
  const liveCount = polls.filter((poll) => poll.status === "fielding").length;
  const staffCount = members.filter(
    (member) => member.role === "admin" || member.role === "researcher",
  ).length;

  return (
    <div className="shell py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink-900">
            Platform overview
          </h1>
          <p className="mt-1.5 text-sm text-ink-600">
            Signed in as {profile.full_name} ({profile.role}). Role changes and
            moderation are enforced again on the server.
          </p>
        </div>
        <Link href="/studio" className="btn btn-ghost">
          Open the studio
        </Link>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Members" value={formatNumber(stats.total_members)} />
        <StatCard label="Staff" value={formatNumber(staffCount)} />
        <StatCard label="Polls" value={formatNumber(stats.total_polls)} hint={`${formatNumber(draftCount)} draft`} />
        <StatCard label="Live polls" value={formatNumber(liveCount)} accent />
        <StatCard
          label="Responses"
          value={formatNumber(stats.total_responses)}
          hint={`${stats.avg_points} avg points`}
        />
        <StatCard label="Countries" value={formatNumber(stats.countries)} />
      </div>

      <section className="mt-10">
        <SectionHeading
          eyebrow="Moderation"
          title="Polls"
          description="Publish, close or archive any poll on the platform."
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/70 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-ink-600">
                  Poll
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-ink-600">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-ink-600">
                  Responses
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-ink-600">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-ink-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll) => (
                <tr key={poll.id} className="border-b border-ink-100 last:border-0">
                  <td className="max-w-[340px] px-4 py-3">
                    <p className="truncate font-semibold text-ink-900">
                      <Link href={`/polls/${poll.slug}`} className="hover:underline">
                        {poll.title}
                      </Link>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">{poll.category}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={poll.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-800">
                    {formatNumber(poll.response_count)}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(poll.created_at)}</td>
                  <td className="px-4 py-3">
                    <ModerateButtons poll={poll} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading
          eyebrow="People"
          title="Members"
          description="Grant researcher access to colleagues, or promote to admin. You cannot change your own role here."
        />
        <div className="mt-4">
          <RoleFilter value={roleFilter} counts={roleCounts} />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/70 text-left">
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
                  Points
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-ink-600">
                  Joined
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-ink-600">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleMembers.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-ink-100 last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.full_name} size={32} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-900">
                          {member.full_name ?? "Unnamed member"}
                        </p>
                        <p className="truncate text-xs text-ink-500">{member.email}</p>
                      </div>
                      {member.is_demo ? <Pill>Demo</Pill> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {member.country ?? "—"}
                    {member.age_band ? (
                      <span className="block text-xs text-ink-500">{member.age_band}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                    {formatNumber(member.polls_completed)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink-900">
                    {formatNumber(member.reputation_points)}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(member.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {member.id === profile.id ? (
                      <span className="text-sm text-ink-500">You</span>
                    ) : (
                      <RoleSelect member={member} />
                    )}
                  </td>
                </tr>
              ))}
              {!visibleMembers.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                    No members with that role.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {!members.length ? (
        <div className="mt-6">
          <EmptyState title="No members yet" description="Sign-ups will appear here." />
        </div>
      ) : null}
    </div>
  );
}
