import type { Metadata } from "next";
import Link from "next/link";

import { requireStaff } from "@/lib/queries";
import { NewPollForm } from "./new-poll-form";

export const metadata: Metadata = {
  title: "New poll",
};

export default async function NewPollPage() {
  await requireStaff("/studio/new");

  return (
    <div className="shell max-w-3xl py-10">
      <nav className="text-xs text-ink-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/studio" className="hover:text-ink-800">
              Studio
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-700">New poll</li>
        </ol>
      </nav>

      <header className="mt-4">
        <p className="eyebrow">Create</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink-900">
          New poll
        </h1>
        <p className="mt-1.5 text-sm text-ink-600">
          Set the framing first, then add questions on the next screen.
        </p>
      </header>

      <div className="mt-7">
        <NewPollForm />
      </div>
    </div>
  );
}
