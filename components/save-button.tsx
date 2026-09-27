"use client";

import { useState, useTransition } from "react";

import { toggleSavedPoll } from "@/app/actions/polls";
import { cn } from "@/lib/utils";

export function SaveButton({
  pollId,
  slug,
  initialSaved,
  signedIn,
}: {
  pollId: string;
  slug: string;
  initialSaved: boolean;
  signedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <a href={`/login?next=${encodeURIComponent(`/polls/${slug}`)}`} className="btn btn-ghost">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path strokeLinejoin="round" d="M6 4.5h12v16l-6-4-6 4v-16z" />
        </svg>
        Save
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      onClick={() => {
        const next = !saved;
        setSaved(next);
        startTransition(async () => {
          try {
            await toggleSavedPoll(pollId, slug);
          } catch {
            setSaved(!next);
          }
        });
      }}
      className={cn("btn", saved ? "btn-dark" : "btn-ghost")}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <path strokeLinejoin="round" d="M6 4.5h12v16l-6-4-6 4v-16z" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
