"use server";

import { redirect } from "next/navigation";

import {
  errorMessage,
  failure,
  success,
  type ActionState,
} from "@/lib/action-state";
import {
  clearRateLimit,
  clientAddress,
  rateLimit,
  resetBucket,
  retryAfterMessage,
  signInBucket,
  signInIpBucket,
  signupIpBucket,
} from "@/lib/auth-throttle";
import { DEMO_PASSWORD, findDemoAccount, type DemoRole } from "@/lib/demo-accounts";
import { safeNextPath } from "@/lib/next-path";
import { validatePassword } from "@/lib/password";
import { getOrigin } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

/** Thresholds, deliberately generous for humans but hostile to scripts. */
const SIGN_IN_MAX = 8;
const SIGN_IN_WINDOW = 15 * 60;
const SIGN_IN_IP_MAX = 40;
const SIGNUP_IP_MAX = 5;
const SIGNUP_IP_WINDOW = 60 * 60;
const RESET_MAX = 3;
const RESET_WINDOW = 60 * 60;

const INVALID_CREDENTIALS = "That email and password combination was not recognised.";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * Supabase distinguishes "no such account" from "wrong password" and reports
 * unconfirmed accounts, rate limits and invalid domains in plain text. None of
 * that should reach the sign-in form, so every failure looks the same.
 */
function signInFailure(): ActionState {
  return failure(INVALID_CREDENTIALS, { password: INVALID_CREDENTIALS });
}

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const next = safeNextPath(value(formData, "next"), "/profile");

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "Enter your email address.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) {
    return failure("Check the highlighted fields.", fieldErrors);
  }

  const ip = await clientAddress();

  const perAccount = await rateLimit(
    signInBucket(email),
    SIGN_IN_MAX,
    SIGN_IN_WINDOW,
  );
  if (!perAccount.allowed) {
    return failure(retryAfterMessage(perAccount.retryAfterSeconds));
  }

  const perIp = await rateLimit(signInIpBucket(ip), SIGN_IN_IP_MAX, SIGN_IN_WINDOW);
  if (!perIp.allowed) {
    return failure(retryAfterMessage(perIp.retryAfterSeconds));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Rate limited by Supabase itself, or anything else unexpected: stay vague.
    if (/rate limit|too many|over_request_rate/i.test(error.message)) {
      return failure(
        "Too many sign-in attempts. Wait a few minutes and try again.",
      );
    }
    console.error("sign-in failed:", error.message);
    return signInFailure();
  }

  // Good credentials: forgive earlier failures on this account.
  await clearRateLimit(signInBucket(email));

  redirect(next);
}

export async function demoSignIn(role: DemoRole, formData: FormData) {
  const account = findDemoAccount(role);
  if (!account) {
    redirect(`/login?error=${encodeURIComponent("unknown-demo-account")}`);
  }

  const next = safeNextPath(value(formData, "next"), account.landing);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: DEMO_PASSWORD,
  });

  if (error) {
    console.error(`demo sign-in failed (${account.role}):`, error.message);
    redirect(`/login?error=${encodeURIComponent("demo-unavailable")}`);
  }

  redirect(next);
}

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fullName = value(formData, "full_name");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const confirmPassword = value(formData, "confirm_password");
  const next = safeNextPath(value(formData, "next"), "/profile");

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.full_name = "Tell us your name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }
  const passwordProblem = validatePassword(password);
  if (passwordProblem) fieldErrors.password = passwordProblem;
  if (confirmPassword && confirmPassword !== password) {
    fieldErrors.confirm_password = "Passwords do not match.";
  }
  if (Object.keys(fieldErrors).length) {
    return failure("Check the highlighted fields.", fieldErrors);
  }

  // Email confirmation is currently disabled project-wide, so an unverified
  // address can collect reputation points. Cap how many accounts one client can
  // create per hour.
  const signupLimit = await rateLimit(
    signupIpBucket(await clientAddress()),
    SIGNUP_IP_MAX,
    SIGNUP_IP_WINDOW,
  );
  if (!signupLimit.allowed) {
    return failure(retryAfterMessage(signupLimit.retryAfterSeconds));
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // `role` is deliberately omitted: staff roles can only be granted by an admin.
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    if (/already registered|already been registered/i.test(error.message)) {
      return failure("An account already exists for that email address.", {
        email: "Try signing in instead.",
      });
    }
    if (/rate limit|too many|over_request_rate/i.test(error.message)) {
      return failure(
        "Too many accounts created from this device. Try again later.",
      );
    }
    console.error("sign-up failed:", error.message);
    return failure(errorMessage(error, "Could not create your account."));
  }

  // No session means the project requires email confirmation; the confirm link
  // is emailed to the address above.
  if (data.session) redirect(next);

  return success(
    "Account created. Check your inbox to confirm your email address, then sign in.",
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = value(formData, "email").toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return failure("Enter a valid email address.", {
      email: "Enter a valid email address.",
    });
  }

  const limit = await rateLimit(resetBucket(email), RESET_MAX, RESET_WINDOW);
  if (!limit.allowed) {
    return failure(retryAfterMessage(limit.retryAfterSeconds));
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    // Log the real reason, but never show it: it distinguishes a known address
    // from an unknown one, and it can contain the address back to the user.
    console.error("password reset email failed:", error.message);
  }

  // Identical response whether or not the account exists.
  return success(
    "If an account exists for that address we have sent a password reset link.",
  );
}

export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = value(formData, "password");
  const confirm = value(formData, "confirm_password");

  const fieldErrors: Record<string, string> = {};
  const passwordProblem = validatePassword(password);
  if (passwordProblem) fieldErrors.password = passwordProblem;
  if (confirm && confirm !== password) {
    fieldErrors.confirm_password = "Passwords do not match.";
  }
  if (Object.keys(fieldErrors).length) {
    return failure("Check the highlighted fields.", fieldErrors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("password update failed:", error.message);
    return failure(
      /session|token|expired/i.test(error.message)
        ? "This reset link has expired. Request a new one."
        : "Could not update your password.",
    );
  }

  return success("Password updated. You can now use it to sign in.");
}
