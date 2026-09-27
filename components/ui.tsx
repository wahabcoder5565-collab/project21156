import type { ReactNode } from "react";

import { cn, initials, STATUS_META } from "@/lib/utils";
import type { PollStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: PollStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span
      className={cn(
        "chip ring-1 ring-inset",
        meta.className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "chip bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200/70",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="card card-pad">
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-semibold tabular-nums",
          accent ? "text-brand-600" : "text-ink-900",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-ink-500">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-ink-600">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "bg-sky-50 text-sky-900 ring-sky-600/20",
    success: "bg-emerald-50 text-emerald-900 ring-emerald-600/20",
    warning: "bg-amber-50 text-amber-900 ring-amber-600/20",
    error: "bg-brand-50 text-brand-900 ring-brand-600/25",
  } as const;

  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-sm ring-1 ring-inset",
        tones[tone],
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={cn(title && "mt-0.5", "text-[0.9375rem]")}>{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card card-pad flex flex-col items-center gap-3 py-14 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-ink-100 text-ink-500">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
          />
        </svg>
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-ink-600">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 40,
}: {
  name: string | null;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-1 ring-ink-200"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-ink-900 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Progress({
  value,
  max,
  tone = "brand",
  className,
}: {
  value: number;
  max: number;
  tone?: "brand" | "emerald" | "ink";
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (100 * value) / max)) : 0;
  const tones = {
    brand: "bg-brand-600",
    emerald: "bg-emerald-500",
    ink: "bg-ink-800",
  } as const;
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink-100", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function MetaRow({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-500">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-sm font-medium text-ink-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
