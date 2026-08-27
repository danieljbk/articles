import type { APIRoute, GetStaticPaths } from "astro";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Local-only tools served alongside the articles, one route per tool. Same
// gate as the private article routes: no paths are emitted unless the server
// runs with INCLUDE_PRIVATE=1, so no tool can exist in a production build —
// which also means the machine-local paths below are never touched there.
export const getStaticPaths: GetStaticPaths = () => {
  if (process.env.INCLUDE_PRIVATE !== "1") return [];
  return [{ params: { tool: "claude-md" } }];
};

export const GET: APIRoute = () => {
  // Regenerate from the live file on every request, so the view is never
  // stale. The interpreter lives with the file it renders.
  const dir = join(homedir(), "config", "claude");
  execFileSync("python3", [join(dir, "render.py"), "--no-open"]);
  return new Response(readFileSync(join(dir, "CLAUDE.html")), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
