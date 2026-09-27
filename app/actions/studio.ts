"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { errorMessage } from "@/lib/action-state";
import { getSupabase } from "@/lib/queries";
import { CHART_PALETTE } from "@/lib/utils";
import type { PollStatus, QuestionType } from "@/lib/types";

export type StudioOutcome =
  | { ok: true; message: string; pollId?: string; slug?: string; questionId?: string }
  | { ok: false; error: string };

type CreatePollInput = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  geography: string;
  audience: string;
  sponsor: string;
  targetResponses: number;
  fieldingDays: number;
  incentivePoints: number;
  showResultsLive: boolean;
  hideResultsUntilComplete: boolean;
  allowTextAnswers: boolean;
  isAnonymous: boolean;
};

export async function createPoll(input: CreatePollInput): Promise<StudioOutcome> {
  if (input.title.trim().length < 8) {
    return { ok: false, error: "Give the poll a title of at least 8 characters." };
  }
  if (!input.category) return { ok: false, error: "Choose a category." };

  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_create_poll", {
    p_title: input.title.trim(),
    p_subtitle: input.subtitle.trim() || null,
    p_description: input.description.trim() || null,
    p_category: input.category,
    p_geography: input.geography || "Global",
    p_audience: input.audience || "Adults 18+",
    p_sponsor: input.sponsor.trim() || null,
    p_target_responses: input.targetResponses,
    p_fielding_days: input.fieldingDays,
    p_incentive_points: input.incentivePoints,
    p_show_results_live: input.showResultsLive,
    p_hide_results_until_complete: input.hideResultsUntilComplete,
    p_allow_text_answers: input.allowTextAnswers,
    p_is_anonymous: input.isAnonymous,
  });

  if (error) return { ok: false, error: errorMessage(error, "Could not create poll.") };

  const pollId = data as string;
  revalidatePath("/studio");
  return { ok: true, message: "Poll created as a draft.", pollId };
}

export async function saveQuestion(input: {
  pollId: string;
  questionId?: string | null;
  prompt: string;
  questionType: QuestionType;
  helpText: string;
  isRequired: boolean;
  minSelections: number | null;
  maxSelections: number | null;
  scaleMin: number | null;
  scaleMax: number | null;
  scaleMinLabel: string;
  scaleMaxLabel: string;
  options: { label: string; color: string | null }[];
}): Promise<StudioOutcome> {
  if (input.prompt.trim().length < 5) {
    return { ok: false, error: "Question text must be at least 5 characters." };
  }
  const isChoice =
    input.questionType === "single_choice" || input.questionType === "multiple_choice";
  if (isChoice && input.options.filter((o) => o.label.trim()).length < 2) {
    return { ok: false, error: "Add at least two answer options." };
  }
  if (input.questionType === "scale") {
    const min = input.scaleMin ?? 0;
    const max = input.scaleMax ?? 10;
    if (max <= min) return { ok: false, error: "Scale maximum must exceed the minimum." };
  }

  const supabase = await getSupabase();
  let questionId = input.questionId ?? null;

  if (questionId) {
    const { error } = await supabase.rpc("yg_update_question", {
      p_question_id: questionId,
      p_fields: {
        prompt: input.prompt.trim(),
        question_type: input.questionType,
        help_text: input.helpText.trim() || null,
        is_required: input.isRequired,
        min_selections: input.minSelections,
        max_selections: input.maxSelections,
        scale_min: input.scaleMin,
        scale_max: input.scaleMax,
        scale_min_label: input.scaleMinLabel.trim() || null,
        scale_max_label: input.scaleMaxLabel.trim() || null,
      },
    });
    if (error) return { ok: false, error: errorMessage(error, "Could not save question.") };
  } else {
    const { data, error } = await supabase.rpc("yg_add_question", {
      p_poll_id: input.pollId,
      p_prompt: input.prompt.trim(),
      p_question_type: input.questionType,
      p_help_text: input.helpText.trim() || null,
      p_is_required: input.isRequired,
      p_min_selections: input.minSelections,
      p_max_selections: input.maxSelections,
      p_scale_min: input.scaleMin,
      p_scale_max: input.scaleMax,
      p_scale_min_label: input.scaleMinLabel.trim() || null,
      p_scale_max_label: input.scaleMaxLabel.trim() || null,
    });
    if (error) return { ok: false, error: errorMessage(error, "Could not add question.") };
    questionId = data as string;
  }

  // Options are only written for brand new questions. Existing options are
  // edited individually via `saveOption` / `removeOption` to avoid duplicates.
  if (isChoice && questionId && !input.questionId) {
    const options = input.options.filter((option) => option.label.trim());
    for (const [index, option] of options.entries()) {
      const { error } = await supabase.rpc("yg_add_option", {
        p_question_id: questionId,
        p_label: option.label.trim(),
        p_color: option.color ?? CHART_PALETTE[index % CHART_PALETTE.length],
      });
      if (error) {
        return { ok: false, error: errorMessage(error, "Could not save options.") };
      }
    }
  }

  revalidatePath("/studio");
  revalidatePath(`/studio/polls/${input.pollId}`);
  return { ok: true, message: "Question saved.", questionId };
}

export async function saveOption(input: {
  questionId: string;
  optionId?: string | null;
  label: string;
  color: string | null;
}) {
  const supabase = await getSupabase();
  if (input.optionId) {
    const { error } = await supabase.rpc("yg_update_option", {
      p_option_id: input.optionId,
      p_label: input.label,
      p_color: input.color,
    });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.rpc("yg_add_option", {
      p_question_id: input.questionId,
      p_label: input.label,
      p_color: input.color,
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/studio");
}

export async function removeOption(optionId: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("yg_delete_option", {
    p_option_id: optionId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/studio");
}

export async function removeQuestion(questionId: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("yg_delete_question", {
    p_question_id: questionId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/studio");
}

export async function setPollStatus(
  pollId: string,
  slug: string,
  status: PollStatus,
) {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("yg_set_poll_status", {
    p_poll_id: pollId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/studio");
  revalidatePath(`/polls/${slug}`);
  revalidatePath("/polls");
}

export async function publishPoll(pollId: string, slug: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("yg_set_poll_status", {
    p_poll_id: pollId,
    p_status: "fielding",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/studio");
  revalidatePath("/polls");
  redirect(`/polls/${slug}`);
}
