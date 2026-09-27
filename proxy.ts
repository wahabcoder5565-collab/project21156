import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

const PROTECTED_PREFIXES = ["/profile", "/studio", "/admin", "/survey"];
const GUEST_ONLY_PREFIXES = ["/login", "/signup", "/forgot-password"];

function isStaff(role: string | undefined) {
  return role === "admin" || role === "researcher";
}

/**
 * Refreshes the Supabase auth session on every matched request and applies
 * coarse route protection. All real authorization lives in Postgres (RLS plus
 * the `yg_*` RPCs), so this is only a redirect convenience.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const guestOnly = GUEST_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!user && needsAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (user && guestOnly) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const { data: profile } = await supabase
      .from("yg_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !isStaff(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "?notice=admin-only";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
