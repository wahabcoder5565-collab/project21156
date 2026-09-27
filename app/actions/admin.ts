"use server";

import { revalidatePath } from "next/cache";

import { errorMessage } from "@/lib/action-state";
import { getSupabase } from "@/lib/queries";
import type { MemberRole } from "@/lib/types";

export type AdminOutcome = { ok: true } | { ok: false; error: string };

export async function setMemberRole(
  userId: string,
  role: MemberRole,
): Promise<AdminOutcome> {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("yg_admin_set_role", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) return { ok: false, error: errorMessage(error, "Could not change role.") };
  revalidatePath("/admin");
  return { ok: true };
}

export async function moderatePoll(
  pollId: string,
  slug: string,
  action: "feature" | "unfeature" | "close" | "reopen" | "archive",
): Promise<AdminOutcome> {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("yg_admin_moderate_poll", {
    p_poll_id: pollId,
    p_action: action,
  });
  if (error) {
    return { ok: false, error: errorMessage(error, "Could not moderate poll.") };
  }
  revalidatePath("/admin");
  revalidatePath("/polls");
  revalidatePath(`/polls/${slug}`);
  return { ok: true };
}

export async function updateProfileFields(fields: {
  full_name?: string;
  country?: string;
  age_band?: string;
  gender?: string;
  employment?: string;
  education?: string;
}): Promise<AdminOutcome> {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc("yg_update_my_profile", {
    p_fields: fields,
  });
  if (error) {
    return { ok: false, error: errorMessage(error, "Could not save profile.") };
  }
  revalidatePath("/profile");
  return { ok: true };
}
