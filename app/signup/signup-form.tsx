"use client";

import { useActionState } from "react";

import { signUp } from "@/app/actions/auth";
import {
  AuthLink,
  AuthShell,
  FieldError,
  FormAlert,
  SubmitButton,
} from "@/components/auth-ui";
import { PASSWORD_MAX_BYTES, PASSWORD_MIN } from "@/lib/password";

export function SignupForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signUp, null);

  return (
    <AuthShell
      title="Join YouPulse"
      intro="Answer polls, earn points, and see what the country thinks. Free, and takes about a minute."
      footer={
        <>
          Already a member? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <FormAlert state={state} />

        <div>
          <label className="label" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            className="field"
            placeholder="Alex Morgan"
          />
          <FieldError message={state?.fieldErrors?.full_name} />
        </div>

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

        <div>
          <label className="label" htmlFor="password">
            Password
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
          <p className="hint mt-1">
            At least {PASSWORD_MIN} characters. A short phrase you can recall
            beats a scrambled word.
          </p>
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

        <SubmitButton label="Create account" pendingLabel="Creating account…" />

        <p className="text-xs leading-relaxed text-ink-500">
          By joining you agree to take part in research fieldwork. Your profile
          details are used to weight results so the panel stays representative.
        </p>
      </form>
    </AuthShell>
  );
}
