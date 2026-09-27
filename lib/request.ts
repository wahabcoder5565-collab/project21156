import { headers } from "next/headers";

/** Absolute origin for the current request, used to build auth redirect URLs. */
export async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${proto}://${host}`;
}
