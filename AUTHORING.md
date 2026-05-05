# Authoring articles

How to write content for this system. Aimed at a future Claude (or human) who has never seen this repo and needs to add an article without fighting the design.

## TL;DR

- Articles are Markdown (`.md`) files with YAML frontmatter.
- New articles land in **`articles-private/articles/`** (the sibling repo, private).
- Daniel says "publish this" to move them to **`articles/src/data/articles/`** (this repo, public).
- **Never write CSS, `<style>`, or layout HTML in articles.** The Astro app already styles every Markdown construct using shadcn design tokens. Writing CSS in articles means you didn't read this file.

## Where articles live

```
articles/                              ← THIS repo (public, deployed to articles.kwon.ai)
└── src/data/articles/
    └── YYYY-MM-DD-short-slug.md       ← public articles

articles-private/                      ← sibling repo (private)
└── articles/
    └── YYYY-MM-DD-short-slug.md       ← private articles, default landing zone
```

The Astro app reads from both via content collections. Public articles render at `/<slug>`, private ones (only when `INCLUDE_PRIVATE=1`) render at `/private/<slug>`.

## Frontmatter (required)

```yaml
---
title: "Article title"
description: "One-line summary, shown on the index and as the meta description."
pubDate: 2026-05-05
tags:
  - macos
  - networking
draft: false
---
```

Schema enforced by `src/content.config.ts`:

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Used in `<title>`, on the index, in OG tags |
| `description` | string | yes | One sentence; appears under the title and in meta tags |
| `pubDate` | date (`YYYY-MM-DD`) | yes | Sorts the index. UTC-formatted on render so the day stays stable across timezones |
| `updatedDate` | date | no | Optional revision date |
| `tags` | string[] | no | Defaults to `[]`. Lowercase, hyphenated |
| `draft` | bool | no | Defaults to `false`. `true` hides from index and routes |

**Slug convention:** filename `YYYY-MM-DD-short-slug.md`. The date prefix sorts files chronologically on disk; the URL slug strips the date (so `articles.kwon.ai/short-slug`).

## What the system gives you for free

The Astro app wraps every Markdown article in a styled prose container (`.prose.article-prose`). Every standard Markdown construct gets shadcn-tokened styling automatically. **Use plain Markdown — the styling is automatic.**

### Headings

```md
## Section heading
### Subsection
```

Sized via Tailwind Typography defaults, color-bound to `--foreground`, letter-spacing tightened, `scroll-margin-top` set so anchor jumps don't hide under the header.

### Paragraphs and emphasis

```md
A normal paragraph reads at the foreground color with comfortable line-height.

Use **bold** for emphasis and *italic* sparingly. Both keep the foreground color (no muted variant).
```

### Inline code and code blocks

````md
Inline code like `tailscale up` gets a subtle `secondary` background, a border, and slight padding — pill-style, monospace.

```bash
tailscale up --accept-routes=false
```

Code blocks get **Shiki** syntax highlighting (light/dark themes auto-swap). Always specify the language for highlighting: `bash`, `js`, `ts`, `json`, `yaml`, `astro`, `css`, `tsx`, etc.
````

### Links

```md
[Tailscale docs](https://tailscale.com/docs)
```

Foreground color, dashed-style underline that solidifies on hover (decoration uses the `--border` token).

### Lists

```md
- Bullet one
- Bullet two
  - Nested bullet

1. Numbered
2. List
```

Bullets/numbers in the muted-foreground color; item text in foreground.

### Tables

```md
| Option | Tradeoff |
|---|---|
| A | Pro and con |
| B | Pro and con |
```

Bordered, header row weighted; uses `--border` for cell borders.

### Blockquotes (the convention for callouts)

```md
> **Verdict.** The single most important takeaway, leading bold, then explanation.

> **Why this matters.** A second blockquote for a paired emphasis.
```

Renders as a left-bordered block, same foreground color as body, no italic. **This is the default callout pattern** — use blockquotes with a leading **bold lead-in** for verdicts, warnings, "what's deliverable," etc. Don't reach for custom HTML.

### Horizontal rules

```md
---
```

Renders as a thin border-color rule, separating major sections.

### Images

```md
![alt text](/images/foo.png)
```

Auto-rounded corners. Place images in `public/images/` and reference with absolute paths.

## What NOT to write in articles

- **No `<style>` tags, no inline `style="..."` attributes.** Ever.
- **No CSS classes.** No `class="..."` on elements (Markdown renders to plain HTML; styling comes from `.article-prose`).
- **No `<div>` wrappers** for visual effect. If you need structural grouping, use Markdown sections (headings split content); if you need a custom component, use MDX.
- **No fonts, no font-size overrides, no color overrides.** Geist Sans/Mono is the body font, foreground/muted-foreground are the only text colors. Don't fight them.
- **No re-emitted CSS reset, normalize, or anything that resets prose styling.**
- **No copy-button scripts inside articles.** Code-block UI is a system-level concern (Layout/components), not a per-article concern.

If you find yourself wanting to "make this section pop with a colored background," stop — that's an MDX-component request, not a Markdown task.

## When to use MDX

`.mdx` is the same as `.md` except you can import and use Astro/React components from `src/components/`. Reach for it ONLY when plain Markdown can't express what's needed and the styling is genuinely a system-level decision.

Examples where MDX would be appropriate:

- A custom `<Callout type="warning">` component if blockquote-as-callout becomes insufficient (it hasn't yet — don't preempt this).
- An interactive demo (very rare for an article archive).

Don't reach for MDX just to add CSS — that's still wrong. MDX is for *components*, not for inline styling. If you build a new component, add it to `src/components/` and document it in this file under "Custom components" below.

## Custom components

(None yet. Add documentation here when components land in `src/components/` that articles are expected to use.)

## When you've added something to the system

If you change `src/styles/global.css`, content schema, or add a component, **update this file in the same commit**. Future Claude sessions read this guide to learn the system; if it lags the system, it actively misleads.

## Diagnosing layout issues

If something in an article isn't rendering as expected, the order of investigation:

1. **Is it a Markdown syntax issue?** Check that headings have a space after `#`, lists have a space after `-`, fences have a language tag.
2. **Is it a frontmatter issue?** Run `bun run build` — schema validation errors print clearly.
3. **Is the prose styling broken?** Inspect the rendered element in devtools. Check that `--tw-prose-*` variables resolve to `hsl(var(--foreground))` etc. (not raw oklch values from typography plugin defaults).
4. **Specifically: prose color overrides not applying?** The override block in `global.css` is intentionally NOT inside `@layer components` because Tailwind v4's typography plugin emits `.prose` styles in `@layer utilities` (later, higher precedence). Unlayered styles beat layered ones — keep the override unlayered.
