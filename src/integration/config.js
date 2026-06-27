/**
 * PluginConfig - resolves runtime configuration for the plugin.
 *
 * Configuration is read (in increasing priority) from:
 *   1. DEFAULT_CONFIG below
 *   2. window.MDPLUS_CONFIG          (set via copyparty --html-head)
 *   3. explicit overrides passed to the plugin constructor
 *
 * The plugin is self-contained: there is no `tier` or `sidecarUrl`. The only
 * optional external dependency is a PlantUML/Kroki server for PlantUML/Graphviz.
 */

export const DEFAULT_CONFIG = {
  // Diagram backend for non-Mermaid diagrams.
  //   'mermaid+puml' -> Mermaid in-browser, PlantUML via a PlantUML server
  //   'kroki'        -> Mermaid in-browser, everything else via a Kroki server
  diagramBackend: 'mermaid+puml',

  // Base URL of the PlantUML or Kroki server (required only for PlantUML/Graphviz).
  // PlantUML example: 'https://www.plantuml.com/plantuml' (public; avoid for privacy)
  // Kroki example:    '/kroki' or 'http://localhost:8000'
  diagramBackendUrl: null,

  // Output format for server-rendered diagrams.
  diagramFormat: 'svg',

  // Where lazily-loaded assets (Mermaid, KaTeX CSS/fonts) are fetched from.
  // Defaults to a public CDN for zero-config use; point at a self-hosted copy
  // (produced by `npm run build:assets`) for offline / air-gapped deployments.
  assetBaseUrl: 'https://cdn.jsdelivr.net/npm',
  mermaidUrl: null, // full override; else `${assetBaseUrl}/mermaid@11/dist/mermaid.min.js`
  katexCssUrl: null, // full override; else `${assetBaseUrl}/katex@0.16.11/dist/katex.min.css`

  // Math rendering: 'KaTeX' | 'none'
  mathRenderer: 'KaTeX',

  // Mermaid security level: 'strict' | 'loose' | 'antiscript' | 'sandbox'
  mermaidSecurityLevel: 'strict',

  // Feature toggles.
  features: {
    toc: true,
    search: true,
    zoom: true, // click-a-diagram fullscreen zoom overlay
    contentZoom: true, // toolbar zoom in/out for the whole document
    export: true,
    copyCode: true,
  },

  // Theme: 'auto' (follow copyparty / OS), 'light', or 'dark'.
  theme: 'auto',

  // Optional explicit CSS selector for copyparty's markdown container. When null,
  // the detector tries a list of known candidates.
  viewerSelector: null,

  // Automatically observe the DOM and render markdown views.
  autoInit: true,
};

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

/** Shallow-but-nested merge sufficient for this config shape. */
function mergeConfig(base, override) {
  if (!isObject(override)) return base;
  const out = { ...base };
  for (const key of Object.keys(override)) {
    if (isObject(base[key]) && isObject(override[key])) {
      out[key] = { ...base[key], ...override[key] };
    } else if (override[key] !== undefined) {
      out[key] = override[key];
    }
  }
  return out;
}

/**
 * Resolve the effective configuration.
 * @param {object} [overrides] - explicit overrides (highest priority).
 * @returns {object} resolved config
 */
export function resolveConfig(overrides) {
  const fromWindow =
    typeof window !== 'undefined' && window.MDPLUS_CONFIG ? window.MDPLUS_CONFIG : {};
  let cfg = mergeConfig(DEFAULT_CONFIG, fromWindow);
  cfg = mergeConfig(cfg, overrides || {});
  return cfg;
}
