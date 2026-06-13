/**
 * MermaidAdapter - renders Mermaid diagrams in-browser.
 *
 * Mermaid (UMD) is lazy-loaded by the LibraryLoader. Theme variables come from the
 * vendored MPU diagram-themes module so output matches the rest of the MPU family.
 */
import { getMermaidThemeConfig } from '../vendor/mpu/diagrams/diagram-themes.js';

let counter = 0;

export class MermaidAdapter {
  constructor(config, loader) {
    this.config = config;
    this.loader = loader;
    this._lastDark = null;
  }

  match(lang) {
    return lang === 'mermaid';
  }

  async render(code, el, ctx) {
    const mermaid = await this.loader.ensureMermaid();
    const isDark = !!ctx.isDark;

    // Re-initialize when the theme changes (Mermaid keeps global config).
    if (this._lastDark !== isDark) {
      const themeConfig = getMermaidThemeConfig(isDark);
      themeConfig.securityLevel = this.config.mermaidSecurityLevel || 'strict';
      themeConfig.startOnLoad = false;
      mermaid.initialize(themeConfig);
      this._lastDark = isDark;
    }

    const id = 'mdplus-mermaid-' + (++counter);
    const { svg, bindFunctions } = await mermaid.render(id, code);
    el.innerHTML = svg;
    if (typeof bindFunctions === 'function') {
      try {
        bindFunctions(el);
      } catch {
        /* clickable bindings are optional */
      }
    }
  }
}
