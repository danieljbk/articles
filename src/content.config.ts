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

// Private articles live in the SIBLING `articles-private` repo at
// `../articles-private/articles/`. They're rendered locally via
// `bun run dev:private` (sets INCLUDE_PRIVATE=1). Production builds on
// Cloudflare Pages have no sibling repo and no INCLUDE_PRIVATE flag, so
// nothing private ever ships.
const privateArticles = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "../articles-private/articles",
  }),
  schema: articleSchema,
});

export const collections = { articles, private: privateArticles };
