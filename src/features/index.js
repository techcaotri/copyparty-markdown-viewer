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
import { ExportMenu } from './export.js';
import { ThemeBridge } from './theme-bridge.js';

export class FeatureUI {
  constructor(config, coordinator) {
    this.config = config;
    this.coordinator = coordinator;
    this.toc = new TocPanel(config);
    this.search = new SearchController(config);
    this.zoom = new ZoomOverlay(config);
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
      b.textContent = label;
      b.title = title;
      b.dataset.act = act;
      toolbar.appendChild(b);
      return b;
    };

    const f = this.config.features || {};
    if (f.toc !== false) mkBtn('☰', 'Table of contents', 'toc');
    if (f.search !== false) mkBtn('⌕', 'Search (in document)', 'search');
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

    host.appendChild(toolbar);
    host.appendChild(tocPanel);
    host.appendChild(searchBar);

    const chrome = { toolbar, tocPanel, searchBar, searchUI: { input, countEl } };

    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'toc') tocPanel.classList.toggle('open');
      else if (act === 'search') {
        searchBar.classList.toggle('open');
        if (searchBar.classList.contains('open')) input.focus();
      } else if (act === 'theme') {
        this.theme.toggle(host, chrome.ctx).catch(() => {});
      } else if (act === 'html') {
        this.export.exportHtml(chrome.ctx.container, chrome.ctx);
      } else if (act === 'print') {
        this.export.printPdf();
      }
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
