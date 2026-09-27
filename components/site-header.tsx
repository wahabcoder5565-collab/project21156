import Link from "next/link";

import { MobileNav, UserMenu } from "@/components/user-menu";
import { getProfile } from "@/lib/queries";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="YouPulse home">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M3 13h2.6l2.2-6.4 3.1 11.2 2.7-8.1 1.6 3.3H21v2.2h-6.4l-1.1-2.2-3.4 10.2L6.4 15H3v-2z" />
        </svg>
      </span>
      <span className="font-display text-[1.0625rem] font-bold tracking-tight text-ink-900">
        You<span className="text-brand-600">Pulse</span>
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const profile = await getProfile();
  const isStaff =
    profile?.role === "admin" || profile?.role === "researcher";

  const links = [
    { href: "/polls", label: "Polls" },
    { href: "/leaderboard", label: "Leaderboard" },
    ...(isStaff ? [{ href: "/studio", label: "Studio" }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-white/85 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <UserMenu
            profile={
              profile
                ? {
                    fullName: profile.full_name,
                    avatarUrl: profile.avatar_url,
                    role: profile.role,
                    reputationPoints: profile.reputation_points,
                  }
                : null
            }
          />
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
