import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p = await (await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 800 } })).newPage();
await p.goto('http://127.0.0.1:4399/?pw=trituyen', { waitUntil: 'domcontentloaded' });
await p.goto('http://127.0.0.1:4399/dev/Playground_Copyparty/copyparty-markdown-viewer/examples/sample.md?v', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.mdplus-diagram svg', { timeout: 20000 });
await p.waitForTimeout(800);

// --- Issue 1: zoom overlay ---
await p.click('.mdplus-diagram[data-zoomable]');
await p.waitForTimeout(400);
const z = await p.evaluate(() => {
  const ov = document.querySelector('.mdplus-zoom-overlay');
  const closeBtn = document.querySelector('.mdplus-zoom-bar [data-act="close"]');
  const br = closeBtn.getBoundingClientRect();
  const hit = document.elementFromPoint(Math.round(br.left + br.width/2), Math.round(br.top + br.height/2));
  return { overlayBg: getComputedStyle(ov).backgroundColor, closeIsButton: hit === closeBtn, closeHit: (hit.className||hit.tagName)+(hit.dataset&&hit.dataset.act?'['+hit.dataset.act+']':'') };
});
console.log('ZOOM:', JSON.stringify(z));
// click close via real click + verify overlay closes
await p.click('.mdplus-zoom-bar [data-act="close"]');
await p.waitForTimeout(200);
const closed = await p.evaluate(()=>!document.querySelector('.mdplus-zoom-overlay').classList.contains('open'));
console.log('ZOOM closed via button:', closed);

// --- Issue 2: ToC auto-hide ---
await p.click('.mdplus-toolbar [data-act="toc"]');
await p.waitForTimeout(200);
const opened = await p.evaluate(()=>document.querySelector('.mdplus-sidebar').classList.contains('open'));
// click in the content area (outside the sidebar)
await p.mouse.click(900, 400);
await p.waitForTimeout(200);
const hiddenAfterOutside = await p.evaluate(()=>!document.querySelector('.mdplus-sidebar').classList.contains('open'));
// re-open and click toggle again to ensure toggle still closes
await p.click('.mdplus-toolbar [data-act="toc"]'); await p.waitForTimeout(150);
const reopened = await p.evaluate(()=>document.querySelector('.mdplus-sidebar').classList.contains('open'));
console.log('TOC opened:', opened, '| hidden after outside click:', hiddenAfterOutside, '| reopened via button:', reopened);
await b.close();
