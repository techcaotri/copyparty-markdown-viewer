// copy-assets.mjs - copy lazily-loaded libraries into dist/assets/ for self-hosting.
//
// The main bundle loads Mermaid and KaTeX's CSS/fonts at runtime from
// `assetBaseUrl` (default: a public CDN for zero-config use). For offline /
// air-gapped deployments, run `npm run build:assets`, serve the dist/ folder, and
// set MDPLUS_CONFIG.assetBaseUrl to point at it (e.g. "/.mdplus/assets").

import { cpSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const out = resolve(root, 'dist/assets');

function need(p, hint) {
  if (!existsSync(p)) {
    console.warn(`[assets] missing ${p}\n          (${hint})`);
    return false;
  }
  return true;
}

mkdirSync(resolve(out, 'katex'), { recursive: true });
mkdirSync(resolve(out, 'mermaid'), { recursive: true });

// KaTeX CSS + fonts
const katexDist = resolve(root, 'node_modules/katex/dist');
if (need(katexDist, 'run npm install')) {
  copyFileSync(resolve(katexDist, 'katex.min.css'), resolve(out, 'katex/katex.min.css'));
  cpSync(resolve(katexDist, 'fonts'), resolve(out, 'katex/fonts'), { recursive: true });
  console.log('[assets] copied KaTeX css + fonts -> dist/assets/katex/');
}

// Mermaid ESM bundle
const mermaidEsm = resolve(root, 'node_modules/mermaid/dist/mermaid.esm.min.mjs');
const mermaidUmd = resolve(root, 'node_modules/mermaid/dist/mermaid.min.js');
if (existsSync(mermaidUmd)) {
  copyFileSync(mermaidUmd, resolve(out, 'mermaid/mermaid.min.js'));
  console.log('[assets] copied Mermaid UMD -> dist/assets/mermaid/mermaid.min.js');
} else if (need(mermaidUmd, 'run npm install; expected mermaid UMD build')) {
  // handled by need()
}

console.log('[assets] done. Serve dist/ and set MDPLUS_CONFIG.assetBaseUrl accordingly.');
