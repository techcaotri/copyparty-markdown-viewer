/**
 * TocPanel - builds a navigable table of contents from the rendered headings.
 */
export class TocPanel {
  constructor(config) {
    this.config = config;
  }

  build(container, panelEl) {
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4'));
    panelEl.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'mdplus-toc-title';
    title.textContent = 'Contents';
    panelEl.appendChild(title);

    if (!headings.length) {
      const empty = document.createElement('div');
      empty.className = 'mdplus-toc-empty';
      empty.textContent = '(no headings)';
      panelEl.appendChild(empty);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'mdplus-toc-list';

    for (const h of headings) {
      if (!h.id) {
        h.id = (h.textContent || 'section')
          .trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
      }
      const li = document.createElement('li');
      li.className = 'mdplus-toc-item mdplus-toc-' + h.tagName.toLowerCase();
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = (h.textContent || '').replace(/^#\s*/, '').trim();
      a.addEventListener('click', (e) => {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + h.id);
      });
      li.appendChild(a);
      list.appendChild(li);
    }
    panelEl.appendChild(list);
  }
}
