"use client";

import { useState, useTransition } from "react";

import { updateProfileFields } from "@/app/actions/admin";
import {
  AGE_BANDS,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUSES,
  GENDERS,
  GEOGRAPHIES,
} from "@/lib/utils";
import type { Profile } from "@/lib/types";

type Field = "full_name" | "country" | "age_band" | "gender" | "employment" | "education";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [values, setValues] = useState<Record<Field, string>>({
    full_name: profile.full_name ?? "",
    country: profile.country ?? "",
    age_band: profile.age_band ?? "",
    gender: profile.gender ?? "",
    employment: profile.employment ?? "",
    education: profile.education ?? "",
  });
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty =
    values.full_name !== (profile.full_name ?? "") ||
    values.country !== (profile.country ?? "") ||
    values.age_band !== (profile.age_band ?? "") ||
    values.gender !== (profile.gender ?? "") ||
    values.employment !== (profile.employment ?? "") ||
    values.education !== (profile.education ?? "");

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const outcome = await updateProfileFields(values);
      setMessage(
        outcome.ok
          ? { tone: "ok", text: "Profile updated." }
          : { tone: "err", text: outcome.error },
      );
    });
  };

  const select = (field: Field, label: string, options: readonly string[]) => (
    <div>
      <label className="label" htmlFor={field}>
        {label}
      </label>
      <select
        id={field}
        name={field}
        value={values[field]}
        onChange={(event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))}
        className="field"
      >
        <option value="">Not stated</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={save} className="card card-pad space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">
            Display name
          </label>
          <input
            id="full_name"
            name="full_name"
            value={values.full_name}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, full_name: event.target.value }))
            }
            className="field"
          />
          <p className="hint mt-1">This is the name shown on the leaderboard.</p>
        </div>
        {select("country", "Country", GEOGRAPHIES)}
        {select("age_band", "Age band", AGE_BANDS)}
        {select("gender", "Gender", GENDERS)}
        {select("employment", "Employment", EMPLOYMENT_STATUSES)}
        {select("education", "Education", EDUCATION_LEVELS)}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
        <p
          role="status"
          className={`text-sm ${
            message?.tone === "err" ? "text-brand-700" : "text-emerald-700"
          }`}
        >
          {message?.text ?? ""}
        </p>
        <button type="submit" disabled={!dirty || pending} className="btn btn-primary btn-sm">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
