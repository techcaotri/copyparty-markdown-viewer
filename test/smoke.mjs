// Node smoke test for the core markdown pipeline (no DOM needed).
// Run: node test/smoke.mjs
import assert from 'node:assert';
import { MarkdownRenderer } from '../src/renderer/markdown-renderer.js';

const md = new MarkdownRenderer({ mathRenderer: 'KaTeX' });

const sample = `# Title

Some **bold** and a [link](https://example.com).

- [x] done
- [ ] todo

Inline math $E = mc^2$ and block:

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

\`\`\`js
const x = 1;
\`\`\`

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

::: warning Heads up
be careful
:::
`;

const html = md.render(sample, 'sample.md');

const checks = [
  ['heading id', /<h1[^>]*id="title"/],
  ['anchor link', /class="mdplus-anchor"/],
  ['bold', /<strong>bold<\/strong>/],
  ['external link target', /href="https:\/\/example\.com"/],
  ['task list', /class="task-list-item/],
  ['katex math', /class="katex"/],
  ['highlighted js', /class="language-js"/],
  ['diagram passthrough', /data-diagram-lang="mermaid"/],
  ['admonition', /mdplus-warning/],
];

let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}

assert.strictEqual(failed, 0, `${failed} check(s) failed`);
console.log('\nAll smoke checks passed.');
