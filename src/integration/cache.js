/**
 * RenderCache - small LRU cache keyed by a content hash.
 *
 * Used at two levels:
 *   - whole-document HTML (keyed by the markdown source hash)
 *   - per-diagram output  (keyed by the diagram source hash)
 */
export class RenderCache {
  constructor(maxEntries = 64) {
    this.max = maxEntries;
    this.map = new Map(); // insertion-ordered; re-insert on get for LRU
  }

  /** 32-bit FNV-1a hash, returned as a hex string. */
  hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val); // move to most-recently-used
    return val;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
  }

  clear() {
    this.map.clear();
  }
}
