# articles.kwon.ai

Public-facing articles. Each article is a self-contained HTML file in `pages/`.

## Adding an article

1. Drop a self-contained HTML file into `pages/`. Slug format: `YYYY-MM-DD-short-slug.html`.
2. Ensure the file has these tags in `<head>`:
   - `<title>` — article title
   - `<meta name="date" content="YYYY-MM-DD">` — publish date
   - `<meta name="description" content="...">` — one-line summary
3. Run `node build.js` to regenerate `index.html`.
4. Commit and push. Cloudflare Pages rebuilds and deploys to `articles.kwon.ai`.

## Cloudflare Pages

- Build command: `node build.js`
- Build output directory: `/` (repo root)
