"use server";

import { generateJson } from "@/lib/gemini";
import { getProfile, isStaff } from "@/lib/queries";
import { CATEGORIES, GEOGRAPHIES } from "@/lib/utils";

export type AiDraft = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  geography: string;
};

export type AiOutcome =
  | { ok: true; draft: AiDraft }
  | { ok: false; error: string };

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "The poll question, phrased neutrally as a single question.",
    },
    subtitle: {
      type: "string",
      description: "A short framing line, e.g. 'Global tracker, wave 3 of 2026'.",
    },
    description: {
      type: "string",
      description: "Two or three sentences of background a respondent needs before answering.",
    },
    category: { type: "string", enum: [...CATEGORIES] },
    geography: { type: "string", enum: [...GEOGRAPHIES] },
  },
  required: ["title", "subtitle", "description", "category", "geography"],
} as const;

/**
 * Drafts a poll for a researcher. Staff-only, and the model is constrained to
 * the app's own category/geography vocabularies so the result is always valid.
 */
export async function draftPoll(topic: string): Promise<AiOutcome> {
  const profile = await getProfile();
  if (!isStaff(profile)) {
    return { ok: false, error: "Only researchers and admins can draft polls." };
  }

  const trimmed = topic.trim().slice(0, 400);
  if (trimmed.length < 3) {
    return { ok: false, error: "Describe what you want to ask about." };
  }

  const result = await generateJson<AiDraft>({
    schema: DRAFT_SCHEMA,
    prompt: [
      "You write neutral, professional public opinion poll questions for a global research panel.",
      "",
      `Topic: ${trimmed}`,
      "",
      "Return a single poll question that is neutral (no leading or loaded wording),",
      "answerable by adults in any country, and answerable without reading further context.",
      `Set "category" to one of: ${CATEGORIES.join(", ")}.`,
      `Set "geography" to one of: ${GEOGRAPHIES.join(", ")}.`,
      'Keep "title" under 120 characters.',
    ].join("\n"),
  });

  if (!result.ok) return { ok: false, error: result.error };

  const { data } = result;

  // Guard against the model returning something outside our vocabularies.
  const category = (CATEGORIES as readonly string[]).includes(data.category)
    ? data.category
    : CATEGORIES[0];
  const geography = (GEOGRAPHIES as readonly string[]).includes(data.geography)
    ? data.geography
    : "Global";

  const title = data.title?.trim();
  if (!title) return { ok: false, error: "The AI service returned an empty draft." };

  return {
    ok: true,
    draft: {
      title: title.slice(0, 200),
      subtitle: (data.subtitle ?? "").trim().slice(0, 160),
      description: (data.description ?? "").trim().slice(0, 600),
      category,
      geography,
    },
  };
}
