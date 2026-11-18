/*
 * RatnaOS i18n + country profile layer
 * ------------------------------------
 * English source strings are the translation keys (source-text keys), so any
 * string not yet translated silently falls back to readable English.
 *
 * To translate: edit locales/ne.json — map the English text to Nepali.
 * Missing entries fall back to English automatically.
 */
import enCatalog from './locales/en.json';
import neCatalog from './locales/ne.json';
import hiCatalog from './locales/hi.json';
import NepaliDate from 'nepali-date-converter';

export const LOCALES = {
  en: { label: 'English', native: 'English', tag: 'en-US', dir: 'ltr' },
  ne: { label: 'Nepali', native: 'नेपाली', tag: 'ne-NP', dir: 'ltr' },
  hi: { label: 'Hindi', native: 'हिन्दी', tag: 'hi-IN', dir: 'ltr' }
};

export const LANGUAGE_OPTIONS = Object.entries(LOCALES).map(([code, l]) => ({ value: code, label: l.native }));

/*
 * Country profiles drive currency, tax defaults, date/number formatting,
 * weight unit and fiscal-year labelling. Add a country by adding a block here.
 */
export const COUNTRIES = {
  NP: {
    name: 'Nepal', currency: 'NPR', locale: 'ne-NP', taxLabel: 'VAT', taxRate: 13,
    taxInclusive: true, weightUnit: 'tola', dateFormat: 'DD/MM/YYYY',
    dial: '+977', fiscalYearStart: 'Shrawan (mid-July)', invoicePrefix: 'INV', calendar: 'bs'
  },
  IN: {
    name: 'India', currency: 'INR', locale: 'en-IN', taxLabel: 'GST', taxRate: 3,
    taxInclusive: true, weightUnit: 'tola', dateFormat: 'DD/MM/YYYY',
    dial: '+91', fiscalYearStart: 'April', invoicePrefix: 'INV', calendar: 'ad'
  },
  AE: {
    name: 'United Arab Emirates', currency: 'AED', locale: 'en-AE', taxLabel: 'VAT', taxRate: 5,
    taxInclusive: false, weightUnit: 'gram', dateFormat: 'DD/MM/YYYY',
    dial: '+971', fiscalYearStart: 'January', invoicePrefix: 'INV', calendar: 'ad'
  },
  SA: {
    name: 'Saudi Arabia', currency: 'SAR', locale: 'en-SA', taxLabel: 'VAT', taxRate: 15,
    taxInclusive: false, weightUnit: 'gram', dateFormat: 'DD/MM/YYYY',
    dial: '+966', fiscalYearStart: 'January', invoicePrefix: 'INV'
  },
  QA: {
    name: 'Qatar', currency: 'QAR', locale: 'en-QA', taxLabel: 'Tax', taxRate: 0,
    taxInclusive: false, weightUnit: 'gram', dateFormat: 'DD/MM/YYYY',
    dial: '+974', fiscalYearStart: 'January', invoicePrefix: 'INV'
  },
  US: {
    name: 'United States', currency: 'USD', locale: 'en-US', taxLabel: 'Sales Tax', taxRate: 0,
    taxInclusive: false, weightUnit: 'gram', dateFormat: 'MM/DD/YYYY',
    dial: '+1', fiscalYearStart: 'January', invoicePrefix: 'INV'
  },
  GB: {
    name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', taxLabel: 'VAT', taxRate: 20,
    taxInclusive: true, weightUnit: 'gram', dateFormat: 'DD/MM/YYYY',
    dial: '+44', fiscalYearStart: 'April', invoicePrefix: 'INV'
  },
  AU: {
    name: 'Australia', currency: 'AUD', locale: 'en-AU', taxLabel: 'GST', taxRate: 10,
    taxInclusive: true, weightUnit: 'gram', dateFormat: 'DD/MM/YYYY',
    dial: '+61', fiscalYearStart: 'July', invoicePrefix: 'INV'
  },
  CA: {
    name: 'Canada', currency: 'CAD', locale: 'en-CA', taxLabel: 'HST/GST', taxRate: 5,
    taxInclusive: false, weightUnit: 'gram', dateFormat: 'YYYY-MM-DD',
    dial: '+1', fiscalYearStart: 'January', invoicePrefix: 'INV'
  },
  SG: {
    name: 'Singapore', currency: 'SGD', locale: 'en-SG', taxLabel: 'GST', taxRate: 9,
    taxInclusive: false, weightUnit: 'gram', dateFormat: 'DD/MM/YYYY',
    dial: '+65', fiscalYearStart: 'January', invoicePrefix: 'INV'
  },
  HK: {
    name: 'Hong Kong', currency: 'HKD', locale: 'en-HK', taxLabel: 'Tax', taxRate: 0,
    taxInclusive: false, weightUnit: 'gram', dateFormat: 'DD/MM/YYYY',
    dial: '+852', fiscalYearStart: 'January', invoicePrefix: 'INV'
  },
  MY: {
    name: 'Malaysia', currency: 'MYR', locale: 'en-MY', taxLabel: 'SST', taxRate: 6,
    taxInclusive: false, weightUnit: 'gram', dateFormat: 'DD/MM/YYYY',
    dial: '+60', fiscalYearStart: 'January', invoicePrefix: 'INV'
  },
  LK: {
    name: 'Sri Lanka', currency: 'LKR', locale: 'en-LK', taxLabel: 'VAT', taxRate: 15,
    taxInclusive: true, weightUnit: 'gram', dateFormat: 'DD/MM/YYYY',
    dial: '+94', fiscalYearStart: 'January', invoicePrefix: 'INV'
  },
  BD: {
    name: 'Bangladesh', currency: 'BDT', locale: 'en-BD', taxLabel: 'VAT', taxRate: 5,
    taxInclusive: true, weightUnit: 'gram', dateFormat: 'DD/MM/YYYY',
    dial: '+880', fiscalYearStart: 'July', invoicePrefix: 'INV'
  }
};

