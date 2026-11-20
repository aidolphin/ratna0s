import { state, money, num, rnd, t, icon, input, select, textarea, rows, card, esc, fmtDate, PAGE_TITLES, getSupplier, generateSupplierCode, updateSupplierStats, id, save } from '../src.js';

function suppliersList() {
  const suppliers = state.suppliers||[];
  const rowsHtml = suppliers.map(s => {
    const statusBadge = s.balance > 0 ? '<span class="badge badge-warn">' + t('Outstanding') + '</span>' : '<span class="badge badge-completed">' + t('Settled') + '</span>';
    return '<tr><td><strong>' + esc(s.name) + '</strong></td><td>' + esc(s.contactPerson || '-') + '</td><td>' + esc(s.phone || '-') + '</td><td>' + esc(s.address || '-') + '</td><td>' + esc(s.paymentTerms || '-') + '</td><td class="mono align-right">' + num(s.totalPurchases || 0) + '</td><td class="mono align-right">' + money(num(s.totalAmount || 0)) + '</td><td class="mono align-right ' + (s.balance > 0 ? 'text-danger' : 'text-success') + '">' + money(num(s.balance || 0)) + '</td><td><span class="badge ' + (s.balance > 0 ? 'badge-warn' : 'badge-completed') + '">' + (s.balance > 0 ? t('Payable') : t('Settled')) + '</span></td><td><button class="btn btn-sm btn-outline" data-supplier-edit="' + esc(s.id) + '">' + t('Edit') + '</button> <button class="btn btn-sm btn-outline" data-supplier-ledger="' + esc(s.id) + '">' + t('Ledger') + '</button></td></tr>';
  }).join('');
  const emptyRow = '<tr><td colspan="10" class="align-center">' + t('No suppliers registered') + '</td></tr>';

  const totalSuppliers = suppliers.length;
  const totalPurchases = rnd(suppliers.reduce((s2, s) => s2 + num(s.totalPurchases || 0), 0));
  const totalAmount = money(rnd(suppliers.reduce((s2, s) => s2 + num(s.totalAmount || 0), 0)));
  const totalBalance = money(rnd(suppliers.reduce((s2, s) => s2 + num(s.balance || 0), 0)));

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.suppliers[0]}</h1><p class="page-subtitle">${PAGE_TITLES.suppliers[1]}</p></div><div class="page-header-actions"><button class="btn btn-champagne" data-supplier-new>${t('Add Supplier')}</button></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Suppliers')}</h2></div><div class="card-body" style="padding:0">${rows([t('Name'), t('Contact'), t('Phone'), t('Address'), t('Terms'), t('Purchases'), t('Amount'), t('Balance'), t('Status'), t('Actions')], rowsHtml || emptyRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Summary')}</h2></div><div class="card-body"><div class="metric-grid">${card(t('Total Suppliers'), totalSuppliers)}${card(t('Total Purchases'), totalPurchases)}${card(t('Total Amount'), totalAmount)}${card(t('Total Balance'), totalBalance)}</div></div></div>`;
}

function supplierForm(editId=null) {
  const s = editId ? getSupplier(editId) : null;
  const isEdit = !!s;
  const pageTitle = isEdit ? t('Edit Supplier') : t('Add Supplier');
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.suppliers[0]} - ${pageTitle}</h1><p class="page-subtitle">${PAGE_TITLES.suppliers[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${pageTitle}</h2></div><div class="card-body"><form id="supplierForm" class="form" ${isEdit ? 'data-edit-id="' + esc(editId) + '"' : ''}>
${input('name', t('Supplier Name'), 'text', s ? s.name : '', 'required')}
${input('contactPerson', t('Contact Person'), 'text', s ? s.contactPerson : '')}
${input('phone', t('Phone'), 'tel', s ? s.phone : '')}
${input('address', t('Address'), 'text', s ? s.address : '')}
${input('paymentTerms', t('Payment Terms'), 'text', s ? s.paymentTerms : '')}
<div class="field-full"><button class="btn btn-champagne" type="submit" style="width:100%">${isEdit ? t('Update Supplier') : t('Save Supplier')}</button></div>
${isEdit ? '<button class="btn btn-ghost" type="button" data-supplier-cancel-edit>' + t('Cancel') + '</button>' : ''}
</form></div></div>`;
}

export default function suppliers() {
  const view = state.supplierView || 'list';
  if (view === 'new' || view === 'edit') return supplierForm(state.supplierEditId || null);
  return suppliersList();
}
