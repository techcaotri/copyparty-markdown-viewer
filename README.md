# Copyparty Markdown Viewer

A **self-contained** [copyparty](https://github.com/9001/copyparty) browser plugin
that upgrades copyparty's Markdown viewing with **Mermaid** and **PlantUML** diagrams,
**math** (KaTeX), rich code highlighting, a **table-of-contents**, in-document
**search**, **zoomable** diagrams, light/dark **theming**, and client-side **export**.

It is built by *vendoring* (copying) the rendering pipeline from the
[Markdown-Preview-Unified](https://github.com/techcaotri/markdown-preview-enhanced)
(MPU) project and bundling it into a single browser artifact that copyparty loads via
`--js-browser` / `--css-browser`. There is **no extra service to run** at runtime
(the only optional external piece is a self-hostable PlantUML/Kroki server, needed
only for PlantUML/Graphviz diagrams).

> Design rationale, alternatives considered, and the full architecture are documented
> in the brainstorming document that this implementation follows.

## Status

Work in progress. See the implementation phases in
[docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).

## Quick start

```bash
# 1. Install dev/runtime dependencies
npm install

# 2. Vendor the rendering pipeline from a local MPU checkout (optional; see below)
MPU_REPO=/path/to/markdown-preview-unified npm run vendor

# 3. Build the single artifact (dist/markdown-plus.js + dist/markdown-plus.css)
npm run build

# 4. Load it into copyparty
copyparty --js-browser /abs/path/dist/markdown-plus.js \
          --css-browser /abs/path/dist/markdown-plus.css
```

## License

MIT (c) Tri Pham. See [LICENSE](LICENSE).

This plugin vendors source from Markdown-Preview-Unified (MIT) and bundles
markdown-it, KaTeX, highlight.js, Mermaid, DOMPurify, and pako (each under their
respective permissive licenses).
