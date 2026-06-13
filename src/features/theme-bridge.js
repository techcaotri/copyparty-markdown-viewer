/**
 * ThemeBridge - keeps the rendered document's theme in sync with copyparty / the OS
 * and provides a manual toggle. Toggling re-renders so diagrams (whose colors are
 * baked into their SVG) are recolored for the new theme.
 */
const STORAGE_KEY = 'mdplus-theme';

export class ThemeBridge {
  constructor(config, coordinator) {
    this.config = config;
    this.coordinator = coordinator;
  }

  current(host) {
    return host.getAttribute('data-mdplus-theme') || 'light';
  }

  saved() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  apply(host, theme) {
    host.setAttribute('data-mdplus-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }

  /** Toggle light/dark and re-render so diagrams pick up the new theme. */
  async toggle(host, ctx) {
    const next = this.current(host) === 'dark' ? 'light' : 'dark';
    this.apply(host, next);
    if (ctx && typeof ctx.sourceText === 'string') {
      await this.coordinator.render(ctx.sourceText, ctx.filePath, host);
    }
  }
}
