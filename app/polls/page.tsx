import type { Metadata } from "next";
import Link from "next/link";

import { PollCard } from "@/components/poll-card";
import { EmptyState } from "@/components/ui";
import { getPollCategories, getPollFeed, getUser } from "@/lib/queries";
import { formatNumber, STATUS_META } from "@/lib/utils";
import type { PollStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Polls",
  description: "Browse every poll on YouPulse, filter by topic or fieldwork status.",
};

const PAGE_SIZE = 12;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "fielding", label: STATUS_META.fielding.label },
  { value: "closed", label: STATUS_META.closed.label },
  { value: "draft", label: STATUS_META.draft.label },
];

export default async function PollsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = first(params.status);
  const category = first(params.category);
  const search = first(params.q);
  const mine = first(params.mine) === "1";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [user, categories] = await Promise.all([getUser(), getPollCategories()]);

  const polls = await getPollFeed({
    status: status ? (status as PollStatus) : null,
    category: category || null,
    search: search || null,
    mine: mine && !!user,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const buildHref = (overrides: Record<string, string>) => {
    const next = new URLSearchParams();
    const merged: Record<string, string> = {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(search ? { q: search } : {}),
      ...(mine ? { mine: "1" } : {}),
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `/polls?${qs}` : "/polls";
  };

  const hasFilters = !!(status || category || search || mine);

  return (
    <div className="shell py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Opinion tracker</p>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink-900">
            {mine ? "My polls" : "All polls"}
          </h1>
          <p className="mt-1.5 text-sm text-ink-600">
            {polls.length
              ? `Showing ${formatNumber(polls.length)} poll${polls.length === 1 ? "" : "s"}${hasFilters ? " matching your filters" : ""}.`
              : "No polls to show."}
          </p>
        </div>
        <form action="/polls" className="flex w-full max-w-sm gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {category ? <input type="hidden" name="category" value={category} /> : null}
          {mine ? <input type="hidden" name="mine" value="1" /> : null}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search polls"
            aria-label="Search polls"
            className="field"
          />
          <button type="submit" className="btn btn-dark">
            Search
          </button>
        </form>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => {
          const active = (status || "") === tab.value;
          return (
            <Link
              key={tab.value || "all"}
              href={buildHref({ status: tab.value, page: "" })}
              className={`btn btn-sm ${
                active ? "btn-dark" : "btn-ghost"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
        <span className="mx-1 hidden h-5 w-px bg-ink-200 sm:block" />
        <Link
          href={buildHref({ category: "", mine: mine ? "" : "1", page: "" })}
          className={`btn btn-sm ${mine ? "btn-dark" : "btn-ghost"}`}
        >
          Saved &amp; taken by me
        </Link>
        {hasFilters ? (
          <Link href="/polls" className="btn btn-sm btn-ghost">
            Clear filters
          </Link>
        ) : null}
      </div>

      {categories.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((item) => {
            const active = item.category === category;
            return (
              <Link
                key={item.category}
                href={buildHref({ category: active ? "" : item.category, page: "" })}
                className={`chip ring-1 ring-inset transition ${
                  active
                    ? "bg-brand-600 text-white ring-brand-600"
                    : "bg-white text-ink-600 ring-ink-200 hover:bg-ink-50"
                }`}
              >
                {item.category}
                <span className={active ? "text-white/70" : "text-ink-400"}>
                  {item.poll_count}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="mt-8">
        {polls.length ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
            <nav className="mt-8 flex items-center justify-center gap-3">
              {page > 1 ? (
                <Link href={buildHref({ page: String(page - 1) })} className="btn btn-ghost btn-sm">
                  Previous
                </Link>
              ) : null}
              <span className="text-sm text-ink-500">Page {page}</span>
              {polls.length === PAGE_SIZE ? (
                <Link href={buildHref({ page: String(page + 1) })} className="btn btn-ghost btn-sm">
                  Next
                </Link>
              ) : null}
            </nav>
          </>
        ) : (
          <EmptyState
            title="No polls match those filters"
            description="Try clearing the search or choosing a different topic."
            action={
              <Link href="/polls" className="btn btn-primary btn-sm">
                Show all polls
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
