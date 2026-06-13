/**
 * RenderCoordinator - orchestrates a single render.
 *
 * Flow: render (markdown-it) -> sanitize (DOMPurify) -> mount -> upgrade diagrams
 * -> mount feature UI. The diagram manager and feature UI are injected by later
 * phases via setDiagramManager()/setFeatureUI(); when absent the coordinator still
 * produces correctly rendered (diagram-less) output.
 */
export class RenderCoordinator {
  constructor({ config, renderer, sanitizer, cache, loader }) {
    this.config = config;
    this.renderer = renderer;
    this.sanitizer = sanitizer;
    this.cache = cache;
    this.loader = loader;
    this.diagrams = null;
    this.features = null;
  }

  setDiagramManager(dm) {
    this.diagrams = dm;
  }

  setFeatureUI(fu) {
    this.features = fu;
  }

  resolveTheme() {
    const t = this.config.theme;
    if (t === 'light' || t === 'dark') return t;
    // A manual choice (from the toolbar toggle) wins over auto-detection so a
    // re-render does not snap back to copyparty's theme.
    try {
      const saved = localStorage.getItem('mdplus-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignore */
    }
    // 'auto': follow copyparty's theme, else OS preference.
    // copyparty's markdown viewer sets <html class="z"> for dark, "y" for light.
    const root = document.documentElement;
    if (root) {
      const cls = root.className || '';
      if (/\bz\b/.test(cls)) return 'dark';
      if (/\by\b/.test(cls)) return 'light';
    }
    const body = document.body;
    if (body && body.classList.contains('dark')) return 'dark';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark';
    return 'light';
  }

  async render(text, filePath, hostEl) {
    if (!hostEl) throw new Error('RenderCoordinator.render requires a host element');

    // KaTeX HTML is produced synchronously by the bundled engine; its stylesheet is
    // only for visual polish, so load it without blocking the render.
    if (this.config.mathRenderer === 'KaTeX' && /\$|\\\(|\\\[/.test(text)) {
      this.loader.ensureKatexCss();
    }

    const key = this.cache.hash(text);
    let html = this.cache.get(key);
    if (html === undefined) {
      html = this.sanitizer.sanitize(this.renderer.render(text, filePath));
      this.cache.set(key, html);
    }

    const container = this._mount(html, hostEl);

    // Mount the feature UI first so it appears immediately and never waits on a slow
    // or hanging diagram backend; diagrams upgrade asynchronously afterwards.
    if (this.features) {
      try {
        this.features.mountAll(container, { filePath, sourceText: text });
      } catch (err) {
        console.warn('[mdplus] feature mount failed', err);
      }
    }

    if (this.diagrams) {
      try {
        await this.diagrams.process(container);
      } catch (err) {
        console.warn('[mdplus] diagram processing failed', err);
      }
    }

    container.dispatchEvent(
      new CustomEvent('mdplus:rendered', { bubbles: true, detail: { filePath } })
    );
    return container;
  }

  _mount(html, hostEl) {
    const theme = this.resolveTheme();
    hostEl.classList.add('mdplus-host');
    hostEl.setAttribute('data-mdplus-theme', theme);

    // Hide copyparty's native markdown output so ours is authoritative on the
    // markdown viewer page: #ml = "Loading", #mp = copyparty's rendered output,
    // #toc = copyparty's table of contents (its links point into the hidden #mp, so
    // hide it and use the plugin's own ToC instead).
    const nativeSelectors = ['#ml', '#mp', '#toc'];
    for (const sel of nativeSelectors) {
      const native = hostEl.querySelector(sel) || document.querySelector(sel);
      if (native && !native.classList.contains('mdplus-content')) {
        native.style.display = 'none';
        native.setAttribute('data-mdplus-hidden', '');
      }
    }

    // On copyparty's wide-screen layout #mw is fixed with a large left offset to
    // make room for its (now hidden) #toc. Reclaim the full width so the content is
    // not pushed right with empty space on the left.
    if (hostEl.id === 'mw' || hostEl.id === 'mp') {
      hostEl.style.left = '0';
      hostEl.style.right = '0';
      hostEl.style.maxWidth = 'none';
    }

    let wrapper = hostEl.querySelector(':scope > .mdplus-content');
    if (!wrapper) {
      wrapper = document.createElement('article');
      wrapper.className = 'mdplus-content';
      hostEl.appendChild(wrapper);
    }
    wrapper.innerHTML = html;
    return wrapper;
  }
}
