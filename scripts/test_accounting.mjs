import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureAccounting, toMinor, formatMinor, makeLine, validateLines, postJournal,
  postSale, postExpense, postMetalTxn, postSupplierPayment, trialBalance, accountLedger,
  backfill, reverseJournal, ACCOUNTS
} from '../accounting.js';

const baseState = (overrides = {}) => ({
  items: [
    { id: 'i1', name: 'Ring', costPrice: 4000 },
    { id: 'i2', name: 'Chain', costPrice: 0 }
  ],
  sales: [],
  expenses: [],
  metalManagement: { transactions: [] },
  ...overrides
});

const sale = (overrides = {}) => ({
  id: 's1',
  invoice: 'INV-1',
  date: '2026-11-18',
  customerName: 'Walk-in Customer',
  subtotal: 10000,
  discount: 500,
  tax: 1235,
  total: 10735,
  payments: [{ method: 'Cash', amount: 10735 }],
  items: [{ itemId: 'i1', qty: 1, total: 10735 }],
  ...overrides
});

test('minor units are exact', () => {
  assert.equal(toMinor(0.1) + toMinor(0.2), 30);
  assert.equal(formatMinor(30), '0.30');
  assert.equal(toMinor(10735.555), 1073556);
  assert.equal(toMinor(-1.005), -100);
});

test('unbalanced journal is rejected without writing', () => {
  const state = baseState();
  ensureAccounting(state);
  const before = state.accounting.journals.length;
  const result = postJournal(state, {
    sourceType: 'manual', sourceId: 'bad-1', date: '2026-11-18',
    lines: [makeLine('1000', 100), makeLine('4000', 0, 99)]
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /Unbalanced/);
  assert.equal(state.accounting.journals.length, before);
  assert.equal(state.accounting.lines.length, 0);
});

test('manual journal posts balanced with sequence', () => {
  const state = baseState();
  const r = postJournal(state, {
    sourceType: 'manual', sourceId: 'm1', date: '2026-11-18', memo: 'Capital',
    lines: [makeLine('1000', 500000), makeLine('3000', 0, 500000)]
  });
  assert.equal(r.ok, true);
  assert.equal(r.journal.debit, 500000);
  assert.match(r.journal.no, /^JV-202611-\d{5}$/);
  const tb = trialBalance(state);
  assert.equal(tb.balanced, true);
  assert.equal(tb.debit, 500000);
  assert.equal(tb.credit, 500000);
});

test('duplicate source is not double posted', () => {
  const state = baseState({ sales: [sale()] });
  const first = postSale(state, state.sales[0], state.items);
  const second = postSale(state, state.sales[0], state.items);
  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.duplicate, true);
  assert.equal(state.accounting.journals.length, 1);
});

test('sale posts revenue, VAT, COGS and receivable correctly', () => {
  const state = baseState();
  const s = sale({ id: 's2', payments: [{ method: 'Cash', amount: 5000 }] });
  const r = postSale(state, s, state.items);
  assert.equal(r.ok, true);
  const lines = state.accounting.lines.filter(l => l.journalId === r.journal.id);
  const total = lines.reduce((sum, l) => sum + l.debit, 0);
  assert.equal(total, lines.reduce((sum, l) => sum + l.credit, 0));
  assert.equal(total, toMinor(10735) + toMinor(4000));
  const ar = lines.filter(l => l.account === '1100').reduce((s, l) => s + l.debit, 0);
  assert.equal(ar, toMinor(5735));
  const vat = lines.filter(l => l.account === '2100').reduce((s, l) => s + l.credit, 0);
  assert.equal(vat, toMinor(1235));
  const revenue = lines.filter(l => l.account === '4000').reduce((s, l) => s + l.credit, 0);
  assert.equal(revenue, toMinor(9500));
});

