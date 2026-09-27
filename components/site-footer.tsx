import Link from "next/link";

import { Logo } from "@/components/site-header";

const columns = [
  {
    title: "Participate",
    links: [
      { href: "/polls", label: "Live polls" },
      { href: "/polls?status=closed", label: "Closed polls" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/profile", label: "My dashboard" },
    ],
  },
  {
    title: "Research",
    links: [
      { href: "/studio", label: "Poll studio" },
      { href: "/polls?mine=1", label: "My fieldwork" },
      { href: "/signup", label: "Join the panel" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/", label: "About YouPulse" },
      { href: "/admin", label: "Admin" },
      { href: "/login", label: "Sign in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-ink-200 bg-white">
      <div className="shell py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-600">
              YouPulse is a public opinion platform. Members answer short polls,
              earn points, and see what the country thinks in near real time.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-500">
                {column.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-600 transition hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-ink-100 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} YouPulse. Demo environment.</p>
          <p>
            Sample data for demonstration. Not a real opinion poll.
          </p>
        </div>
      </div>
    </footer>
  );
}
