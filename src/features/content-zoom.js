/**
 * ContentZoom - scale the rendered document up/down from the toolbar (zoom in / out).
 *
 * The CSS `zoom` property is used on the `.mdplus-content` element so that the
 * font/text size, images and diagrams all scale together AND the layout reflows
 * (unlike `transform: scale`, which only visually stretches a fixed-size box). Where
 * `zoom` is unsupported the controller falls back to scaling the root `font-size`,
 * which still grows/shrinks all text since the content's typography is em-relative.
 *
 * The level is clamped to [MIN, MAX], stepped, and persisted in localStorage so it
 * survives re-renders and page reloads (mirroring the width/theme toggles).
 */
const KEY = 'mdplus-zoom';
const MIN = 0.5; // 50%
const MAX = 3; // 300%
const STEP = 0.1; // 10% per click
const EPS = 1e-6;

const SUPPORTS_ZOOM =
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('zoom', '1.5');

export class ContentZoom {
  constructor(config) {
    this.config = config;
    this.level = this._read();
    this.target = null; // current .mdplus-content element
    this.onChange = null; // set by FeatureUI to refresh the toolbar controls
  }

  _read() {
    try {
      const v = parseFloat(localStorage.getItem(KEY));
      if (Number.isFinite(v)) return this._clamp(v);
    } catch {
      /* ignore */
    }
    return 1;
  }

  _write() {
    try {
      localStorage.setItem(KEY, String(this.level));
    } catch {
      /* ignore */
    }
  }

  _clamp(v) {
    const r = Math.round(v * 100) / 100;
    return Math.min(MAX, Math.max(MIN, r));
  }

  /** Bind the (freshly re-rendered) content element and apply the current level. */
  apply(container) {
    if (!container) return;
    this.target = container;
    this._render();
  }

  setLevel(v) {
    this.level = this._clamp(v);
    this._write();
    this._render();
  }

  zoomIn() {
    this.setLevel(this.level + STEP);
  }

  zoomOut() {
    this.setLevel(this.level - STEP);
  }

  reset() {
    this.setLevel(1);
  }

  get atMin() {
    return this.level <= MIN + EPS;
  }

  get atMax() {
    return this.level >= MAX - EPS;
  }

  get percent() {
    return Math.round(this.level * 100);
  }

  _render() {
    const el = this.target;
    if (el) {
      if (SUPPORTS_ZOOM) {
        // '' restores the stylesheet default (16px) at 100% so we don't pin it.
        el.style.zoom = this.level === 1 ? '' : String(this.level);
      } else {
        el.style.fontSize = this.level === 1 ? '' : `${(16 * this.level).toFixed(2)}px`;
      }
    }
    if (typeof this.onChange === 'function') this.onChange(this);
  }
}
