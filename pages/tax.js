import { state, money, num, rnd, t, icon, input, select, textarea, rows, card, esc, fmtDate, PAGE_TITLES, TAX_TYPES } from '../src.js';

function taxList() {
  const totalTaxCollected = rnd(state.sales.reduce((s, x) => s + (x.tax || 0), 0));
  const totalTaxPaid = rnd(state.tax?.payments?.reduce((s, p) => s + num(p.amount), 0) || 0);
  const taxLiability = rnd(totalTaxCollected - totalTaxPaid);

  const paymentRows = (state.tax?.payments || []).slice(-20).reverse().map(p => {
    const statusBadge = p.status === 'paid' ? '<span class="badge badge-completed">' + t('Paid') + '</span>' : '<span class="badge badge-warn">' + t('Pending') + '</span>';
    return '<tr><td class="mono">' + fmtDate(p.date) + '</td><td>' + t(p.type) + '</td><td>' + esc(p.period) + '</td><td class="mono align-right">' + money(p.amount) + '</td><td>' + esc(p.method) + '</td><td><code class="mono">' + esc(p.reference || '-') + '</code></td><td>' + statusBadge + '</td></tr>';
  }).join('');
  const emptyPaymentRow = '<tr><td colspan="7" class="align-center">' + t('No tax payments recorded') + '</td></tr>';

  const byType = {};
  state.sales.forEach(s => { (s.items || []).forEach(it => { const tType = it.taxType || state.settings.taxLabel; byType[tType] = (byType[tType] || 0) + (s.tax || 0) * (num(it.total) / num(s.subtotal || 1)); }); });
  const typeRows = Object.entries(byType).map(([t, v]) => '<tr><td>' + esc(t) + '</td><td class="mono align-right">' + money(rnd(v)) + '</td></tr>').join('');
  const emptyTypeRow = '<tr><td colspan="2" class="align-center">' + t('No sales data') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.tax[0]}</h1><p class="page-subtitle">${PAGE_TITLES.tax[1]}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-tab="tax" data-action="new">${t('Record Tax Payment')}</button>
  <button class="btn btn-secondary" data-tab="reports" data-report-type="pnl">${t('P&L Report')}</button>
</div></div></div>
<div class="metric-grid">${card(t('Total Tax Collected'), money(totalTaxCollected))} ${card(t('Total Tax Paid'), money(totalTaxPaid))} ${card(t('Tax Liability'), money(taxLiability))} ${card(t('Current Tax Rate'), state.settings.taxRate + '% ' + state.settings.taxLabel)}</div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Tax Payments')}</h2></div><div class="card-body" style="padding:0">${rows([t('Date'), t('Tax Type'), t('Period'), t('Amount'), t('Method'), t('Reference'), t('Status')], paymentRows || emptyPaymentRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Tax Collected by Type')}</h2></div><div class="card-body" style="padding:0">${rows([t('Tax Type'), t('Collected')], typeRows || emptyTypeRow)}</div></div>`;
}

function taxNew() {
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.tax[0]} - ${t('Record Tax Payment')}</h1><p class="page-subtitle">${PAGE_TITLES.tax[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('New Tax Payment')}</h2></div><div class="card-body"><form id="taxForm" class="form">${input('date', t('Date *'), 'date', new Date().toISOString().slice(0, 10))}${select('type', t('Tax Type *'), TAX_TYPES.map(x => ({ value: x, label: t(x) })))}${input('period', t('Period (e.g., 2024-Q1, 2024-01) *'))}${input('amount', t('Amount (NPR) *'), 'number', '', 'min="0.01" step="0.01"')}${select('method', t('Payment Method *'), ['Cash', 'Bank Transfer', 'Cheque', 'Online'].map(m => ({ value: m, label: t(m) })))}${input('reference', t('Reference / Challan No. *'))}${textarea('notes', t('Notes'))}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Record Payment')}</button></div></form></div></div>`;
}

function taxReturns() {
  const returns = state.tax?.returns || [];
  const returnRows = returns.slice().reverse().map(r => {
    const statusBadge = r.status === 'filed' ? '<span class="badge badge-completed">' + t('Filed') + '</span>' : r.status === 'pending' ? '<span class="badge badge-inprogress">' + t('Pending') + '</span>' : '<span class="badge badge-warn">' + t('Overdue') + '</span>';
    return '<tr><td>' + esc(r.period) + '</td><td>' + t(r.type) + '</td><td class="mono">' + fmtDate(r.filedDate) + '</td><td class="mono align-right">' + money(r.taxableAmount) + '</td><td class="mono align-right">' + money(r.taxDue) + '</td><td class="mono align-right">' + money(r.taxPaid) + '</td><td>' + statusBadge + '</td></tr>';
  }).join('');
  const emptyReturnRow = '<tr><td colspan="7" class="align-center">' + t('No returns filed') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.tax[0]} - ${t('Tax Returns')}</h1><p class="page-subtitle">${PAGE_TITLES.tax[1]}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-tab="tax" data-action="newReturn">${t('File Return')}</button>
</div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Filed Returns')}</h2></div><div class="card-body" style="padding:0">${rows([t('Period'), t('Tax Type'), t('Filed Date'), t('Taxable Amount'), t('Tax Due'), t('Tax Paid'), t('Status')], returnRows || emptyReturnRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('File New Return')}</h2></div><div class="card-body"><form id="returnForm" class="form">${input('period', t('Period * (e.g., 2024-Q1)'))}${select('type', t('Tax Type *'), TAX_TYPES.map(x => ({ value: x, label: t(x) })))}${input('taxableAmount', t('Taxable Amount (NPR) *'), 'number', '', 'min="0" step="0.01"')}${input('taxDue', t('Tax Due (NPR) *'), 'number', '', 'min="0" step="0.01"')}${input('taxPaid', t('Tax Paid (NPR) *'), 'number', '', 'min="0" step="0.01"')}${input('filedDate', t('Filed Date *'), 'date', new Date().toISOString().slice(0, 10))}${select('status', t('Status *'), ['filed', 'pending'].map(s => ({ value: s, label: t(s) })), 'filed')}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('File Return')}</button></div></form></div></div>`;
}

export default function tax() {
  const view = state.taxView || 'list';
  if (view === 'new') return taxNew();
  if (view === 'returns') return taxReturns();
  return taxList();
}