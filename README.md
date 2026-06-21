# Copyparty Markdown Viewer

A **self-contained** [copyparty](https://github.com/9001/copyparty) browser plugin
that upgrades copyparty's Markdown viewing with **Mermaid** and **PlantUML** diagrams,
**math** (KaTeX), rich code highlighting, a **table-of-contents**, in-document
**search**, **zoomable** diagrams, light/dark **theming**, and client-side **export**.

It is built by *vendoring* (copying) the rendering pipeline from the
[Markdown-Preview-Unified](https://github.com/techcaotri/markdown-preview-enhanced)
(MPU) project and bundling it into a **single browser artifact** that copyparty loads
into its Markdown **viewer** page via `--js-other`. There is **no extra service to run**
at runtime — the only optional external piece is a self-hostable PlantUML/Kroki server,
needed only for PlantUML/Graphviz diagrams.

```
Copyparty (Python)  --js-other-->  markdown-plus.js (one bundled artifact)
                                     |
   integration/  detector, coordinator, sanitizer, cache, config, loader
   renderer/     markdown-it pipeline (mirrors MPU engine.ts)
   diagrams/     DiagramManager + Mermaid / PlantUML / Kroki adapters
   features/     ToC, search, zoom, export, theme bridge
   vendor/mpu/   copied portable MPU source (PlantUML encoder, themes, constants)
```

> **Loads on the viewer page, not the file browser.** copyparty injects `--js-other`
> into "all other pages", which includes the Markdown viewer (shown when you open a
> `.md` with `?v`). `--js-browser` only covers the directory/file-browser page and is
> left free for other plugins — see [Deploy as a systemd service](#deploy-as-a-systemd-service),
> where it hosts the companion [Video.js plugin](https://github.com/techcaotri/copyparty-video-plugin).

## Features

- Mermaid diagrams rendered in-browser (flowchart, sequence, class, state, gantt, ...)
- PlantUML / Graphviz via a self-hostable PlantUML or Kroki server
- Math with KaTeX (`$inline$` and `$$block$$`)
- Syntax highlighting (highlight.js)
- GitHub-style Markdown: tables, task lists, footnotes, emoji, anchored headings
- Admonitions: `::: note | tip | info | warning | caution | danger`
- Table of contents sidebar, in-document search, click-to-zoom diagrams
- Zoom the whole document in/out from the toolbar (`−` / `+`, scales text, images and
  diagrams together; click the percentage to reset; persisted)
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
npm run build          # -> dist/markdown-plus.js (+ dist/markdown-plus.css)
```

`dist/` is git-ignored — it is a generated artifact, so rebuild it after pulling.

### 2. Load it into copyparty

copyparty's **Markdown viewer** page (shown when you open a `.md`, i.e. `?v`) is
injected via **`--js-other`** — *not* `--js-browser` (which only covers the
file-browser page). The plugin is a single self-contained JS file and injects its own
CSS, so no `--css-browser` is needed. The bundle must be reachable **by URL**; the
easiest way is to serve it from one of your copyparty volumes.

```bash
# Expose your dev tree read-only so the browser can fetch the bundle same-origin.
# Here /home/tripham/Dev is shared as /dev, so the built bundle is reachable at
#   /dev/Playground_Copyparty/copyparty-markdown-viewer/dist/markdown-plus.js
copyparty -c /etc/copyparty/args.conf \
  -v /home/tripham/Dev:/dev:r,tripham,readuser \
  --js-other  /dev/Playground_Copyparty/copyparty-markdown-viewer/dist/markdown-plus.js \
  --html-head '<script>window.MDPLUS_CONFIG={diagramBackend:"mermaid+puml"}</script>'
```

Open a `.md` file in the copyparty web UI — it renders with diagrams, math, a ToC,
search, and export controls (a floating toolbar appears top-right). The plugin reads
the raw markdown from copyparty's `#mt` textarea, renders into `#mw`, and hides
copyparty's native output/ToC.

> Verified against copyparty v1.20.2; also deployed on v1.19.17. If a future version
> changes the viewer DOM, set `viewerSelector` (see [Configuration](#configuration));
> the detector also falls back to a MutationObserver + URL heuristics.

### 3. Or use the launcher

[`start_copyparty.sh`](start_copyparty.sh) is a foreground launcher that mirrors the
production systemd unit (same binary, same `/etc/copyparty/args.conf`, same `--ftp` /
`.ts` mime tweaks) and loads **both** local plugins. Use it for local
testing/development; for a persistent service use the [installer](#deploy-as-a-systemd-service).

```bash
./start_copyparty.sh                 # Video.js + Markdown viewer (default)
./start_copyparty.sh --no-videojs    # Markdown viewer only
./start_copyparty.sh --no-markdown   # Video.js only
./start_copyparty.sh --no-ftp        # don't start the FTP server
./start_copyparty.sh -h              # help
```

| Flag | Default | Effect |
|------|---------|--------|
| `--videojs` / `--no-videojs`   | on | load the Video.js player on the file-browser page (`--js-browser`) |
| `--markdown` / `--no-markdown` | on | load this Markdown viewer on the viewer page (`--js-other`) |
| `--ftp` / `--no-ftp`           | on | enable copyparty's FTP server (port `3921`) |

Env overrides: `ENABLE_VIDEOJS`, `ENABLE_MARKDOWN`, `ENABLE_FTP`, `DIAGRAM_BACKEND`,
`DIAGRAM_BACKEND_URL`, `COPYPARTY`, `CONF`. The launcher auto-builds the bundle if
`dist/markdown-plus.js` is missing, and adds the read-only `/dev` volume on the command
line if `args.conf` does not already define it.

## Deploy as a systemd service

For a persistent install, `install_copyparty_service.sh` writes
`/etc/systemd/system/copyparty.service` wiring up **both** local copyparty
enhancements, each independently toggleable, and (optionally) adds the read-only
`/dev` volume to `/etc/copyparty/args.conf` so the browser can load both plugins
same-origin:

| Plugin / option | Page | copyparty flag | Disable with | Default |
|-----------------|------|----------------|--------------|---------|
| [Video.js enhanced player](https://github.com/techcaotri/copyparty-video-plugin) | file browser | `--js-browser` | `--no-videojs` | on |
| Markdown viewer (this repo) | viewer (`?v`) | `--js-other` + `--html-head` | `--no-markdown` | on |
| `/dev` read-only volume (`-v /home/tripham/Dev:/dev:r,tripham,readuser`) | — | `args.conf` edit | `--no-dev-volume` | on |
| FTP server | — | `--ftp 3921` | `--no-ftp` | on |

Because the two plugins live on **different** pages (Video.js on `--js-browser`, the
Markdown viewer on `--js-other`), they coexist without contending for a single
option.

The script is published as a secret Gist (it contains machine-specific paths, so it is
**not** part of this repo):

➡️ **[install_copyparty_service.sh (Gist)](https://gist.github.com/techcaotri/6420fbd61783df624b61d7221eb8c4d0)**

Run it **as your normal user** (so the nvm-based `npm` build works) — it calls `sudo`
only for the privileged steps and backs up every file it touches. Download it next to
this repo (it locates both plugin repos relative to its own path):

```bash
cd /home/tripham/Dev/Playground_Copyparty/copyparty-markdown-viewer
curl -fsSL https://gist.githubusercontent.com/techcaotri/6420fbd61783df624b61d7221eb8c4d0/raw/install_copyparty_service.sh \
  -o install_copyparty_service.sh
chmod +x install_copyparty_service.sh

./install_copyparty_service.sh --dry-run   # preview the plan + rendered unit, change nothing
./install_copyparty_service.sh             # apply (prompts before writing; --yes to skip)
```

Examples:

```bash
./install_copyparty_service.sh --no-videojs     # Markdown viewer + /dev volume only
./install_copyparty_service.sh --no-markdown     # Video.js only
./install_copyparty_service.sh --no-dev-volume   # leave args.conf untouched
./install_copyparty_service.sh --no-ftp --no-restart
```

What it does, in order: builds the Markdown bundle if missing → appends the `/dev`
volume to `args.conf` (idempotent, backed up) → renders and installs the unit (backed
up) → `systemd-analyze verify` → `daemon-reload` + `enable` + `restart`. The resulting
`ExecStart` (all features on) is:

```
/home/tripham/.local/bin/copyparty -c /etc/copyparty/args.conf --ftp 3921 \
  --mime ".ts=video/mp2t" \
  --js-browser /dev/Playground_Copyparty/copyparty-video-plugin/videojs-enhanced.js \
  --js-other  /dev/Playground_Copyparty/copyparty-markdown-viewer/dist/markdown-plus.js \
  --html-head '<script>window.MDPLUS_CONFIG={diagramBackend:"mermaid+puml"}</script>'
```

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
| `features`          | all `true`                         | `{ toc, search, zoom, contentZoom, export, copyCode }` |
| `theme`             | `"auto"`                           | `"auto"`, `"light"`, or `"dark"`                      |
| `viewerSelector`    | `null`                             | Explicit CSS selector for copyparty's md container    |
| `autoInit`          | `true`                             | Observe the DOM and render automatically              |

The launcher and installer build `MDPLUS_CONFIG` from the `DIAGRAM_BACKEND` and
`DIAGRAM_BACKEND_URL` environment variables.

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
start_copyparty.sh foreground launcher: args.conf + Video.js + Markdown viewer (toggleable)
build.mjs          esbuild bundler
```

The systemd installer (`install_copyparty_service.sh`) is kept in a separate Gist
because it carries machine-specific paths; see
[Deploy as a systemd service](#deploy-as-a-systemd-service).

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
- The `/dev` volume is mounted **read-only** for logged-in accounts only
  (`r,tripham,readuser`) — no anonymous access and no write, so exposing the dev tree
  to host the bundle cannot be used to modify it.

## Troubleshooting

- **Nothing renders:** confirm the bundle is loaded — the `--js-other` URL must be
  correct *and* reachable (open it directly in the browser; you should get the JS, not
  a 404/login page). Check the console. Set `viewerSelector` if your copyparty version
  uses a different Markdown container.
- **Bundle 404s / redirects to login:** the `/dev` volume is missing or the file is
  outside it. Add `-v /home/tripham/Dev:/dev:r,tripham,readuser` (the installer's
  `/dev volume` step) and make sure you are logged in.
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