test('expense and supplier payment keep the ledger balanced', () => {
  const state = baseState();
  assert.equal(postExpense(state, { id: 'e1', date: '2026-11-01', category: 'Rent', amount: 20000, paymentMethod: 'Bank Transfer', status: 'paid', reference: 'RENT-1' }).ok, true);
  assert.equal(postSupplierPayment(state, { id: 'p1', date: '2026-11-02', amount: 15000, method: 'Cash', supplierName: 'S1' }).ok, true);
  assert.equal(postMetalTxn(state, { id: 't1', date: '2026-11-03', type: 'PURCHASE', metal: 'Gold', purity: '22K', value: 100000, reference: 'PUR-1' }).ok, true);
  const tb = trialBalance(state);
  assert.equal(tb.balanced, true);
  assert.equal(tb.difference, 0);
  assert.ok(tb.rows.find(r => r.account === '2000'));
});

test('old gold receipt and opening balance map to stock', () => {
  const state = baseState();
  assert.equal(postMetalTxn(state, { id: 't2', type: 'RECEIPT', metal: 'Gold', value: 5000, date: '2026-11-04' }).ok, true);
  assert.equal(postMetalTxn(state, { id: 't3', type: 'OPENING_BALANCE', metal: 'Silver', value: 3000, date: '2026-11-04' }).ok, true);
  assert.equal(postMetalTxn(state, { id: 't4', type: 'ISSUE', metal: 'Gold', value: 0, date: '2026-11-04' }).ok, false);
  const tb = trialBalance(state);
  assert.equal(tb.balanced, true);
  assert.equal(tb.rows.find(r => r.account === '1210').balance, toMinor(5000));
  assert.equal(tb.rows.find(r => r.account === '1220').balance, toMinor(3000));
});

test('reversal offsets the original journal', () => {
  const state = baseState();
  const r = postJournal(state, {
    sourceType: 'manual', sourceId: 'm2', date: '2026-11-05',
    lines: [makeLine('6000', 125050), makeLine('1000', 0, 125050)]
  });
  const rev = reverseJournal(state, r.journal.id, '2026-11-05');
  assert.equal(rev.ok, true);
  const tb = trialBalance(state);
  assert.equal(tb.balanced, true);
  assert.equal(tb.rows.length, 0);
  assert.equal(accountLedger(state, '6000').length, 2);
});

test('backfill posts existing records once', () => {
  const state = baseState({
    sales: [sale()],
    expenses: [{ id: 'e2', date: '2026-11-06', category: 'Utilities', amount: 800, paymentMethod: 'Cash', status: 'paid' }],
    metalManagement: { transactions: [
      { id: 't5', date: '2026-11-07', type: 'PURCHASE', metal: 'Gold', value: 50000, posted: true },
      { id: 't6', date: '2026-11-07', type: 'ISSUE', metal: 'Gold', value: 0, posted: true },
      { id: 't7', date: '2026-11-07', type: 'WASTAGE', metal: 'Gold', value: 0, posted: true }
    ] }
  });
  const first = backfill(state);
  assert.equal(first.posted, 3);
  assert.equal(first.errors.length, 0);
  const second = backfill(state);
  assert.equal(second.posted, 0);
  assert.equal(second.skipped, 3);
  assert.equal(trialBalance(state).balanced, true);
});

test('all seeded account codes are unique and typed', () => {
  const codes = new Set();
  for (const a of ACCOUNTS) {
    assert.equal(codes.has(a.code), false, `duplicate ${a.code}`);
    codes.add(a.code);
    assert.ok(['asset', 'liability', 'equity', 'income', 'expense'].includes(a.type));
    assert.ok(['debit', 'credit'].includes(a.normal));
  }
});

import {
  addAccount, updateAccount, archiveAccount, postVoucher, voucherRegister,
  postOpeningBalances, addFiscalYear, closeFiscalYear, reopenFiscalYear,
  cashBook, trialBalance as tb2
} from '../accounting.js';

test('custom accounts validate and protect postings', () => {
  const state = baseState();
  assert.equal(addAccount(state, { code: '1999', name: 'Advances', type: 'asset' }).ok, true);
  assert.equal(addAccount(state, { code: '1999', name: 'Dup', type: 'asset' }).ok, false);
  assert.equal(addAccount(state, { code: '12', name: 'Bad', type: 'asset' }).ok, false);
  assert.equal(updateAccount(state, '1999', { name: 'Customer Advances' }).ok, true);
  assert.equal(archiveAccount(state, '1999').ok, true);
  assert.equal(addAccount(state, { code: '1998', name: 'Deposits', type: 'asset' }).ok, true);
  postJournal(state, { sourceType: 'manual', sourceId: 'used', date: '2026-11-01', lines: [makeLine('1998', 100), makeLine('1000', 0, 100)] });
  assert.equal(archiveAccount(state, '1998').ok, false);
  assert.equal(archiveAccount(state, '1000').ok, false);
});

