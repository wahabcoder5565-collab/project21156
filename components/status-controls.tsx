"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { publishPoll, setPollStatus } from "@/app/actions/studio";
import { POLL_STATUS_OPTIONS } from "@/lib/utils";
import type { PollStatus } from "@/lib/types";

export function StatusControls({
  pollId,
  slug,
  status,
  questionCount,
}: {
  pollId: string;
  slug: string;
  status: PollStatus;
  questionCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const publish = () => {
    if (questionCount === 0) {
      alert("Add at least one question before publishing.");
      return;
    }
    if (!confirm("Publish this poll and open it for responses?")) return;
    run(() => publishPoll(pollId, slug));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" ? (
        <button type="button" onClick={publish} disabled={pending} className="btn btn-primary btn-sm">
          {pending ? "Working…" : "Publish poll"}
        </button>
      ) : null}

      {status === "fielding" ? (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm("Close fieldwork on this poll?")) return;
              run(() => setPollStatus(pollId, slug, "closed"));
            }}
            className="btn btn-ghost btn-sm"
          >
            Close fieldwork
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setPollStatus(pollId, slug, "draft"))}
            className="btn btn-ghost btn-sm"
          >
            Unpublish
          </button>
        </>
      ) : null}

      {status === "closed" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setPollStatus(pollId, slug, "fielding"))}
          className="btn btn-ghost btn-sm"
        >
          Reopen fieldwork
        </button>
      ) : null}

      {status !== "archived" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("Archive this poll? It will be hidden from the public feed."))
              return;
            run(() => setPollStatus(pollId, slug, "archived"));
          }}
          className="btn btn-ghost btn-sm"
        >
          Archive
        </button>
      ) : (
        <span className="text-xs text-ink-500">
          Archived · current status: {POLL_STATUS_OPTIONS.find((o) => o.value === status)?.label}
        </span>
      )}
    </div>
  );
}
