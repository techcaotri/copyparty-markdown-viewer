/**
 * FeatureUI - mounts the feature chrome (toolbar, ToC sidebar, search bar) and wires
 * the individual feature controllers (ToC, search, zoom, export, theme).
 *
 * The chrome is built once per host element; mountAll() is safe to call again after
 * each re-render (it rebuilds the ToC/search index and re-binds copy/zoom handlers).
 */
import { TocPanel } from './toc.js';
import { SearchController } from './search.js';
import { ZoomOverlay } from './zoom.js';
import { ContentZoom } from './content-zoom.js';
import { ExportMenu } from './export.js';
import { ThemeBridge } from './theme-bridge.js';

/**
 * Toolbar icons as inline SVG (keyed by the button's data-act). Inline SVG is used
 * instead of Unicode pictographs because several glyphs we previously relied on
 * (notably the printer 🖶 U+1F5B6 and download arrow ⤓ U+2913) are missing from the
 * default fonts on Android and render as a blank box / "tofu". SVG always renders,
 * scales crisply, and recolors via `currentColor` (so theme + active states still
 * work). Sizing is controlled entirely from CSS (.mdplus-tb-btn svg).
 */
const svg = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;

const ICONS = {
  toc: svg('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>'),
  width: svg('<polyline points="8 7 3 12 8 17"/><polyline points="16 7 21 12 16 17"/><line x1="3" y1="12" x2="21" y2="12"/>'),
  'zoom-out': svg('<line x1="5" y1="12" x2="19" y2="12"/>'),
  'zoom-in': svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  // Contrast disc for the light/dark toggle: outlined circle with a filled left half.
  theme: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3 A9 9 0 0 0 12 21 Z" fill="currentColor" stroke="none"/>'),
  html: svg('<path d="M12 3 v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 20 h14"/>'),
  print: svg('<polyline points="6 9 6 3 18 3 18 9"/><path d="M6 18 H4 a2 2 0 0 1 -2 -2 v-4 a2 2 0 0 1 2 -2 h16 a2 2 0 0 1 2 2 v4 a2 2 0 0 1 -2 2 h-2"/><rect x="6" y="14" width="12" height="7"/>'),
};

export class FeatureUI {
  constructor(config, coordinator) {
    this.config = config;
    this.coordinator = coordinator;
    this.toc = new TocPanel(config);
    this.search = new SearchController(config);
    this.zoom = new ZoomOverlay(config);
    this.contentZoom = new ContentZoom(config);
    this.export = new ExportMenu(config);
    this.theme = new ThemeBridge(config, coordinator);
  }

  mountAll(container, ctx) {
    const host = container.closest('.mdplus-host') || container.parentElement;
    if (!host) return;
    const f = this.config.features || {};
    const fullCtx = { ...ctx, host, container };

    let chrome = host.__mdplusChrome;
    if (!chrome) {
      chrome = this._buildChrome(host);
      host.__mdplusChrome = chrome;
    }
    chrome.ctx = fullCtx;

    if (f.copyCode !== false) this._addCopyButtons(container);
    if (f.toc !== false) this.toc.build(container, chrome.tocPanel);
    if (f.zoom !== false) this.zoom.attach(container);
    if (f.contentZoom !== false) this.contentZoom.apply(container);
    if (f.search !== false) this.search.attach(container, chrome.searchUI);

    chrome.toolbar.style.display = '';
  }

  _buildChrome(host) {
    const toolbar = document.createElement('div');
    toolbar.className = 'mdplus-toolbar';

    const mkBtn = (label, title, act) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mdplus-tb-btn';
      if (ICONS[act]) b.innerHTML = ICONS[act];
      else b.textContent = label;
      b.title = title;
      b.setAttribute('aria-label', title);
      b.dataset.act = act;
      toolbar.appendChild(b);
      return b;
    };

    const f = this.config.features || {};
    if (f.toc !== false) mkBtn('☰', 'Table of contents', 'toc');
    if (f.search !== false) mkBtn('⌕', 'Search (in document)', 'search');
    const widthBtn = mkBtn('↔', 'Toggle full width', 'width');
    try {
      if (localStorage.getItem('mdplus-width') === 'wide') widthBtn.classList.add('mdplus-tb-active');
    } catch {
      /* ignore */
    }