export const COUNTRY_OPTIONS = Object.entries(COUNTRIES).map(([code, c]) => ({ value: code, label: `${c.name} — ${c.currency}` }));

const CATALOGS = { en: enCatalog, ne: neCatalog, hi: hiCatalog };
let lang = 'en';
let countryCode = 'NP';

export function setLanguage(code) {
  lang = CATALOGS[code] ? code : 'en';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dir = LOCALES[lang].dir;
    document.documentElement.dataset.lang = lang;
  }
  return lang;
}
export const getLanguage = () => lang;
export const languageTag = () => LOCALES[lang].tag;

export function setCountry(code) {
  countryCode = COUNTRIES[code] ? code : 'NP';
  return countryCode;
}
export const getCountry = () => countryCode;
export const countryProfile = (code = countryCode) => COUNTRIES[code] || COUNTRIES.NP;

export function setContext({ language, country } = {}) {
  if (language) setLanguage(language);
  if (country) setCountry(country);
}

/** Translate an English source string. Unknown strings fall back to English. */
export function t(text, vars) {
  if (text == null) return '';
  const table = CATALOGS[lang] || {};
  let out = table[text] || (lang === 'en' ? text : table[text] || text);
  if (vars && typeof out === 'string') {
    out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  }
  return out;
}

/** Translate a list of strings (e.g. table headers). */
export const tAll = list => (list || []).map(x => t(x));

/**
 * Locale used for digits/grouping: Nepali UI shows Devanagari digits,
 * while English UI keeps Latin digits even for Nepal-style (lakh) grouping.
 */
export function displayLocale(settings = {}) {
  const p = countryProfile(settings.country);
  if (lang === 'ne') return p.locale || 'ne-NP';
  if (p.locale && p.locale.startsWith('ne')) return 'en-IN';
  return p.locale || LOCALES.en.tag;
}
export const numberLocale = () => displayLocale();
const DEV_DIGITS = ['०','१','२','३','४','५','६','७','८','९'];
let numeralStyle = 'devanagari';
/** Nepali UI can show Devanagari or Latin digits. Display only — values never change. */
export function setNumeralStyle(style) {
  numeralStyle = style === 'latin' ? 'latin' : 'devanagari';
  return numeralStyle;
}
export const getNumeralStyle = () => numeralStyle;
export const toDevanagariDigits = str => (lang === 'ne' && numeralStyle === 'devanagari' ? String(str).replace(/[0-9]/g, d => DEV_DIGITS[+d]) : String(str));

