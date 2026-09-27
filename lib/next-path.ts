/**
 * Keeps a user-supplied redirect inside the app. Safe to use from both server
 * and client components, so it must not depend on `next/headers`.
 */
export function safeNextPath(value: unknown, fallback = "/profile") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  return value;
}
