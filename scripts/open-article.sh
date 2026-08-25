#!/usr/bin/env bash
#
# Open an article in the browser. Starts the local dev server if it isn't
# already running, waits until the page actually responds, then opens it.
# Works for both private and public articles — the script finds the source
# file and derives the right URL, so nothing has to be typed by hand.
#
#   bun run open black-hole-size-gravitational-waves
#   bun run open 2026-08-21-black-hole-size-gravitational-waves.md   # date prefix ok
#   bun run open ../articles-private/completed/2026-08-21-foo.md    # full path ok
#   bun run open                                                     # article index
#   bun run open --stop                                              # shut the server down
#
# The server always runs with INCLUDE_PRIVATE=1 so private drafts are visible
# locally. Production builds on Cloudflare never set that flag, so this has no
# bearing on what ships.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-4321}"
HOST="http://localhost:$PORT"
STATE_DIR="$ROOT/.astro"
LOG="$STATE_DIR/dev-server.log"
PIDFILE="$STATE_DIR/dev-server.pid"

PUBLIC_DIR="$ROOT/src/data/articles"
PRIVATE_ROOT="$ROOT/../articles-private"

die() { printf '%s\n' "$*" >&2; exit 1; }

# The pid we record is the `bun run` process; astro/node runs as its child.
server_pid() {
  [[ -f "$PIDFILE" ]] || return 1
  local pid; pid="$(cat "$PIDFILE" 2>/dev/null || true)"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && printf '%s' "$pid"
}

if [[ "${1:-}" == "--stop" ]]; then
  if pid="$(server_pid)"; then
    pkill -P "$pid" 2>/dev/null || true   # astro/node child
    kill "$pid" 2>/dev/null || true       # the bun wrapper
    rm -f "$PIDFILE"
    echo "Dev server stopped (pid $pid)."
  else
    rm -f "$PIDFILE"
    echo "No dev server running from this script."
  fi
  exit 0
fi

# Resolve whatever was passed — bare slug, filename, or full path — to a slug.
raw="${1:-}"
slug="$(basename -- "$raw")"
slug="${slug%.mdx}"
slug="${slug%.md}"
slug="${slug#[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-}"

# Find the source file so the private-vs-public URL is derived, never guessed.
find_in() {
  local dir="$1" f
  for f in "$dir"/????-??-??-"$slug".md "$dir"/????-??-??-"$slug".mdx \
           "$dir/$slug.md" "$dir/$slug.mdx"; do
    [[ -f "$f" ]] && { printf '%s' "$f"; return 0; }
  done
  return 1
}

# Private articles are split into completed/ and drafts/; the status is part
# of the URL, so it has to come from wherever the file actually sits.
private_status=""
for st in completed drafts; do
  if find_in "$PRIVATE_ROOT/$st" >/dev/null; then private_status="$st"; break; fi
done

if [[ -z "$slug" ]]; then
  path="/private"
  label="article index"
elif [[ -n "$private_status" ]]; then
  path="/private/$private_status/$slug"
  label="private/$private_status: $slug"
  # A slug can exist in both places — the archive copy and its published
  # counterpart. The private one wins, since that is the one being reviewed.
  if find_in "$PUBLIC_DIR" >/dev/null; then
    also_public="$HOST/$slug"
  fi
elif find_in "$PUBLIC_DIR" >/dev/null; then
  path="/$slug"
  label="published: $slug"
else
  {
    echo "No article matching '$slug'."
    echo
    echo "Closest names:"
    ls "$PRIVATE_ROOT/completed" "$PRIVATE_ROOT/drafts" "$PUBLIC_DIR" 2>/dev/null \
      | grep -i -- "$(printf '%s' "$slug" | cut -c1-12)" | head -10 \
      || echo "  (no near matches)"
  } >&2
  exit 1
fi

url="$HOST$path"
ready() { curl -fs -o /dev/null --max-time 3 "$1" 2>/dev/null; }

if ! ready "$url"; then
  if server_pid >/dev/null; then
    : # our server is up; the page just isn't ready yet — the wait loop covers it
  elif lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    die "Port $PORT is in use by something else. Free it, or rerun with PORT=4322."
  else
    mkdir -p "$STATE_DIR"
    # Fully detach: the subshell replaces its own stdio, then execs the server,
    # so $! is the server itself and it holds no handle on this script's stdout.
    # Without that, the caller blocks until the server exits.
    (
      cd "$ROOT" || exit 1
      exec </dev/null >"$LOG" 2>&1
      INCLUDE_PRIVATE=1 exec nohup bun run dev:private -- --port "$PORT"
    ) &
    pid=$!
    echo "$pid" >"$PIDFILE"
    disown "$pid" 2>/dev/null || true
    echo "Starting dev server (pid $pid, log: .astro/dev-server.log)"
    echo "Stop it any time with: bun run open --stop"
  fi

  # Wait for the page itself, not just the port. Bounded at 60s.
  for _ in $(seq 1 120); do
    ready "$url" && break
    sleep 0.5
  done

  ready "$url" || die "Server never served $url. Last log lines:
$(tail -15 "$LOG" 2>/dev/null)"
fi

open "$url"
echo "Opened $label"
echo "  $url"
if [[ -n "${also_public:-}" ]]; then
  echo "  (also published: $also_public)"
fi
