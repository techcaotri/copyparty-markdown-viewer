/**
 * ZoomOverlay - click a diagram or image to open a fullscreen, zoomable/pannable
 * overlay window.
 *
 * Input is unified through Pointer Events so the same code path serves mouse, touch,
 * and pen:
 *   - mouse:  wheel zooms toward the cursor; drag pans; double-click toggles zoom.
 *   - touch:  one finger pans; two fingers pinch-zoom AND pan (anchored on the
 *             midpoint); double-tap toggles zoom.
 * The stage sets `touch-action: none` (in CSS) so the browser hands every touch
 * gesture to us instead of treating it as page scroll / page pinch-zoom — that was the
 * main reason panning/zooming felt broken on phones.
 */
export class ZoomOverlay {
  constructor(config) {
    this.config = config;
    this.overlay = null;
    this.stage = null;
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this._pointers = new Map(); // pointerId -> { x, y } (live positions)
    this._pinchPrev = null; // { dist, mx, my } between the two active pointers
    this._tap = null; // { x, y, id, moved } for tap / double-tap detection
    this._lastTapAt = 0;
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
      '<button data-act="out" title="Zoom out" aria-label="Zoom out">−</button>' +
      '<button data-act="reset" title="Reset" aria-label="Reset zoom">reset</button>' +
      '<button data-act="in" title="Zoom in" aria-label="Zoom in">+</button>' +
      '<button data-act="close" title="Close (Esc)" aria-label="Close">close</button>' +
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

    // Desktop: wheel zooms toward the cursor.
    this.stage.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this._zoomAround(e.deltaY < 0 ? 1.1 : 0.9, e.clientX, e.clientY);
      },
      { passive: false }
    );

    this.stage.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    this.stage.addEventListener('pointermove', (e) => this._onPointerMove(e));
    const up = (e) => this._onPointerUp(e);
    this.stage.addEventListener('pointerup', up);
    this.stage.addEventListener('pointercancel', up);

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
    this._pointers.clear();
    this._pinchPrev = null;
    this._tap = null;
    this._reset();
    this.overlay.classList.add('open');
  }

  close() {
    if (this.overlay) this.overlay.classList.remove('open');
    this._pointers.clear();
    this._pinchPrev = null;
    this._tap = null;
  }

  _onPointerDown(e) {
    this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      this.stage.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (this._pointers.size === 1) {
      this._tap = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
    } else {
      this._tap = null; // multi-touch is never a tap
      if (this._pointers.size === 2) this._pinchPrev = this._pinchState();
    }
    e.preventDefault();
  }

  _onPointerMove(e) {
    const prev = this._pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    this._pointers.set(e.pointerId, cur);

    if (this._pointers.size === 1) {
      this.tx += cur.x - prev.x;
      this.ty += cur.y - prev.y;
      this._apply();
      if (this._tap && this._tap.id === e.pointerId) {
        if (Math.hypot(cur.x - this._tap.x, cur.y - this._tap.y) > 10) this._tap.moved = true;
      }
    } else if (this._pointers.size === 2) {
      const now = this._pinchState();
      if (this._pinchPrev) {
        // Two-finger drag pans by the midpoint delta...
        this.tx += now.mx - this._pinchPrev.mx;
        this.ty += now.my - this._pinchPrev.my;
        // ...and the change in finger spread zooms, anchored on the midpoint.
        if (this._pinchPrev.dist > 0) this._zoomAround(now.dist / this._pinchPrev.dist, now.mx, now.my);
        else this._apply();
      }
      this._pinchPrev = now;
    }
    e.preventDefault();
  }

  _onPointerUp(e) {
    if (!this._pointers.has(e.pointerId)) return;
    this._pointers.delete(e.pointerId);
    try {
      this.stage.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (this._pointers.size < 2) this._pinchPrev = null;

    // Double-tap / double-click (no drag) toggles between fit and 2x, anchored on
    // the tap point.
    if (this._tap && this._tap.id === e.pointerId && !this._tap.moved && this._pointers.size === 0) {
      const now = Date.now();
      if (now - this._lastTapAt < 300) {
        this._lastTapAt = 0;
        this._zoomAround(this.scale > 1.5 ? 1 / this.scale : 2, e.clientX, e.clientY);
      } else {
        this._lastTapAt = now;
      }
    }
    this._tap = null;
  }

  _pinchState() {
    const pts = [...this._pointers.values()];
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return {
      dist: Math.hypot(dx, dy),
      mx: (pts[0].x + pts[1].x) / 2,
      my: (pts[0].y + pts[1].y) / 2,
    };
  }

  _zoom(factor) {
    const r = this.stage.getBoundingClientRect();
    this._zoomAround(factor, r.left + r.width / 2, r.top + r.height / 2);
  }

  /** Scale by `factor`, keeping the screen point (px,py) visually fixed. */
  _zoomAround(factor, px, py) {
    const next = Math.min(8, Math.max(0.2, this.scale * factor));
    const ratio = next / this.scale;
    if (ratio === 1) return;
    // The child is flex-centered, so its transform-origin (center) sits at the stage
    // center; offset the translation so (px,py) stays put as we scale about it.
    const r = this.stage.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    this.tx += (px - cx - this.tx) * (1 - ratio);
    this.ty += (py - cy - this.ty) * (1 - ratio);
    this.scale = next;
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
