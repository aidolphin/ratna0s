import { state, money, num, rnd, t, icon, input, select, textarea, rows, card, esc, fmtDate, PAGE_TITLES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../src.js';

function accountingList() {
  const incomeRows = (state.accounting?.income || []).slice(-10).reverse().map(i => 
    `<tr><td class="mono">${fmtDate(i.date)}</td><td>${esc(i.category)}</td><td class="mono align-right text-success">${money(i.amount)}</td><td>${esc(i.method)}</td><td><code class="mono">${esc(i.reference || '-')}</code></td><td>${esc(i.notes || '-')}</td></tr>`
  ).join('');
  const expenseRows = (state.accounting?.expenses || []).slice(-10).reverse().map(e => 
    `<tr><td class="mono">${fmtDate(e.date)}</td><td>${esc(e.category)}</td><td class="mono align-right text-danger">${money(e.amount)}</td><td>${e.status === 'paid' ? '<span class="badge badge-completed">' + t('Paid') + '</span>' : e.status === 'pending' ? '<span class="badge badge-inprogress">' + t('Pending') + '</span>' : '<span class="badge badge-warn">' + t('Overdue') + '</span>'}</td><td>${esc(e.method)}</td><td><code class="mono">${esc(e.reference || '-')}</code></td><td>${esc(e.notes || '-')}</td></tr>`
  ).join('');
  const incomeTotal = rnd(state.accounting?.income?.reduce((s, i) => s + num(i.amount), 0) || 0);
  const expenseTotal = rnd(state.accounting?.expenses?.reduce((s, e) => s + num(e.amount), 0) || 0);
  const pendingReceivables = rnd(state.customers.reduce((s, c) => s + Math.max(0, num(c.balance || 0)), 0));
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.accounting[0]}</h1><p class="page-subtitle">${PAGE_TITLES.accounting[1]}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-tab="accounting" data-action="newIncome">${t('Record Income')}</button>
  <button class="btn btn-secondary" data-tab="accounting" data-action="newExpense">${t('Record Expense')}</button>
  <button class="btn btn-outline-champagne" data-tab="reports" data-report-type="pnl">${t('P&L Report')}</button>
</div></div></div>
<div class="metric-grid">${card(t('Total Income'), money(incomeTotal))} ${card(t('Total Expenses'), money(expenseTotal))} ${card(t('Net Profit'), money(incomeTotal - expenseTotal))} ${card(t('Pending Receivables'), money(pendingReceivables))}</div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Recent Income')}</h2></div><div class="card-body" style="padding:0">${rows([t('Date'), t('Category'), t('Amount'), t('Method'), t('Reference'), t('Notes')], incomeRows || `<tr><td colspan="6" class="align-center">${t('No income recorded')}</td></tr>`)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Recent Expenses')}</h2></div><div class="card-body" style="padding:0">${rows([t('Date'), t('Category'), t('Amount'), t('Status'), t('Method'), t('Reference'), t('Notes')], expenseRows || `<tr><td colspan="7" class="align-center">${t('No expenses recorded')}</td></tr>`)}</div></div>`;
}

function accountingNewIncome() {
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.accounting[0]} - ${t('Record Income')}</h1><p class="page-subtitle">${PAGE_TITLES.accounting[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('New Income Entry')}</h2></div><div class="card-body"><form id="incomeForm" class="form">${input('date', t('Date *'), 'date', new Date().toISOString().slice(0, 10))}${select('category', t('Category *'), INCOME_CATEGORIES.map(c => ({ value: c, label: t(c) })))}${input('amount', t('Amount (NPR) *'), 'number', '', 'min="0.01" step="0.01"')}${select('method', t('Payment Method *'), PAYMENT_METHODS.map(m => ({ value: m, label: t(m) })))}${input('reference', t('Reference / Invoice No.'))}${textarea('notes', t('Notes'))}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Record Income')}</button></div></form></div></div>`;
}

function accountingNewExpense() {
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.accounting[0]} - ${t('Record Expense')}</h1><p class="page-subtitle">${PAGE_TITLES.accounting[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('New Expense Entry')}</h2></div><div class="card-body"><form id="expenseForm" class="form">${input('date', t('Date *'), 'date', new Date().toISOString().slice(0, 10))}${select('category', t('Category *'), EXPENSE_CATEGORIES.map(c => ({ value: c, label: t(c) })))}${input('amount', t('Amount (NPR) *'), 'number', '', 'min="0.01" step="0.01"')}${select('status', t('Status *'), ['paid', 'pending', 'overdue'].map(s => ({ value: s, label: t(s) })), 'pending')}${select('method', t('Payment Method *'), PAYMENT_METHODS.map(m => ({ value: m, label: t(m) })))}${input('reference', t('Reference / Bill No.'))}${textarea('notes', t('Notes'))}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Record Expense')}</button></div></form></div></div>`;
}

function accountingChartOfAccounts() {
  const accountRows = (state.accounting?.chartOfAccounts || []).map(a => 
    `<tr><td><code class="mono">${esc(a.code)}</code></td><td>${esc(a.name)}</td><td>${t(a.type)}</td><td>${esc(a.parentCode || '-')}</td><td class="mono align-right">${money(a.balance)}</td></tr>`
  ).join('');
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.accounting[0]} - ${t('Chart of Accounts')}</h1><p class="page-subtitle">${PAGE_TITLES.accounting[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Accounts')}</h2></div><div class="card-body" style="padding:0">${rows([t('Code'), t('Name'), t('Type'), t('Parent'), t('Balance')], accountRows || `<tr><td colspan="5" class="align-center">${t('No accounts defined')}</td></tr>`)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Add Account')}</h2></div><div class="card-body"><form id="coaForm" class="form">${input('code', t('Account Code *'))}${input('name', t('Account Name *'))}${select('type', t('Account Type *'), ['asset', 'liability', 'equity', 'income', 'expense'].map(x => ({ value: x, label: t(x) })))}${input('parentCode', t('Parent Account Code'))}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Add Account')}</button></div></form></div></div>`;
}

export default function accounting() {
  const view = state.accountingView || 'list';
  if (view === 'newIncome') return accountingNewIncome();
  if (view === 'newExpense') return accountingNewExpense();
  if (view === 'chartOfAccounts') return accountingChartOfAccounts();
  return accountingList();
}