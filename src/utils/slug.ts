/**
 * Convert a content collection entry's `id` (e.g. "2026-05-05-tailscale-warp-on-macos")
 * into the URL slug we expose on the site (date prefix stripped).
 */
export function toUrlSlug(id: string): string {
  return id.replace(/^\d{4}-\d{2}-\d{2}-/, "");
}
