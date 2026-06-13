/**
 * PlantUML Encoder - Client-side PlantUML Encoding
 *
 * Encodes PlantUML text for use with PlantUML server URLs.
 * Uses deflate compression and PlantUML's custom base64 encoding.
 */

import { PLANTUML_ALPHABET } from '../core/constants.js';

/**
 * Encode a 6-bit value to PlantUML's custom base64 character
 * @param {number} b - 6-bit value (0-63)
 * @returns {string} Encoded character
 * @private
 */
function encode6bit(b) {
  return PLANTUML_ALPHABET.charAt(b & 0x3F);
}

/**
 * Encode 3 bytes to 4 PlantUML base64 characters
 * @param {number} b1 - First byte
 * @param {number} b2 - Second byte
 * @param {number} b3 - Third byte
 * @returns {string} 4 encoded characters
 * @private
 */
function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  return encode6bit(c1) + encode6bit(c2) + encode6bit(c3) + encode6bit(c4);
}

/**
 * Check if pako library is loaded
 * @returns {boolean}
 */
function isPakoLoaded() {
  return typeof pako !== 'undefined';
}

/**
 * Load pako library dynamically
 * @returns {Promise<void>}
 */
async function loadPako() {
  if (isPakoLoaded()) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load pako library'));
    document.head.appendChild(script);
  });
}

/**
 * Encode PlantUML text for use in server URLs
 *
 * This uses PlantUML's encoding format:
 * 1. Convert text to UTF-8 bytes
 * 2. Compress using raw deflate
 * 3. Encode using PlantUML's custom base64 alphabet
 *
 * @param {string} text - PlantUML diagram text
 * @returns {Promise<string>} Encoded string for URL
 */
export async function encodePlantUmlText(text) {
  if (!text) return '';

  // Ensure pako is loaded
  await loadPako();

  // Convert text to UTF-8 bytes
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(text);

  // Compress using raw deflate
  const deflated = pako.deflateRaw(utf8Bytes, { level: 9 });

  // Encode using PlantUML's custom base64
  let result = '';
  for (let i = 0; i < deflated.length; i += 3) {
    const b1 = deflated[i];
    const b2 = i + 1 < deflated.length ? deflated[i + 1] : 0;
    const b3 = i + 2 < deflated.length ? deflated[i + 2] : 0;
    result += append3bytes(b1, b2, b3);
  }

  return result;
}

/**
 * Generate PlantUML server URL for a diagram
 * @param {string} encoded - Encoded PlantUML text
 * @param {string} [format='svg'] - Output format (svg, png, txt)
 * @param {string} [server='https://www.plantuml.com/plantuml'] - PlantUML server URL
 * @returns {string} Full URL to diagram
 */
export function getPlantUmlUrl(encoded, format = 'svg', server = 'https://www.plantuml.com/plantuml') {
  return `${server}/${format}/${encoded}`;
}

/**
 * Generate PlantUML server URL with cache busting
 * @param {string} encoded - Encoded PlantUML text
 * @param {string} [format='svg'] - Output format
 * @param {string} [server] - PlantUML server URL
 * @returns {string} URL with cache-busting parameter
 */
export function getPlantUmlUrlWithCacheBuster(encoded, format = 'svg', server) {
  const baseUrl = getPlantUmlUrl(encoded, format, server);
  const cacheBuster = Date.now();
  return `${baseUrl}?_cb=${cacheBuster}`;
}

/**
 * Encode PlantUML text and generate URL
 * @param {string} text - PlantUML diagram text
 * @param {string} [format='svg'] - Output format
 * @param {string} [server] - PlantUML server URL
 * @returns {Promise<string>} Full URL to diagram
 */
export async function encodePlantUmlToUrl(text, format = 'svg', server) {
  const encoded = await encodePlantUmlText(text);
  return getPlantUmlUrl(encoded, format, server);
}
