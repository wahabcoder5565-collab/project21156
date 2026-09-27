import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

const ERROR_NOTICES: Record<string, string> = {
  "demo-unavailable":
    "We could not sign you in with that demo account. Use the form below instead.",
  "unknown-demo-account": "That demo account is not available.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = raw && raw.startsWith("/") ? raw : "/profile";
  const errorKey = Array.isArray(params.error) ? params.error[0] : params.error;
  const notice = errorKey ? ERROR_NOTICES[errorKey] : undefined;

  return <LoginForm next={next} notice={notice} />;
}
