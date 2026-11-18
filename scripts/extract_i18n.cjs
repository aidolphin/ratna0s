#!/usr/bin/env node
/*
 * Extracts translatable UI strings from the app source into locales/en.json
 * (the translation catalog) and reports coverage of locales/ne.json.
 *
 * Usage: node scripts/extract_i18n.cjs [--write]
 *   --write   write locales/en.json
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = ['src.js', 'reliability.js', 'index.html'];
const catalogs = { src: path.join(root, 'src.js'), rel: path.join(root, 'reliability.js') };

const CSS_LIKE = /(?:^|\s)(?:font-|background|border|color:|display:|position:|padding|margin|grid|flex|width:|height:|stroke|fill|var\(|rgba?\(|#[0-9a-fA-F]{3,8}\b|\d+(?:\.\d+)?(?:px|rem|em|vh|vw|ms|%|fr)\b)/;
const NON_TEXT = /^(?:[a-z0-9_-]+|\d+(?:\.\d+)?|[\s\W]*)$/i;
const DATAISH = /^(?:[a-z]+:[a-z-]+|https?:|\/|\.|#|[A-Z_]+$|data-|[a-z]+(?:-[a-z]+)+$)/i;

function looksTranslatable(s) {
  const text = s.trim();
  if (text.length < 2 || text.length > 160) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (NON_TEXT.test(text)) return false;
  if (DATAISH.test(text)) return false;
  if (CSS_LIKE.test(text)) return false;
  if (/[{}<>=;\\`]/.test(text)) return false;
  if (/^[\w$]+$/.test(text)) return false;
  if (/^[[\].#():;,/+*]/.test(text)) return false;
  if (/join\(|=>|dataset|querySelector|getElementById|addEventListener|classList|localStorage/.test(text)) return false;
  if (/^(?:true|false|null|undefined|function|return|const|let|var|document|window)$/.test(text)) return false;
  if (/^(?:btn|badge|card|form|field|align|text|mono|small|muted|table|grid|nav|row|col|div|span|tooltip|data-)(?:\s+[\w\-]+)+$/.test(text)) return false;
  if (/\?'|'\?|\?\s*:|=>|\.toFixed|\.map\(|\.join\(/.test(text)) return false;
  if (/^[?%]/.test(text) || /\.balance|\bdi\.|\bc\./.test(text)) return false;
  if (/^[:()\[\]{}]/.test(text) || /[:;]$/.test(text)) return false;
  if (/^(?:use strict|return false)$/.test(text) || /^new Date\(/.test(text) || /^M\d+ \d/.test(text)) return false;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)?(?:[ ,]+[a-z0-9]+(?:-[a-z0-9]+)?)+$/.test(text) && !/[A-Z]/.test(text)) return false;
  const CLASSY = /^(?:align-[\w-]+|mono|muted|small|badge[\w-]*|btn[\w-]*|text-[\w-]+|bg-[\w-]+|card|section|grid[\w-]*|field[\w-]*|tooltip|table|nav-item|active|open|collapsed)$/;
  if (text.split(/\s+/).every(w => CLASSY.test(w))) return false;
  const wordy = /\s/.test(text) || /^[A-Z][A-Za-z0-9&/'-]{1,24}$/.test(text);
  if (!wordy) return false;
  return true;
}

const found = new Map();

function add(text, file, line) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!looksTranslatable(clean)) return;
  if (!found.has(clean)) found.set(clean, { text: clean, files: new Set(), lines: [] });
  const entry = found.get(clean);
  entry.files.add(file);
  if (entry.lines.length < 6) entry.lines.push(`${file}:${line}`);
}

function scanJS(file) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  const lines = src.split('\n');
  lines.forEach((lineText, i) => {
    const line = lineText;
    // Skip comments and pure markup/CSS noise lines
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    // Quoted and template literal text chunks
    const re = /`([^`$]*)`|'([^'\\]*)'|"([^"\\]*)"/g;
    let m;
    while ((m = re.exec(line))) {
      const text = m[1] || m[2] || m[3];
      if (text == null) continue;
      if (m[1] !== undefined) {
        // split template text around ${...}
        text.split(/\$\{[^}]*\}/).forEach(chunk => add(chunk, file, i + 1));
      } else {
        add(text, file, i + 1);
      }
    }
    // Visible text between tags (HTML strings)
    const tagRe = />([^<>{}`$]{2,120})</g;
    let tm;
    while ((tm = tagRe.exec(line))) add(tm[1], file, i + 1);
  });
}

files.forEach(f => {
  if (fs.existsSync(path.join(root, f))) scanJS(f);
});

const entries = [...found.values()].sort((a, b) => a.text.localeCompare(b.text));
const ne = JSON.parse(fs.readFileSync(path.join(root, 'locales/ne.json'), 'utf8'));
const translated = entries.filter(e => ne[e.text]);
const missing = entries.filter(e => !ne[e.text]);

const enOut = {};
entries.forEach(e => { enOut[e.text] = e.text; });

if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(root, 'locales/en.json'), JSON.stringify(enOut, null, 2) + '\n');
}

const pending = {};
missing.forEach(e => {
  pending[e.text] = '';
});
fs.writeFileSync(path.join(root, 'locales/ne.pending.json'), JSON.stringify(pending, null, 2) + '\n');

const report = {
  candidates: entries.length,
  translated: translated.length,
  missing: missing.length,
  coverage: `${((translated.length / Math.max(entries.length, 1)) * 100).toFixed(1)}%`
};
console.log(JSON.stringify(report, null, 2));
if (!process.argv.includes('--quiet')) {
  console.log('\nNext 30 untranslated strings:');
  missing.slice(0, 30).forEach(e => console.log(`  ${e.text}   [${[...e.files].join(', ')} ${e.lines[0] || ''}]`));
}
