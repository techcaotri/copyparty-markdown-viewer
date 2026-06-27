#!/bin/bash
#
# start_copyparty.sh
#
# Foreground launcher for copyparty with this machine's enhancements:
#
#   * Video.js enhanced player   (copyparty-video-plugin)  -> the file BROWSER page
#   * Markdown Viewer (this repo) (copyparty-markdown-viewer) -> the markdown VIEWER page
#
# It mirrors the production systemd unit (/etc/systemd/system/copyparty.service):
# same binary, same /etc/copyparty/args.conf, same FTP + .ts mime tweaks. Use it for
# local testing/development. To install/update the actual service, run
# ./install_copyparty_service.sh instead.
#
# How the plugins are loaded:
#   --js-browser  injects JS into copyparty's file-browser page (md.html's parent /
#                 directory listing). Video.js enhances the in-browser video player here.
#   --js-other    injects JS into "all other pages", which includes copyparty's markdown
#                 VIEWER page (shown when you open a .md with "?v"). This is where the
#                 Markdown Viewer renders Mermaid/PlantUML/math/ToC/search/zoom/export.
#   --html-head   sets window.MDPLUS_CONFIG (diagram backend, etc.) for the viewer.
#
# Both plugin files are served by copyparty itself from the read-only /dev volume
# (/home/tripham/Dev -> /dev), so the browser loads them same-origin while logged in.
# If args.conf does not yet define the /dev volume, this script adds it on the command
# line (read-only) so the launcher works standalone.
#
# This repo holds the canonical copy; /home/tripham/bin/start_copyparty.sh is a symlink
# to it. The script resolves symlinks before locating the repos, so it can be launched
# from anywhere on $PATH.
#
# Usage:
#   ./start_copyparty.sh                 # videojs + markdown (default)
#   ./start_copyparty.sh --no-videojs    # markdown only
#   ./start_copyparty.sh --no-markdown   # videojs only
#   ./start_copyparty.sh --no-ftp        # don't start the FTP server
#   ./start_copyparty.sh -h              # help
#
# Env overrides: ENABLE_VIDEOJS, ENABLE_MARKDOWN, ENABLE_FTP (1/0),
#                DIAGRAM_BACKEND, DIAGRAM_BACKEND_URL, COPYPARTY, CONF.

set -euo pipefail

# ── tunables ───────────────────────────────────────────────────────────────
ENABLE_VIDEOJS="${ENABLE_VIDEOJS:-1}"
ENABLE_MARKDOWN="${ENABLE_MARKDOWN:-1}"
ENABLE_FTP="${ENABLE_FTP:-1}"
FTP_PORT="${FTP_PORT:-3921}"

# Markdown diagram backend. By default Mermaid + KaTeX load from a CDN; for offline
# use run 'npm run build:assets' and point assetBaseUrl at a /dev/.../dist/assets URL.
#   DIAGRAM_BACKEND     "mermaid+puml" (default) or "kroki"
#   DIAGRAM_BACKEND_URL self-hosted PlantUML/Kroki base URL (required for PlantUML)
#     PlantUML:  docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
#     Kroki:     docker run -d -p 8000:8000 yuzutech/kroki
DIAGRAM_BACKEND="${DIAGRAM_BACKEND:-mermaid+puml}"
DIAGRAM_BACKEND_URL="${DIAGRAM_BACKEND_URL:-}"

# The /dev volume (read-only) that exposes the plugin repos to the browser.
DEV_SRC="/home/tripham/Dev"
DEV_URL="/dev"
DEV_PERM="r,tripham,readuser"      # read for both accounts, no anonymous, no write

# ── CLI flags ──────────────────────────────────────────────────────────────
usage() { sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }
while [ "$#" -gt 0 ]; do
  case "$1" in
    --videojs)     ENABLE_VIDEOJS=1 ;;
    --no-videojs)  ENABLE_VIDEOJS=0 ;;
    --markdown)    ENABLE_MARKDOWN=1 ;;
    --no-markdown) ENABLE_MARKDOWN=0 ;;
    --ftp)         ENABLE_FTP=1 ;;
    --no-ftp)      ENABLE_FTP=0 ;;
    -h|--help)     usage 0 ;;
    *) echo "[start] unknown option: $1" >&2; usage 1 ;;
  esac
  shift
done

# ── locate the copyparty binary (prefer the one the systemd unit uses) ──────
pick_copyparty() {
  if [ -n "${COPYPARTY:-}" ]; then echo "$COPYPARTY"; return; fi
  for c in /home/tripham/.local/bin/copyparty /opt/copyparty/venv/bin/copyparty; do
    [ -x "$c" ] && { echo "$c"; return; }
  done
  command -v copyparty 2>/dev/null && return
  echo ""
}
COPYPARTY="$(pick_copyparty)"
[ -n "$COPYPARTY" ] || { echo "[start] ERROR: copyparty binary not found" >&2; exit 1; }
CONF="${CONF:-/etc/copyparty/args.conf}"
[ -f "$CONF" ] || { echo "[start] ERROR: config not found: $CONF" >&2; exit 1; }

