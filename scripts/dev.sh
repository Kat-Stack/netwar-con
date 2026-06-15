#!/usr/bin/env bash
#
# dev.sh — serve the static site locally (no build step).
#
# Usage:
#   ./scripts/dev.sh         # http://localhost:5173
#   ./scripts/dev.sh 3000    # pick a port
#
# Then, in another terminal, expose it with:  ./scripts/share.sh <same-port>

set -euo pipefail

PORT="${1:-${PORT:-5173}}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "▶ Serving ${ROOT}"
echo "  http://localhost:${PORT}   (Ctrl+C to stop)"
echo "  (no-store: the browser always refetches, so edits show on a normal reload)"
echo

# Serve with Cache-Control: no-store so the browser never holds a stale copy of the JS/CSS.
# (the default `python -m http.server` sends only Last-Modified, which Firefox heuristically
#  caches — that's what made old puzzle.js / styles linger after edits.)
exec python3 -c "
import http.server, functools, sys
root, port = sys.argv[1], int(sys.argv[2])
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache'); self.send_header('Expires', '0')
        super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=root)).serve_forever()
" "${ROOT}" "${PORT}"
