"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { demoSignIn, signIn } from "@/app/actions/auth";
import { FieldError, FormAlert } from "@/components/auth-ui";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { safeNextPath } from "@/lib/next-path";

function DemoButton({ label, blurb }: { label: string; blurb: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full items-center gap-3 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-left transition hover:border-brand-300 hover:bg-brand-50/60 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink-100 font-display text-[0.6875rem] font-bold uppercase tracking-wide text-ink-700 transition group-hover:bg-brand-600 group-hover:text-white">
        {label.slice(0, 2)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight text-ink-900">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-500">{blurb}</span>
      </span>
      {pending ? (
        <span
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600"
          aria-hidden
        />
      ) : (
        <svg
          viewBox="0 0 20 20"
          className="size-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
          fill="currentColor"
          aria-hidden
        >
          <path d="M7.5 4.5L13 10l-5.5 5.5z" />
        </svg>
      )}
      <span className="sr-only" role="status">
        {pending ? `Signing in as ${label}…` : `Sign in as ${label}`}
      </span>
    </button>
  );
}

function AccountButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark w-full">
      {pending ? "Signing in…" : label}
    </button>
  );
}

export function HeroSignIn({
  memberNext = "/polls",
}: {
  memberNext?: string;
}) {
  const [state, formAction] = useActionState(signIn, null);
  const [showFields, setShowFields] = useState(false);
  const next = safeNextPath(memberNext, "/polls");

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-100 bg-gradient-to-b from-white to-ink-50/60 px-5 py-4">
        <p className="eyebrow">Fast sign in</p>
        <p className="mt-1 text-sm text-ink-600">
          Jump straight in as a demo account — no typing needed.
        </p>
      </div>

      <div className="space-y-2 p-4">
        {DEMO_ACCOUNTS.map((account) => (
          <form
            key={account.role}
            action={demoSignIn.bind(null, account.role)}
          >
            <input
              type="hidden"
              name="next"
              value={account.role === "member" ? next : account.landing}
            />
            <DemoButton label={account.label} blurb={account.blurb} />
          </form>
        ))}
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-ink-200" />
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
            or
          </span>
          <span className="h-px flex-1 bg-ink-200" />
        </div>

        {!showFields ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowFields(true)}
              aria-expanded={false}
              className="btn btn-ghost w-full"
            >
              Sign in with your account
            </button>
            <p className="text-center text-xs text-ink-500">
              New here?{" "}
              <Link href="/signup" className="link">
                Join free
              </Link>
            </p>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <FormAlert state={state} />

            <div>
              <label className="label" htmlFor="hero-email">
                Email
              </label>
              <input
                id="hero-email"
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
              <div className="flex items-baseline justify-between gap-3">
                <label className="label" htmlFor="hero-password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-brand-700 hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                id="hero-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="field"
              />
              <FieldError message={state?.fieldErrors?.password} />
            </div>

            <AccountButton label="Sign in" />

            <p className="text-center text-xs text-ink-500">
              Demo password{" "}
              <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[0.6875rem] text-ink-700">
                {DEMO_PASSWORD}
              </code>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
