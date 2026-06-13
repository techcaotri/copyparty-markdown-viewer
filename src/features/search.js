/**
 * SearchController - in-document search with highlight + next/prev navigation.
 */
export class SearchController {
  constructor(config) {
    this.config = config;
    this.container = null;
    this.matches = [];
    this.index = -1;
  }

  attach(container, ui) {
    this.container = container;
    const { input, countEl } = ui;
    this.countEl = countEl;
    input.oninput = () => this.run(input.value);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.shiftKey ? this.prev() : this.next();
      } else if (e.key === 'Escape') {
        input.value = '';
        this.clear();
      }
    };
  }

  clear() {
    if (!this.container) return;
    for (const m of this.container.querySelectorAll('mark.mdplus-hit')) {
      const parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    }
    this.matches = [];
    this.index = -1;
    if (this.countEl) this.countEl.textContent = '';
  }

  run(query) {
    this.clear();
    const q = (query || '').trim();
    if (q.length < 2) return;

    const walker = document.createTreeWalker(this.container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const tag = node.parentNode && node.parentNode.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK')
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const lower = q.toLowerCase();
    const targets = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue.toLowerCase().includes(lower)) targets.push(n);
    }

    for (const node of targets) this._highlightNode(node, lower, q.length);

    this.matches = Array.from(this.container.querySelectorAll('mark.mdplus-hit'));
    this.index = this.matches.length ? 0 : -1;
    this._focusCurrent();
  }

  _highlightNode(node, lower, len) {
    const text = node.nodeValue;
    const frag = document.createDocumentFragment();
    let i = 0;
    let pos;
    const hay = text.toLowerCase();
    while ((pos = hay.indexOf(lower, i)) !== -1) {
      if (pos > i) frag.appendChild(document.createTextNode(text.slice(i, pos)));
      const mark = document.createElement('mark');
      mark.className = 'mdplus-hit';
      mark.textContent = text.slice(pos, pos + len);
      frag.appendChild(mark);
      i = pos + len;
    }
    if (i < text.length) frag.appendChild(document.createTextNode(text.slice(i)));
    node.parentNode.replaceChild(frag, node);
  }

  _focusCurrent() {
    this.matches.forEach((m, i) => m.classList.toggle('mdplus-hit-active', i === this.index));
    if (this.index >= 0) {
      this.matches[this.index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (this.countEl) {
      this.countEl.textContent = this.matches.length
        ? `${this.index + 1}/${this.matches.length}`
        : '0';
    }
  }

  next() {
    if (!this.matches.length) return;
    this.index = (this.index + 1) % this.matches.length;
    this._focusCurrent();
  }

  prev() {
    if (!this.matches.length) return;
    this.index = (this.index - 1 + this.matches.length) % this.matches.length;
    this._focusCurrent();
  }
}
