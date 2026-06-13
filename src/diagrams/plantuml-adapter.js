/**
 * PlantUmlAdapter - renders PlantUML via a PlantUML server.
 *
 * Reuses the vendored MPU PlantUML encoder (deflate + custom base64) and the
 * theme-aware skinparam injector. The bundled `pako` is published to `window.pako`
 * so the vendored encoder runs fully offline (it checks for a global `pako` and
 * otherwise tries to fetch it from a CDN - which we avoid).
 *
 * Requires `diagramBackendUrl` to point at a PlantUML server (self-hosted for
 * privacy). When unset, the adapter falls back to showing the diagram source.
 */
import pako from 'pako';
import { encodePlantUmlText, getPlantUmlUrl } from '../vendor/mpu/diagrams/plantuml-encoder.js';
import { injectPlantUmlTheme } from '../vendor/mpu/diagrams/diagram-themes.js';

if (typeof window !== 'undefined' && !window.pako) {
  window.pako = pako; // satisfy the vendored encoder's global lookup
}

export class PlantUmlAdapter {
  constructor(config) {
    this.config = config;
  }

  match(lang) {
    return lang === 'plantuml' || lang === 'puml' || lang === 'uml';
  }

  async render(code, el, ctx) {
    const server = this.config.diagramBackendUrl;
    if (!server) {
      throw new Error(
        'PlantUML needs MDPLUS_CONFIG.diagramBackendUrl (a PlantUML server URL)'
      );
    }
    const format = this.config.diagramFormat || 'svg';
    const themed = injectPlantUmlTheme(code, !!ctx.isDark);
    const encoded = await encodePlantUmlText(themed);
    const url = getPlantUmlUrl(encoded, format, server.replace(/\/+$/, ''));

    await new Promise((resolve, reject) => {
      const img = new Image();
      img.alt = 'PlantUML diagram';
      img.loading = 'lazy';
      img.onload = () => {
        el.appendChild(img);
        resolve();
      };
      img.onerror = () => reject(new Error('PlantUML server request failed'));
      img.src = url;
    });
  }
}
