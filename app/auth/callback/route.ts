import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/next-path";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the PKCE / magic-link redirect from Supabase Auth.
 * Supports both `?code=` (PKCE exchange) and `?token_hash=&type=` (email OTP).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "signup";
  const next = safeNextPath(searchParams.get("next"), "/profile");

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail(error.message);
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "recovery" | "email_change",
      token_hash: tokenHash,
    });
    if (error) return fail(error.message);
    return NextResponse.redirect(`${origin}${next}`);
  }

  return fail("Missing confirmation token.");
}