    // Zoom controls: shrink / current level (click to reset) / enlarge. The CSS `zoom`
    // applied by ContentZoom scales font size, images, and diagrams together.
    let zoomOutBtn, zoomLevelBtn, zoomInBtn, refreshZoom;
    if (f.contentZoom !== false) {
      zoomOutBtn = mkBtn('−', 'Zoom out', 'zoom-out');
      zoomLevelBtn = mkBtn('100%', 'Reset zoom', 'zoom-reset');
      zoomLevelBtn.classList.add('mdplus-tb-zoom-level');
      zoomInBtn = mkBtn('+', 'Zoom in', 'zoom-in');
      refreshZoom = (z) => {
        zoomLevelBtn.textContent = `${z.percent}%`;
        zoomLevelBtn.classList.toggle('mdplus-tb-active', z.percent !== 100);
        zoomOutBtn.disabled = z.atMin;
        zoomInBtn.disabled = z.atMax;
        zoomOutBtn.title = `Zoom out (${z.percent}%)`;
        zoomInBtn.title = `Zoom in (${z.percent}%)`;
        zoomOutBtn.setAttribute('aria-label', zoomOutBtn.title);
        zoomInBtn.setAttribute('aria-label', zoomInBtn.title);
      };
      this.contentZoom.onChange = refreshZoom;
      refreshZoom(this.contentZoom); // reflect the persisted level immediately
    }

    mkBtn('◐', 'Toggle light/dark theme', 'theme');
    if (f.export !== false) {
      mkBtn('⤓', 'Export to HTML', 'html');
      mkBtn('🖶', 'Print / Save as PDF', 'print');
    }

    // ToC sidebar
    const tocPanel = document.createElement('aside');
    tocPanel.className = 'mdplus-sidebar';

    // Search bar
    const searchBar = document.createElement('div');
    searchBar.className = 'mdplus-searchbar';
    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Find in document... (Enter / Shift+Enter)';
    input.className = 'mdplus-search-input';
    const countEl = document.createElement('span');
    countEl.className = 'mdplus-search-count';
    searchBar.appendChild(input);
    searchBar.appendChild(countEl);

    // Attach the floating chrome to <body>, NOT to the host. copyparty's #mw host
    // creates a stacking context (and its #mh header has a positive z-index), which
    // would otherwise paint over our toolbar. On <body> our high z-index wins.
    const mount = document.body || host;
    mount.appendChild(toolbar);
    mount.appendChild(tocPanel);
    mount.appendChild(searchBar);

    const chrome = { toolbar, tocPanel, searchBar, searchUI: { input, countEl } };

    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'toc') tocPanel.classList.toggle('open');
      else if (act === 'search') {
        searchBar.classList.toggle('open');
        if (searchBar.classList.contains('open')) input.focus();
      } else if (act === 'width') {
        const wide = host.classList.toggle('mdplus-wide');
        try {
          localStorage.setItem('mdplus-width', wide ? 'wide' : 'fixed');
        } catch {
          /* ignore */
        }
        btn.classList.toggle('mdplus-tb-active', wide);
      } else if (act === 'zoom-out') {
        this.contentZoom.zoomOut();
      } else if (act === 'zoom-in') {
        this.contentZoom.zoomIn();
      } else if (act === 'zoom-reset') {
        this.contentZoom.reset();
      } else if (act === 'theme') {
        this.theme.toggle(host, chrome.ctx).catch(() => {});
      } else if (act === 'html') {
        this.export.exportHtml(chrome.ctx.container, chrome.ctx);
      } else if (act === 'print') {
        this.export.printPdf();
      }
    });

    // Auto-hide the ToC drawer when clicking outside it. Clicks on the toolbar are
    // ignored so the toggle button keeps working (its handler runs in the same click).
    document.addEventListener('click', (e) => {
      if (!tocPanel.classList.contains('open')) return;
      if (tocPanel.contains(e.target) || toolbar.contains(e.target)) return;
      tocPanel.classList.remove('open');
    });

    return chrome;
  }

  _addCopyButtons(container) {
    for (const pre of container.querySelectorAll('pre.mdplus-code')) {
      if (pre.parentElement && pre.parentElement.classList.contains('mdplus-code-wrap')) continue;
      const wrap = document.createElement('div');
      wrap.className = 'mdplus-code-wrap';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mdplus-copy-btn';
      btn.textContent = 'copy';
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText);
          btn.textContent = 'copied';
          setTimeout(() => (btn.textContent = 'copy'), 1200);
        } catch {
          btn.textContent = 'failed';
          setTimeout(() => (btn.textContent = 'copy'), 1200);
        }
      });
      wrap.appendChild(btn);
    }
  }
}
