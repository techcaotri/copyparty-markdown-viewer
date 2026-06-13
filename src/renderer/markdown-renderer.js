/**
 * MarkdownRenderer - the in-browser markdown-it pipeline.
 *
 * This mirrors the plugin stack used by Markdown-Preview-Unified's server-side
 * engine (engine.ts), ported to run in the browser so the plugin is fully
 * self-contained: markdown-it + anchor, emoji, footnote, task-lists, container,
 * highlight.js, and texmath/KaTeX for math.
 *
 * Fenced blocks whose language is a known diagram type are emitted verbatim (not
 * highlighted) and tagged so the DiagramManager can upgrade them later.
 */
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import * as emojiPlugin from 'markdown-it-emoji';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import container from 'markdown-it-container';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import hljs from 'highlight.js/lib/common';

const emoji = emojiPlugin.full || emojiPlugin.light || emojiPlugin;

// Languages handled by the DiagramManager rather than the syntax highlighter.
export const DIAGRAM_LANGS = new Set([
  'mermaid',
  'plantuml',
  'puml',
  'uml',
  'dot',
  'graphviz',
  'kroki',
]);

const ADMONITIONS = ['note', 'tip', 'info', 'warning', 'caution', 'danger'];

function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export class MarkdownRenderer {
  constructor(config = {}) {
    this.config = config;
    this.md = this._build();
  }

  _build() {
    const md = new MarkdownIt({
      html: true, // raw HTML is allowed here but sanitized downstream
      linkify: true,
      typographer: true,
      breaks: false,
      highlight: (str, lang) => this._highlight(str, lang),
    });

    md.use(anchor, {
      slugify,
      tabIndex: false,
      permalink: anchor.permalink.linkInsideHeader({
        symbol: '#',
        placement: 'before',
        class: 'mdplus-anchor',
      }),
    });
    md.use(emoji);
    md.use(footnote);
    md.use(taskLists, { enabled: true, label: true, lineNumber: false });

    for (const name of ADMONITIONS) {
      md.use(container, name, {
        render(tokens, idx) {
          const token = tokens[idx];
          if (token.nesting === 1) {
            const info = token.info.trim().slice(name.length).trim();
            const title = info || name.charAt(0).toUpperCase() + name.slice(1);
            return `<div class="mdplus-admonition mdplus-${name}"><p class="mdplus-admonition-title">${md.utils.escapeHtml(
              title
            )}</p>\n`;
          }
          return '</div>\n';
        },
      });
    }

    if (this.config.mathRenderer === 'KaTeX') {
      md.use(texmath, {
        engine: katex,
        delimiters: 'dollars',
        katexOptions: { throwOnError: false, strict: false },
      });
    }

    md.renderer.rules.fence = (tokens, idx) => this._fence(tokens[idx], md);
    return md;
  }

  _highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
      } catch {
        /* fall through */
      }
    }
    return '';
  }

  _fence(token, md) {
    const info = (token.info || '').trim();
    const lang = info.split(/\s+/g)[0].toLowerCase();
    const code = token.content;

    if (DIAGRAM_LANGS.has(lang)) {
      // Emit verbatim so the DiagramManager can read the raw source later.
      return (
        `<pre class="mdplus-diagram-src" data-diagram-lang="${md.utils.escapeHtml(lang)}">` +
        `<code>${md.utils.escapeHtml(code)}</code></pre>\n`
      );
    }

    const highlighted = this._highlight(code, lang);
    const codeClass = lang ? ` class="language-${md.utils.escapeHtml(lang)}"` : '';
    const body = highlighted || md.utils.escapeHtml(code);
    return `<pre class="hljs mdplus-code"><code${codeClass}>${body}</code></pre>\n`;
  }

  /**
   * Render markdown to HTML.
   * @param {string} text
   * @param {string} [filePath]
   * @returns {string} HTML (unsanitized; caller must sanitize)
   */
  render(text, filePath) {
    const env = { filePath: filePath || '' };
    return this.md.render(text || '', env);
  }
}
