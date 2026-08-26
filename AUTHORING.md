# Authoring articles

How to write content for this system. Aimed at a future Claude (or human) who has never seen this repo and needs to add an article without fighting the design.

## TL;DR

- Articles are Markdown (`.md`) files with YAML frontmatter.
- **Private is the default — everything.** Every article goes to **`articles-private/completed/`**, git-tracked and pushed to a private repo, rendered locally. Nothing is published unless Daniel asks for that specific piece. See [Where an article goes](#where-an-article-goes).
- **Quote him verbatim.** Articles are private, so his own words belong in them. See [His words](#his-words).
- Preview any article with **`bun run open <slug>`** — it starts the dev server and opens the page. See [Previewing an article](#previewing-an-article).
- **Sections are numbered automatically** — never write numbers into headings. See [Section numbering](#section-numbering).
- **Never write CSS, `<style>`, or layout HTML in articles.** The Astro app already styles every Markdown construct using shadcn design tokens. Writing CSS in articles means you didn't read this file.

## Where articles live

```
articles/                              ← THIS repo (the Astro app; deploys to articles.kwon.ai)
└── src/data/articles/
    └── YYYY-MM-DD-short-slug.md       ← ONLY pieces Daniel asked to share

articles-private/                      ← sibling repo (private) — where articles live
├── completed/
│   └── YYYY-MM-DD-short-slug.md       ← every finished piece
└── drafts/
    └── YYYY-MM-DD-short-slug.md       ← working passes, superseded material
```

The Astro app reads from both via content collections. Private articles (only when `INCLUDE_PRIVATE=1`) render at `/private/<status>/<slug>`; anything in the public collection renders at `/<slug>` and is world-visible once pushed.

## Where an article goes

**Every article gets an attack-surface assessment before it goes anywhere, and
Claude makes the call.** Clean pieces are published to
`articles/src/data/articles/` and pushed. Anything carrying attack surface goes
to `articles-private/completed/` and stays there. The assessment is reported to
Daniel either way — that reporting is the point of the system, not a formality.

The assessment is a threat model, not a topic check. It states what the piece
discloses, who could use it and how, a severity, a verdict, and anything
stripped to make publication possible. Severity runs **none** / **low** /
**moderate** / **high**, where high means concrete legal, financial, account,
or physical exposure.

**Report before publishing anything that isn't obviously clean.** Science and
world-explanation can publish and report in the same breath. Everything else
gets the report first, because a report on a live article is a post-mortem.

Every assessment is appended to the `publishing-security-review` article in
`articles-private/completed/`.

### Why the subject of an article isn't the test

The previous version of this system tested each article's *subject* and
published anything that was about the world rather than about Daniel. That test
is wrong, and it is worth understanding why, because it looks correct.

A single article about black hole mergers discloses nothing personal, and
publishing it costs nothing — curiosity about astrophysics is not an attack
surface. The subject test fails somewhere more specific: an article documenting
research into a *particular technology* is a dated, public record that its
author knew about that technology. If they later build anything in that space,
the article is discoverable evidence of prior knowledge, and someone in a
dispute with them can point at it.

That is why the floor is private rather than the routing being cleverer. The
question when sharing a piece is not "is the topic personal" but "what does
this give someone who wants to come after me." Science is generally clean.
Anything adjacent to what might get built is not.

### The content test, for sharing

The old routing checklist still exists, but it now answers a different
question: *if Daniel asks to share this piece, what has to come out first?*

| # | Category | Examples |
|---|---|---|
| 1 | Anything about Daniel personally | biography, location, health, finances, family, relationships, schedule, his own skill or performance |
| 2 | His projects and work | unreleased products, business plans, Walaco LLC, career strategy, private-repo code, monetization |
| 3 | Infrastructure and operations | hostnames, IPs, file paths, machine setup, network topology, security posture, anything credential-adjacent |
| 4 | Other people | named friends or family, private conversations, interpersonal analysis |
| 5 | Real identifiers | addresses, policy or account numbers, case numbers |
| 6 | Superseded working drafts | a first pass kept for the record after the finished piece exists |
| 7 | Dated evidence of what he investigated | a piece documenting research into a specific technology or technique, which becomes discoverable proof of prior knowledge if he later builds in that space |

Strip or generalize whatever it catches, and say in one line what came out.
Uncertain counts as unshareable.

> **The originating question is shareable; the personal circumstance behind it
> is not.** "The question came from learning about gravitational waves" is
> fine. "The question came up while dealing with *[private situation]*" is not
> — generalize the framing or drop it.

## Article format

An article is a **record of an exploration**, not only an explainer. Daniel has
to be able to come back years later and reconstruct where he was coming from,
what he proposed, and where it went — while the piece still reads as something
he can hand to anyone.

The `worms-with-extensions` and `black-hole-size-gravitational-waves` articles
are the reference implementations. The shape:

1. **Open with the claim or the tension.** No conversational preamble, no
   restating the question back.
2. **`## Where this came from`** — the originating question and proposal. In a
   private article this is block-quoted verbatim; in a public one it is
   rewritten for a reader, keeping his terminology. See below.
3. **The body**, organized by the logic of the subject.
4. **`## What this leaves open`** — the live frontier: what's unsettled, what
   the next question is. This is what makes it a record rather than a lecture.
5. **`## Sources`** — links, with what each one supports.

### His words

**Quote him verbatim.** Articles are private, so the faithful record is the
default and there is no sanitized counterpart to maintain.

His phrasing is his understanding; converting it swaps in an interpretation of
what he meant for his statement of it. It also preserves his calibration — a
tentative "maybe it's like the size of the solar system" stays tentative, so
you never have to judge how firmly something was held and can't accidentally
firm it up. And it stops you strawmanning him: an early draft fused "the black
holes must be pretty big" with a separate "maybe it's like the size of the
solar system" into one confident heading, then refuted a proposal he never
made.

Allowed inside a quote: cleaning dictation artifacts, cutting a passage, small
readability edits. Not allowed: recasting into your own prose, tightening it
into a thesis, or promoting it into a heading you composed.

**The public register applies only when he asks to share a piece.** Then, and
only then: never paste raw conversation. Keep his distinctive terminology for
the *idea* — "a cylinder within a cylinder", "worms with extensions" — because
that is what makes it his thinking rather than a summary of it, but compose the
surrounding prose for a reader and drop everything that is about *him* rather
than the subject: emotional register, ideology, stated confidence or doubt,
admitted mistakes, self-appraisal.

Two rules about how the surrounding explanation gets written:

- **Organize around the substance; never soften the verdict.** Don't make
  corrections the skeleton of a section and don't grade his thinking — but when
  something is wrong, say so plainly in the first sentence that addresses it,
  and quantify the error where that is checkable ("overshoots by a factor of
  around 40 million" beats "off by orders of magnitude"). Then split the
  conclusion from the reasoning; the reasoning is usually what survives.
  **Never manufacture partial credit** — an adjacent true fact is not a
  half-win, and a tidy "right about X, inverted about Y" reads as flattery
  unless the halves are genuinely comparable.
- **Voice is explanatory second person, where "you" is any reader.** "The room
  you are sitting in" is fine. "Your guess", "you asked", "as you mentioned"
  are not — they presume a conversation the reader wasn't in.

## Sharing an article

Articles are shared as **documents, not links**. There is no unlisted URL and no
public deployment path for private work: you export a PDF and send it to a
specific person. Nothing is hosted, nothing can be enumerated, and nothing gets
forwarded by accident because a link leaked.

Every private article page has a **save as pdf** button in its header. Clicking
it opens a blocking confirmation showing that article's own exposure assessment
— every threat with its category, severity, and detail, plus the verdict — and
only an explicit *Export as PDF* proceeds to the browser's print dialog, where
the destination is "Save as PDF".

The gate exists because **exporting is the moment of disclosure**. The document
goes to a person who keeps it and can pass it on, so the assessment has to be in
front of you then rather than filed somewhere you would have to remember to
check.

### What the PDF does and does not contain

The exposure panel is **hidden when printing**, deliberately. Handing someone the
article together with its own threat model would be worse than publishing the
article. Two independent selectors enforce this — the panel's `aria-label` and a
`data-print-hide` attribute on the component.

Also dropped: the site header and footer, the contents list, the connected-
articles navigation, the private/status badges, and the dialog itself. Anything
marked `data-print-hide` disappears. The publication date is re-emitted in a
print-only element so the document still carries it.

The print stylesheet forces the light palette regardless of the viewer's theme,
drops every background fill, and reduces borders to hairlines — a dark page
would otherwise print as a solid rectangle, and this printer already runs dark.
External link destinations are appended in parentheses after the link text,
since a link is dead on paper. Headings avoid breaking away from their
following content, and code blocks, tables, and blockquotes avoid breaking
internally.

All of it lives in the `@media print` block at the bottom of
`src/styles/global.css`.

### Redaction is deliberately not offered

Considered and rejected on 2026-08-25. Marking sections sensitive and hiding
them in the PDF sounds cheap and is not, for two reasons.

**Visual covering is not redaction.** Blurring or black-barring in CSS leaves
the text in the PDF as selectable, copyable data underneath — the most repeated
redaction failure in the real world. `filter: blur()` may force rasterization
and destroy the text in some browsers, but depending on a rendering side-effect
for a security property is unsound: it fails silently, and only in the copy
already sent. A sound version has to remove the content server-side so it never
enters the DOM.

**A redacted document announces its own gaps.** The recipient sees that
something was removed and usually infers what kind of thing. That trade makes
sense for an institution compelled to produce a document; it does not for
someone choosing each recipient and each file. When a section is genuinely
dangerous, the answer is not to send that document.

The existing tool for the same job is the public-register rewrite — his
terminology for the idea, nothing about him. More expensive, and correct.

## Section numbering

Every `h2` renders as **N** and every `h3` as **N.M**, generated by CSS
counters in `src/styles/global.css`. The table of contents carries the same
numbers.

These are **addresses**. They exist so Daniel can say "rewrite 4.2" or "cut the
last paragraph of 9" and have it mean exactly one place. That makes editing
over a distance possible without a comment system.

- **Never write numbers into the Markdown headings.** They are generated, so
  inserting or reordering a section renumbers everything automatically and the
  numbers can't drift from the document.
- To map a number back to the source: `grep -n '^## ' <file> | nl`.
- Give every section a distinct, meaningful title — a numbered list of vague
  titles is not addressable in practice.
- Use `###` rather than `####` for a subsection worth pointing at; `h4` is not
  numbered.

## The index

The article index at `/` supports full-text search (Pagefind), tag filtering,
and sorting — newest, oldest, or A–Z. Search, tag, and sort all persist to the
URL (`?q=`, `?tag=`, `?sort=`), so any particular view is linkable. Sorting is
client-side and reorders the existing rows, so it composes with whatever filter
is active.


## Previewing an article

```bash
bun run open <slug>
```

One command, from anywhere in the repo. It starts the dev server if one isn't
already running, waits until the page actually responds, and opens it in the
browser. A warm re-open takes about 150ms.

The slug is forgiving — all four of these reach the same page:

```bash
bun run open black-hole-size-gravitational-waves
bun run open 2026-08-21-black-hole-size-gravitational-waves
bun run open 2026-08-21-black-hole-size-gravitational-waves.md
bun run open ../articles-private/completed/2026-08-22-black-hole-size-gravitational-waves.md
```

| Command | Result |
|---|---|
| `bun run open <slug>` | Opens that article |
| `bun run open` | Opens the article index |
| `bun run open --stop` | Shuts the dev server down |
| `PORT=4322 bun run open <slug>` | Uses a different port |

**It works out private-vs-public itself** by finding the source file: something
in `../articles-private/completed/` opens at `/private/completed/<slug>`,
something in `drafts/` at `/private/drafts/<slug>`, and something in
`src/data/articles/` at `/<slug>`. When a slug exists both as an archive copy
and as a published article, the private one opens and the published URL is
printed alongside it. The same command therefore keeps
working after a publish moves the file. An unknown slug fails with a list of
near matches rather than a 404 in the browser.

The server always runs with `INCLUDE_PRIVATE=1`, so drafts are always visible
locally. That flag is never set in the Cloudflare build, so nothing private can
reach production regardless of how the local server was started.

**If you are Claude: run this yourself after writing an article.** Do not print
the command and ask Daniel to run it — the deliverable is the open page, not
instructions for reaching it.

Background state, so nothing is mysterious later: the server's pid is recorded
in `.astro/dev-server.pid` and its output goes to `.astro/dev-server.log` (both
gitignored). `bun run open --stop` kills the server and its child process. The
script itself is `scripts/open-article.sh`.

## Frontmatter

```yaml
---
title: "Article title"
description: "The originating question — not a summary of the answer."
pubDate: 2026-08-25
session: 2026-08-25-short-theme
related:
  - some-other-slug
tags:
  - macos
  - networking
draft: false
exposure:
  threats:
    - category: legal
      threat: Short name for the threat
      severity: moderate
      detail: >-
        One or two sentences: who could use this, in what concrete scenario.
  verdict:
    rules:
      - if: some condition about your own intent or plans
        then: do not publish
    otherwise: publish
---
```

Schema enforced by `src/content.config.ts`:

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Used in `<title>`, on the index, in OG tags |
| `description` | string | yes | **Write it as the originating question**, so the index reads as a list of explored questions |
| `pubDate` | date | yes | Take it and the filename prefix from `date +%F` at write time, never from context — context goes stale across midnight |
| `session` | string | no | `YYYY-MM-DD-short-theme`. Groups articles by the conversation they came from. Set it on every new article; the private index groups by it |
| `related` | string[] | no | URL slugs (no date prefix) of articles on the same subject from *other* sessions. Declare one direction only — the reverse is computed |
| `section` | enum | no | `technology` (default), `science`, or `league`. League sorts below everything on the public index |
| `vault` | bool | no | `true` marks content that must never be publishable. The public schema narrows this to `false`, so a vault article reaching the public collection fails the build |
| `exposure` | object | no | The threat assessment. Private-only — the public schema rejects it outright |
| `updatedDate` | date | no | Optional revision date |
| `tags` | string[] | no | Defaults to `[]`. Lowercase, hyphenated |
| `draft` | bool | no | Defaults to `false`. `true` hides from index and routes |

### The exposure block

Every private article carries one. It renders as a panel above the article, so
Daniel sees it when the page opens and decides from there — reading an article
and deciding whether to publish it are separate acts.

`threats` is a list; each entry has four fields.

| Field | Values | Notes |
|---|---|---|
| `category` | `legal`, `platform`, `security`, `privacy`, `physical`, `reputation`, `pattern` | Fixed vocabulary so it stays greppable across the corpus |
| `threat` | string | A short name, not a sentence. It is scanned, not read |
| `severity` | `low`, `moderate`, `high` | High means concrete legal, financial, account, or physical exposure |
| `detail` | string | One or two sentences naming a concrete actor and scenario, never an abstract risk |

An empty `threats: []` means *assessed and clean*, which the panel renders
distinctly from *not yet assessed*. The overall rating shown in the corner is
derived from the worst threat, never stored.

`verdict` is a decision procedure, not an opinion. `rules` is a list of
`if`/`then` pairs; `otherwise` is required, because there is always an answer.
Never write "author's call" or "depends" — if the deciding condition is
something only Daniel knows, that condition *is* the `if`.

**Calibrate severity by what the consequence costs in time, not by how alarming
the method sounds.** A platform ban is recoverable; a lawsuit costs months. And
note that `pattern` and `reputation` threats are corpus-level — they grow as
more articles accumulate, so they are tracked in the
`publishing-security-review` article rather than settled once.

**Publishing strips the exposure block.** A public article must never carry its
own threat model.

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

### Colour is semantic, and only for status

The site is monochrome for prose, and that is deliberate. Colour carries exactly
one meaning here — **how much risk something represents** — on a traffic-light
scale:

| Token | Colour | Means |
|---|---|---|
| `--safe` | green | Nothing to weigh. `none` and `low` severity. |
| `--caution` | amber | Weigh it before acting. `moderate` severity. |
| `--destructive` | red | Stop. `high` severity, and vault content. |

Use `text-safe`, `text-caution`, `text-destructive` and their `border-*`
equivalents. All three are defined in every theme block, so they invert
correctly in dark mode.

**Colour is never the only signal.** The severity word is printed alongside it
everywhere, so nothing depends on colour perception.

**Never use colour decoratively**, and never introduce a fourth hue. If
something wants colour and is not a risk level, it does not want colour.

> **Why this exists.** The palette originally shipped only `--destructive`, so
> everything below `high` rendered identically to body text — three severity
> levels, two visual states, and a warning that did not look like a warning.
> Compounding it, the `LineChart` monochrome invariant below (correct for data
> viz, where hue encodes series badly) got generalised into a house style and
> suppressed colour where it was exactly the right encoding. Charts stay
> monochrome. Status does not.

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

### Assets for private articles

Public articles put images in `public/images/` and reference them as
`/images/foo.png`. Private articles have their own home, because their assets
must not reach the deployed site either:

```
articles-private/assets/<article-slug>/whatever.png
```

Reference it from the article as `/private-assets/<article-slug>/whatever.png`.

This works through a symlink at `articles/public/private-assets`, which is
gitignored in the public repo, so the files exist locally and are never
committed. As a second guard the `build` script deletes `dist/private-assets`
before Pagefind runs — a local `astro build` copies everything under `public/`
including symlinked content, so without that step a manually deployed `dist/`
would carry private files even though git never sees them.

Use this for anything an article *is about* as well as anything it displays —
a generated page, a dataset, a simulation. The artifact belongs with the piece
that explains it.

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

### `LineChart` — monochrome plotted curves

For genuine function/line plots where a table undersells the *shape* (a decaying curve, a crossover, a mitigation falloff). Not for categorical bars or anything a table already shows clearly — reach for it sparingly; a few excellent charts, never decoration.

**Using it requires the article be `.mdx`** (plain `.md` can't import components). Import via the alias, which resolves the same whether the article is private or published:

```mdx
import LineChart from "@components/LineChart.astro";

<LineChart
  title="Accessibility label — describe the trend; not drawn on the chart"
  xDomain={[0, 350]} yDomain={[0, 20]}
  xTicks={[0, 100, 200, 300]} yTicks={[0, 5, 10, 15, 20]}
  xLabel="bonus attack speed" yLabel="value of the item"
  xSuffix="%" ySuffix="%"
  series={[{ points: Array.from({ length: 71 }, (_, i) => ({ x: i * 5, y: 20 / (1 + i * 5 / 100) })) }]}
  refLines={[{ y: 10, label: "flat +10%" }]}
  markers={[{ x: 100, y: 10, label: "crossover", dy: -12 }]}
  caption="Caption supports <strong>inline HTML</strong> via set:html."
/>
```

Props:

| Prop | Type | Notes |
|---|---|---|
| `title` | string (required) | Accessibility label + `<title>`; never drawn |
| `series` | `{ points: {x,y}[]; label?; dashed?; muted?; labelDy? }[]` | Compute points in real data units. `muted` uses `--muted-foreground`; `dashed` for a secondary/helper line |
| `xDomain` / `yDomain` | `[min, max]` | Data-space bounds |
| `xTicks` / `yTicks` | `number[]` | Round numbers; drive gridlines and labels |
| `xLabel` / `yLabel` | string | Axis titles (sans); `yLabel` sits top-left, unrotated |
| `xSuffix` / `ySuffix` | string | Appended to tick labels, e.g. `"%"` |
| `markers` | `{ x, y, label, anchor?, dx?, dy? }[]` | Annotation dot + label; hand-place `dx`/`dy` to avoid collisions |
| `refLines` | `{ y? , x?, label? }[]` | Dashed muted reference line (horizontal if `y`, vertical if `x`) |
| `caption` | string | Rendered below via `set:html` (inline HTML allowed) |
| `height` | number | SVG height in px (default 360); width is responsive |

**Design invariants — do not break these:** the chart is monochrome by design. The data line is `--foreground`; grid, axes, and ticks recede into `--border` / `--muted-foreground`; there is **no hue**. Multiple series are told apart by direct labels and solid-vs-dashed strokes, never color. It themes light/dark automatically because every mark references the shadcn tokens. If you find yourself wanting a colored series, stop — that is not this system.

> **Config note.** The `@components` alias is defined in `astro.config.mjs` (`vite.resolve.alias`). It exists so an MDX article's import survives a private→shared move (the file changes directories; the alias doesn't). Don't replace it with a relative path.

### `Item` — inline League item reference (icon + name)

When you name a League item, show it. This renders the official item icon inline before the name, sized to the surrounding text, and works in prose **and inside a Markdown table cell**.

```mdx
import Item from "@components/Item.astro";

<Item id="infinity-edge" />                    {/* → [icon] Infinity Edge */}
<Item id="guinsoos-rageblade" label="Guinsoo's" />  {/* override printed text, keep icon */}
```

| Prop | Type | Notes |
|---|---|---|
| `id` | string (required) | The item slug — must exist in the `ITEMS` roster in `Item.astro` |
| `label` | string | Overrides the printed name (e.g. an abbreviation); icon stays |

**Adding an item:** download its official icon and add it to the roster — two steps:

1. Get the icon from Data Dragon. Find the numeric item ID from `https://ddragon.leagueoflegends.com/cdn/<version>/data/en_US/item.json` (latest version is the first entry in `.../api/versions.json`), then save `https://ddragon.leagueoflegends.com/cdn/<version>/img/item/<id>.png` to `public/images/items/<slug>.png`. Icons are stored locally, never hotlinked.
2. Add `"<slug>": "Display Name"` to the `ITEMS` map in `src/components/Item.astro`.

An unknown `id` renders the text without an icon and logs a build warning, so a typo shows up rather than breaking the build. Icons are 64×64 official art; the component sizes them to ~1.15em with a hairline border. No hue — they sit inside the monochrome system as small marks beside the name.

### Interactive tool components

`DpsCalculator`, `AnvilTrainer`, and `BuildSimulator` are self-contained interactive tools for the Ashe pages — not general-purpose primitives like `LineChart`/`Item`, but they establish the pattern for any future embedded tool:

- **Client behavior via `<script is:inline>`** — plain vanilla JS, no framework (the site has no React/Preact integration, and none is needed). `is:inline` guarantees the script ships verbatim even when the component is rendered from a content-collection MDX file.
- **Single instance per page** — they select by `id`, so don't place two of the same tool on one page.
- **The damage model is duplicated deliberately** — each tool carries its own copy of `dps()` (base attack speed 0.658, no ARAM ×1.05, matching the article). If the model changes, update every tool. Keep them in sync with the article's numbers.
- Monochrome like everything else: emphasis is weight, border, and `--foreground` vs `--muted-foreground`, never a hue.

## When you've added something to the system

If you change `src/styles/global.css`, content schema, or add a component, **update this file in the same commit**. Future Claude sessions read this guide to learn the system; if it lags the system, it actively misleads.

## Diagnosing layout issues

If something in an article isn't rendering as expected, the order of investigation:

1. **Is it a Markdown syntax issue?** Check that headings have a space after `#`, lists have a space after `-`, fences have a language tag.
2. **Is it a frontmatter issue?** Run `bun run build` — schema validation errors print clearly.
3. **Is the prose styling broken?** Inspect the rendered element in devtools. Check that `--tw-prose-*` variables resolve to `hsl(var(--foreground))` etc. (not raw oklch values from typography plugin defaults).
4. **Specifically: prose color overrides not applying?** The override block in `global.css` is intentionally NOT inside `@layer components` because Tailwind v4's typography plugin emits `.prose` styles in `@layer utilities` (later, higher precedence). Unlayered styles beat layered ones — keep the override unlayered.
