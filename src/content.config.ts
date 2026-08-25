import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),

  // Provenance grouping: articles written in the same conversation share a
  // session id, whether or not they share a subject. This is captured at write
  // time, not inferred later, and it is what keeps the archive navigable once
  // there are hundreds of pieces. Format: YYYY-MM-DD-<short-theme>.
  session: z.string().optional(),

  // Content links to other articles, by URL slug (no date prefix), naming
  // pieces on the same subject from other sessions. Declare one direction
  // only — the reverse is computed, so a link cannot rot on one side.
  related: z.array(z.string()).default([]),

  // Where a piece sits in the published hierarchy. Technology is the centre;
  // league is deliberately subordinate so it is browsable without reading as
  // equal in weight. Ignored while an article is private.
  section: z.enum(["technology", "science", "league"]).default("technology"),

  // Content that must never be publishable — real identifiers, live legal
  // matters. Deliberately top-level rather than inside `exposure`, because
  // publishing strips the exposure block and the marker has to survive that.
  // The public schema below narrows this to `false`, so a vault article
  // reaching the public collection fails the build rather than deploying.
  vault: z.boolean().default(false),
});

// An article's exposure assessment: a list of discrete threats, each named,
// categorised, and rated, so the panel is scannable rather than readable.
// Private-only by construction — the public schema below rejects the field, so
// a piece still carrying its own threat model fails the build.
const threatSchema = z.object({
  // Fixed vocabulary so categories stay consistent and greppable across the corpus.
  category: z.enum([
    "legal",       // lawsuits, discovery, evidence of prior knowledge
    "platform",    // terms-of-service enforcement, account action
    "security",    // hands an attacker a map or a foothold
    "privacy",     // identifiers, location, personal facts
    "physical",    // safety — address paired with what is worth taking
    "reputation",  // what the byline says about its author
    "pattern",     // corpus-level: what a theme across articles implies
  ]),
  threat: z.string(),
  severity: z.enum(["low", "moderate", "high"]),
  detail: z.string(),
});

const exposureSchema = z.object({
  // Empty means assessed and clean, which is different from unassessed.
  threats: z.array(threatSchema).default([]),
  // The verdict is a decision procedure, not a hedged opinion: conditions that
  // determine the answer, then the answer under each. `otherwise` is the
  // default branch and is required — there is always an answer.
  verdict: z.object({
    rules: z.array(z.object({ if: z.string(), then: z.string() })).default([]),
    otherwise: z.string(),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/articles" }),
  schema: articleSchema.extend({
    // Publishing strips the assessment. If one survives into the public
    // collection the build fails here, which is the guard that makes
    // "never publish this" structural rather than a rule someone remembers.
    exposure: z.never().optional(),
    // Independent of the exposure guard above, so stripping the assessment on
    // publish cannot also strip the thing that forbids publishing.
    vault: z.literal(false).default(false),
  }),
});

// Private articles live in the SIBLING `articles-private` repo, split into
// four status directories: `completed/` (finished pieces kept to be re-read),
// `drafts/` (working passes, superseded material), `archive/` (meta and
// time-bound pieces kept for reference but out of the way), and `vault/`
// (content that must never be publishable). The status is the first path
// segment of the entry id, so one collection covers all four. Rendered locally via
// `bun run dev:private` (sets INCLUDE_PRIVATE=1). Production builds on
// Cloudflare Pages have no sibling repo and no INCLUDE_PRIVATE flag, so
// nothing private ever ships.
const privateArticles = defineCollection({
  loader: glob({
    pattern: "{drafts,completed,archive,vault}/**/*.{md,mdx}",
    base: "../articles-private",
  }),
  schema: articleSchema.extend({ exposure: exposureSchema.optional() }),
});

export const collections = { articles, private: privateArticles };
