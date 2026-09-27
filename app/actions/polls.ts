"use server";

import { revalidatePath } from "next/cache";

import { errorMessage } from "@/lib/action-state";
import { getSupabase } from "@/lib/queries";
import type { SubmitResult, SurveyAnswer } from "@/lib/types";

export type SubmitOutcome =
  | { ok: true; result: SubmitResult }
  | { ok: false; error: string };

export async function submitResponse(input: {
  pollId: string;
  slug: string;
  answers: SurveyAnswer[];
  durationSeconds: number;
}): Promise<SubmitOutcome> {
  const supabase = await getSupabase();
  const answers = input.answers.filter((answer) => {
    if (Array.isArray(answer.optionIds) && answer.optionIds.length) return true;
    if (typeof answer.numericValue === "number") return true;
    if (typeof answer.textValue === "string" && answer.textValue.trim()) {
      return true;
    }
    return false;
  });

  const { data, error } = await supabase.rpc("yg_submit_response", {
    p_poll_id: input.pollId,
    p_answers: answers,
    p_duration_seconds: Math.max(0, Math.round(input.durationSeconds)),
  });

  if (error) {
    return { ok: false, error: errorMessage(error, "Could not submit.") };
  }

  revalidatePath("/polls");
  revalidatePath(`/polls/${input.slug}`);
  revalidatePath(`/polls/${input.slug}/results`);
  revalidatePath("/profile");
  revalidatePath("/");

  return { ok: true, result: data as SubmitResult };
}

export async function toggleSavedPoll(pollId: string, slug: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("yg_toggle_saved_poll", {
    p_poll_id: pollId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/polls/${slug}`);
  revalidatePath("/polls");
  revalidatePath("/profile");
}

export async function addComment(input: {
  pollId: string;
  slug: string;
  body: string;
  parentId?: string | null;
}) {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("yg_add_comment", {
    p_poll_id: input.pollId,
    p_body: input.body,
    p_parent_id: input.parentId ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/polls/${input.slug}`);
}

export async function deleteComment(commentId: string, slug: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("yg_delete_comment", {
    p_comment_id: commentId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/polls/${slug}`);
}
