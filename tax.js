/*
 * RatnaOS Nepal Tax Engine — Phase 3
 * ----------------------------------
 * Configuration-driven VAT and TDS registers with effective-dated rules.
 * No official rate, deadline or form is asserted by this module. Seeded VAT is
 * marked unverified until an administrator records a source.
 */
import { ensureAccounting, postJournal, makeLine, toMinor, trialBalance, SOURCE } from './accounting.js';

export const TAX_VERSION = 1;

export const TAX_STATUS = {
  UNVERIFIED: 'unverified',
  VERIFIED: 'verified',
  ENDED: 'ended'
};

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ensureTax(state) {
  if (!state.tax || typeof state.tax !== 'object') {
    state.tax = { meta: {}, rules: [], vatPeriods: [], vatPurchases: [], tdsEntries: [], payments: [] };
  }
  const tax = state.tax;
  tax.meta = tax.meta || {};
  tax.meta.version = TAX_VERSION;
  for (const key of ['rules', 'vatPeriods', 'vatPurchases', 'tdsEntries', 'payments', 'calendar']) {
    if (!Array.isArray(tax[key])) tax[key] = [];
  }
  if (!tax.meta.seededVat) {
    const rate = Number(state.settings?.taxRate ?? 13);
    tax.rules.push({
      id: 'VAT-SEED',
      taxType: 'VAT',
      category: 'standard',
      rate,
      effectiveFrom: '2000-01-01',
      effectiveTo: '',
      verified: false,
      sourceUrl: '',
      notes: 'Seeded from shop settings. Verify the current VAT rate and effective date against IRD before filing.',
      createdAt: new Date().toISOString()
    });
    tax.meta.seededVat = true;
  }
  return tax;
}

function overlaps(aFrom, aTo, bFrom, bTo) {
  const aEnd = aTo || '9999-12-31';
  const bEnd = bTo || '9999-12-31';
  return !(aEnd < bFrom || bEnd < aFrom);
}

export function addTaxRule(state, input) {
  const tax = ensureTax(state);
  const taxType = input.taxType === 'TDS' ? 'TDS' : input.taxType === 'VAT' ? 'VAT' : null;
  if (!taxType) return { ok: false, error: 'Tax type must be VAT or TDS' };
  const category = String(input.category || (taxType === 'VAT' ? 'standard' : '')).trim();
  if (!category) return { ok: false, error: 'Category is required' };
  const rate = Number(input.rate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return { ok: false, error: 'Rate must be between 0 and 100' };
  const effectiveFrom = String(input.effectiveFrom || '').slice(0, 10);
  const effectiveTo = String(input.effectiveTo || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) return { ok: false, error: 'Effective from date is required' };
  if (effectiveTo && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveTo)) return { ok: false, error: 'Invalid effective to date' };
  if (effectiveTo && effectiveTo < effectiveFrom) return { ok: false, error: 'Effective to must follow effective from' };
  const verified = !!input.verified;
  const sourceUrl = String(input.sourceUrl || '').trim();
  if (verified && !sourceUrl) return { ok: false, error: 'A verified rule needs an official source URL' };
  if (tax.rules.some(r => r.taxType === taxType && r.category.toLowerCase() === category.toLowerCase() && !r.endedBy && overlaps(effectiveFrom, effectiveTo, r.effectiveFrom, r.effectiveTo))) {
    return { ok: false, error: 'This rule overlaps an existing rule for the same category; end the existing rule first' };
  }
  const rule = {
    id: uid(taxType === 'VAT' ? 'VAT' : 'TDS'),
    taxType,
    category,
    rate,
    effectiveFrom,
    effectiveTo,
    verified,
    sourceUrl,
    verifiedAt: verified ? new Date().toISOString() : '',
    notes: String(input.notes || ''),
    createdAt: new Date().toISOString()
  };
  tax.rules.push(rule);
  tax.rules.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  return { ok: true, rule };
}

