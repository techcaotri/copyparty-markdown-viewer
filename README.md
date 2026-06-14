# Copyparty Markdown Viewer

A **self-contained** [copyparty](https://github.com/9001/copyparty) browser plugin
that upgrades copyparty's Markdown viewing with **Mermaid** and **PlantUML** diagrams,
**math** (KaTeX), rich code highlighting, a **table-of-contents**, in-document
**search**, **zoomable** diagrams, light/dark **theming**, and client-side **export**.

It is built by *vendoring* (copying) the rendering pipeline from the
[Markdown-Preview-Unified](https://github.com/techcaotri/markdown-preview-enhanced)
(MPU) project and bundling it into a **single browser artifact** that copyparty loads
via `--js-browser` / `--css-browser`. There is **no extra service to run** at runtime
— the only optional external piece is a self-hostable PlantUML/Kroki server, needed
only for PlantUML/Graphviz diagrams.

```
Copyparty (Python)  --js-browser-->  markdown-plus.js (one bundled artifact)
                                       |
   integration/  detector, coordinator, sanitizer, cache, config, loader
   renderer/     markdown-it pipeline (mirrors MPU engine.ts)
   diagrams/     DiagramManager + Mermaid / PlantUML / Kroki adapters
   features/     ToC, search, zoom, export, theme bridge
   vendor/mpu/   copied portable MPU source (PlantUML encoder, themes, constants)
```

## Features

- Mermaid diagrams rendered in-browser (flowchart, sequence, class, state, gantt, ...)
- PlantUML / Graphviz via a self-hostable PlantUML or Kroki server
- Math with KaTeX (`$inline$` and `$$block$$`)
- Syntax highlighting (highlight.js)
- GitHub-style Markdown: tables, task lists, footnotes, emoji, anchored headings
- Admonitions: `::: note | tip | info | warning | caution | danger`
- Table of contents sidebar, in-document search, click-to-zoom diagrams
- Light / dark theme that recolors diagrams on toggle
- Toggle between a fixed reading column and full screen width (toolbar `↔`, persisted)
- Copy-code buttons
- Export: standalone HTML + browser Print-to-PDF
- HTML/SVG sanitization (DOMPurify); works fully offline when assets are self-hosted

## Install

### 1. Build the artifact

```bash
git clone https://github.com/techcaotri/copyparty-markdown-viewer.git
cd copyparty-markdown-viewer
npm install
npm run build          # -> dist/markdown-plus.js + dist/markdown-plus.css
```

### 2. Load it into copyparty

copyparty's **markdown viewer** page (shown when you open a `.md`, i.e. `?v`) is
injected via **`--js-other`** — not `--js-browser` (which only covers the file-browser
page). The plugin is a single self-contained JS file and injects its own CSS, so no
`--css-browser` is needed. The bundle must be reachable by URL; the easiest way is to
serve it from one of your copyparty volumes.

```bash
# If /home/tripham/Dev is shared as /dev, the built bundle is reachable at
#   /dev/Playground_Copyparty/copyparty-markdown-viewer/dist/markdown-plus.js
copyparty -c /etc/copyparty/args.conf \
  --js-other  /dev/Playground_Copyparty/copyparty-markdown-viewer/dist/markdown-plus.js \
  --js-browser /dev/Playground_Copyparty/copyparty-markdown-viewer/dist/markdown-plus.js \
  --html-head '<script>window.MDPLUS_CONFIG={diagramBackend:"mermaid+puml"}</script>'
```

Or just use the ready-made launcher (mirrors your `start_copyparty.sh` and adds the
plugin): [`start_copyparty.sh`](start_copyparty.sh).

Open a `.md` file in the copyparty web UI — it renders with diagrams, math, a ToC,
search, and export controls (a floating toolbar appears top-right). The plugin reads
the raw markdown from copyparty's `#mt` textarea, renders into `#mw`, and hides
copyparty's native output/ToC.

> Verified against copyparty v1.20.2. If a future version changes the viewer DOM,
> set `viewerSelector` (see Configuration); the detector also falls back to a
> MutationObserver + URL heuristics.

## Configuration

Set `window.MDPLUS_CONFIG` before the bundle loads, using copyparty's `--html-head`:

```bash
copyparty -c /etc/copyparty/args.conf \
  --js-other  /dev/.../dist/markdown-plus.js \
  --html-head '<script>window.MDPLUS_CONFIG={diagramBackend:"kroki",diagramBackendUrl:"/kroki"}</script>'
```

| Key                 | Default                            | Meaning                                              |
|---------------------|------------------------------------|------------------------------------------------------|
| `diagramBackend`    | `"mermaid+puml"`                   | `"mermaid+puml"` or `"kroki"`                         |
| `diagramBackendUrl` | `null`                             | PlantUML or Kroki base URL (required for PlantUML)    |
| `diagramFormat`     | `"svg"`                            | `"svg"` or `"png"` for server-rendered diagrams       |
| `assetBaseUrl`      | `"https://cdn.jsdelivr.net/npm"`   | Where Mermaid + KaTeX CSS are fetched from            |
| `mermaidUrl`        | `null`                             | Full override for the Mermaid script URL              |
| `katexCssUrl`       | `null`                             | Full override for the KaTeX CSS URL                   |
| `mathRenderer`      | `"KaTeX"`                          | `"KaTeX"` or `"none"`                                 |
| `mermaidSecurityLevel` | `"strict"`                      | Mermaid security level                                |
| `features`          | all `true`                         | `{ toc, search, zoom, export, copyCode }`             |
| `theme`             | `"auto"`                           | `"auto"`, `"light"`, or `"dark"`                      |
| `viewerSelector`    | `null`                             | Explicit CSS selector for copyparty's md container    |
| `autoInit`          | `true`                             | Observe the DOM and render automatically              |

## Diagram backends

Mermaid and math are fully self-contained (in-browser). **PlantUML/Graphviz need a
server** because their rendering is not pure JavaScript. Run one yourself — never
point at a public host for private content.

PlantUML server:

```bash
docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
# MDPLUS_CONFIG = { diagramBackend:"mermaid+puml", diagramBackendUrl:"http://localhost:8080" }
```

Kroki (unified: PlantUML, Graphviz, BPMN, ...):

```bash
docker run -d -p 8000:8000 yuzutech/kroki
# MDPLUS_CONFIG = { diagramBackend:"kroki", diagramBackendUrl:"http://localhost:8000" }
```

Tip: reverse-proxy the diagram server under copyparty's origin (e.g. `/kroki`) to
keep everything same-origin.

## Offline / air-gapped

By default Mermaid and KaTeX's CSS/fonts load from a CDN. To self-host them:

```bash
npm run build:assets         # copies KaTeX css/fonts (+ Mermaid if installed) into dist/assets/
```

Serve `dist/` from copyparty and set:

```js
window.MDPLUS_CONFIG = {
  assetBaseUrl: '/.mdplus/dist/assets',
  mermaidUrl: '/.mdplus/dist/assets/mermaid/mermaid.min.js',
  katexCssUrl: '/.mdplus/dist/assets/katex/katex.min.css',
  diagramBackendUrl: '/kroki' // self-hosted diagram server
};
```

With a self-hosted diagram server and assets, the plugin makes **no external
requests**.

## Develop

```bash
npm run dev          # esbuild watch
npm run serve:demo   # http://localhost:8099/demo/  (loads dist/, renders a sample)
npm test             # unit (render + encoder) + jsdom integration test
npm run test:e2e     # headless-Chrome test against a running copyparty (see below)
```

The e2e test (`test/e2e.mjs`, uses `playwright-core` + system Chrome) drives a real
copyparty markdown viewer and checks Mermaid, math, highlighting, the toolbar/ToC,
and graceful PlantUML fallback. Point it at a server with env vars: `BASE`, `CPPW`
(password), `MDPATH` (viewer file path).

Project layout:

```
src/integration/   detector, coordinator, sanitizer, cache, config, library-loader, styles.css, index.js
src/renderer/      markdown-renderer.js (markdown-it pipeline)
src/diagrams/      index.js (DiagramManager) + mermaid/plantuml/kroki adapters
src/features/      index.js (FeatureUI) + toc/search/zoom/export/theme-bridge
src/vendor/mpu/    copied MPU source (do not edit; re-run the vendor script)
scripts/           vendor-from-mpu.sh, copy-assets.mjs, serve-demo.mjs
test/              smoke.mjs, plantuml.mjs, integration.mjs (jsdom), e2e.mjs (real copyparty)
examples/          sample.md (feature showcase)
start_copyparty.sh launcher: your args.conf + the plugin
build.mjs          esbuild bundler
```

## Vendoring / sync with MPU

The rendering core is *copied* from MPU, not depended on at runtime. To refresh it
against a newer MPU checkout:

```bash
MPU_REPO=/path/to/markdown-preview-unified MPU_PIN=<commit-sha> npm run vendor
npm run build && npm test
```

Only portable, low-dependency modules are vendored (PlantUML encoder, Catppuccin
diagram themes/skinparams, shared constants); the ToC/search/zoom modules are
re-implemented under `src/features/` following MPU's design. See
[docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).

## Security

- All rendered Markdown HTML and SVG is sanitized with DOMPurify before injection.
- Mermaid runs with `securityLevel: "strict"` by default.
- The PlantUML/Kroki host must be explicitly configured — there is no public default,
  which avoids leaking private documents and SSRF surprises.

## Troubleshooting

- **Nothing renders:** confirm the bundle is loaded (`--js-browser` path is correct)
  and check the console. Set `viewerSelector` if your copyparty version uses a
  different Markdown container.
- **PlantUML shows the source + an error:** set `diagramBackendUrl` to a reachable
  PlantUML/Kroki server.
- **Math is unstyled:** the KaTeX CSS failed to load; self-host it and set
  `katexCssUrl`, or check CDN access.
- **Mermaid diagrams missing:** the Mermaid script failed to load; self-host it and
  set `mermaidUrl`.

## License

MIT © Tri Pham. See [LICENSE](LICENSE).

This plugin vendors source from Markdown-Preview-Unified (MIT) and bundles
markdown-it, KaTeX, highlight.js, Mermaid, DOMPurify, and pako (each under their
respective permissive licenses).
