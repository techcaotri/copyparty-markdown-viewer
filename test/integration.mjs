// Integration test: load the built IIFE bundle in jsdom and render a document.
// Verifies the bundle executes without throwing and the full pipeline wires up:
// markdown -> sanitize -> diagrams (Mermaid stub + PlantUML fallback) -> feature UI.
//
// Run: npm run build && node test/integration.mjs
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const bundlePath = fileURLToPath(new URL('../dist/markdown-plus.js', import.meta.url));
assert.ok(existsSync(bundlePath), 'dist/markdown-plus.js missing - run `npm run build` first');
const bundle = readFileSync(bundlePath, 'utf8');

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/test.md',
  pretendToBeVisual: true,
  runScripts: 'outside-only', // lets window.eval run the bundle in the jsdom realm
});
const { window } = dom;

// Config + a Mermaid stub so no network is needed.
window.MDPLUS_CONFIG = { autoInit: false, diagramBackendUrl: null };
window.mermaid = {
  initialize() {},
  async render(id) {
    return { svg: `<svg class="stub-mermaid" data-id="${id}"></svg>` };
  },
};

// Execute the IIFE bundle in the jsdom window context.
window.eval(bundle);
assert.ok(window.mdPlus, 'window.mdPlus should be defined after bundle load');

const SAMPLE = [
  '# Hello',
  '',
  'Some **text** with `code`.',
  '',
  '```mermaid',
  'flowchart LR',
  '  A --> B',
  '```',
  '',
  '```plantuml',
  '@startuml',
  'Alice -> Bob: Hi',
  '@enduml',
  '```',
  '',
  '## Second heading',
].join('\n');

const app = window.document.getElementById('app');
const container = await window.mdPlus.renderInto(app, SAMPLE, 'test.md');

const checks = [
  ['content mounted', () => !!app.querySelector('.mdplus-content h1')],
  ['mermaid rendered (stub)', () => !!app.querySelector('.mdplus-diagram svg.stub-mermaid')],
  [
    'plantuml fell back (no server configured)',
    () => !!app.querySelector('.mdplus-diagram .mdplus-diagram-error'),
  ],
  ['toolbar created', () => !!window.document.querySelector('.mdplus-toolbar')],
  ['toc sidebar created', () => !!window.document.querySelector('.mdplus-sidebar')],
  ['copy buttons added', () => !!app.querySelector('.mdplus-copy-btn')],
];

let failed = 0;
for (const [name, fn] of checks) {
  let ok = false;
  try {
    ok = !!fn();
  } catch (e) {
    ok = false;
  }
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}

assert.ok(container, 'renderInto should resolve to the content container');
assert.strictEqual(failed, 0, `${failed} integration check(s) failed`);
console.log('\nAll integration checks passed.');