export function endTaxRule(state, ruleId, endDate) {
  const tax = ensureTax(state);
  const rule = tax.rules.find(r => r.id === ruleId);
  if (!rule) return { ok: false, error: 'Rule not found' };
  const date = String(endDate || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Invalid end date' };
  if (date < rule.effectiveFrom) return { ok: false, error: 'End date must follow the start date' };
  rule.effectiveTo = date;
  rule.endedBy = 'manual';
  rule.endedAt = new Date().toISOString();
  return { ok: true, rule };
}

export function verifyTaxRule(state, ruleId, sourceUrl) {
  const tax = ensureTax(state);
  const rule = tax.rules.find(r => r.id === ruleId);
  if (!rule) return { ok: false, error: 'Rule not found' };
  const url = String(sourceUrl || '').trim();
  if (!url) return { ok: false, error: 'Official source URL is required' };
  rule.verified = true;
  rule.sourceUrl = url;
  rule.verifiedAt = new Date().toISOString();
  return { ok: true, rule };
}

export function ruleFor(state, taxType, category, date) {
  const tax = ensureTax(state);
  const d = String(date || '').slice(0, 10);
  const matches = tax.rules
    .filter(r => r.taxType === taxType && (!category || r.category.toLowerCase() === String(category).toLowerCase()))
    .filter(r => r.effectiveFrom <= d && (!r.effectiveTo || d <= r.effectiveTo))
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return matches[0] || null;
}

export function vatRateFor(state, date) {
  const rule = ruleFor(state, 'VAT', 'standard', date);
  return rule ? Number(rule.rate) : null;
}

export function tdsCategories(state) {
  const tax = ensureTax(state);
  return [...new Set(tax.rules.filter(r => r.taxType === 'TDS').map(r => r.category))].sort();
}

/** Add a purchase VAT record and post the balanced journal. */
export function postVatPurchase(state, input) {
  ensureTax(state);
  const date = String(input.date || '').slice(0, 10);
  const supplier = String(input.supplier || '').trim();
  const pan = String(input.pan || '').trim();
  const invoice = String(input.invoice || '').trim();
  const taxable = toMinor(input.taxable);
  const vat = toMinor(input.vat);
  if (!supplier) return { ok: false, error: 'Supplier name required' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Valid date required' };
  if (taxable <= 0) return { ok: false, error: 'Taxable amount required' };
  if (vat < 0) return { ok: false, error: 'VAT cannot be negative' };
  const account = String(input.account || '1200');
  const rule = ruleFor(state, 'VAT', 'standard', date);
  const record = {
    id: uid('VP'),
    date, supplier, pan, invoice,
    taxable, vat,
    total: taxable + vat,
    account,
    ruleId: rule?.id || '',
    rate: rule?.rate ?? null,
    createdAt: new Date().toISOString()
  };
  const lines = [makeLine(account, taxable, 0, `Purchase ${invoice || supplier}`)];
  if (vat > 0) lines.push(makeLine('1300', vat, 0, 'Input VAT'));
  lines.push(makeLine('2000', 0, taxable + vat, 'Supplier payable'));
  const result = postJournal(state, {
    date,
    memo: `VAT purchase ${invoice || supplier}`,
    sourceType: SOURCE.VAT_PURCHASE,
    sourceId: record.id,
    lines
  });
  if (!result.ok) return result;
  record.journalId = result.journal.id;
  state.tax.vatPurchases.push(record);
  return { ok: true, record, journal: result.journal };
}

export function vatRegisters(state, from, to) {
  ensureTax(state);
  const inRange = d => (!from || d >= from) && (!to || d <= to);
  const sales = (state.sales || [])
    .filter(s => inRange(String(s.date || '').slice(0, 10)))
    .map(s => {
      const total = toMinor(s.total);
      const vat = toMinor(s.tax || 0);
      const customer = (state.customers || []).find(c => c.id === s.customerId);
      return {
        date: String(s.date || '').slice(0, 10),
        invoice: s.invoice || s.id,
        customer: s.customerName || s.customer || 'Walk-in Customer',
        pan: customer?.pan || customer?.vatNumber || '',
        taxable: total - vat,
        vat,
        total
      };
    });
  const purchases = state.tax.vatPurchases.filter(p => inRange(p.date));
  const sum = rows => rows.reduce((acc, r) => ({ taxable: acc.taxable + r.taxable, vat: acc.vat + r.vat, total: acc.total + r.total }), { taxable: 0, vat: 0, total: 0 });
  return { sales, purchases, salesTotals: sum(sales), purchaseTotals: sum(purchases) };
}

export function vatLiability(state, from, to) {
  const acc = ensureAccounting(state);
  const range = { from, to };
  const output = acc.lines
    .filter(l => l.account === '2100')
    .filter(l => {
      const j = acc.journals.find(x => x.id === l.journalId);
      return j && (!from || j.date >= from) && (!to || j.date <= to);
    })
    .reduce((s, l) => s + l.credit - l.debit, 0);
  const input = acc.lines
    .filter(l => l.account === '1300')
    .filter(l => {
      const j = acc.journals.find(x => x.id === l.journalId);
      return j && (!from || j.date >= from) && (!to || j.date <= to);
    })
    .reduce((s, l) => s + l.debit - l.credit, 0);
  return { output, input, net: output - input };
}

export function addVatPeriod(state, input) {
  const tax = ensureTax(state);
  const from = String(input.from || '').slice(0, 10);
  const to = String(input.to || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return { ok: false, error: 'Valid period dates required' };
  if (from > to) return { ok: false, error: 'Period start must precede end' };
  if (tax.vatPeriods.some(p => !(to < p.from || from > p.to))) return { ok: false, error: 'Period overlaps an existing VAT period' };
  const period = { id: uid('VATP'), label: String(input.label || '').trim() || `${from} → ${to}`, from, to, status: 'draft', createdAt: new Date().toISOString() };
  tax.vatPeriods.push(period);
  tax.vatPeriods.sort((a, b) => a.from.localeCompare(b.from));
  return { ok: true, period };
}

export function vatPeriodSummary(state, periodId) {
  const tax = ensureTax(state);
  const period = tax.vatPeriods.find(p => p.id === periodId);
  if (!period) return null;
  const registers = vatRegisters(state, period.from, period.to);
  const liability = vatLiability(state, period.from, period.to);
  return { period, registers, liability, payable: Math.max(0, liability.net), credit: Math.max(0, -liability.net) };
}

/** Recognise the net VAT liability: clear output/input VAT into VAT Payable. */
export function prepareVatReturn(state, periodId) {
  const summary = vatPeriodSummary(state, periodId);
  if (!summary) return { ok: false, error: 'VAT period not found' };
  const { period, liability } = summary;
  if (period.status !== 'draft') return { ok: false, error: 'Period already prepared' };
  const output = liability.output;
  const input = liability.input;
  if (output <= 0 && input <= 0) return { ok: false, error: 'No VAT postings in this period' };
  const lines = [];
  if (output > 0) lines.push(makeLine('2100', output, 0, 'Clear output VAT'));
  if (input > 0) lines.push(makeLine('1300', 0, input, 'Clear input VAT'));
  const net = output - input;
  if (net > 0) lines.push(makeLine('2110', 0, net, 'VAT payable'));
  else if (net < 0) lines.push(makeLine('2110', net, 0, 'VAT credit carried forward'));
  const result = postJournal(state, {
    date: period.to,
    memo: `VAT return ${period.label}`,
    sourceType: SOURCE.VAT_SETTLE,
    sourceId: period.id,
    lines
  });
  if (!result.ok) return result;
  period.status = 'prepared';
  period.preparedAt = new Date().toISOString();
  period.settlementJournalId = result.journal.id;
  period.netDue = net;
  return { ok: true, period, journal: result.journal, net };
}

export function payVatPeriod(state, periodId, input) {
  const tax = ensureTax(state);
  const period = tax.vatPeriods.find(p => p.id === periodId);
  if (!period) return { ok: false, error: 'VAT period not found' };
  if (period.status === 'draft') return { ok: false, error: 'Prepare the return before recording payment' };
  const amount = toMinor(input.amount);
  const date = String(input.date || '').slice(0, 10);
  const reference = String(input.reference || '').trim();
  if (amount <= 0) return { ok: false, error: 'Payment amount required' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Valid payment date required' };
  if (!reference) return { ok: false, error: 'Payment reference required' };
  const payment = { id: uid('TAXPAY'), taxType: 'VAT', periodId, amount, date, reference, method: input.method || 'Bank Transfer', createdAt: new Date().toISOString() };
  const result = postJournal(state, {
    date,
    memo: `VAT payment ${reference}`,
    sourceType: SOURCE.VAT_PAYMENT,
    sourceId: payment.id,
    lines: [makeLine('2110', amount, 0, 'VAT paid'), makeLine('1010', 0, amount, 'Bank payment')]
  });
  if (!result.ok) return result;
  payment.journalId = result.journal.id;
  tax.payments.push(payment);
  period.paidAmount = (period.paidAmount || 0) + amount;
  period.status = period.paidAmount >= period.netDue ? 'paid' : 'prepared';
  period.paidAt = new Date().toISOString();
  return { ok: true, payment, period };
}

/** TDS entry: net payment with TDS withheld and posted to TDS Payable. */
export function postTdsEntry(state, input) {
  ensureTax(state);
  const date = String(input.date || '').slice(0, 10);
  const category = String(input.category || '').trim();
  const recipient = String(input.recipient || '').trim();
  const pan = String(input.pan || '').trim();
  const taxable = toMinor(input.taxable);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Valid date required' };
  if (!category) return { ok: false, error: 'TDS category required' };
  if (!recipient) return { ok: false, error: 'Recipient required' };
  if (taxable <= 0) return { ok: false, error: 'Taxable amount required' };
  const rule = ruleFor(state, 'TDS', category, date);
  if (!rule) return { ok: false, error: 'No TDS rule for this category and date' };
  const rate = Number(input.rate ?? rule.rate);
  const tds = input.tds != null && input.tds !== '' ? toMinor(input.tds) : Math.round(taxable * rate / 100);
  if (tds <= 0) return { ok: false, error: 'TDS amount must be positive' };
  if (tds > taxable) return { ok: false, error: 'TDS cannot exceed the taxable amount' };
  const expense = String(input.expenseAccount || '6900');
  const method = input.method || 'Cash';
  const cashAccount = ['Bank Transfer', 'Cheque', 'Bank'].includes(method) ? '1010' : '1000';
  const entry = {
    id: uid('TDS'),
    date, category, recipient, pan,
    taxable, rate, tds,
    net: taxable - tds,
    expenseAccount: expense,
    method,
    ruleId: rule.id,
    status: 'deducted',
    createdAt: new Date().toISOString()
  };
  const result = postJournal(state, {
    date,
    memo: `TDS ${category} — ${recipient}`,
    sourceType: SOURCE.TDS,
    sourceId: entry.id,
    lines: [
      makeLine(expense, taxable, 0, 'Expense'),
      makeLine('2200', 0, tds, 'TDS withheld'),
      makeLine(cashAccount, 0, taxable - tds, 'Net paid')
    ]
  });
  if (!result.ok) return result;
  entry.journalId = result.journal.id;
  state.tax.tdsEntries.push(entry);
  return { ok: true, entry, journal: result.journal };
}

export function depositTds(state, entryId, input) {
  const tax = ensureTax(state);
  const entry = tax.tdsEntries.find(e => e.id === entryId);
  if (!entry) return { ok: false, error: 'TDS entry not found' };
  if (entry.status === 'deposited') return { ok: false, error: 'TDS already deposited' };
  const date = String(input.date || '').slice(0, 10);
  const reference = String(input.reference || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Valid deposit date required' };
  if (!reference) return { ok: false, error: 'Deposit reference required' };
  const payment = { id: uid('TAXPAY'), taxType: 'TDS', entryId, amount: entry.tds, date, reference, method: 'Bank Transfer', createdAt: new Date().toISOString() };
  const result = postJournal(state, {
    date,
    memo: `TDS deposit ${reference}`,
    sourceType: SOURCE.TDS_DEPOSIT,
    sourceId: payment.id,
    lines: [makeLine('2200', entry.tds, 0, 'TDS deposited'), makeLine('1010', 0, entry.tds, 'Bank payment')]
  });
  if (!result.ok) return result;
  payment.journalId = result.journal.id;
  tax.payments.push(payment);
  entry.status = 'deposited';
  entry.depositedAt = date;
  entry.depositReference = reference;
  return { ok: true, entry, payment };
}

export function tdsOutstanding(state) {
  const tax = ensureTax(state);
  return tax.tdsEntries.filter(e => e.status !== 'deposited').reduce((s, e) => s + e.tds, 0);
}

export function taxSummary(state) {
  const tax = ensureTax(state);
  return {
    version: tax.meta.version,
    rules: tax.rules.length,
    unverified: tax.rules.filter(r => !r.verified).length,
    periods: tax.vatPeriods.length,
    purchases: tax.vatPurchases.length,
    tdsEntries: tax.tdsEntries.length,
    tdsOutstanding: tdsOutstanding(state),
    payments: tax.payments.length
  };
}

export function taxRegisterRows(state) {
  const tax = ensureTax(state);
  return [...tax.vatPurchases.map(p => ({ kind: 'VAT purchase', date: p.date, reference: p.invoice, party: p.supplier, taxable: p.taxable, tax: p.vat, status: 'posted' })),
    ...tax.tdsEntries.map(e => ({ kind: 'TDS', date: e.date, reference: e.category, party: e.recipient, taxable: e.taxable, tax: e.tds, status: e.status }))];
}
