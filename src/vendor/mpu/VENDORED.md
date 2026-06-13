# Vendored from Markdown-Preview-Unified

These files are COPIES of MPU source, brought in by `scripts/vendor-from-mpu.sh`.
Do not edit them by hand; re-run the vendor script to update.

- Source repo: Markdown-Preview-Unified (`@mpe/core`)
- Pin: local-2026-06-13
- Vendored paths:
  - core/constants.js
  - diagrams/plantuml-encoder.js
  - diagrams/diagram-themes.js

The PlantUML encoder is consumed via src/diagrams/plantuml-adapter.js, which supplies
the bundled `pako` so the copy runs fully offline (no CDN fetch).
