# articles

Public articles by Daniel Kwon. Deploys to **articles.kwon.ai** via Cloudflare Pages on every push.

## Architecture

Two-repo system, paired with the sibling [`articles-private`](https://github.com/danieljbk/articles-private):

- **`articles/`** (this repo, public) — every article here is published to `articles.kwon.ai`.
- **`articles-private/`** (private, local-only) — archive of unpublished articles, plus `local-index.html` (a unified browser listing articles from both repos for local navigation).

The boundary between public and private is the repo itself, not a subdirectory inside one repo. A misconfigured `.gitignore` can't leak a private article into the public deploy.

## Layout

```
articles/
├── pages/                  # one self-contained HTML file per article
│   └── YYYY-MM-DD-slug.html
├── build.js                # scans pages/, regenerates index.html
├── index.html              # generated. Committed for direct serving + GitHub browsing.
├── README.md
└── .gitignore
```

Each article is a single self-contained HTML file: inline CSS, fonts loaded from CDN, no external assets, no build wrapping. Drop-in portable.

## Adding an article

1. Drop a self-contained HTML file into `pages/`. Slug: `YYYY-MM-DD-short-slug.html`.
2. Include in `<head>`:
   - `<title>` — article title
   - `<meta name="date" content="YYYY-MM-DD">` — publish date (sorts the index)
   - `<meta name="description" content="...">` — one-line summary, shown on the index
3. Run `node build.js` to regenerate `index.html`.
4. Commit and push. Cloudflare Pages rebuilds and deploys.

## Promoting from private

Articles typically start in the sibling private repo. To publish:

```bash
# from articles/
mv ../articles-private/pages/YYYY-MM-DD-slug.html pages/
(cd ../articles-private && node build.js)
node build.js
git add . && git commit -m "Publish: <title>" && git push
(cd ../articles-private && git add . && git commit -m "Promote: <slug>" && git push)
```

Pushing `articles/` triggers the Cloudflare Pages deploy.

## Cloudflare Pages config

- **Build command**: `node build.js`
- **Build output directory**: `/` (repo root)
- **Custom domain**: `articles.kwon.ai`

## Build script

`build.js` reads each file in `pages/`, extracts `<title>`, `<meta name="date">`, and `<meta name="description">`, sorts by date descending, and writes `index.html` styled to match the article pages (Geist font, neutral palette, `prefers-color-scheme` aware). Zero dependencies; runs on plain Node.
