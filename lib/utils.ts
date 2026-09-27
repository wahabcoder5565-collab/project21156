import type { PollStatus, QuestionType } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const nf = new Intl.NumberFormat("en-GB");

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "0";
  return nf.format(value);
}

export function compactNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "0";
  if (Math.abs(value) < 1000) return nf.format(value);
  return new Intl.NumberFormat("en-GB", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | null | undefined) {
  if (!value) return "\u2014";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return dateFmt.format(d);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "\u2014";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return dateTimeFmt.format(d);
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "\u2014";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function daysUntil(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export function closesLabel(value: string | null | undefined) {
  const days = daysUntil(value);
  if (days === null) return "No closing date";
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  if (days < 31) return `${days} days left`;
  return `Closes ${formatDate(value)}`;
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstName(name: string | null | undefined) {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0];
}

export const STATUS_META: Record<
  PollStatus,
  { label: string; className: string; dot: string }
> = {
  fielding: {
    label: "Live",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
  },
  closed: {
    label: "Closed",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  archived: {
    label: "Archived",
    className: "bg-slate-100 text-slate-500 ring-slate-500/20",
    dot: "bg-slate-300",
  },
};

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  scale: "Opinion scale",
  text: "Open response",
};

export function percentOf(part: number, whole: number) {
  if (!whole) return 0;
  return Math.min(100, Math.round((100 * part) / whole));
}

export function pluralize(count: number, singular: string, plural?: string) {
  return `${formatNumber(count)} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export const CATEGORIES = [
  "Politics",
  "Technology",
  "Economy",
  "Environment",
  "Health",
  "Society",
  "Business",
  "Sport",
  "Culture",
] as const;

export const GEOGRAPHIES = [
  "Global",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Poland",
  "India",
  "Japan",
  "Brazil",
  "Mexico",
] as const;

export const AGE_BANDS = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

export const GENDERS = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer to self-describe",
  "Prefer not to say",
] as const;

export const EMPLOYMENT_STATUSES = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Unemployed",
  "Student",
  "Retired",
  "Other",
] as const;

export const EDUCATION_LEVELS = [
  "No qualifications",
  "Secondary school",
  "A-levels or equivalent",
  "Undergraduate degree",
  "Postgraduate degree",
  "Doctorate",
] as const;

export const POLITICAL_VIEWS = [
  "Very left",
  "Left",
  "Centre-left",
  "Centre",
  "Centre-right",
  "Right",
  "Very right",
  "Prefer not to say",
] as const;

export const POLL_STATUS_OPTIONS: { value: PollStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "fielding", label: "Live" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export const CHART_PALETTE = [
  "#e4004b",
  "#0ea5e9",
  "#16a34a",
  "#f59e0b",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#64748b",
];

export function optionColor(option: { color: string | null }, index: number) {
  return option.color || CHART_PALETTE[index % CHART_PALETTE.length];
}
