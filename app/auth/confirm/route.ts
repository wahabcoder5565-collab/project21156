import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/next-path";
import { createClient } from "@/lib/supabase/server";

/** Confirmation link target for new signups. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "signup";
  const next = safeNextPath(searchParams.get("next"), "/profile");

  if (!tokenHash) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Missing confirmation token.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as "signup" | "recovery" | "email_change",
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
