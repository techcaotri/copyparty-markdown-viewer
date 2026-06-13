/**
 * Entry point - MarkdownPlusPlugin composition root + IIFE bootstrap.
 *
 * Loaded into copyparty via `--js-browser`. Observes the DOM for Markdown views and
 * renders them with the vendored pipeline. Also exposes a small programmatic API on
 * `window.mdPlus` for demos, tests, and manual control.
 */
import cssText from './styles.css';
import { resolveConfig } from './config.js';

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('mdplus-styles')) return;
  const style = document.createElement('style');
  style.id = 'mdplus-styles';
  style.textContent = cssText;
  (document.head || document.documentElement).appendChild(style);
}
import { LibraryLoader } from './library-loader.js';
import { RenderCache } from './cache.js';
import { HtmlSanitizer } from './sanitizer.js';
import { MarkdownViewDetector } from './detector.js';
import { RenderCoordinator } from './coordinator.js';
import { MarkdownRenderer } from '../renderer/markdown-renderer.js';
import { DiagramManager } from '../diagrams/index.js';
import { FeatureUI } from '../features/index.js';

export class MarkdownPlusPlugin {
  constructor(overrides) {
    this.config = resolveConfig(overrides);
    this.loader = new LibraryLoader(this.config);
    this.renderer = new MarkdownRenderer(this.config);
    this.sanitizer = new HtmlSanitizer(this.config);
    this.cache = new RenderCache();
    this.coordinator = new RenderCoordinator({
      config: this.config,
      renderer: this.renderer,
      sanitizer: this.sanitizer,
      cache: this.cache,
      loader: this.loader,
    });
    this.coordinator.setDiagramManager(
      new DiagramManager(this.config, this.loader, this.cache)
    );
    this.coordinator.setFeatureUI(new FeatureUI(this.config, this.coordinator));
    this.detector = new MarkdownViewDetector(this.config);
    this._inited = false;
  }

  init() {
    if (this._inited) return;
    this._inited = true;
    injectStyles();
    this.detector.observe(({ text, host, filePath }) => {
      this.coordinator.render(text, filePath, host).catch((err) => {
        console.error('[mdplus] render failed', err);
      });
    });
  }

  /** Render markdown text directly into an element (demo / test / manual use). */
  renderInto(el, text, filePath) {
    injectStyles();
    return this.coordinator.render(text, filePath || '', el);
  }

  destroy() {
    this.detector.disconnect();
    this._inited = false;
  }
}

(function bootstrap() {
  if (typeof window === 'undefined') return;
  if (window.mdPlusLoaded) return;
  window.mdPlusLoaded = true;

  const plugin = new MarkdownPlusPlugin(window.MDPLUS_CONFIG_OVERRIDES);
  window.mdPlus = plugin;

  if (plugin.config.autoInit) {
    if (document.readyState !== 'loading') plugin.init();
    else document.addEventListener('DOMContentLoaded', () => plugin.init());
  }
})();
