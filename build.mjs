// build.mjs - bundle the self-contained copyparty markdown plugin with esbuild.
//
// Produces:
//   dist/markdown-plus.js   (IIFE; load via copyparty --js-browser)
//   dist/markdown-plus.css  (load via copyparty --css-browser)
//
// markdown-it (+ plugins), KaTeX, highlight.js, DOMPurify and pako are bundled in.
// Mermaid and KaTeX's CSS/fonts are loaded lazily at runtime from `assetBaseUrl`
// (see src/integration/library-loader.js); run `npm run build:assets` to self-host
// them for offline/air-gapped deployments.

import * as esbuild from 'esbuild';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const watch = process.argv.includes('--watch');

mkdirSync(resolve(root, 'dist'), { recursive: true });

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: [resolve(root, 'src/integration/index.js')],
  bundle: true,
  format: 'iife',
  outfile: resolve(root, 'dist/markdown-plus.js'),
  platform: 'browser',
  target: ['es2020'],
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  legalComments: 'none',
  logLevel: 'info',
  loader: {
    // CSS is imported as a string and injected at runtime, so the plugin is a
    // single self-contained JS file (works via copyparty --js-other and --js-browser
    // with no separate --css-browser needed).
    '.css': 'text',
  },
  banner: {
    js: '/* copyparty-markdown-viewer - self-contained Markdown plugin. MIT. */',
  },
  define: {
    'process.env.NODE_ENV': watch ? '"development"' : '"production"',
  },
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('[build] watching for changes...');
} else {
  await esbuild.build(options);
  console.log('[build] wrote dist/markdown-plus.js (CSS inlined)');
}
