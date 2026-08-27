import type { APIRoute, GetStaticPaths } from "astro";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Local-only tools served alongside the articles, one route per tool. Same
// gate as the private article routes: no paths are emitted unless the server
// runs with INCLUDE_PRIVATE=1, so no tool can exist in a production build —
// which also means the machine-local paths below are never touched there.
// Each tool is a generator script in ~/config/claude that writes an HTML file;
// it re-runs on every request, so the view is never stale.
const TOOLS: Record<string, { script: string; out: string }> = {
  "claude-md": { script: "render.py", out: "CLAUDE.html" },
  "rebuild-diff": { script: "render_rebuild_diff.py", out: "rebuild-diff.html" },
  "sessions": { script: "render_sessions.py", out: "sessions.html" },
  "telemetry": { script: "render_telemetry.py", out: "telemetry.html" },
};

export const getStaticPaths: GetStaticPaths = () => {
  if (process.env.INCLUDE_PRIVATE !== "1") return [];
  return Object.keys(TOOLS).map(tool => ({ params: { tool } }));
};

export const GET: APIRoute = ({ params }) => {
  const tool = TOOLS[params.tool as string];
  if (!tool) return new Response(null, { status: 404 });
  const dir = join(homedir(), "config", "claude");
  execFileSync("python3", [join(dir, tool.script), "--no-open"]);
  return new Response(readFileSync(join(dir, tool.out)), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
