import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export type RateLimit = { allowed: boolean; retryAfterSeconds: number };

const ALLOWED: RateLimit = { allowed: true, retryAfterSeconds: 0 };

/** Best-effort client address; proxy headers can be absent in local dev. */
export async function clientAddress(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

function minutes(seconds: number) {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const mins = Math.ceil(seconds / 60);
  return `${mins} minute${mins === 1 ? "" : "s"}`;
}

export function retryAfterMessage(seconds: number) {
  return `Too many attempts. Try again in ${minutes(seconds)}.`;
}

/**
 * Fixed-window counter kept in Postgres, so the limit holds across server
 * instances rather than resetting with each cold start.
 *
 * Fails open: if the counter itself errors we would rather allow a sign-in than
 * lock everybody out of the product.
 */
export async function rateLimit(
  bucket: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<RateLimit> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("yg_auth_rate_limit", {
      p_bucket: bucket,
      p_max_attempts: maxAttempts,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("yg_auth_rate_limit failed:", error.message);
      return ALLOWED;
    }
    const row = (Array.isArray(data) ? data[0] : data) as
      | { allowed: boolean; retry_after: number }
      | null;
    if (!row) return ALLOWED;
    return {
      allowed: row.allowed,
      retryAfterSeconds: Number(row.retry_after) || 0,
    };
  } catch (error) {
    console.error("rateLimit threw:", error);
    return ALLOWED;
  }
}

export async function clearRateLimit(bucket: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("yg_auth_throttle_reset", { p_bucket: bucket });
    if (error) console.error("yg_auth_throttle_reset failed:", error.message);
  } catch (error) {
    console.error("clearRateLimit threw:", error);
  }
}

export const signInBucket = (email: string) => `signin:${email}`;
export const signInIpBucket = (ip: string) => `signin-ip:${ip}`;
export const signupIpBucket = (ip: string) => `signup-ip:${ip}`;
export const resetBucket = (email: string) => `reset:${email}`;
