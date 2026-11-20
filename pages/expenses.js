import { state, money, num, rnd, t, icon, input, select, textarea, rows, card, esc, fmtDate, PAGE_TITLES, getExpense, generateExpenseNumber, EXPENSE_CATEGORIES, EXPENSE_STATUSES, id, save } from '../src.js';

function expensesList() {
  const expenses = state.expenses||[];
  const rowsHtml = expenses.map(e => {
    const statusClass = e.status === 'paid' ? 'badge-completed' : e.status === 'pending' ? 'badge-warn' : e.status === 'overdue' ? 'badge-warn' : 'badge-ghost';
    return '<tr><td class="mono">' + esc(e.id.slice(-8)) + '</td><td>' + fmtDate(e.date) + '</td><td>' + esc(e.category || 'General') + '</td><td class="mono align-right">' + money(num(e.amount || 0)) + '</td><td><span class="badge ' + statusClass + '">' + t(e.status || 'paid') + '</span></td><td>' + esc(e.paymentMethod || 'Cash') + '</td><td><code class="mono">' + esc(e.reference || '-') + '</code></td><td>' + esc(e.notes || '-') + '</td><td><button class="btn btn-sm btn-outline" data-expense-edit="' + esc(e.id) + '">' + t('Edit') + '</button> <button class="btn btn-sm btn-outline" data-expense-delete="' + esc(e.id) + '">' + t('Delete') + '</button></td></tr>';
  }).join('');
  const emptyRow = '<tr><td colspan="9" class="align-center">' + t('No expenses recorded') + '</td></tr>';

  const totalExpenses = expenses.length;
  const totalAmount = money(rnd(expenses.reduce((s2, e) => s2 + num(e.amount || 0), 0)));
  const paidAmount = money(rnd(expenses.filter(e => e.status === 'paid').reduce((s2, e) => s2 + num(e.amount || 0), 0)));
  const pendingAmount = money(rnd(expenses.filter(e => e.status !== 'paid' && e.status !== 'cancelled').reduce((s2, e) => s2 + num(e.amount || 0), 0)));

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.expenses[0]}</h1><p class="page-subtitle">${PAGE_TITLES.expenses[1]}</p></div><div class="page-header-actions"><button class="btn btn-champagne" data-expense-new>${t('Add Expense')}</button></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Expenses')}</h2></div><div class="card-body" style="padding:0">${rows([t('ID'), t('Date'), t('Category'), t('Amount'), t('Status'), t('Method'), t('Reference'), t('Notes'), t('Actions')], rowsHtml || emptyRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Summary')}</h2></div><div class="card-body"><div class="metric-grid">${card(t('Total Expenses'), totalExpenses)}${card(t('Total Amount'), totalAmount)}${card(t('Paid'), paidAmount)}${card(t('Pending'), pendingAmount)}</div></div></div>`;
}

function expenseForm(editId=null) {
  const e = editId ? getExpense(editId) : null;
  const isEdit = !!e;
  const pageTitle = isEdit ? t('Edit Expense') : t('Add Expense');
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.expenses[0]} - ${pageTitle}</h1><p class="page-subtitle">${PAGE_TITLES.expenses[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${pageTitle}</h2></div><div class="card-body"><form id="expenseForm" class="form" ${isEdit ? 'data-edit-id="' + esc(editId) + '"' : ''}>
${input('reference', t('Reference / Voucher'), 'text', e ? e.reference : generateExpenseNumber())}
${input('date', t('Date'), 'date', e ? e.date : new Date().toISOString().slice(0, 10))}
${select('category', t('Category'), EXPENSE_CATEGORIES, e ? e.category : 'General')}
${input('amount', t('Amount'), 'number', e ? e.amount : '', 'min="0" step="0.01" required')}
${select('paymentMethod', t('Payment Method'), ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card'], e ? e.paymentMethod : 'Cash')}
${select('status', t('Status'), EXPENSE_STATUSES, e ? e.status : 'paid')}
${textarea('notes', t('Notes'), e ? e.notes : '')}
<div class="field-full"><button class="btn btn-champagne" type="submit" style="width:100%">${isEdit ? t('Update Expense') : t('Save Expense')}</button></div>
${isEdit ? '<button class="btn btn-ghost" type="button" data-expense-cancel-edit>' + t('Cancel') + '</button>' : ''}
</form></div></div>`;
}

export default function expenses() {
  const view = state.expenseView || 'list';
  if (view === 'new' || view === 'edit') return expenseForm(state.expenseEditId || null);
  return expensesList();
}
