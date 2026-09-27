import type { Metadata } from "next";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create an account",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = raw && raw.startsWith("/") ? raw : "/profile";

  return <SignupForm next={next} />;
}
