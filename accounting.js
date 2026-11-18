/*
 * RatnaOS Accounting Engine — Phase 1
 * ----------------------------------
 * Pure, deterministic double-entry foundation that can run in the browser and
 * under Node tests. Existing RatnaOS data is never modified; accounting is an
 * additive namespace (`state.accounting`).
 *
 * Money rule: every amount is stored as an integer in minor units (paisa).
 * JavaScript floating-point arithmetic is never used for ledger balances.
 */

export const ACCOUNTING_VERSION = 1;
export const CURRENCY_MINOR = 100;

export const ACCOUNTS = [
  { code: '1000', name: 'Cash', type: 'asset', normal: 'debit' },
  { code: '1010', name: 'Bank', type: 'asset', normal: 'debit' },
  { code: '1020', name: 'Card / Wallet Clearing', type: 'asset', normal: 'debit' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
  { code: '1200', name: 'Inventory — Jewellery', type: 'asset', normal: 'debit' },
  { code: '1210', name: 'Metal Stock — Gold', type: 'asset', normal: 'debit' },
  { code: '1220', name: 'Metal Stock — Silver', type: 'asset', normal: 'debit' },
  { code: '1300', name: 'Input VAT', type: 'asset', normal: 'debit' },
  { code: '1500', name: 'Fixed Assets', type: 'asset', normal: 'debit' },
  { code: '1510', name: 'Accumulated Depreciation', type: 'asset', normal: 'credit' },
  { code: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
  { code: '2100', name: 'Output VAT', type: 'liability', normal: 'credit' },
  { code: '2110', name: 'VAT Payable', type: 'liability', normal: 'credit' },
  { code: '2200', name: 'TDS Payable', type: 'liability', normal: 'credit' },
  { code: '3000', name: 'Owner’s Equity', type: 'equity', normal: 'credit' },
  { code: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
  { code: '3200', name: 'Opening Balance Equity', type: 'equity', normal: 'credit' },
  { code: '4000', name: 'Jewellery Sales', type: 'income', normal: 'credit' },
  { code: '4100', name: 'Making Charges Income', type: 'income', normal: 'credit' },
  { code: '4200', name: 'Other Income', type: 'income', normal: 'credit' },
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense', normal: 'debit' },
  { code: '5100', name: 'Gold Purchases', type: 'expense', normal: 'debit' },
  { code: '5200', name: 'Silver Purchases', type: 'expense', normal: 'debit' },
  { code: '5300', name: 'Diamond & Gem Purchases', type: 'expense', normal: 'debit' },
  { code: '6000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
  { code: '6100', name: 'Karigar Labour', type: 'expense', normal: 'debit' },
  { code: '6200', name: 'Rent', type: 'expense', normal: 'debit' },
  { code: '6300', name: 'Utilities', type: 'expense', normal: 'debit' },
  { code: '6400', name: 'Marketing', type: 'expense', normal: 'debit' },
  { code: '6500', name: 'Transport', type: 'expense', normal: 'debit' },
  { code: '6510', name: 'Insurance', type: 'expense', normal: 'debit' },
  { code: '6520', name: 'Maintenance', type: 'expense', normal: 'debit' },
  { code: '6530', name: 'Professional Fees', type: 'expense', normal: 'debit' },
  { code: '6540', name: 'Office Supplies', type: 'expense', normal: 'debit' },
  { code: '6550', name: 'Taxes', type: 'expense', normal: 'debit' },
  { code: '6560', name: 'Licenses', type: 'expense', normal: 'debit' },
  { code: '6570', name: 'Bank Charges', type: 'expense', normal: 'debit' },
  { code: '6580', name: 'Wastage & Loss', type: 'expense', normal: 'debit' },
  { code: '6900', name: 'General Expenses', type: 'expense', normal: 'debit' }
];

const EXPENSE_ACCOUNTS = {
  Rent: '6200',
  Utilities: '6300',
  Salaries: '6000',
  Marketing: '6400',
  Transport: '6500',
  Insurance: '6510',
  Maintenance: '6520',
  'Professional Fees': '6530',
  'Office Supplies': '6540',
  Taxes: '6550',
  Licenses: '6560',
  'Bank Charges': '6570',
  Other: '6900'
};

const PAYMENT_ACCOUNTS = {
  Cash: '1000',
  'Bank Transfer': '1010',
  Cheque: '1010',
  Bank: '1010',
  Card: '1020',
  Wallet: '1020',
  UPI: '1020'
};

export const SOURCE = {
  SALE: 'sale',
  EXPENSE: 'expense',
  METAL: 'metal',
  SUPPLIER_PAYMENT: 'supplier_payment',
  MANUAL: 'manual',
  VOUCHER: 'voucher',
  OPENING: 'opening',
  VAT_PURCHASE: 'vat_purchase',
  VAT_SETTLE: 'vat_settlement',
  VAT_PAYMENT: 'vat_payment',
  TDS: 'tds',
  TDS_DEPOSIT: 'tds_deposit',
  CLOSING: 'closing',
  REVERSAL: 'reversal'
};

/** Round a number of currency units to an exact integer of minor units. */
export function toMinor(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * CURRENCY_MINOR);
}

/** Convert integer minor units back to a display number (never for arithmetic). */
export function fromMinor(minor) {
  return Number(minor) / CURRENCY_MINOR;
}

export function formatMinor(minor) {
  const n = Number(minor) || 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return sign + Math.floor(abs / CURRENCY_MINOR) + '.' + String(abs % CURRENCY_MINOR).padStart(2, '0');
}

export function accountByCode(accounts, code) {
  return (accounts || []).find(a => a.code === code) || null;
}

export function paymentAccount(method) {
  return PAYMENT_ACCOUNTS[String(method || 'Cash')] || '1000';
}

export function expenseAccount(category) {
  return EXPENSE_ACCOUNTS[String(category || 'Other')] || '6900';
}

/** Additive, non-destructive state migration. */
export function ensureAccounting(state) {
  if (!state || typeof state !== 'object') throw new Error('state required');
  if (!state.accounting || typeof state.accounting !== 'object') {
    state.accounting = { meta: {}, accounts: [], journals: [], lines: [], sequence: 0 };
  }
  const acc = state.accounting;
  if (!acc.meta) acc.meta = {};
  if (acc.meta.version == null) acc.meta.version = ACCOUNTING_VERSION;
  acc.meta.currencyMinor = CURRENCY_MINOR;
  if (!Array.isArray(acc.accounts)) acc.accounts = [];
  if (!Array.isArray(acc.journals)) acc.journals = [];
  if (!Array.isArray(acc.lines)) acc.lines = [];
  if (typeof acc.sequence !== 'number') acc.sequence = 0;
  if (!Array.isArray(acc.fiscalYears)) acc.fiscalYears = [];

  const existing = new Set(acc.accounts.map(a => a.code));
  for (const account of ACCOUNTS) {
    if (!existing.has(account.code)) {
      acc.accounts.push({ ...account, system: true, archived: false, createdAt: new Date().toISOString() });
    }
  }
  return acc;
}

export function makeLine(account, debit = 0, credit = 0, memo = '') {
  const d = Math.max(0, Math.round(debit));
  const c = Math.max(0, Math.round(credit));
  if (d > 0 && c > 0) throw new Error('A line cannot have both debit and credit');
  if (d === 0 && c === 0) throw new Error('A line cannot be zero');
  return { account, debit: d, credit: c, memo };
}

/** Validate a set of lines. Returns {ok, error, debit, credit}. */
export function validateLines(lines) {
  if (!Array.isArray(lines) || lines.length < 2) return { ok: false, error: 'At least two lines are required' };
  let debit = 0;
  let credit = 0;
  for (const line of lines) {
    if (!line || typeof line.account !== 'string' || !line.account) return { ok: false, error: 'Account code required' };
    if (!Number.isInteger(line.debit) || !Number.isInteger(line.credit)) return { ok: false, error: 'Amounts must be integer minor units' };
    if (line.debit < 0 || line.credit < 0) return { ok: false, error: 'Amounts cannot be negative' };
    if (line.debit > 0 && line.credit > 0) return { ok: false, error: 'Line mixes debit and credit' };
    if (line.debit === 0 && line.credit === 0) return { ok: false, error: 'Zero-value line' };
    debit += line.debit;
    credit += line.credit;
  }
  if (debit !== credit) return { ok: false, error: `Unbalanced entry (debit ${debit}, credit ${credit})` };
  if (debit === 0) return { ok: false, error: 'Empty entry' };
  return { ok: true, debit, credit };
}

function sourceExists(acc, sourceType, sourceId) {
  return acc.journals.some(j => j.sourceType === sourceType && j.sourceId === sourceId && j.status !== 'reversed');
}

function nextNumber(acc, date) {
  acc.sequence = (acc.sequence || 0) + 1;
  const ym = String(date || new Date().toISOString()).slice(0, 7).replace('-', '');
  return `JV-${ym}-${String(acc.sequence).padStart(5, '0')}`;
}

/**
 * Post a balanced journal with rollback. Nothing is written unless every check
 * and every line is valid.
 */
export function postJournal(state, entry) {
  const acc = ensureAccounting(state);
  const { date, memo = '', sourceType = SOURCE.MANUAL, sourceId = '', lines } = entry || {};
  if (!sourceId) return { ok: false, error: 'Source ID required' };
  if (sourceExists(acc, sourceType, sourceId)) return { ok: false, error: 'Already posted', duplicate: true };
  if (sourceType !== SOURCE.CLOSING && isDateInClosedYear(state, date)) {
    return { ok: false, error: 'Financial year is closed for this date' };
  }
  const valid = validateLines(lines);
  if (!valid.ok) return { ok: false, error: valid.error };
  const known = new Set(acc.accounts.map(a => a.code));
  for (const line of lines) {
    if (!known.has(line.account)) return { ok: false, error: `Unknown account ${line.account}` };
  }

  const createdAt = new Date().toISOString();
  const journal = {
    id: `JRN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    no: nextNumber(acc, date),
    date: String(date || createdAt).slice(0, 10),
    memo: String(memo),
    sourceType,
    sourceId: String(sourceId),
    status: 'posted',
    debit: valid.debit,
    credit: valid.credit,
    createdAt,
    postedAt: createdAt
  };
  const lineRows = lines.map((line, idx) => ({
    id: `${journal.id}-${idx + 1}`,
    journalId: journal.id,
    account: line.account,
    debit: line.debit,
    credit: line.credit,
    memo: line.memo || '',
    lineNo: idx + 1
  }));

  acc.journals.push(journal);
  acc.lines.push(...lineRows);
  return { ok: true, journal, lines: lineRows };
}

/** Mark a journal reversed with a balanced counter-entry. */
export function reverseJournal(state, journalId, date, memo = 'Reversal') {
  const acc = ensureAccounting(state);
  const journal = acc.journals.find(j => j.id === journalId);
  if (!journal) return { ok: false, error: 'Journal not found' };
  if (journal.status === 'reversed') return { ok: false, error: 'Already reversed' };
  const original = acc.lines.filter(l => l.journalId === journalId);
  const lines = original.map(l => makeLine(l.account, l.credit, l.debit, `Reverse ${journal.no}`));
  const result = postJournal(state, {
    date: date || new Date().toISOString().slice(0, 10),
    memo: `${memo} ${journal.no}`,
    sourceType: SOURCE.REVERSAL,
    sourceId: journal.id,
    lines
  });
  if (!result.ok) return result;
  journal.status = 'reversed';
  journal.reversedBy = result.journal.id;
  result.journal.reversalOf = journal.id;
  return result;
}

export function journalLines(state, journalId) {
  return ensureAccounting(state).lines.filter(l => l.journalId === journalId);
}

/** Trial balance from posted lines, in integer minor units. */
function inRange(date, range) {
  if (!range) return true;
  const d = String(date || '');
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}

export function trialBalance(state, range = null) {
  const acc = ensureAccounting(state);
  const totals = new Map();
  for (const line of acc.lines) {
    const journal = acc.journals.find(j => j.id === line.journalId);
    if (!journal || !inRange(journal.date, range)) continue;
    const row = totals.get(line.account) || { account: line.account, debit: 0, credit: 0 };
    row.debit += line.debit;
    row.credit += line.credit;
    totals.set(line.account, row);
  }
  const rows = [...totals.values()]
    .filter(r => r.debit !== r.credit)
    .map(r => {
      const net = r.debit - r.credit;
      return { ...r, balance: net };
    })
    .sort((a, b) => a.account.localeCompare(b.account));
  const debit = rows.reduce((s, r) => s + (r.balance > 0 ? r.balance : 0), 0);
  const credit = rows.reduce((s, r) => s + (r.balance < 0 ? -r.balance : 0), 0);
  return { rows, debit, credit, difference: debit - credit, balanced: debit === credit };
}

/** Ledger rows for one account with running balance in minor units. */
export function accountLedger(state, accountCode, range = null) {
  const acc = ensureAccounting(state);
  const rows = [];
  let balance = 0;
  const journals = [...acc.journals].sort((a, b) => a.date.localeCompare(b.date) || a.no.localeCompare(b.no));
  for (const journal of journals) {
    if (!inRange(journal.date, range)) continue;
    for (const line of acc.lines.filter(l => l.journalId === journal.id && l.account === accountCode)) {
      balance += line.debit - line.credit;
      rows.push({
        date: journal.date,
        no: journal.no,
        memo: journal.memo,
        sourceType: journal.sourceType,
        debit: line.debit,
        credit: line.credit,
        balance
      });
    }
  }
  return rows;
}

/** Sale mapping: cash/bank/AR vs revenue, output VAT and COGS. */
export function saleLines(sale, items = []) {
  const total = toMinor(sale.total);
  const tax = toMinor(sale.tax || 0);
  const paid = Math.min(total, (sale.payments || []).reduce((s, p) => s + toMinor(p.amount), 0));
  const unpaid = total - paid;
  const revenue = total - tax;
  const lines = [];

  const byAccount = new Map();
  for (const payment of sale.payments || []) {
    const amount = toMinor(payment.amount);
    if (amount <= 0) continue;
    const account = paymentAccount(payment.method);
    byAccount.set(account, (byAccount.get(account) || 0) + amount);
  }
  for (const [account, amount] of byAccount) lines.push(makeLine(account, amount, 0, 'Received'));
  if (unpaid > 0) lines.push(makeLine('1100', unpaid, 0, 'Customer receivable'));
  if (revenue > 0) lines.push(makeLine('4000', 0, revenue, 'Sales revenue'));
  if (tax > 0) lines.push(makeLine('2100', 0, tax, 'Output VAT'));

  const costByItem = new Map((items || []).map(i => [i.id, toMinor(i.costPrice || 0)]));
  let cogs = 0;
  for (const line of sale.items || []) {
    const unit = costByItem.get(line.itemId) || 0;
    cogs += unit * Math.max(0, Number(line.qty) || 0);
  }
  if (cogs > 0) {
    lines.push(makeLine('5000', cogs, 0, 'Cost of goods sold'));
    lines.push(makeLine('1200', 0, cogs, 'Inventory relief'));
  }

  const balanced = validateLines(lines);
  if (!balanced.ok) return { ok: false, error: balanced.error };
  return { ok: true, lines };
}

export function postSale(state, sale, items) {
  if (!sale || !sale.id) return { ok: false, error: 'Sale required' };
  const mapped = saleLines(sale, items);
  if (!mapped.ok) return mapped;
  return postJournal(state, {
    date: sale.date,
    memo: `${sale.invoice || sale.id} — ${sale.customerName || 'Walk-in Customer'}`,
    sourceType: SOURCE.SALE,
    sourceId: sale.id,
    lines: mapped.lines
  });
}

export function expenseLines(expense) {
  const amount = toMinor(expense.amount);
  const account = expenseAccount(expense.category);
  const paid = (expense.status || 'paid') === 'paid';
  const credit = paid ? paymentAccount(expense.paymentMethod) : '2000';
  if (amount <= 0) return { ok: false, error: 'Expense amount required' };
  const lines = [makeLine(account, amount, 0, expense.reference || expense.category || 'Expense')];
  lines.push(makeLine(credit, 0, amount, paid ? 'Paid' : 'Payable'));
  validateLines(lines);
  return { ok: true, lines };
}

export function postExpense(state, expense) {
  if (!expense || !expense.id) return { ok: false, error: 'Expense required' };
  const mapped = expenseLines(expense);
  if (!mapped.ok) return mapped;
  return postJournal(state, {
    date: expense.date,
    memo: `${expense.reference || expense.category || 'Expense'} — ${expense.description || expense.notes || ''}`.trim(),
    sourceType: SOURCE.EXPENSE,
    sourceId: expense.id,
    lines: mapped.lines
  });
}

export function metalLines(txn) {
  const value = toMinor(txn.value);
  if (value <= 0) return { ok: false, error: 'No financial value' };
  const stock = txn.metal === 'Silver' ? '1220' : '1210';
  switch (txn.type) {
    case 'PURCHASE':
      return { ok: true, lines: [makeLine(stock, value, 0, 'Metal purchase'), makeLine('2000', 0, value, 'Supplier payable')] };
    case 'RECEIPT':
      return { ok: true, lines: [makeLine(stock, value, 0, 'Old gold receipt'), makeLine('1000', 0, value, 'Cash paid')] };
    case 'OPENING_BALANCE':
      return { ok: true, lines: [makeLine(stock, value, 0, 'Opening metal stock'), makeLine('3200', 0, value, 'Opening balance')] };
    case 'WASTAGE':
      return { ok: true, lines: [makeLine('6580', value, 0, 'Wastage loss'), makeLine(stock, 0, value, 'Metal written off')] };
    default:
      return { ok: false, error: 'Quantity-only movement' };
  }
}

export function postMetalTxn(state, txn) {
  if (!txn || !txn.id) return { ok: false, error: 'Transaction required' };
  const mapped = metalLines(txn);
  if (!mapped.ok) return mapped;
  return postJournal(state, {
    date: txn.date,
    memo: `${txn.type} ${txn.metal || ''} ${txn.purity || ''} ${txn.reference || ''}`.trim(),
    sourceType: SOURCE.METAL,
    sourceId: txn.id,
    lines: mapped.lines
  });
}

export function supplierPaymentLines(payment) {
  const amount = toMinor(payment.amount);
  if (amount <= 0) return { ok: false, error: 'Payment amount required' };
  return {
    ok: true,
    lines: [
      makeLine('2000', amount, 0, 'Supplier payment'),
      makeLine(paymentAccount(payment.method), 0, amount, 'Cash/bank paid')
    ]
  };
}

export function postSupplierPayment(state, payment) {
  if (!payment || !payment.id) return { ok: false, error: 'Payment required' };
  const mapped = supplierPaymentLines(payment);
  if (!mapped.ok) return mapped;
  return postJournal(state, {
    date: payment.date,
    memo: `Supplier ${payment.supplierName || payment.supplierId || ''} ${payment.reference || ''}`.trim(),
    sourceType: SOURCE.SUPPLIER_PAYMENT,
    sourceId: payment.id,
    lines: mapped.lines
  });
}

/** Idempotently post existing sale, expense and metal records. */
export function backfill(state) {
  const acc = ensureAccounting(state);
  const result = { posted: 0, skipped: 0, errors: [] };

  for (const sale of state.sales || []) {
    const r = postSale(state, sale, state.items || []);
    if (r.ok) result.posted += 1;
    else if (r.duplicate) result.skipped += 1;
    else result.errors.push(`Sale ${sale.invoice || sale.id}: ${r.error}`);
  }
  for (const expense of state.expenses || []) {
    if ((expense.status || 'paid') === 'cancelled') continue;
    const r = postExpense(state, expense);
    if (r.ok) result.posted += 1;
    else if (r.duplicate) result.skipped += 1;
    else result.errors.push(`Expense ${expense.reference || expense.id}: ${r.error}`);
  }
  for (const txn of state.metalManagement?.transactions || []) {
    if (txn.posted === false) continue;
    const r = postMetalTxn(state, txn);
    if (r.ok) result.posted += 1;
    else if (r.duplicate) result.skipped += 1;
    else if (r.error !== 'No financial value' && r.error !== 'Quantity-only movement') {
      result.errors.push(`Metal ${txn.reference || txn.id}: ${r.error}`);
    }
  }
  return result;
}

export function addAccount(state, input) {
  const acc = ensureAccounting(state);
  const code = String(input.code || '').trim();
  const name = String(input.name || '').trim();
  const type = input.type;
  const normal = input.normal || (['asset', 'expense'].includes(type) ? 'debit' : 'credit');
  if (!/^[0-9]{3,6}$/.test(code)) return { ok: false, error: 'Account code must be 3–6 digits' };
  if (!name) return { ok: false, error: 'Account name required' };
  if (!['asset', 'liability', 'equity', 'income', 'expense'].includes(type)) return { ok: false, error: 'Invalid account type' };
  if (!['debit', 'credit'].includes(normal)) return { ok: false, error: 'Invalid normal balance' };
  if (acc.accounts.some(a => a.code === code)) return { ok: false, error: 'Account code already exists' };
  const account = { code, name, type, normal, system: false, archived: false, createdAt: new Date().toISOString() };
  acc.accounts.push(account);
  return { ok: true, account };
}

export function updateAccount(state, code, patch) {
  const acc = ensureAccounting(state);
  const account = acc.accounts.find(a => a.code === code);
  if (!account) return { ok: false, error: 'Account not found' };
  if (patch.name != null && !String(patch.name).trim()) return { ok: false, error: 'Account name required' };
  if (account.system && patch.type != null && patch.type !== account.type) return { ok: false, error: 'Cannot change the type of a system account' };
  if (patch.name != null) account.name = String(patch.name).trim();
  if (!account.system && patch.type != null && ['asset', 'liability', 'equity', 'income', 'expense'].includes(patch.type)) account.type = patch.type;
  if (!account.system && patch.normal != null && ['debit', 'credit'].includes(patch.normal)) account.normal = patch.normal;
  account.updatedAt = new Date().toISOString();
  return { ok: true, account };
}

export function archiveAccount(state, code, archived = true) {
  const acc = ensureAccounting(state);
  const account = acc.accounts.find(a => a.code === code);
  if (!account) return { ok: false, error: 'Account not found' };
  if (account.system) return { ok: false, error: 'System accounts cannot be archived' };
  if (archived) {
    const used = acc.lines.some(l => l.account === code);
    if (used) return { ok: false, error: 'Account has postings; archive is not allowed' };
  }
  account.archived = !!archived;
  account.updatedAt = new Date().toISOString();
  return { ok: true, account };
}

export function accountsForEntry(state, includeArchived = false) {
  return ensureAccounting(state).accounts.filter(a => includeArchived || !a.archived);
}

/** Post a manual voucher (payment, receipt, journal, contra). */
export function postVoucher(state, voucher) {
  const { type = 'Journal', date, reference = '', memo = '', lines, id } = voucher || {};
  const allowed = ['Payment', 'Receipt', 'Journal', 'Contra'];
  if (!allowed.includes(type)) return { ok: false, error: 'Invalid voucher type' };
  const sourceId = id || `VCH-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const result = postJournal(state, {
    date,
    memo: `${type}${reference ? ' ' + reference : ''}${memo ? ' — ' + memo : ''}`,
    sourceType: SOURCE.VOUCHER,
    sourceId,
    lines
  });
  if (!result.ok) return result;
  result.journal.voucherType = type;
  result.journal.reference = reference;
  return result;
}

export function voucherRegister(state) {
  return ensureAccounting(state).journals
    .filter(j => j.sourceType === SOURCE.VOUCHER)
    .sort((a, b) => b.date.localeCompare(a.date) || b.no.localeCompare(a.no));
}

/** Post opening balances, plugging the difference into Opening Balance Equity. */
export function postOpeningBalances(state, input) {
  const acc = ensureAccounting(state);
  const date = String(input.date || '').slice(0, 10);
  const fyId = input.fiscalYearId || date.slice(0, 4);
  if (acc.journals.some(j => j.sourceType === SOURCE.OPENING && j.sourceId === fyId)) {
    return { ok: false, error: 'Opening balances already posted for this period' };
  }
  const raw = (input.lines || []).filter(l => Number(l.debit) > 0 || Number(l.credit) > 0);
  if (!raw.length) return { ok: false, error: 'Enter at least one opening balance' };
  let debit = 0;
  let credit = 0;
  const lines = [];
  for (const line of raw) {
    const d = Math.max(0, Math.round(Number(line.debit) || 0));
    const c = Math.max(0, Math.round(Number(line.credit) || 0));
    if (d > 0 && c > 0) return { ok: false, error: 'A line cannot have both debit and credit' };
    if (d === 0 && c === 0) continue;
    if (!acc.accounts.some(a => a.code === line.account)) return { ok: false, error: `Unknown account ${line.account}` };
    lines.push(makeLine(line.account, d, c, 'Opening balance'));
    debit += d;
    credit += c;
  }
  const diff = debit - credit;
  if (diff !== 0) {
    if (diff > 0) lines.push(makeLine('3200', 0, diff, 'Opening balance equity'));
    else lines.push(makeLine('3200', -diff, 0, 'Opening balance equity'));
  }
  return postJournal(state, {
    date,
    memo: `Opening balances${input.label ? ' — ' + input.label : ''}`,
    sourceType: SOURCE.OPENING,
    sourceId: fyId,
    lines
  });
}

export function addFiscalYear(state, input) {
  const acc = ensureAccounting(state);
  const label = String(input.label || '').trim();
  const start = String(input.start || '').slice(0, 10);
  const end = String(input.end || '').slice(0, 10);
  if (!label) return { ok: false, error: 'Fiscal year label required' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return { ok: false, error: 'Valid start and end dates required' };
  if (start > end) return { ok: false, error: 'Start date must be before end date' };
  const overlap = acc.fiscalYears.some(f => !(end < f.start || start > f.end));
  if (overlap) return { ok: false, error: 'Dates overlap an existing fiscal year' };
  const fy = { id: `FY-${start.slice(0, 4)}-${Date.now().toString(36).slice(-4)}`, label, start, end, status: 'open', createdAt: new Date().toISOString() };
  acc.fiscalYears.push(fy);
  acc.fiscalYears.sort((a, b) => a.start.localeCompare(b.start));
  return { ok: true, fiscalYear: fy };
}

export function isDateInClosedYear(state, date) {
  const acc = ensureAccounting(state);
  const d = String(date || '').slice(0, 10);
  return acc.fiscalYears.some(f => f.status === 'closed' && d >= f.start && d <= f.end);
}

export function fiscalYearById(state, id) {
  return ensureAccounting(state).fiscalYears.find(f => f.id === id) || null;
}

/** Close a fiscal year by transferring income/expense balances to Retained Earnings. */
export function closeFiscalYear(state, fiscalYearId, options = {}) {
  const acc = ensureAccounting(state);
  const fy = acc.fiscalYears.find(f => f.id === fiscalYearId);
  if (!fy) return { ok: false, error: 'Fiscal year not found' };
  if (fy.status === 'closed') return { ok: false, error: 'Fiscal year is already closed' };
  const tb = trialBalance(state, { from: fy.start, to: fy.end });
  const pl = tb.rows.filter(r => {
    const account = acc.accounts.find(a => a.code === r.account);
    return account && (account.type === 'income' || account.type === 'expense');
  });
  if (!pl.length) return { ok: false, error: 'No income or expense balances to close' };
  const lines = [];
  let incomeNet = 0;
  let expenseNet = 0;
  for (const row of pl) {
    const account = acc.accounts.find(a => a.code === row.account);
    if (row.balance === 0) continue;
    if (account.type === 'income') {
      const amount = -row.balance;
      incomeNet += amount;
      if (amount > 0) lines.push(makeLine(row.account, amount, 0, 'Close income'));
      else lines.push(makeLine(row.account, 0, -amount, 'Close income'));
    } else {
      const amount = row.balance;
      expenseNet += amount;
      if (amount > 0) lines.push(makeLine(row.account, 0, amount, 'Close expense'));
      else lines.push(makeLine(row.account, -amount, 0, 'Close expense'));
    }
  }
  const net = incomeNet - expenseNet;
  if (net > 0) lines.push(makeLine('3100', 0, net, 'Profit transferred'));
  else if (net < 0) lines.push(makeLine('3100', -net, 0, 'Loss transferred'));
  if (!lines.length) return { ok: false, error: 'Nothing to close' };
  const result = postJournal(state, {
    date: options.date || fy.end,
    memo: `Year close ${fy.label}`,
    sourceType: SOURCE.CLOSING,
    sourceId: fy.id,
    lines
  });
  if (!result.ok) return result;
  fy.status = 'closed';
  fy.closedAt = new Date().toISOString();
  fy.closingJournalId = result.journal.id;
  fy.netResult = net;
  return { ok: true, fiscalYear: fy, journal: result.journal, net };
}

export function reopenFiscalYear(state, fiscalYearId) {
  const acc = ensureAccounting(state);
  const fy = acc.fiscalYears.find(f => f.id === fiscalYearId);
  if (!fy) return { ok: false, error: 'Fiscal year not found' };
  if (fy.status !== 'closed') return { ok: false, error: 'Fiscal year is not closed' };
  const journal = acc.journals.find(j => j.id === fy.closingJournalId);
  if (!journal) return { ok: false, error: 'Closing journal not found' };
  fy.status = 'open';
  const reversal = reverseJournal(state, journal.id, new Date().toISOString().slice(0, 10), `Reopen ${fy.label}`);
  if (!reversal.ok) { fy.status = 'closed'; return reversal; }
  fy.status = 'open';
  fy.reopenedAt = new Date().toISOString();
  fy.reopenJournalId = reversal.journal.id;
  return { ok: true, fiscalYear: fy, journal: reversal.journal };
}

export function cashBook(state, accountCode = '1000', range = null) {
  return accountLedger(state, accountCode, range);
}

export function accountingSummary(state) {
  const acc = ensureAccounting(state);
  const tb = trialBalance(state);
  return {
    version: acc.meta.version,
    accounts: acc.accounts.length,
    journals: acc.journals.filter(j => j.status !== 'reversed').length,
    reversed: acc.journals.filter(j => j.status === 'reversed').length,
    debit: tb.debit,
    credit: tb.credit,
    difference: tb.difference,
    balanced: tb.balanced,
    postedMinor: acc.lines.reduce((s, l) => s + l.debit, 0)
  };
}
