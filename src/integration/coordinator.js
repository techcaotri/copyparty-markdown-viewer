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
    // 'auto': follow copyparty's body class if present, else OS preference.
    const body = document.body;
    if (body && /\b(dark|y)\b/.test(body.getAttribute('data-theme') || '')) return 'dark';
    if (body && body.classList.contains('dark')) return 'dark';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark';
    return 'light';
  }

  async render(text, filePath, hostEl) {
    if (!hostEl) throw new Error('RenderCoordinator.render requires a host element');

    if (this.config.mathRenderer === 'KaTeX' && /\$|\\\(|\\\[/.test(text)) {
      await this.loader.ensureKatexCss();
    }

    const key = this.cache.hash(text);
    let html = this.cache.get(key);
    if (html === undefined) {
      html = this.sanitizer.sanitize(this.renderer.render(text, filePath));
      this.cache.set(key, html);
    }

    const container = this._mount(html, hostEl);

    if (this.diagrams) {
      try {
        await this.diagrams.process(container);
      } catch (err) {
        console.warn('[mdplus] diagram processing failed', err);
      }
    }

    if (this.features) {
      try {
        this.features.mountAll(container, { filePath, sourceText: text });
      } catch (err) {
        console.warn('[mdplus] feature mount failed', err);
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
