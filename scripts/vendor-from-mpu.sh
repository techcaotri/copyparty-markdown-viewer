#!/usr/bin/env bash
#
# vendor-from-mpu.sh
#
# Copy a pinned set of portable Markdown-Preview-Unified (MPU) source files into
# this repository under src/vendor/mpu/. This is the "vendoring" step of the
# self-contained design: we COPY MPU source rather than depend on or run MPU at
# runtime. Re-run this script against a newer MPU checkout and then `npm run build`
# to sync.
#
# Usage:
#   MPU_REPO=/path/to/markdown-preview-unified [MPU_PIN=<sha>] bash scripts/vendor-from-mpu.sh
#
# Only genuinely portable, low-dependency modules are vendored here (the PlantUML
# encoder, the Catppuccin diagram themes/skinparams, and the shared constants they
# rely on). The remaining feature modules (ToC, search, zoom) are re-implemented in
# src/features/ following MPU's design, because MPU's originals are tightly coupled
# to its event-bus/store runtime.
set -euo pipefail

MPU="${MPU_REPO:-/home/tripham/Dev/Playground_Markdown/Markdown-Preview-Unified/markdown-preview-unified}"
PIN="${MPU_PIN:-unpinned-local-checkout}"

SRC="$MPU/packages/core/preview/assets/js"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/src/vendor/mpu"

if [ ! -d "$SRC" ]; then
  echo "ERROR: MPU source not found at: $SRC" >&2
  echo "Set MPU_REPO to your markdown-preview-unified checkout." >&2
  exit 1
fi

echo "Vendoring MPU @ ${PIN}"
echo "  from: $SRC"
echo "  to:   $DEST"

rm -rf "$DEST"
mkdir -p "$DEST/core" "$DEST/diagrams"

cp "$SRC/core/constants.js"            "$DEST/core/constants.js"
cp "$SRC/diagrams/plantuml-encoder.js" "$DEST/diagrams/plantuml-encoder.js"
cp "$SRC/diagrams/diagram-themes.js"   "$DEST/diagrams/diagram-themes.js"

# Record provenance.
cat > "$DEST/VENDORED.md" <<EOF
# Vendored from Markdown-Preview-Unified

These files are COPIES of MPU source, brought in by \`scripts/vendor-from-mpu.sh\`.
Do not edit them by hand; re-run the vendor script to update.

- Source repo: Markdown-Preview-Unified (\`@mpe/core\`)
- Pin: ${PIN}
- Vendored paths:
  - core/constants.js
  - diagrams/plantuml-encoder.js
  - diagrams/diagram-themes.js

The PlantUML encoder is consumed via src/diagrams/plantuml-adapter.js, which supplies
the bundled \`pako\` so the copy runs fully offline (no CDN fetch).
EOF

echo "Done. Vendored 3 files + provenance into src/vendor/mpu/."
