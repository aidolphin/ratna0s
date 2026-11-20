import { t } from './i18n.js';
import { state } from './state.js';
import { PAGE_TITLES } from './constants.js';
import { JEWELRY_CATEGORIES, JEWELRY_ICONS, NAV_ICONS, ICON_PATHS, STATUS_OPTIONS, LOCATIONS, PURITY_OPTIONS, METAL_TYPES_BY_CATEGORY, METAL_UNITS, EXPENSE_CATEGORIES, EXPENSE_STATUSES, JOB_STATUSES, JOB_STAGES, UNITS, GOLD_PURITIES, SILVER_PURITIES, PAYMENT_METHODS, METAL_TXN_TYPES, PROCESS_TYPES, KC_SILVER_PURITIES, KC_GOLD_PURITIES, RING_SIZE_SYSTEMS, REGIONAL_TERMS } from './constants.js';
import { formatNumber, formatMoney, translateDigits, esc, money, num, rnd, fmtDate, fmtDateTime, lt, getLanguage, getCountry, countryProfile, LOCALES, LANGUAGE_OPTIONS, COUNTRY_OPTIONS } from './i18n.js';
import { totals, getAllMetalBalances, stock, calcItem, getKarigar, getKarigarJobs, getJobIssuedWeight, getJobReturnedWeight, getJobNetIssued, isJobActiveStatus, ensureJobShape, recalcJobFinancials, updateKarigarStats, syncJobKarigar, generateSKU, generateBarcode, generateQRData, recordMovement, generateInvoiceNumber, getCustomer, updateCustomerStats, id } from './src.js';

export function icon(name, cls = '') {
  const p = ICON_PATHS[name];
  if (!p) return '';
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

export function input(name, label, type = 'text', value = '', extra = '') {
  return `<div class="field"><label class="field-label" for="${name}">${t(label)}</label><input class="field-input" id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
}

export function select(name, label, opts, val = '', extra = '') {
  return `<div class="field" ${extra.includes('data-field-wrap') ? '' : ''}><label class="field-label" for="${name}">${t(label)}</label><select class="field-select" id="${name}" name="${name}" ${extra}>${opts.map(x => { const v = (typeof x === 'object') ? x.value : x; const l = (typeof x === 'object') ? x.label : x; return `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>` }).join('')}</select></div>`;
}

export function textarea(name, label, val = '', extra = '') {
  return `<div class="field"><label class="field-label" for="${name}">${t(label)}</label><textarea class="field-textarea" id="${name}" name="${name}" ${extra}>${esc(val)}</textarea></div>`;
}

export function card(label, value, sub = '', iconName = '', tab = '') {
  return `<div class="metric-card${tab ? ' metric-link' : ''}"${tab ? ` data-tab="${tab}" role="button" tabindex="0"` : ''}>${iconName ? `<span class="metric-icon">${icon(iconName)}</span>` : ''}<div class="metric-label">${t(label)}</div><div class="metric-value">${translateDigits(value)}</div>${sub ? `<div class="metric-sub">${sub}</div>` : ''}</div>`;
}

export function rows(headers, body) {
  return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h => `<th>${t(h)}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${headers.length}" class="align-center"><div class="empty"><p class="empty-title">${t('No records yet')}</p></div></td></tr>`}</tbody></table></div>`;
}

export function jobStatusBadge(status) {
  const map = { 'Pending': 'badge-pending', 'In Progress': 'badge-inprogress', QC: 'badge-qc', Rework: 'badge-rework', Completed: 'badge-completed' };
  return `<span class="badge ${map[status] || 'badge-open'}">${esc(t(status || 'Pending'))}</span>`;
}

export function kcBadge(text, cls = '') {
  return `<span class="badge ${cls}">${esc(text)}</span>`;
}

export function kcName(r) {
  return typeof r === 'object' ? (r.en || r.id) : r;
}

export function kcLang() {
  return getLanguage();
}

export function kcCanEdit() {
  return window.RatnaOS?.auth?.hasPermission?.('knowledge:configure');
}

export function kcEditBtns(name, id) {
  return `<div style="display:flex;gap:4px;justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-kc-edit="${esc(name)}:${esc(id)}" title="${esc(t('Edit'))}">${icon('edit')}</button><button type="button" class="btn btn-ghost btn-sm" data-kc-del="${esc(name)}:${esc(id)}" title="${esc(t('Delete'))}">${icon('trash')}</button></div>`;
}

export function kcAdminBar(name, label) {
  return `<div class="card section" style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="small muted">${esc(t('Admin editing'))}: ${esc(t(label))}</span><button type="button" class="btn btn-secondary btn-sm" data-kc-new="${esc(name)}">${icon('plus')}<span>${esc(t('Add record'))}</span></button></div>`;
}

export function kcStatus(r) {
  return r.verified ? kcBadge(t('Verified'), 'badge-completed') : kcBadge(t('Needs Verification'), 'badge-warn');
}

export { t, state, PAGE_TITLES, JEWELRY_CATEGORIES, JEWELRY_ICONS, NAV_ICONS, ICON_PATHS, STATUS_OPTIONS, LOCATIONS, PURITY_OPTIONS, METAL_TYPES_BY_CATEGORY, METAL_UNITS, EXPENSE_CATEGORIES, EXPENSE_STATUSES, JOB_STATUSES, JOB_STAGES, UNITS, GOLD_PURITIES, SILVER_PURITIES, PAYMENT_METHODS, METAL_TXN_TYPES, PROCESS_TYPES, KC_SILVER_PURITIES, KC_GOLD_PURITIES, RING_SIZE_SYSTEMS, REGIONAL_TERMS, formatNumber, formatMoney, translateDigits, esc, money, num, rnd, fmtDate, fmtDateTime, lt, getLanguage, getCountry, countryProfile, LOCALES, LANGUAGE_OPTIONS, COUNTRY_OPTIONS, totals, getAllMetalBalances, stock, calcItem, getKarigar, getKarigarJobs, getJobIssuedWeight, getJobReturnedWeight, getJobNetIssued, isJobActiveStatus, ensureJobShape, recalcJobFinancials, updateKarigarStats, syncJobKarigar, generateSKU, generateBarcode, generateQRData, recordMovement, generateInvoiceNumber, getCustomer, updateCustomerStats, id };