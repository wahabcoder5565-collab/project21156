"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { moderatePoll, setMemberRole } from "@/app/actions/admin";
import type { AdminMember, AdminPoll, MemberRole } from "@/lib/types";

const ROLES: MemberRole[] = ["member", "researcher", "admin"];

export function RoleSelect({
  member,
}: {
  member: AdminMember;
}) {
  const router = useRouter();
  const [value, setValue] = useState<MemberRole>(member.role);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={`Role for ${member.email ?? member.full_name ?? member.id}`}
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as MemberRole;
          const previous = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const outcome = await setMemberRole(member.id, next);
            if (!outcome.ok) {
              setValue(previous);
              setError(outcome.error);
              return;
            }
            router.refresh();
          });
        }}
        className="field w-auto py-1.5 text-sm"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      {error ? (
        <span role="alert" className="text-xs text-brand-700">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function ModerateButtons({ poll }: { poll: AdminPoll }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: "feature" | "unfeature" | "close" | "reopen" | "archive") =>
    startTransition(async () => {
      setError(null);
      const outcome = await moderatePoll(poll.id, poll.slug, action);
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {error ? (
        <span role="alert" className="text-xs text-brand-700">
          {error}
        </span>
      ) : null}
      {poll.status === "draft" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("reopen")}
          className="btn btn-ghost btn-sm"
        >
          Publish
        </button>
      ) : poll.status === "fielding" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("close")}
          className="btn btn-ghost btn-sm"
        >
          Close
        </button>
      ) : poll.status === "closed" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("reopen")}
          className="btn btn-ghost btn-sm"
        >
          Reopen
        </button>
      ) : null}
      {poll.status !== "archived" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("archive")}
          className="btn btn-ghost btn-sm"
        >
          Archive
        </button>
      ) : null}
    </div>
  );
}

export function RoleFilter({
  value,
  counts,
}: {
  value: string;
  counts: { role: MemberRole; count: number }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span
        className={`chip ring-1 ring-inset ${
          value === ""
            ? "bg-ink-900 text-white ring-ink-900"
            : "bg-white text-ink-600 ring-ink-200"
        }`}
      >
        All
      </span>
      {counts.map((item) => (
        <span
          key={item.role}
          className={`chip ring-1 ring-inset ${
            value === item.role
              ? "bg-ink-900 text-white ring-ink-900"
              : "bg-white text-ink-600 ring-ink-200"
          }`}
        >
          {item.role}
          <span className={value === item.role ? "text-white/70" : "text-ink-400"}>
            {item.count}
          </span>
        </span>
      ))}
    </div>
  );
}
