#!/usr/bin/env node
// Generates index.html from pages/*.html
// Reads <title>, <meta name="date">, <meta name="description"> from each article.

const fs = require('fs');
const path = require('path');

const root = __dirname;
const pagesDir = path.join(root, 'pages');
const outFile = path.join(root, 'index.html');

const files = fs.existsSync(pagesDir)
  ? fs.readdirSync(pagesDir).filter((f) => f.endsWith('.html'))
  : [];

function extract(content, re) {
  const m = content.match(re);
  return m ? m[1].trim() : '';
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”');
}

function escape(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const articles = files
  .map((file) => {
    const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
    const title = decode(extract(content, /<title>([^<]+)<\/title>/i)) || file;
    const date = extract(content, /<meta\s+name="date"\s+content="([^"]+)"/i);
    const description = decode(
      extract(content, /<meta\s+name="description"\s+content="([^"]+)"/i)
    );
    return { file: 'pages/' + file, title, date, description };
  })
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>articles &middot; kwon.ai</title>
<meta name="description" content="Articles by Daniel Kwon." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root {
    --bg: #ffffff;
    --fg: #09090b;
    --muted: #71717a;
    --muted-bg: #f4f4f5;
    --border: #e4e4e7;
    --accent: #18181b;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #09090b;
      --fg: #fafafa;
      --muted: #a1a1aa;
      --muted-bg: #18181b;
      --border: #27272a;
      --accent: #fafafa;
    }
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    font-size: 15.5px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 80px 32px 96px;
  }
  header { margin-bottom: 56px; }
  header .eyebrow {
    font-size: 13px;
    color: var(--muted);
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  h1 {
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
    line-height: 1.2;
  }
  header p {
    color: var(--muted);
    margin: 0;
    font-size: 16px;
  }
  ul.articles {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  ul.articles li {
    border-bottom: 1px solid var(--border);
  }
  ul.articles li:first-child { border-top: 1px solid var(--border); }
  ul.articles a {
    display: block;
    padding: 20px 0;
    color: inherit;
    text-decoration: none;
  }
  ul.articles a:hover { background: var(--muted-bg); margin: 0 -16px; padding: 20px 16px; }
  .title {
    font-size: 17px;
    font-weight: 500;
    letter-spacing: -0.005em;
    margin-bottom: 4px;
  }
  .desc {
    color: var(--muted);
    font-size: 14.5px;
    line-height: 1.5;
    margin-bottom: 6px;
  }
  .date {
    color: var(--muted);
    font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12.5px;
  }
  .empty {
    color: var(--muted);
    font-style: italic;
    padding: 24px 0;
    text-align: center;
  }
  footer {
    margin-top: 80px;
    color: var(--muted);
    font-size: 13px;
    text-align: center;
  }
  footer a { color: inherit; }
</style>
</head>
<body>
<main>
  <header>
    <div class="eyebrow">articles.kwon.ai</div>
    <h1>articles</h1>
    <p>by Daniel Kwon</p>
  </header>
  ${
    articles.length === 0
      ? '<div class="empty">No articles yet.</div>'
      : `<ul class="articles">
${articles
  .map(
    (a) => `    <li>
      <a href="${escape(a.file)}">
        <div class="title">${escape(a.title)}</div>
        ${a.description ? `<div class="desc">${escape(a.description)}</div>` : ''}
        ${a.date ? `<div class="date">${escape(a.date)}</div>` : ''}
      </a>
    </li>`
  )
  .join('\n')}
  </ul>`
  }
  <footer>
    <a href="https://kwon.ai">kwon.ai</a>
  </footer>
</main>
</body>
</html>
`;

fs.writeFileSync(outFile, html);
console.log(`Built index.html with ${articles.length} article${articles.length === 1 ? '' : 's'}.`);
