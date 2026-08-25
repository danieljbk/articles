import { getCollection } from "astro:content";
import { toUrlSlug, splitPrivateId } from "@/utils/slug";

export interface Linked {
  title: string;
  description: string;
  href: string;
  scope: "private" | "published";
  status?: string;
}

/**
 * Every connection an article has, resolved into things that can be clicked.
 *
 * Three kinds, because "linked" means three different things:
 *   - session   — written in the same conversation. Provenance, not subject.
 *   - related   — same subject, different conversation. Declared in one
 *                 direction; the reverse is derived here so the two sides
 *                 cannot disagree.
 *   - counterpart — the same article existing in both collections, matched on
 *                 slug. Needs no field: identical slugs across collections are
 *                 by definition the same piece.
 *
 * Only ever called from private routes. A published page must not enumerate
 * private siblings — that would leak their titles to anyone reading the
 * public site.
 */
export async function getConnections(slug: string, session?: string, related: string[] = []) {
  const privateArticles = await getCollection("private", ({ data }) => !data.draft);
  const publicArticles = await getCollection("articles", ({ data }) => !data.draft);

  const all: (Linked & { slug: string; session?: string; related: string[] })[] = [
    ...privateArticles.map(a => {
      const { status, slug } = splitPrivateId(a.id);
      return {
        slug,
        title: a.data.title,
        description: a.data.description,
        href: `/private/${status}/${slug}`,
        scope: "private" as const,
        status,
        session: a.data.session,
        related: a.data.related,
      };
    }),
    ...publicArticles.map(a => {
      const slug = toUrlSlug(a.id);
      return {
        slug,
        title: a.data.title,
        description: a.data.description,
        href: `/${slug}`,
        scope: "published" as const,
        session: a.data.session,
        related: a.data.related,
      };
    }),
  ];

  const self = all.find(a => a.slug === slug && a.scope === "private");

  const counterpart = all.filter(a => a.slug === slug && a !== self);

  const sameSession = session
    ? all.filter(a => a.session === session && a.slug !== slug && a.scope === "private")
    : [];

  // Declared outward, plus anything declaring this article — one direction
  // authored, both directions navigable.
  const relatedSlugs = new Set([
    ...related,
    ...all.filter(a => a.related.includes(slug)).map(a => a.slug),
  ]);
  const relatedTo = all.filter(
    a => relatedSlugs.has(a.slug) && a.slug !== slug && a.scope === "private"
  );

  return { counterpart, sameSession, relatedTo };
}