# ── locate the two plugin repos and turn their paths into /dev URLs ─────────
# Resolve symlinks (e.g. /home/tripham/bin/start_copyparty.sh -> this file) so the repo
# paths are correct no matter how/where the script is invoked.
SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]:-$0}")"
REPO_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"      # copyparty-markdown-viewer
VIDEO_DIR="$(cd "$REPO_DIR/.." && pwd)/copyparty-video-plugin"
VIDEO_JS_FILE="$VIDEO_DIR/videojs-enhanced.js"
MARKDOWN_JS_FILE="$REPO_DIR/dist/markdown-plus.js"

# Map an absolute path under $DEV_SRC to its /dev URL (or empty if outside).
dev_url_of() {
  case "$1" in
    "$DEV_SRC"/*) echo "${DEV_URL}/${1#"$DEV_SRC"/}" ;;
    *) echo "" ;;
  esac
}
VIDEO_JS_URL="$(dev_url_of "$VIDEO_JS_FILE")"
MARKDOWN_JS_URL="$(dev_url_of "$MARKDOWN_JS_FILE")"

# ── build the markdown bundle if it is enabled and missing ─────────────────
if [ "$ENABLE_MARKDOWN" = 1 ] && [ ! -f "$MARKDOWN_JS_FILE" ]; then
  echo "[start] dist/markdown-plus.js not found; building (npm install && npm run build)..."
  ( cd "$REPO_DIR" && npm install && npm run build )
fi

# ── assemble the argument list ─────────────────────────────────────────────
ARGS=( -c "$CONF" )

# FTP needs the pyftpdlib module inside copyparty's Python. If it is missing, start
# WITHOUT FTP (with a hint) instead of letting copyparty crash on import. The
# production systemd unit does not enable FTP either, so this matches it by default.
if [ "$ENABLE_FTP" = 1 ]; then
  _sb=""; IFS= read -r _sb < "$COPYPARTY" 2>/dev/null || true
  FTP_PY=""
  case "$_sb" in
    '#!'*)
      read -r _w1 _w2 _ <<<"${_sb#\#!}" || true        # split: interpreter (+ optional arg)
      FTP_PY="$_w1"
      [ "${FTP_PY##*/}" = env ] && FTP_PY="${_w2:-}"    # "#!/usr/bin/env python3"
      ;;
  esac
  command -v "$FTP_PY" >/dev/null 2>&1 || FTP_PY=""
  if [ -n "$FTP_PY" ] && "$FTP_PY" -c 'import pyftpdlib' >/dev/null 2>&1; then
    ARGS+=( --ftp "$FTP_PORT" )
    echo "[start] ftp     : port $FTP_PORT"
  else
    ENABLE_FTP=0
    echo "[start] ftp     : disabled — pyftpdlib not installed for $COPYPARTY" >&2
    echo "[start]           enable with: sudo $(dirname "$COPYPARTY")/pip install pyftpdlib" >&2
  fi
fi
ARGS+=( --mime ".ts=video/mp2t" )

# Add the read-only /dev volume only if args.conf does not already define it,
# so we don't create a duplicate-volume conflict.
if [ -r "$CONF" ] && grep -q ':/dev:' "$CONF"; then
  echo "[start] /dev volume already in $CONF"
else
  echo "[start] adding read-only /dev volume on the command line"
  ARGS+=( -v "${DEV_SRC}:${DEV_URL}:${DEV_PERM}" )
fi

if [ "$ENABLE_VIDEOJS" = 1 ]; then
  [ -f "$VIDEO_JS_FILE" ] || { echo "[start] ERROR: videojs plugin missing: $VIDEO_JS_FILE" >&2; exit 1; }
  [ -n "$VIDEO_JS_URL" ]  || { echo "[start] ERROR: videojs plugin is not under $DEV_SRC" >&2; exit 1; }
  ARGS+=( --js-browser "$VIDEO_JS_URL" )
  echo "[start] videojs : $VIDEO_JS_URL"
else
  echo "[start] videojs : disabled"
fi

if [ "$ENABLE_MARKDOWN" = 1 ]; then
  [ -n "$MARKDOWN_JS_URL" ] || { echo "[start] ERROR: markdown plugin is not under $DEV_SRC" >&2; exit 1; }
  MDPLUS_CONFIG="{diagramBackend:\"${DIAGRAM_BACKEND}\""
  [ -n "$DIAGRAM_BACKEND_URL" ] && MDPLUS_CONFIG="${MDPLUS_CONFIG},diagramBackendUrl:\"${DIAGRAM_BACKEND_URL}\""
  MDPLUS_CONFIG="${MDPLUS_CONFIG}}"
  ARGS+=( --js-other "$MARKDOWN_JS_URL"
          --html-head "<script>window.MDPLUS_CONFIG=${MDPLUS_CONFIG}</script>" )
  echo "[start] markdown: $MARKDOWN_JS_URL  (MDPLUS_CONFIG=${MDPLUS_CONFIG})"
else
  echo "[start] markdown: disabled"
fi

echo "[start] exec: $COPYPARTY ${ARGS[*]}"
exec "$COPYPARTY" "${ARGS[@]}"
