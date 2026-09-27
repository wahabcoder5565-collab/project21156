import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/queries";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.error) ? params.error[0] : params.error;

  if (raw) redirect("/login");

  // Reaching this page without a recovery session means the link expired.
  const user = await getUser();
  if (!user) redirect("/forgot-password");

  return <ResetPasswordForm />;
}
