"use client";

import { useActionState } from "react";

import { requestPasswordReset } from "@/app/actions/auth";
import {
  AuthLink,
  AuthShell,
  FieldError,
  FormAlert,
  SubmitButton,
} from "@/components/auth-ui";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, null);

  return (
    <AuthShell
      title="Reset your password"
      intro="Enter the email address on your account and we will send you a reset link."
      footer={
        <>
          Remembered it? <AuthLink href="/login">Back to sign in</AuthLink>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <FormAlert state={state} />
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field"
            placeholder="you@example.com"
          />
          <FieldError message={state?.fieldErrors?.email} />
        </div>
        <SubmitButton label="Send reset link" pendingLabel="Sending…" />
      </form>
    </AuthShell>
  );
}
