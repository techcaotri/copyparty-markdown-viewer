// End-to-end test against a real copyparty markdown viewer using system Chrome.
//
// Prereqs: a copyparty instance serving this repo with the plugin injected via
// --js-other (and MDPLUS_CONFIG via --html-head). See start_copyparty.sh.
//
// Env: BASE (default http://127.0.0.1:4399), CPPW (password), MDPATH (viewer path).
// Run: node test/e2e.mjs
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4399';
const PW = process.env.CPPW || 'trituyen';
const MDPATH =
  process.env.MDPATH ||
  '/dev/Playground_Copyparty/copyparty-markdown-viewer/examples/sample.md';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let failed = 0;
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  // Authenticate (sets the cppwd cookie), then open the markdown viewer (?v).
  await page.goto(`${BASE}/?pw=${PW}`, { waitUntil: 'domcontentloaded' });
  await page.goto(`${BASE}${MDPATH}?v`, { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('.mdplus-content', { timeout: 20000 });
  await page.waitForSelector('.mdplus-toolbar', { timeout: 10000 }).catch(() => {});
  // Mermaid loads from CDN + renders; give it time.
  await page
    .waitForSelector('.mdplus-diagram svg', { timeout: 25000 })
    .catch(() => {});
  // Wait for the PlantUML block to settle (image or graceful error).
  await page
    .waitForFunction(
      () => {
        const d = document.querySelector('.mdplus-diagram[data-diagram-lang="plantuml"]');
        return d && (d.querySelector('img') || d.querySelector('.mdplus-diagram-error'));
      },
      { timeout: 30000 }
    )
    .catch(() => {});
  await page.waitForTimeout(800);

  const res = await page.evaluate(() => ({
    mdplusLoaded: !!window.mdPlusLoaded,
    h1: !!document.querySelector('.mdplus-content h1'),
    headingText: (document.querySelector('.mdplus-content h1') || {}).textContent || '',
    mermaidCount: document.querySelectorAll('.mdplus-diagram svg').length,
    katex: !!document.querySelector('.mdplus-content .katex'),
    highlight: !!document.querySelector('.mdplus-content pre.hljs'),
    taskList: !!document.querySelector('.mdplus-content .task-list-item'),
    admonition: !!document.querySelector('.mdplus-content .mdplus-tip'),
    table: !!document.querySelector('.mdplus-content table'),
    toolbar: !!document.querySelector('.mdplus-toolbar'),
    sidebar: !!document.querySelector('.mdplus-sidebar'),
    copyBtn: !!document.querySelector('.mdplus-copy-btn'),
    nativeHidden: !!document.querySelector('#mp[data-mdplus-hidden], #ml[data-mdplus-hidden]'),
    plantumlImg: document.querySelectorAll('.mdplus-diagram img').length,
    plantumlFallback: document.querySelectorAll('.mdplus-diagram-error').length,
    theme: (document.querySelector('.mdplus-host') || {}).getAttribute
      ? document.querySelector('.mdplus-host').getAttribute('data-mdplus-theme')
      : null,
  }));

  const shot = new URL('./e2e-screenshot.png', import.meta.url);
  await page.screenshot({ path: shot.pathname, fullPage: true });

  const checks = [
    ['plugin loaded', res.mdplusLoaded],
    ['h1 rendered', res.h1 && /Sample/.test(res.headingText)],
    ['mermaid rendered (>=2)', res.mermaidCount >= 2],
    ['katex math', res.katex],
    ['syntax highlight', res.highlight],
    ['task list', res.taskList],
    ['admonition', res.admonition],
    ['table', res.table],
    ['toolbar present', res.toolbar],
    ['toc sidebar present', res.sidebar],
    ['copy button', res.copyBtn],
    ["copyparty's native output hidden", res.nativeHidden],
    ['plantuml rendered OR graceful fallback', res.plantumlImg >= 1 || res.plantumlFallback >= 1],
  ];

  console.log('Result:', JSON.stringify(res, null, 2));
  console.log('\nChecks:');
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    if (!ok) failed++;
  }
  if (errors.length) {
    console.log('\nConsole errors:');
    for (const e of errors) console.log('  -', e);
  }
  console.log(`\nScreenshot: ${shot.pathname}`);
} finally {
  await browser.close();
}

if (failed) {
  console.error(`\n${failed} e2e check(s) failed`);
  process.exit(1);
}
console.log('\nAll e2e checks passed.');
