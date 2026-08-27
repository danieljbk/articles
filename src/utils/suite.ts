// Data layer for the tool suite / dashboard. Reads machine-local state from
// ~/config/claude. Every reader returns empty/null unless the server runs
// with INCLUDE_PRIVATE=1, so production builds never touch these paths —
// the same guarantee as the private article routes.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ROOT = join(homedir(), "config", "claude");
export const suiteEnabled = process.env.INCLUDE_PRIVATE === "1";

export type BoardItem = { state: "done" | "doing" | "todo" | "waits"; text: string };
export type Board = {
  session: string;
  started: string;
  status: string;
  title: string;
  items: BoardItem[];
  open: number;
};

const STATES: Record<string, BoardItem["state"]> = {
  x: "done",
  ">": "doing",
  " ": "todo",
  "!": "waits",
};

export function readBoards(): Board[] {
  if (!suiteEnabled) return [];
  const dir = join(ROOT, "sessions");
  if (!existsSync(dir)) return [];
  const boards: Board[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md") || name === "README.md") continue;
    const text = readFileSync(join(dir, name), "utf8");
    const fm = text.startsWith("---") ? text.split("---")[1] : "";
    const meta = Object.fromEntries(
      [...fm.matchAll(/^(\w+):\s*(.+?)\s*$/gm)].map(m => [m[1], m[2]])
    );
    const items: BoardItem[] = [...text.matchAll(/^- \[([ x>!])\] (.+)$/gm)].map(
      m => ({ state: STATES[m[1]], text: m[2].trim() })
    );
    boards.push({
      session: meta.session ?? name.replace(/\.md$/, ""),
      started: meta.started ?? "",
      status: meta.status ?? "active",
      title: text.match(/^# (.+)$/m)?.[1] ?? name,
      items,
      open: items.filter(i => i.state !== "done").length,
    });
  }
  boards.sort((a, b) => b.started.localeCompare(a.started));
  boards.sort((a, b) => Number(a.status !== "active") - Number(b.status !== "active"));
  return boards;
}

export type TelemetryRecord = {
  date: string;
  session: string;
  model?: string;
  topics?: string[];
  sentiment?: string;
  signals?: { corrections?: number; validations?: number };
  evidence?: { positive?: string[]; negative?: string[] };
  notes?: string;
  claude_md?: { start?: string; end?: string };
};

export function readTelemetry(): TelemetryRecord[] {
  if (!suiteEnabled) return [];
  const file = join(ROOT, "telemetry", "sessions.jsonl");
  if (!existsSync(file)) return [];
  const records = readFileSync(file, "utf8")
    .split("\n")
    .filter(l => l.trim())
    .map(l => JSON.parse(l) as TelemetryRecord);
  records.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return records;
}

export function claudeMdStats(): { chars: number; budget: number } | null {
  if (!suiteEnabled) return null;
  const file = join(ROOT, "CLAUDE.md");
  if (!existsSync(file)) return null;
  const chars = readFileSync(file, "utf8").length;
  const budget = Number(
    readFileSync(join(ROOT, "validate.py"), "utf8").match(
      /^BUDGET = ([\d_]+)/m
    )?.[1].replace(/_/g, "") ?? 0
  );
  return { chars, budget };
}

// The derived time series — the flywheel layer. derive_metrics.py computes it
// incrementally from git history and session transcripts (artifacts that
// accrue with zero per-session effort); we refresh it when it is older than
// ten minutes, which is cheap because the derivation is cached per commit and
// per transcript.
export type DerivedDay = { date: string; chars: number; delta: number; commits: number };
export type Derived = {
  generated_at: string;
  claude_md: {
    per_commit: { t: number; chars: number }[];
    daily: DerivedDay[];
    now_tokens?: { chars: number; cl100k: number; claude_est: number } | null;
  };
  sessions: {
    daily: { date: string; started: number }[];
    recent: {
      project: string;
      records: number;
      first: string | null;
      last: string | null;
      enriched?: {
        topics?: string[];
        sentiment?: string;
        corrections?: number;
        validations?: number;
        by?: string;
      } | null;
    }[];
  };
};

export function readDerived(): Derived | null {
  if (!suiteEnabled) return null;
  const file = join(ROOT, "telemetry", "derived.json");
  const stale =
    !existsSync(file) || Date.now() - statSync(file).mtimeMs > 10 * 60_000;
  if (stale) {
    try {
      execFileSync("python3", [join(ROOT, "derive_metrics.py")], {
        timeout: 90_000,
      });
    } catch {
      /* serve the last derivation rather than failing the page */
    }
  }
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as Derived;
}

// Chart helpers. Git only records change-days, so a plain line would invent
// gradual growth across quiet months; the honest shape is a step — flat until
// a change-day, vertical at it.
export function dayIndex(date: string, epoch: string): number {
  return Math.round(
    (Date.parse(date + "T00:00:00Z") - Date.parse(epoch + "T00:00:00Z")) / 86_400_000
  );
}

export function stepSeries(
  daily: DerivedDay[],
  epoch: string,
  scale = 1
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  let prev: number | null = null;
  for (const d of daily) {
    const x = dayIndex(d.date, epoch);
    if (prev !== null) pts.push({ x, y: prev });
    pts.push({ x, y: d.chars / scale });
    prev = d.chars / scale;
  }
  return pts;
}

// Same step series, but quiet stretches carry no information, so they get no
// width: a gap longer than `threshold` days collapses to `breakWidth` x-units
// and is returned as a labeled axis break. Short gaps stay proportional, so
// the local time-shape survives; only dead space is removed.
export function compressedStepSeries(
  daily: DerivedDay[],
  scale = 1,
  threshold = 14,
  breakWidth = 5
): {
  pts: { x: number; y: number }[];
  breaks: { x: number; label: string }[];
  span: number;
  xOf: Record<string, number>;
} {
  const pts: { x: number; y: number }[] = [];
  const breaks: { x: number; label: string }[] = [];
  const xOf: Record<string, number> = {};
  let x = 0;
  let prevDate: string | null = null;
  let prevY: number | null = null;
  for (const d of daily) {
    if (prevDate !== null && prevY !== null) {
      const gap = dayIndex(d.date, prevDate);
      if (gap > threshold) {
        breaks.push({ x: x + breakWidth / 2, label: `${gap}d` });
        x += breakWidth;
      } else {
        x += gap;
      }
      pts.push({ x, y: prevY });
    }
    pts.push({ x, y: d.chars / scale });
    xOf[d.date] = x;
    prevDate = d.date;
    prevY = d.chars / scale;
  }
  return { pts, breaks, span: x, xOf };
}

// Date ticks only where the compressed axis changes meaning: the endpoints
// and both sides of every collapsed gap. Everything else is legible from the
// line itself.
export function breakTickLabels(
  daily: DerivedDay[],
  xOf: Record<string, number>,
  threshold = 14
): { x: number; label: string }[] {
  const dlab = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  const dates = new Set<string>();
  if (daily.length) {
    dates.add(daily[0].date);
    dates.add(daily[daily.length - 1].date);
    for (let i = 1; i < daily.length; i++) {
      if (dayIndex(daily[i].date, daily[i - 1].date) > threshold) {
        dates.add(daily[i - 1].date);
        dates.add(daily[i].date);
      }
    }
  }
  return [...dates].sort().map(d => ({ x: xOf[d], label: dlab(d) }));
}

// Counts derived from the diff tool's own source, so they can never go stale
// against it: one I.append(dict(n=…)) per item, pending=True on amber ones.
export function rebuildDiffStats(): { executed: number; pending: number } | null {
  if (!suiteEnabled) return null;
  const file = join(ROOT, "render_rebuild_diff.py");
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  const total = (src.match(/I\.append\(dict\(n=/g) ?? []).length;
  const pending = (src.match(/pending=True/g) ?? []).length;
  return { executed: total - pending, pending };
}
