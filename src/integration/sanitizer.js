/**
 * HtmlSanitizer - DOMPurify wrapper for the markdown-it HTML output.
 *
 * The markdown source is untrusted (any user can upload a .md to copyparty), so the
 * rendered HTML is always sanitized before injection. KaTeX (MathML + styled spans)
 * is preserved; diagram code blocks survive as plain text for the DiagramManager to
 * pick up. Mermaid SVG and PlantUML <img> elements are produced AFTER sanitization
 * by the trusted DiagramManager and are not routed through here.
 */
import DOMPurify from 'dompurify';

export class HtmlSanitizer {
  constructor(config = {}) {
    this.config = config;

    // Open external links in a new tab safely.
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A' && node.getAttribute('href')) {
        const href = node.getAttribute('href');
        if (/^https?:\/\//i.test(href)) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });
  }

  sanitize(html) {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true, svg: true, svgFilters: true, mathMl: true },
      ADD_ATTR: ['target', 'rel', 'align', 'colspan', 'rowspan'],
      // markdown-it task-list checkboxes:
      ADD_TAGS: ['input'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      ALLOW_DATA_ATTR: true,
    });
  }
}
