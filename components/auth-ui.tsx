"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full">
      {pending ? pendingLabel : label}
    </button>
  );
}

export function FormAlert({
  state,
}: {
  state: { status: string; message: string } | null;
}) {
  if (!state || !state.message) return null;
  const isError = state.status === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`rounded-xl px-3.5 py-3 text-sm ring-1 ring-inset ${
        isError
          ? "bg-brand-50 text-brand-900 ring-brand-600/25"
          : "bg-emerald-50 text-emerald-900 ring-emerald-600/20"
      }`}
    >
      {state.message}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-brand-700" role="alert">
      {message}
    </p>
  );
}

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  return <Submit label={label} pendingLabel={pendingLabel} />;
}

export function AuthShell({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="shell py-14">
      <div className="mx-auto max-w-md">
        <div className="card card-pad">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-ink-600">{intro}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-5 text-center text-sm text-ink-600">{footer}</p>
        <p className="mt-6 rounded-xl bg-ink-100/70 px-4 py-3 text-center text-xs leading-relaxed text-ink-600">
          Demo environment. Every account uses the password{" "}
          <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-ink-800">
            {DEMO_PASSWORD}
          </code>
          .
        </p>
      </div>
    </div>
  );
}

export function DemoAccounts() {
  return (
    <div className="mt-4 space-y-1.5">
      {DEMO_ACCOUNTS.map((account) => (
        <div
          key={account.email}
          className="flex items-center justify-between gap-3 text-xs text-ink-600"
        >
          <code className="font-mono">{account.email}</code>
          <span className="chip bg-white text-ink-500 ring-1 ring-inset ring-ink-200">
            {account.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="link">
      {children}
    </Link>
  );
}
