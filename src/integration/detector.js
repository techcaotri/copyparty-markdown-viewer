/**
 * MarkdownViewDetector - notices when copyparty is showing a Markdown file and
 * provides the raw markdown text + a host element to render into.
 *
 * It relies on a MutationObserver (resilient to copyparty version changes) plus URL
 * inspection, rather than copyparty's private functions. The exact viewer container
 * selector varies by copyparty version, so a configurable `viewerSelector` and a
 * list of fallbacks are used; if none match, a dedicated overlay host is created.
 */
const MD_URL_RE = /\.(md|markdown|mkd|mdown|mdwn|mkdn|text|txt)(\?|#|$)/i;

// Preferred render hosts. On copyparty's markdown viewer (md.html) the wrapper is
// #mw (containing #ml loading text and #mp.mdo output); we render into #mw and hide
// copyparty's native nodes (handled in the coordinator).
const HOST_CANDIDATES = ['#mdplus-root', '#mw', '#mp', '.mdo', '#mhtml', '#bdoc', '#doc'];

export class MarkdownViewDetector {
  constructor(config) {
    this.config = config;
    this.observer = null;
    this.lastUrl = null;
    this.onOpen = null;
    this._scheduled = false;
  }

  isMarkdownUrl(url = location.pathname) {
    return MD_URL_RE.test(url);
  }

  /** Find (or create) the element to render markdown into. */
  findHost() {
    const sels = [];
    if (this.config.viewerSelector) sels.push(this.config.viewerSelector);
    sels.push(...HOST_CANDIDATES);
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // Create our own overlay host as a last resort.
    let root = document.getElementById('mdplus-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'mdplus-root';
      root.className = 'mdplus-overlay-host';
      document.body.appendChild(root);
    }
    return root;
  }

  /**
   * Fetch the raw markdown for the current view.
   * Best-effort: copyparty serves the raw file at its URL; if an HTML document is
   * returned instead, we try to recover the source from a <textarea> (editor) or a
   * <pre> (raw view) before giving up.
   */
  async fetchMarkdown(url = location.href) {
    // 1. Editor textarea already in the DOM?
    const ta = document.querySelector('textarea#mt, textarea.mdeditor, textarea[name="body"]');
    if (ta && ta.value && ta.value.trim()) return ta.value;

    // 2. Fetch the file.
    const res = await fetch(url, { credentials: 'same-origin' });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const body = await res.text();

    if (ct.includes('text/markdown') || ct.includes('text/plain')) return body;

    // 3. HTML returned: try to extract embedded source.
    if (/^\s*<(?:!doctype|html)/i.test(body)) {
      const doc = new DOMParser().parseFromString(body, 'text/html');
      const eta = doc.querySelector('textarea#mt, textarea.mdeditor, textarea[name="body"]');
      if (eta && eta.textContent.trim()) return eta.textContent;
      const pre = doc.querySelector('pre');
      if (pre && pre.textContent.trim()) return pre.textContent;
      // Could not recover; return null so the caller leaves copyparty's view alone.
      return null;
    }

    return body;
  }

  _schedule() {
    if (this._scheduled) return;
    this._scheduled = true;
    setTimeout(() => {
      this._scheduled = false;
      this._check();
    }, 80);
  }

  async _check() {
    if (!this.isMarkdownUrl()) return;
    if (location.href === this.lastUrl) return;
    this.lastUrl = location.href;
    try {
      const text = await this.fetchMarkdown();
      if (text == null) return;
      const host = this.findHost();
      if (this.onOpen) this.onOpen({ text, host, filePath: location.pathname });
    } catch (err) {
      console.warn('[mdplus] detector failed to load markdown', err);
    }
  }

  observe(onOpen) {
    this.onOpen = onOpen;
    this.observer = new MutationObserver(() => this._schedule());
    this.observer.observe(document.documentElement, { childList: true, subtree: true });
    // Re-check on SPA-style navigation.
    window.addEventListener('hashchange', () => {
      this.lastUrl = null;
      this._schedule();
    });
    window.addEventListener('popstate', () => {
      this.lastUrl = null;
      this._schedule();
    });
    this._check();
  }

  disconnect() {
    if (this.observer) this.observer.disconnect();
    this.observer = null;
  }
}
