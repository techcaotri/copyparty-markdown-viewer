/**
 * KrokiAdapter - renders many diagram types through a (self-hosted) Kroki server.
 *
 * Enabled when MDPLUS_CONFIG.diagramBackend === 'kroki'. Mermaid is still rendered
 * in-browser (interactive); everything else (PlantUML, Graphviz/dot, etc.) is POSTed
 * to Kroki and embedded as an image. Requires `diagramBackendUrl`.
 */
const LANG_TO_KROKI = {
  plantuml: 'plantuml',
  puml: 'plantuml',
  uml: 'plantuml',
  dot: 'graphviz',
  graphviz: 'graphviz',
  kroki: 'graphviz',
};

export class KrokiAdapter {
  constructor(config) {
    this.config = config;
  }

  match(lang) {
    return Object.prototype.hasOwnProperty.call(LANG_TO_KROKI, lang);
  }

  async render(code, el, ctx) {
    const server = this.config.diagramBackendUrl;
    if (!server) {
      throw new Error('Kroki needs MDPLUS_CONFIG.diagramBackendUrl (a Kroki server URL)');
    }
    const type = LANG_TO_KROKI[ctx.lang] || 'graphviz';
    const format = this.config.diagramFormat === 'png' ? 'png' : 'svg';
    const url = `${server.replace(/\/+$/, '')}/${type}/${format}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: code,
    });
    if (!res.ok) throw new Error(`Kroki ${type} request failed (${res.status})`);

    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.alt = `${type} diagram`;
    img.src = objUrl;
    el.appendChild(img);
  }
}
