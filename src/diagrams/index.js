/**
 * DiagramManager - finds tagged diagram blocks and routes each to an adapter.
 *
 * The MarkdownRenderer emits diagram fences as:
 *   <pre class="mdplus-diagram-src" data-diagram-lang="LANG"><code>SOURCE</code></pre>
 * This manager replaces each with a rendered <div class="mdplus-diagram">. Output is
 * cached per (lang, theme, source). On any failure it falls back to showing the
 * diagram source plus an inline error, so a bad diagram never blanks the page.
 */
import { MermaidAdapter } from './mermaid-adapter.js';
import { PlantUmlAdapter } from './plantuml-adapter.js';
import { KrokiAdapter } from './kroki-adapter.js';

export class DiagramManager {
  constructor(config, loader, cache) {
    this.config = config;
    this.loader = loader;
    this.cache = cache;
    this.adapters = [];
    this._register();
  }

  _register() {
    // Mermaid always renders in-browser.
    this.adapters.push(new MermaidAdapter(this.config, this.loader));
    if (this.config.diagramBackend === 'kroki') {
      this.adapters.push(new KrokiAdapter(this.config));
    } else {
      this.adapters.push(new PlantUmlAdapter(this.config));
    }
  }

  register(adapter) {
    this.adapters.push(adapter);
  }

  _isDark(container) {
    const host = container.closest('.mdplus-host');
    return host ? host.getAttribute('data-mdplus-theme') === 'dark' : false;
  }

  async process(container) {
    const blocks = Array.from(container.querySelectorAll('pre.mdplus-diagram-src'));
    if (!blocks.length) return;
    const isDark = this._isDark(container);
    await Promise.all(blocks.map((block) => this._processOne(block, isDark)));
  }

  async _processOne(block, isDark) {
    const lang = block.getAttribute('data-diagram-lang') || '';
    const codeEl = block.querySelector('code');
    const code = (codeEl ? codeEl.textContent : block.textContent) || '';

    const target = document.createElement('div');
    target.className = 'mdplus-diagram';
    target.setAttribute('data-diagram-lang', lang);
    block.replaceWith(target);

    const adapter = this.adapters.find((a) => a.match(lang));
    if (!adapter) {
      this._fallback(target, code, lang, 'no adapter for this diagram type');
      return;
    }

    const cacheKey = 'diag:' + this.cache.hash(lang + '|' + (isDark ? 'd' : 'l') + '|' + code);
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      target.innerHTML = cached;
      target.setAttribute('data-zoomable', '');
      return;
    }

    try {
      await this._withTimeout(
        adapter.render(code, target, { isDark, lang, config: this.config }),
        25000
      );
      target.setAttribute('data-zoomable', '');
      // Cache string-based outputs (svg / remote <img>); skip blob: URLs.
      if (!/blob:/.test(target.innerHTML)) {
        this.cache.set(cacheKey, target.innerHTML);
      }
    } catch (err) {
      this._fallback(target, code, lang, err && err.message ? err.message : String(err));
    }
  }

  _withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('diagram render timed out')), ms)
      ),
    ]);
  }

  _fallback(target, code, lang, message) {
    target.innerHTML = '';
    target.removeAttribute('data-zoomable');
    const note = document.createElement('div');
    note.className = 'mdplus-diagram-error';
    note.textContent = `${lang || 'diagram'} could not be rendered: ${message}`;
    const pre = document.createElement('pre');
    pre.className = 'mdplus-code';
    const code_ = document.createElement('code');
    code_.textContent = code;
    pre.appendChild(code_);
    target.appendChild(note);
    target.appendChild(pre);
  }
}
