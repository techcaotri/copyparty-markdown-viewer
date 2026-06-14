import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p = await (await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 800 } })).newPage();
await p.goto('http://127.0.0.1:4399/?pw=trituyen', { waitUntil: 'domcontentloaded' });
await p.goto('http://127.0.0.1:4399/dev/Playground_Copyparty/copyparty-markdown-viewer/examples/sample.md?v', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.mdplus-content', { timeout: 15000 });
await p.waitForTimeout(600);
await p.click('.mdplus-toolbar [data-act="toc"]'); await p.waitForTimeout(200);
const info = await p.evaluate(() => {
  const sb = document.querySelector('.mdplus-sidebar');
  const r = sb.getBoundingClientRect();
  const at = document.elementFromPoint(900, 450);
  return { open: sb.classList.contains('open'), rect: {l:Math.round(r.left),w:Math.round(r.width)}, at900: (at && (at.className||at.tagName)) , atClosestSidebar: !!(at && at.closest && at.closest('.mdplus-sidebar')), atClosestToolbar: !!(at && at.closest && at.closest('.mdplus-toolbar')) };
});
console.log('after open:', JSON.stringify(info));
// dispatch a genuine click at (900,450) using mouse
await p.mouse.move(900,450); await p.mouse.down(); await p.mouse.up();
await p.waitForTimeout(300);
const after = await p.evaluate(()=>document.querySelector('.mdplus-sidebar').classList.contains('open'));
console.log('open after outside click:', after);
await b.close();
