# Implementation Notes

This project follows the recommended approach from the brainstorming document:
a **single self-contained `--js-browser` plugin** built by **vendoring** the
Markdown-Preview-Unified (MPU) rendering pipeline and **bundling** it with esbuild.

## Architecture (recap)

```
Copyparty (Python)  --js-browser-->  markdown-plus.js (one bundled artifact)
                                       |
   +-----------------------------------+----------------------------------+
   | integration/  (authored glue: detector, coordinator, sanitizer,      |
   |               cache, config, library-loader)                         |
   | renderer/     (markdown-it pipeline mirroring MPU engine.ts)         |
   | diagrams/     (DiagramManager + Mermaid / PlantUML / Kroki adapters) |
   | features/     (ToC, search, zoom, export, theme bridge)              |
   | vendor/mpu/   (copied portable MPU source: encoder, themes, ...)     |
   +----------------------------------------------------------------------+
```

Only PlantUML/Graphviz rendering may reach an external (self-hostable)
PlantUML/Kroki server. Everything else runs in the browser.

## Phases

- **Phase 0 - Scaffolding:** repo skeleton, package.json, build tooling, license.
- **Phase 1 - Vendoring + build:** `scripts/vendor-from-mpu.sh` copies portable MPU
  modules into `src/vendor/mpu/`; `build.mjs` bundles everything with esbuild.
- **Phase 2 - Core render path:** `PluginConfig`, `LibraryLoader`,
  `MarkdownViewDetector`, `RenderCoordinator`, `HtmlSanitizer`, `RenderCache`,
  and the `MarkdownRenderer` (markdown-it pipeline).
- **Phase 3 - Diagrams:** `DiagramManager` + `MermaidAdapter`, `PlantUmlAdapter`,
  `KrokiAdapter`.
- **Phase 4 - Feature UI:** `TocPanel`, `SearchController`, `ZoomOverlay`,
  `ExportMenu`, `ThemeBridge`.
- **Phase 5 - Hardening + docs:** styles, build verification, documentation.

## Vendoring / sync

The MPU source of truth lives in a separate repo. `scripts/vendor-from-mpu.sh`
copies a pinned set of portable files into `src/vendor/mpu/`. Re-running the script
against a newer MPU commit (and re-bundling) is how this plugin stays in sync. The
copied files carry their original headers; the pinned commit should be recorded in
the script (`MPU_PIN`).

## Configuration

The plugin reads `window.MDPLUS_CONFIG` (see `src/integration/config.js`). Inject it
with copyparty's `--html-head`, e.g.:

```bash
--html-head '<script>window.MDPLUS_CONFIG={diagramBackend:"kroki",diagramBackendUrl:"/kroki"}</script>'
```
