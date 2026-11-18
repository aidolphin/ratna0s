#!/usr/bin/env node
/*
 * Nepali language checker
 * -----------------------
 * Validates locales/ne.json against locales/ne.terminology.json:
 *  - banned variants (unnatural or inconsistent words)
 *  - untranslated values (Latin-only text not on the technical allowlist)
 *  - duplicate concepts translated differently
 *
 * Usage: node scripts/check_nepali.cjs [--strict]
 *   --strict  exit 1 when banned words or untranslated values exist
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ne = JSON.parse(fs.readFileSync(path.join(root, 'locales/ne.json'), 'utf8'));
const termFile = JSON.parse(fs.readFileSync(path.join(root, 'locales/ne.terminology.json'), 'utf8'));

const TECHNICAL = new Set([
  'RatnaOS', 'BOM', 'CSV', 'PDF', 'JSON', 'VAT', 'PAN', 'GST', 'CGST', 'SGST', 'IGST',
  'HSN', 'HUID', 'BIS', 'NBSM', 'SKU', 'QR', 'URL', 'API', 'POS', 'ID', 'OTP', 'UPI',
  'Cash', 'Card', 'Bank', 'NPR', 'INR', 'USD', 'AED', 'SAR', 'QAR', 'GBP', 'AUD', 'CAD',
  'SGD', 'HKD', 'MYR', 'LKR', 'BDT', 'Admin', 'Manager', 'Sales', 'Production',
  'Accountant', 'Viewer', 'QC', 'New', 'UPI', 'FIFO', 'LIFO'
]);

const errors = [];
const warnings = [];

// 1. Banned variants
for (const term of termFile.terms) {
  for (const bad of term.avoid || []) {
    for (const [key, value] of Object.entries(ne)) {
      if (typeof value === 'string') {
        const esc = bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(^|[^\\u0900-\\u097F])${esc}([^\\u0900-\\u097F]|$)`);
        if (re.test(value)) errors.push(`banned "${bad}" (use "${term.ne}") in "${key}" → "${value}"`);
      }
    }
  }
}

// 2. Untranslated / Latin-only values
const latinOnly = [];
for (const [key, value] of Object.entries(ne)) {
  if (typeof value !== 'string') continue;
  if (!/[A-Za-z]/.test(value)) continue;
  if (!/[\u0900-\u097F]/.test(value)) latinOnly.push([key, value]);
}
for (const [key, value] of latinOnly) {
  const words = value.split(/[^A-Za-z]+/).filter(Boolean);
  const allowed = words.every(w => TECHNICAL.has(w) || /^[0-9]+$/.test(w));
  if (!allowed) warnings.push(`untranslated value "${key}" → "${value}"`);
}

// 3. Terminology drift: same English concept mapped to conflicting Nepali
const byEn = new Map();
for (const term of termFile.terms) {
  if (byEn.has(term.en) && byEn.get(term.en) !== term.ne) {
    warnings.push(`terminology file conflict for "${term.en}"`);
  }
  byEn.set(term.en, term.ne);
}

const devanagari = Object.values(ne).filter(v => /[\u0900-\u097F]/.test(String(v))).length;
const total = Object.keys(ne).length;

console.log(JSON.stringify({
  entries: total,
  withDevanagari: devanagari,
  banned: errors.length,
  untranslated: warnings.length
}, null, 2));

if (errors.length) {
  console.log('\nBanned variants:');
  errors.forEach(e => console.log('  ✗ ' + e));
}
if (warnings.length) {
  console.log('\nUntranslated / review:');
  warnings.slice(0, 40).forEach(w => console.log('  - ' + w));
  if (warnings.length > 40) console.log(`  … ${warnings.length - 40} more`);
}

if (process.argv.includes('--strict') && (errors.length || warnings.length)) process.exit(1);
