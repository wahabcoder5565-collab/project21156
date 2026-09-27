export const DEMO_PASSWORD = "Polls2024!demo";

export type DemoRole = "member" | "researcher" | "admin";

export type DemoAccount = {
  role: DemoRole;
  email: string;
  label: string;
  blurb: string;
  /** Where a one-click sign in lands when no explicit `next` is supplied. */
  landing: string;
};

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    role: "member",
    email: "you@youpulse.app",
    label: "Member",
    blurb: "Take polls and earn points",
    landing: "/polls",
  },
  {
    role: "researcher",
    email: "researcher@youpulse.app",
    label: "Researcher",
    blurb: "Build and publish polls",
    landing: "/studio",
  },
  {
    role: "admin",
    email: "admin@youpulse.app",
    label: "Admin",
    blurb: "Moderate members and polls",
    landing: "/admin",
  },
];

/** Resolves a client-supplied role to a known demo account, or null. */
export function findDemoAccount(role: unknown): DemoAccount | null {
  if (typeof role !== "string") return null;
  return DEMO_ACCOUNTS.find((account) => account.role === role) ?? null;
}
