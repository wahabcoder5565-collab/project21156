"use client";

import { useActionState } from "react";

import { updatePassword } from "@/app/actions/auth";
import {
  AuthLink,
  AuthShell,
  FieldError,
  FormAlert,
  SubmitButton,
} from "@/components/auth-ui";
import { PASSWORD_MAX_BYTES, PASSWORD_MIN } from "@/lib/password";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePassword, null);

  return (
    <AuthShell
      title="Choose a new password"
      intro="Pick something you have not used before. You will stay signed in afterwards."
      footer={
        <>
          Need a new link? <AuthLink href="/forgot-password">Request another</AuthLink>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <FormAlert state={state} />

        <div>
          <label className="label" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX_BYTES}
            className="field"
          />
          <FieldError message={state?.fieldErrors?.password} />
        </div>

        <div>
          <label className="label" htmlFor="confirm_password">
            Confirm password
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX_BYTES}
            className="field"
          />
          <FieldError message={state?.fieldErrors?.confirm_password} />
        </div>

        <SubmitButton label="Update password" pendingLabel="Updating…" />

        {state?.status === "success" ? (
          <p className="text-center text-sm text-ink-600">
            <AuthLink href="/profile">Go to your profile</AuthLink>
          </p>
        ) : null}
      </form>
    </AuthShell>
  );
}
