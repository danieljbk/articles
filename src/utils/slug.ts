/**
 * Convert a content collection entry's `id` (e.g. "2026-05-05-tailscale-warp-on-macos")
 * into the URL slug we expose on the site (date prefix stripped).
 */
export function toUrlSlug(id: string): string {
  return id.replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

/**
 * Split a private entry id ("completed/2026-08-21-worms-with-extensions") into
 * its status directory and the URL slug. Private URLs are
 * `/private/<status>/<slug>`, so the status stays visible in the address.
 */
export function splitPrivateId(id: string): { status: string; slug: string } {
  const [status, ...rest] = id.split("/");
  return { status, slug: toUrlSlug(rest.join("/")) };
}
