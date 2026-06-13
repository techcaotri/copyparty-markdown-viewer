// Verify the vendored PlantUML encoder works with the bundled pako (no CDN).
// Run: node test/plantuml.mjs
import assert from 'node:assert';
import pako from 'pako';
globalThis.pako = pako; // the vendored encoder looks up a global `pako`

const { encodePlantUmlText, getPlantUmlUrl } = await import(
  '../src/vendor/mpu/diagrams/plantuml-encoder.js'
);
const { injectPlantUmlTheme } = await import('../src/vendor/mpu/diagrams/diagram-themes.js');

const themed = injectPlantUmlTheme('@startuml\nAlice -> Bob: Hi\n@enduml', false);
const enc = await encodePlantUmlText(themed);
const url = getPlantUmlUrl(enc, 'svg', 'https://example.com/plantuml');

assert.ok(/skinparam/.test(themed), 'theme skinparams injected');
assert.ok(enc.length > 0, 'produced an encoded string');
assert.ok(url.startsWith('https://example.com/plantuml/svg/'), 'built server URL');

console.log('PASS plantuml encoder (encoded length ' + enc.length + ')');
