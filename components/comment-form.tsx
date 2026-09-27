"use client";

import { useActionState, useEffect, useRef } from "react";

import { addComment } from "@/app/actions/polls";
import { failure, type ActionState } from "@/lib/action-state";

export function CommentForm({
  pollId,
  slug,
  parentId,
  placeholder,
  autoFocus,
}: {
  pollId: string;
  slug: string;
  parentId?: string | null;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const body = String(formData.get("body") ?? "").trim();
      if (!body) return failure("Write something before posting.");
      if (body.length > 2000) {
        return failure("Comments are limited to 2000 characters.");
      }
      try {
        await addComment({ pollId, slug, body, parentId: parentId ?? null });
        return { status: "success", message: "Posted." };
      } catch (error) {
        return failure(
          error instanceof Error ? error.message : "Could not post comment.",
        );
      }
    },
    null,
  );

  useEffect(() => {
    if (state?.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form action={formAction} ref={formRef} className="space-y-2">
      <textarea
        name="body"
        rows={parentId ? 2 : 3}
        required
        autoFocus={autoFocus}
        placeholder={placeholder ?? "Add to the discussion…"}
        className="field resize-y"
      />
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-xs ${
            state?.status === "error" ? "text-brand-700" : "text-ink-500"
          }`}
          role={state?.status === "error" ? "alert" : "status"}
        >
          {state?.message ?? ""}
        </p>
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
          {pending ? "Posting…" : parentId ? "Post reply" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