test('manual vouchers post and appear in the register', () => {
  const state = baseState();
  const r = postVoucher(state, {
    type: 'Receipt', date: '2026-11-10', reference: 'RC-1', memo: 'Customer receipt',
    lines: [makeLine('1000', 2500), makeLine('1100', 0, 2500)]
  });
  assert.equal(r.ok, true);
  assert.equal(r.journal.voucherType, 'Receipt');
  assert.equal(voucherRegister(state).length, 1);
  const bad = postVoucher(state, { type: 'Nope', date: '2026-11-10', lines: [makeLine('1000', 1), makeLine('4000', 0, 1)] });
  assert.equal(bad.ok, false);
});

test('opening balances are posted once with equity plug', () => {
  const state = baseState();
  const r = postOpeningBalances(state, {
    date: '2026-07-16', fiscalYearId: 'FY-T1',
    lines: [
      { account: '1000', debit: 500000, credit: 0 },
      { account: '1200', debit: 700000, credit: 0 },
      { account: '2000', debit: 0, credit: 300000 }
    ]
  });
  assert.equal(r.ok, true);
  assert.equal(r.journal.debit, 1200000);
  const equity = state.accounting.lines.filter(l => l.account === '3200').reduce((s, l) => s + l.credit, 0);
  assert.equal(equity, 900000);
  assert.equal(postOpeningBalances(state, { date: '2026-07-16', fiscalYearId: 'FY-T1', lines: [{ account: '1000', debit: 1 }] }).ok, false);
});

test('cash book returns running balances', () => {
  const state = baseState();
  postJournal(state, { sourceType: 'manual', sourceId: 'c1', date: '2026-11-01', lines: [makeLine('1000', 1000), makeLine('4000', 0, 1000)] });
  postJournal(state, { sourceType: 'manual', sourceId: 'c2', date: '2026-11-02', lines: [makeLine('6200', 300), makeLine('1000', 0, 300)] });
  const rows = cashBook(state, '1000');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].balance, 1000);
  assert.equal(rows[1].balance, 700);
  assert.equal(cashBook(state, '1000', { from: '2026-11-02', to: '2026-11-02' }).length, 1);
});

test('fiscal year close transfers profit and locks the period', () => {
  const state = baseState();
  assert.equal(addFiscalYear(state, { label: 'FY 2083/84', start: '2026-07-16', end: '2027-07-15' }).ok, true);
  const fy = state.accounting.fiscalYears[0];
  postJournal(state, { sourceType: 'manual', sourceId: 'rev1', date: '2026-08-01', lines: [makeLine('1000', 100000), makeLine('4000', 0, 100000)] });
  postJournal(state, { sourceType: 'manual', sourceId: 'exp1', date: '2026-08-02', lines: [makeLine('6200', 25000), makeLine('1000', 0, 25000)] });
  const closed = closeFiscalYear(state, fy.id);
  assert.equal(closed.ok, true);
  assert.equal(closed.net, 75000);
  assert.equal(fy.status, 'closed');
  const re = state.accounting.lines.filter(l => l.account === '3100').reduce((s, l) => s + l.credit - l.debit, 0);
  assert.equal(re, 75000);
  const blocked = postJournal(state, { sourceType: 'manual', sourceId: 'late', date: '2026-09-01', lines: [makeLine('1000', 10), makeLine('4000', 0, 10)] });
  assert.equal(blocked.ok, false);
  assert.match(blocked.error, /closed/i);
  assert.equal(closeFiscalYear(state, fy.id).ok, false);
  const reopened = reopenFiscalYear(state, fy.id);
  assert.equal(reopened.ok, true);
  assert.equal(fy.status, 'open');
  assert.equal(tb2(state).balanced, true);
  assert.equal(postJournal(state, { sourceType: 'manual', sourceId: 'after-reopen', date: '2026-09-02', lines: [makeLine('1000', 5), makeLine('4000', 0, 5)] }).ok, true);
});