export function formatNumber(n, opts = {}) {
  return Number(n || 0).toLocaleString(numberLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2, ...opts });
}

/** Currency with country grouping rules, e.g. "NPR 1,23,456.00" (NP) vs "USD 123,456.00" (US). */
export function formatMoney(n, settings = {}) {
  const code = (settings.currency || countryProfile().currency || 'NPR').toUpperCase();
  const p = countryProfile(settings.country);
  const locale = displayLocale(settings);
  let amount;
  try {
    amount = Number(n || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch {
    amount = Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  const symbols = { NPR: 'रु.', INR: '₹' };
  const prefix = lang === 'ne' && symbols[code] ? symbols[code] : code;
  return `${prefix} ${toDevanagariDigits(amount)}`;
}

const BS_MONTHS_EN = ['Baisakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];
const BS_MONTHS_NE = ['बैशाख','जेठ','असार','साउन','भदौ','असोज','कार्तिक','मंसिर','पुष','माघ','फाल्गुन','चैत'];

/** Convert a Gregorian date to Bikram Sambat. Returns null when out of range. */
export function adToBs(value) {
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const n = new NepaliDate(d);
    return { year: n.getYear(), month: n.getMonth() + 1, day: n.getDate() };
  } catch (e) { return null; }
}

/** Convert a Bikram Sambat date to a Gregorian Date. Returns null when invalid. */
export function bsToAd(year, month, day) {
  try { return new NepaliDate(Number(year), Number(month) - 1, Number(day)).toJsDate(); }
  catch (e) { return null; }
}

function bsParts(value) {
  const bs = adToBs(value);
  if (!bs) return null;
  const pad = n => String(n).padStart(2, '0');
  return { ...bs, y: String(bs.year), m: pad(bs.month), d: pad(bs.day) };
}

/** Bikram Sambat numeric date, e.g. 2083/08/02 */
export function formatBsDate(value, settings = {}) {
  const p = bsParts(value);
  if (!p) return formatDateAd(value, settings);
  return toDevanagariDigits(`${p.y}/${p.m}/${p.d}`);
}

/** Bikram Sambat long date, e.g. 2 Mangsir 2083 / २ मंसिर २०८३ */
export function formatBsDateLong(value, settings = {}) {
  const p = bsParts(value);
  if (!p) return formatDateLongAd(value, settings);
  const month = (lang === 'ne' ? BS_MONTHS_NE : BS_MONTHS_EN)[p.month - 1] || p.month;
  return toDevanagariDigits(`${p.day} ${month} ${p.year}`);
}

/** Calendar mode: 'bs' (Nepal default), 'ad', or 'both'. */
export function calendarMode(settings = {}) {
  return settings.calendar || (lang === 'ne' ? 'bs' : countryProfile(settings.country).calendar || 'ad');
}

/** Gregorian date using the country's numeric pattern. */
function formatDateAd(value, settings = {}) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '';
  const p = countryProfile(settings.country);
  const pad = n => String(n).padStart(2, '0');
  const dd = pad(d.getDate()), mm = pad(d.getMonth() + 1), yyyy = String(d.getFullYear());
  const pattern = p.dateFormat || 'DD/MM/YYYY';
  let out;
  if (pattern === 'YYYY-MM-DD') out = `${yyyy}-${mm}-${dd}`;
  else if (pattern === 'MM/DD/YYYY') out = `${mm}/${dd}/${yyyy}`;
  else out = `${dd}/${mm}/${yyyy}`;
  return toDevanagariDigits(out);
}

/** Convert a JS Date to an ISO yyyy-mm-dd input value (always Latin digits). */
export function toInputDate(value) {
  const d = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Date + time for receipts, logs and audit trails. */
export function formatDateTime(value, settings = {}) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '';
  const locale = displayLocale(settings);
  try {
    const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${formatDate(d, settings)} ${time}`;
  } catch {
    return d.toLocaleString();
  }
}

/** Nepali-friendly long date, e.g. 18 Nov 2026 / २ मंसिर २०८३ style month names via locale. */
function formatDateLongAd(value, settings = {}) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '';
  try {
    return d.toLocaleDateString(displayLocale(settings), { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return formatDate(d, settings);
  }
}

const GRAMS = { gram: 1, tola: 11.6638, aana: 0.7289875, lal: 0.116638, ratti: 0.1215 };
const NE_UNIT_LABELS = { gram: 'ग्राम', tola: 'तोला', aana: 'आना', lal: 'लाल', ratti: 'रत्ती' };
/** Weight display in the country's customary unit (tola for NP/IN, grams elsewhere). */
export function formatWeight(grams, settings = {}, decimals = 3) {
  const unit = settings.weightUnit || countryProfile(settings.country).weightUnit || 'gram';
  const div = GRAMS[unit] || 1;
  const label = lang === 'ne' ? (NE_UNIT_LABELS[unit] || unit) : (unit === 'gram' ? 'g' : unit);
  return toDevanagariDigits(`${(Number(grams || 0) / div).toFixed(decimals)} ${label}`);
}

/** Apply a country preset onto shop settings (currency, tax label/rate, prefix). */
export function applyCountryPreset(settings, code) {
  const p = countryProfile(code);
  return {
    ...settings,
    country: code,
    currency: p.currency,
    taxLabel: p.taxLabel,
    taxRate: p.taxRate,
    taxInclusive: p.taxInclusive,
    weightUnit: p.weightUnit,
    dial: p.dial,
    calendar: p.calendar || 'ad',
    invoicePrefix: settings.invoicePrefix || p.invoicePrefix
  };
}


/*
 * Final pass for static copy: translates remaining literal labels that were not
 * routed through t() (headings, button captions, placeholders, table headers).
 * Only exact catalog matches are replaced, so unknown/dynamic text stays intact.
 */
const LOCALIZABLE = [
  '.page-title', '.page-subtitle', '.card-title', '.card-subtitle', '.section-title',
  '.empty-title', '.empty-message', '.field-label', '.btn', '.tab', '.nav-label',
  'th', 'td[data-label]', '.badge', '.muted', '.small', '.stat-label', '.metric-label',
  '.metric-sub', '.breakdown-title', '.breakdown-label', '.modal-title', '.alert-title',
  '.alert-message', '.note', '.tooltip', '.login-title', '.login-heading', '.login-subtitle',
  '.login-footer', '.demo-btn', '.jewelry-type-name', '.inventory-name', '.cart-item-name',
  '.btn span', 'button span', 'h4', 'h5', 'h6', 'label', 'option'
].join(',');

export function localizeDom(root = (typeof document !== 'undefined' ? document : null)) {
  if (!root || lang === 'en') return;
  const table = CATALOGS[lang] || {};
  let nodes;
  try { nodes = root.querySelectorAll(LOCALIZABLE); } catch { return; }
  const translateText = node => {
    const raw = node.nodeValue;
    if (!raw) return;
    const key = raw.trim();
    if (!key || !table[key]) return;
    node.nodeValue = raw.replace(key, table[key]);
  };
  nodes.forEach(el => {
    if (el.closest('[data-i18n-skip]')) return;
    el.childNodes.forEach(child => {
      if (child.nodeType === 3) translateText(child);
    });
    ['placeholder', 'title', 'aria-label', 'data-tooltip'].forEach(attr => {
      const value = el.getAttribute && el.getAttribute(attr);
      if (value && table[value.trim()]) el.setAttribute(attr, table[value.trim()]);
    });
  });
}


/* Calendar-aware public date API */
export function formatDate(value, settings = {}) {
  const mode = calendarMode(settings);
  if (mode === 'bs') return formatBsDate(value, settings);
  if (mode === 'both') {
    const bs = bsParts(value);
    const ad = formatDateAd(value, settings);
    return bs ? `${toDevanagariDigits(`${bs.y}/${bs.m}/${bs.d}`)} (${ad})` : ad;
  }
  return formatDateAd(value, settings);
}

export function formatDateLong(value, settings = {}) {
  const mode = calendarMode(settings);
  if (mode === 'bs' || mode === 'both') return formatBsDateLong(value, settings);
  return formatDateLongAd(value, settings);
}
