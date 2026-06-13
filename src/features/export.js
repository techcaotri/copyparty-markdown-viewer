/**
 * ExportMenu - client-side export.
 *   - HTML: serialize the rendered content into a standalone .html file. Stylesheets
 *           already loaded in the page (our CSS + KaTeX) are linked by absolute URL.
 *   - PDF:  use the browser's print-to-PDF with a print-friendly stylesheet.
 *
 * Server-side PDF/PNG/ePub is intentionally out of scope for the self-contained
 * plugin (see the design doc); these client-side paths cover the common cases.
 */
export class ExportMenu {
  constructor(config) {
    this.config = config;
  }

  _collectStyleLinks() {
    const links = [];
    for (const el of document.querySelectorAll('link[rel="stylesheet"], style')) {
      if (el.tagName === 'LINK' && el.href) {
        links.push(`<link rel="stylesheet" href="${el.href}">`);
      } else if (el.tagName === 'STYLE' && el.textContent) {
        links.push(`<style>${el.textContent}</style>`);
      }
    }
    return links.join('\n');
  }

  exportHtml(container, ctx) {
    const theme = (container.closest('.mdplus-host') || container).getAttribute(
      'data-mdplus-theme'
    ) || 'light';
    const title = (ctx && ctx.filePath ? ctx.filePath.split('/').pop() : 'document') || 'document';
    const html =
      '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n' +
      `<title>${title}</title>\n` +
      this._collectStyleLinks() +
      '\n</head>\n' +
      `<body><div class="mdplus-host" data-mdplus-theme="${theme}">` +
      `<article class="mdplus-content">${container.innerHTML}</article>` +
      '</div></body>\n</html>';

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title.replace(/\.(md|markdown)$/i, '') + '.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  printPdf() {
    document.body.classList.add('mdplus-printing');
    const cleanup = () => {
      document.body.classList.remove('mdplus-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }
}
