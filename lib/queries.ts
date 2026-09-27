import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type {
  AdminOverview,
  Crosstab,
  FeedPoll,
  LeaderboardRow,
  MyActivity,
  PlatformStats,
  Poll,
  PollCategory,
  PollComment,
  PollDetail,
  PollResults,
  PollStatus,
  PollTrend,
  Profile,
  StudioDashboard,
} from "@/lib/types";

export const getSupabase = cache(async () => {
  return createClient();
});

export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await getSupabase();
  // `yg_profiles` is world-readable, so this must be filtered to the caller.
  // Without the filter `maybeSingle()` sees every row and errors out, which
  // made a successful sign-in bounce straight back to /login.
  const { data, error } = await supabase
    .from("yg_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("getProfile failed:", error.message);
    return null;
  }
  return (data as Profile | null) ?? null;
});

export function isStaff(profile: Profile | null) {
  return profile?.role === "admin" || profile?.role === "researcher";
}

export async function requireUser(nextPath: string) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireProfile(nextPath: string) {
  await requireUser(nextPath);
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireStaff(nextPath: string) {
  const profile = await requireProfile(nextPath);
  if (!isStaff(profile)) redirect("/?notice=admin-only");
  return profile;
}

type FeedParams = {
  status?: PollStatus | null;
  category?: string | null;
  search?: string | null;
  mine?: boolean;
  limit?: number;
  offset?: number;
};

export async function getPollFeed({
  status = null,
  category = null,
  search = null,
  mine = false,
  limit = 24,
  offset = 0,
}: FeedParams = {}): Promise<FeedPoll[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_poll_feed", {
    p_status: status,
    p_category: category && category !== "All" ? category : null,
    p_search: search && search.trim() ? search.trim() : null,
    p_mine: mine,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) {
    console.error("yg_poll_feed failed:", error.message);
    return [];
  }
  return (data ?? []) as FeedPoll[];
}

export async function getPollCategories(): Promise<PollCategory[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_poll_categories");
  if (error) {
    console.error("yg_poll_categories failed:", error.message);
    return [];
  }
  return ((data ?? []) as { category: string; poll_count: number }[]).map(
    (row) => ({ category: row.category, poll_count: Number(row.poll_count) }),
  );
}

export async function getPollBySlug(
  slug: string,
): Promise<PollDetail | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_get_poll", {
    p_slug: slug,
  });
  if (error) {
    console.error("yg_get_poll failed:", error.message);
    return null;
  }
  if (!data) return null;
  return data as unknown as PollDetail;
}

export async function getPollResults(
  pollId: string,
  includeText = true,
): Promise<PollResults | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_poll_results", {
    p_poll_id: pollId,
    p_include_text: includeText,
  });
  if (error) {
    console.error("yg_poll_results failed:", error.message);
    return null;
  }
  return (data ?? null) as unknown as PollResults | null;
}

export async function getPollTrend(pollId: string): Promise<PollTrend | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_poll_option_trend", {
    p_poll_id: pollId,
  });
  if (error) {
    console.error("yg_poll_option_trend failed:", error.message);
    return null;
  }
  return (data ?? null) as unknown as PollTrend | null;
}

export async function getCrosstab(
  pollId: string,
  dimension: string,
): Promise<Crosstab | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_poll_crosstab", {
    p_poll_id: pollId,
    p_dimension: dimension,
  });
  if (error) {
    console.error("yg_poll_crosstab failed:", error.message);
    return null;
  }
  return data as unknown as Crosstab;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_platform_stats");
  if (error) {
    console.error("yg_platform_stats failed:", error.message);
    return {
      total_polls: 0,
      total_responses: 0,
      total_members: 0,
      live_polls: 0,
      countries: 0,
      avg_points: 0,
    };
  }
  return data as unknown as PlatformStats;
}

export async function getLeaderboard(limit = 25): Promise<LeaderboardRow[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_leaderboard", {
    p_limit: limit,
  });
  if (error) {
    console.error("yg_leaderboard failed:", error.message);
    return [];
  }
  return (data ?? []) as LeaderboardRow[];
}

export async function getMyActivity(): Promise<MyActivity | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_my_activity");
  if (error) {
    console.error("yg_my_activity failed:", error.message);
    return null;
  }
  return data as unknown as MyActivity;
}

export async function getStudioDashboard(): Promise<StudioDashboard | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_studio_dashboard");
  if (error) {
    console.error("yg_studio_dashboard failed:", error.message);
    return null;
  }
  return data as unknown as StudioDashboard;
}

export async function getAdminOverview(): Promise<AdminOverview | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_admin_overview");
  if (error) {
    console.error("yg_admin_overview failed:", error.message);
    return null;
  }
  return data as unknown as AdminOverview;
}

export async function getPollComments(
  pollId: string,
  limit = 30,
): Promise<PollComment[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("yg_poll_comments", {
    p_poll_id: pollId,
    p_limit: limit,
  });
  if (error) {
    console.error("yg_poll_comments failed:", error.message);
    return [];
  }
  return (data ?? []) as PollComment[];
}

export async function getPollById(pollId: string): Promise<Poll | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("yg_polls")
    .select("*")
    .eq("id", pollId)
    .maybeSingle();
  if (error) return null;
  return (data as Poll | null) ?? null;
}
