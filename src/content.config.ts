import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/articles" }),
  schema: articleSchema,
});

// Private articles live in the SIBLING `articles-private` repo, split into
// `drafts/` (working passes, superseded material) and `completed/` (finished
// pieces kept to be re-read). The status is the first path segment of the
// entry id, so one collection covers both. Rendered locally via
// `bun run dev:private` (sets INCLUDE_PRIVATE=1). Production builds on
// Cloudflare Pages have no sibling repo and no INCLUDE_PRIVATE flag, so
// nothing private ever ships.
const privateArticles = defineCollection({
  loader: glob({
    pattern: "{drafts,completed}/**/*.{md,mdx}",
    base: "../articles-private",
  }),
  schema: articleSchema,
});

export const collections = { articles, private: privateArticles };
