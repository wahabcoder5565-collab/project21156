"use client";

import { useActionState } from "react";

import { signIn } from "@/app/actions/auth";
import {
  AuthShell,
  AuthLink,
  DemoAccounts,
  FieldError,
  FormAlert,
  SubmitButton,
} from "@/components/auth-ui";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, formAction] = useActionState(signIn, null);

  return (
    <AuthShell
      title="Welcome back"
      intro="Sign in to take part in polls and track your reputation."
      footer={
        <>
          New to YouPulse? <AuthLink href="/signup">Create an account</AuthLink>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        {notice ? <FormAlert state={{ status: "error", message: notice }} /> : null}
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
            defaultValue={next === "/profile" ? "you@youpulse.app" : ""}
            className="field"
            placeholder="you@example.com"
          />
          <FieldError message={state?.fieldErrors?.email} />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label className="label" htmlFor="password">
              Password
            </label>
            <AuthLink href="/forgot-password">Forgot password?</AuthLink>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            defaultValue={next === "/profile" ? "Polls2024!demo" : ""}
            className="field"
          />
          <FieldError message={state?.fieldErrors?.password} />
        </div>

        <SubmitButton label="Sign in" pendingLabel="Signing in…" />
      </form>

      <DemoAccounts />
    </AuthShell>
  );
}
