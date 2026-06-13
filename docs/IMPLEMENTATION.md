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

## Copyparty integration (verified against v1.20.2)

Confirmed by reading copyparty's source and testing end-to-end:

- The **markdown viewer** page (`md.html`, served by `tx_md` when a `.md` is opened
  with `?v`) injects **`--js-other`**, not `--js-browser`. `--js-browser` only covers
  the file-browser page (`browser.html`). So the plugin is loaded via `--js-other`.
- `--html-head` is appended to the viewer's `<head>`, so `window.MDPLUS_CONFIG` is set
  there.
- The viewer already contains the raw markdown in `<textarea id="mt">` (HTML-escaped;
  `textarea.value` gives the real source). The detector reads it directly — no fetch.
- copyparty renders into `<div id="mp" class="mdo">` inside `<div id="mw">`, with a
  `<div id="toc">` sidebar and an `<div id="ml">` loading placeholder. The plugin
  renders into `#mw` and hides `#ml`, `#mp`, and `#toc` (whose links would otherwise
  point into the hidden `#mp`).
- copyparty signals dark mode via `<html class="z">` (`"y"` = light); the theme bridge
  honors this.
- Gotcha found in testing: the viewer page exposes an unrelated `window.mermaid`
  (a DOM collection), so the loader validates that a global is the real Mermaid API
  (has `initialize()`/`render()`) before using it; otherwise it dynamic-imports
  Mermaid's ESM build (the v11 UMD no longer sets a usable global).

The end-to-end test (`test/e2e.mjs`, `playwright-core` + system Chrome) starts from a
real copyparty viewer and asserts all of the above renders correctly. A ready-to-use
launcher is `start_copyparty.sh`.

## Configuration

The plugin reads `window.MDPLUS_CONFIG` (see `src/integration/config.js`). Inject it
with copyparty's `--html-head`, e.g.:

```bash
--html-head '<script>window.MDPLUS_CONFIG={diagramBackend:"kroki",diagramBackendUrl:"/kroki"}</script>'
```
