/**
 * ZoomOverlay - click a diagram to open a fullscreen, zoomable/pannable overlay.
 */
export class ZoomOverlay {
  constructor(config) {
    this.config = config;
    this.overlay = null;
    this.stage = null;
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this._drag = null;
  }

  attach(container) {
    if (container.__mdplusZoomBound) return;
    container.__mdplusZoomBound = true;
    container.addEventListener('click', (e) => {
      const diagram = e.target.closest('.mdplus-diagram[data-zoomable]');
      if (diagram && container.contains(diagram)) this.open(diagram);
    });
  }

  _ensureOverlay() {
    if (this.overlay) return;
    const overlay = document.createElement('div');
    // mdplus-host supplies the themed CSS variables to the windowed viewer.
    overlay.className = 'mdplus-zoom-overlay mdplus-host';
    overlay.innerHTML =
      '<div class="mdplus-zoom-window">' +
      '<div class="mdplus-zoom-bar">' +
      '<button data-act="out" title="Zoom out">-</button>' +
      '<button data-act="reset" title="Reset">reset</button>' +
      '<button data-act="in" title="Zoom in">+</button>' +
      '<button data-act="close" title="Close (Esc)">close</button>' +
      '</div>' +
      '<div class="mdplus-zoom-stage"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.stage = overlay.querySelector('.mdplus-zoom-stage');

    overlay.querySelector('[data-act="close"]').onclick = () => this.close();
    overlay.querySelector('[data-act="in"]').onclick = () => this._zoom(1.25);
    overlay.querySelector('[data-act="out"]').onclick = () => this._zoom(0.8);
    overlay.querySelector('[data-act="reset"]').onclick = () => this._reset();
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
    this.stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      this._zoom(e.deltaY < 0 ? 1.1 : 0.9);
    }, { passive: false });
    this.stage.addEventListener('pointerdown', (e) => {
      this._drag = { x: e.clientX - this.tx, y: e.clientY - this.ty };
      this.stage.setPointerCapture(e.pointerId);
    });
    this.stage.addEventListener('pointermove', (e) => {
      if (!this._drag) return;
      this.tx = e.clientX - this._drag.x;
      this.ty = e.clientY - this._drag.y;
      this._apply();
    });
    this.stage.addEventListener('pointerup', () => (this._drag = null));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay && this.overlay.classList.contains('open'))
        this.close();
    });
  }

  open(diagram) {
    this._ensureOverlay();
    const node = diagram.querySelector('svg, img');
    if (!node) return;
    // Match the window's theme to the currently selected document theme.
    const themed = diagram.closest('.mdplus-host') || document.querySelector('.mdplus-host');
    const theme = (themed && themed.getAttribute('data-mdplus-theme')) || 'light';
    this.overlay.setAttribute('data-mdplus-theme', theme);
    this.stage.innerHTML = '';
    this.stage.appendChild(node.cloneNode(true));
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this._apply();
    this.overlay.classList.add('open');
  }

  close() {
    if (this.overlay) this.overlay.classList.remove('open');
  }

  _zoom(factor) {
    this.scale = Math.min(8, Math.max(0.2, this.scale * factor));
    this._apply();
  }

  _reset() {
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this._apply();
  }

  _apply() {
    const child = this.stage.firstElementChild;
    if (child)
      child.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
  }
}
