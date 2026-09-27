"use client";

import Link from "next/link";
import { useState } from "react";

import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@/lib/types";

export type NavProfile = {
  fullName: string | null;
  avatarUrl: string | null;
  role: MemberRole;
  reputationPoints: number;
} | null;

type NavLink = { href: string; label: string };

export function UserMenu({ profile }: { profile: NavProfile }) {
  const [open, setOpen] = useState(false);

  if (!profile) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn btn-ghost btn-sm">
          Sign in
        </Link>
        <Link href="/signup" className="btn btn-primary btn-sm">
          Join free
        </Link>
      </div>
    );
  }

  const isStaff = profile.role === "admin" || profile.role === "researcher";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-ink-100"
      >
        <Avatar name={profile.fullName} src={profile.avatarUrl} size={32} />
        <span className="hidden text-sm font-semibold text-ink-800 sm:inline">
          {profile.fullName?.split(" ")[0] ?? "Account"}
        </span>
        <svg
          viewBox="0 0 20 20"
          className={cn(
            "size-4 text-ink-500 transition-transform",
            open && "rotate-180",
          )}
          fill="currentColor"
          aria-hidden
        >
          <path d="M5.5 7.5L10 12l4.5-4.5H5.5z" />
        </svg>
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lift"
          >
            <div className="border-b border-ink-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink-900">
                {profile.fullName ?? "YouPulse member"}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                {profile.reputationPoints.toLocaleString("en-GB")} points
                {isStaff ? ` · ${profile.role}` : ""}
              </p>
            </div>
            <nav className="p-1.5 text-sm">
              {[
                { href: "/profile", label: "My profile" },
                { href: "/polls?mine=1", label: "My polls" },
                { href: "/leaderboard", label: "Leaderboard" },
                ...(isStaff ? [{ href: "/studio", label: "Studio" }] : []),
                ...(profile.role === "admin"
                  ? [{ href: "/admin", label: "Admin" }]
                  : []),
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 font-medium text-ink-700 transition hover:bg-ink-50 hover:text-ink-900"
                >
                  {item.label}
                </Link>
              ))}
              <form action={signOut} className="mt-1 border-t border-ink-100 pt-1">
                <button
                  type="submit"
                  role="menuitem"
                  className="block w-full rounded-lg px-3 py-2 text-left font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
                >
                  Sign out
                </button>
              </form>
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle navigation"
        className="grid size-9 place-items-center rounded-lg text-ink-700 transition hover:bg-ink-100"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open ? (
        <nav className="absolute inset-x-0 top-full z-30 border-b border-ink-200 bg-white px-5 py-3 shadow-lift">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2.5 text-[0.9375rem] font-medium text-ink-800 transition hover:bg-ink-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
