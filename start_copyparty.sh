#!/bin/bash
#
# start_copyparty.sh
#
# Starts copyparty with your existing configuration (/etc/copyparty/args.conf) PLUS
# the Copyparty Markdown Viewer plugin, so opening a .md file renders Mermaid,
# PlantUML, math, a table of contents, search, zoom, and export.
#
# This is the canonical copy. /home/tripham/bin/start_copyparty.sh is a symlink to it,
# so it can be launched from anywhere on $PATH.
#
# How the plugin is loaded:
#   --js-other   injects the plugin into copyparty's markdown VIEWER page (md.html,
#                shown when you open a .md with "?v"). This is the important one.
#   --js-browser injects it into the file-browser page too (for future README use).
#   --html-head  sets window.MDPLUS_CONFIG (diagram backend, etc.).
#
# The plugin file is served by copyparty itself from the /dev volume (your args.conf
# maps /home/tripham/Dev -> /dev), so the browser loads it from the same origin while
# you are logged in.

set -e

COPYPARTY="${COPYPARTY:-/opt/copyparty/venv/bin/copyparty}"
CONF="${CONF:-/etc/copyparty/args.conf}"

# Absolute path to this repo and the URL copyparty serves the built bundle at.
# Resolve symlinks first (e.g. /home/tripham/bin/start_copyparty.sh -> this file) so
# REPO_DIR points at the real repo no matter how/where the script is invoked.
SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]:-$0}")"
REPO_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
# /home/tripham/Dev is shared as /dev, so strip that prefix to form the URL path.
PLUGIN_URL="/dev/${REPO_DIR#/home/tripham/Dev/}/dist/markdown-plus.js"

# Optional: a self-hosted PlantUML or Kroki server for PlantUML/Graphviz diagrams.
# Leave empty to disable PlantUML (those blocks show their source instead).
#   PlantUML:  docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
#   Kroki:     docker run -d -p 8000:8000 yuzutech/kroki
DIAGRAM_BACKEND="mermaid+puml"     # or "kroki"
DIAGRAM_BACKEND_URL=""             # e.g. "http://localhost:8080" (plantuml) or "http://localhost:8000" (kroki)

# Build the bundle if it is missing.
if [ ! -f "$REPO_DIR/dist/markdown-plus.js" ]; then
  echo "[start] dist/markdown-plus.js not found; building..."
  ( cd "$REPO_DIR" && npm install && npm run build )
fi

# Compose MDPLUS_CONFIG. By default Mermaid + KaTeX load from a CDN; for offline use
# run 'npm run build:assets' and set assetBaseUrl to a /dev/.../dist/assets URL.
MDPLUS_CONFIG="{diagramBackend:\"${DIAGRAM_BACKEND}\""
if [ -n "$DIAGRAM_BACKEND_URL" ]; then
  MDPLUS_CONFIG="${MDPLUS_CONFIG},diagramBackendUrl:\"${DIAGRAM_BACKEND_URL}\""
fi
MDPLUS_CONFIG="${MDPLUS_CONFIG}}"

echo "[start] plugin URL: ${PLUGIN_URL}"
echo "[start] MDPLUS_CONFIG: ${MDPLUS_CONFIG}"

exec "$COPYPARTY" -c "$CONF" \
  --js-other  "$PLUGIN_URL" \
  --js-browser "$PLUGIN_URL" \
  --html-head "<script>window.MDPLUS_CONFIG=${MDPLUS_CONFIG}</script>"
