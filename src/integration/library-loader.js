/**
 * LibraryLoader - lazy, de-duplicated loading of runtime assets.
 *
 * markdown-it, KaTeX (JS), highlight.js, DOMPurify and pako are bundled directly
 * into the artifact. The two genuinely heavy / font-bearing assets are loaded on
 * demand from `assetBaseUrl`:
 *   - Mermaid (UMD)            -> only when a Mermaid block is present
 *   - KaTeX CSS + web fonts    -> only when a document contains math
 */
export class LibraryLoader {
  constructor(config) {
    this.config = config;
    this.promises = new Map();
    this.mermaid = null;
  }

  _once(key, factory) {
    if (this.promises.has(key)) return this.promises.get(key);
    const p = factory().catch((err) => {
      this.promises.delete(key); // allow retry on failure
      throw err;
    });
    this.promises.set(key, p);
    return p;
  }

  loadScript(url, timeoutMs = 20000) {
    return this._once('script:' + url, () =>
      new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        const timer = setTimeout(
          () => reject(new Error('Timed out loading script: ' + url)),
          timeoutMs
        );
        s.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        s.onerror = () => {
          clearTimeout(timer);
          reject(new Error('Failed to load script: ' + url));
        };
        document.head.appendChild(s);
      })
    );
  }

  loadStyle(url) {
    return this._once('style:' + url, () =>
      new Promise((resolve, reject) => {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = url;
        l.onload = () => resolve();
        l.onerror = () => reject(new Error('Failed to load stylesheet: ' + url));
        document.head.appendChild(l);
      })
    );
  }

  /** Inject KaTeX CSS (and thus its web fonts) once, when math is present. */
  ensureKatexCss() {
    if (this.config.mathRenderer !== 'KaTeX') return Promise.resolve();
    const url =
      this.config.katexCssUrl ||
      `${this.config.assetBaseUrl}/katex@0.16.11/dist/katex.min.css`;
    return this.loadStyle(url).catch((err) => {
      console.warn('[mdplus] KaTeX CSS failed to load; math may be unstyled.', err);
    });
  }

  /**
   * Load Mermaid once and return the instance.
   *
   * Mermaid v11 ships an ES module (its UMD build no longer exposes a window
   * global), so we dynamic-import the ESM build and use its default export. The
   * import() is built via Function() so the bundler leaves it as a real runtime
   * import of the (possibly remote) URL.
   */
  async ensureMermaid() {
    if (this.mermaid) return this.mermaid;
    // Only trust a pre-existing global if it's actually the Mermaid API. (Copyparty's
    // page can expose an unrelated `window.mermaid`, e.g. a DOM collection.)
    if (typeof window !== 'undefined' && this._isMermaid(window.mermaid)) {
      this.mermaid = window.mermaid;
      return this.mermaid;
    }
    const url =
      this.config.mermaidUrl ||
      `${this.config.assetBaseUrl}/mermaid@11/dist/mermaid.esm.min.mjs`;
    const dynamicImport = this._dynamicImport || (this._dynamicImport = new Function('u', 'return import(u)'));
    const mod = await dynamicImport(url);
    const picked = (mod && (mod.default || mod.mermaid)) || mod;
    if (!this._isMermaid(picked)) {
      throw new Error('Mermaid module loaded but has no initialize()/render()');
    }
    this.mermaid = picked;
    return this.mermaid;
  }

  _isMermaid(obj) {
    return !!obj && typeof obj.render === 'function' && typeof obj.initialize === 'function';
  }
}
