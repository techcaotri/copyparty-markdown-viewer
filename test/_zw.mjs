import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 800 } });
const p = await ctx.newPage();
const open = async () => {
  await p.goto('http://127.0.0.1:4399/?pw=trituyen', { waitUntil: 'domcontentloaded' });
  await p.goto('http://127.0.0.1:4399/dev/Playground_Copyparty/copyparty-markdown-viewer/examples/sample.md?v', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.mdplus-diagram svg', { timeout: 20000 });
  await p.waitForTimeout(700);
  await p.click('.mdplus-diagram[data-zoomable]');
  await p.waitForTimeout(300);
};
await open();
const info = await p.evaluate(() => {
  const ov = document.querySelector('.mdplus-zoom-overlay');
  const win = document.querySelector('.mdplus-zoom-window');
  const wr = win.getBoundingClientRect();
  const closeBtn = document.querySelector('.mdplus-zoom-bar [data-act="close"]');
  const br = closeBtn.getBoundingClientRect();
  const hit = document.elementFromPoint(Math.round(br.left+br.width/2), Math.round(br.top+br.height/2));
  return {
    theme: ov.getAttribute('data-mdplus-theme'),
    overlayBg: getComputedStyle(ov).backgroundColor,
    winBg: getComputedStyle(win).backgroundColor,
    winBorder: getComputedStyle(win).borderTopWidth,
    windowed: Math.round(wr.width) < 1400 && Math.round(wr.height) < 800,
    winW: Math.round(wr.width), winH: Math.round(wr.height),
    closeIsButton: hit === closeBtn,
  };
});
console.log('DARK open:', JSON.stringify(info));
// backdrop click (top-left corner, outside the centered window) should close
await p.mouse.click(15, 15); await p.waitForTimeout(200);
const closedByBackdrop = await p.evaluate(()=>!document.querySelector('.mdplus-zoom-overlay').classList.contains('open'));
console.log('closed by backdrop click:', closedByBackdrop);

// Light theme: set localStorage then reopen
await p.evaluate(()=>localStorage.setItem('mdplus-theme','light'));
await open();
const light = await p.evaluate(() => {
  const ov = document.querySelector('.mdplus-zoom-overlay');
  const win = document.querySelector('.mdplus-zoom-window');
  return { theme: ov.getAttribute('data-mdplus-theme'), winBg: getComputedStyle(win).backgroundColor };
});
console.log('LIGHT open:', JSON.stringify(light));
await b.close();
