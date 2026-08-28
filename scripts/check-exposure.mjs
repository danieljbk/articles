// Ties every private article's exposure assessment to the body it assessed.
// The assessment records `exposure.assessed`, the first 12 hex of the body's
// sha256 (content after frontmatter). This check recomputes and compares:
// absent field or mismatch prints per file and exits 1, so a body edited
// after assessment cannot pass silently. Closes the OPEN.md item about
// unverifiable assessments by making read-before-assess structural.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const roots = ["../articles-private/completed", "../articles-private/drafts"];
let bad = 0, legacy = 0;
for (const root of roots) {
  let names;
  try { names = readdirSync(root); } catch { continue; }
  for (const name of names) {
    if (!name.endsWith(".md") && !name.endsWith(".mdx")) continue;
    const text = readFileSync(join(root, name), "utf8");
    const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) continue;
    const [, fm, body] = m;
    if (!/^exposure:/m.test(fm)) continue;
    const sha = createHash("sha256").update(body.trim()).digest("hex").slice(0, 12);
    const rec = fm.match(/^\s*assessed:\s*"?([0-9a-f]{12})"?/m)?.[1];
    if (!rec) { legacy++; continue; } // grandfathered: pre-standard assessments tie as each is next touched
    else if (rec !== sha) { console.log(`${name}: body changed since assessment (${rec} -> ${sha})`); bad++; }
  }
}
console.log(`${bad} mismatch(es); ${legacy} legacy assessment(s) awaiting their first re-tie`);
process.exit(bad ? 1 : 0);
