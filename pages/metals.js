import { state, money, num, rnd, t, icon, input, select, textarea, rows, card, esc, lt, PAGE_TITLES, METAL_TXN_TYPES, METAL_UNITS, GOLD_PURITIES, SILVER_PURITIES, calcMetalBalance, canEditTransaction, getAllMetalBalances, getMetalKey } from '../src.js';

export default function metals() {
  const filterMetal = state.metalFilterMetal || 'all';
  const filterType = state.metalFilterType || 'all';
  const filterPurity = state.metalFilterPurity || 'all';
  const filterPosted = state.metalFilterPosted || 'all';
  const search = state.metalSearch || '';

  let txns = (state.metalManagement?.transactions || []).slice().reverse();
  if (search) { const q = search.toLowerCase(); txns = txns.filter(t => [t.reference, t.karigar, t.jobCode, t.notes].join(' ').toLowerCase().includes(q)); }
  if (filterMetal !== 'all') txns = txns.filter(t => t.metal === filterMetal);
  if (filterType !== 'all') txns = txns.filter(t => t.type === filterType);
  if (filterPurity !== 'all') txns = txns.filter(t => String(t.purity) === filterPurity);
  if (filterPosted === 'Posted') txns = txns.filter(t => t.posted);
  if (filterPosted === 'Unposted') txns = txns.filter(t => !t.posted);

  const typeOptions = METAL_TXN_TYPES.map(x => x.value);
  const allPurities = [...new Set([...GOLD_PURITIES, ...SILVER_PURITIES])].sort();

  const balances = getAllMetalBalances();
  const balanceRows = Object.values(balances).map(b => {
    const rate = b.metal === 'Gold' ? num(state.rates.gold) : num(state.rates.silver);
    return '<tr><td>' + esc(b.metal) + '</td><td class="mono">' + esc(b.purity) + '</td><td class="mono align-right">' + b.opening.toFixed(3) + '</td><td class="mono align-right"><strong>' + b.balance.toFixed(3) + '</strong></td><td class="mono align-right">' + money(rate) + '</td><td class="mono align-right">' + money(rnd(b.balance * rate)) + '</td></tr>';
  }).join('');

  const totalGold = Object.values(balances).filter(b => b.metal === 'Gold').reduce((s, b) => s + b.balance, 0);
  const totalSilver = Object.values(balances).filter(b => b.metal === 'Silver').reduce((s, b) => s + b.balance, 0);
  const goldValue = Object.values(balances).filter(b => b.metal === 'Gold').reduce((s, b) => s + rnd(b.balance * num(state.rates.gold)), 0);
  const silverValue = Object.values(balances).filter(b => b.metal === 'Silver').reduce((s, b) => s + rnd(b.balance * num(state.rates.silver)), 0);

  const filtered = txns.slice(0, 500);
  const typeInfoMap = Object.fromEntries(METAL_TXN_TYPES.map(x => [x.value, x]));
  const postedCount = txns.filter(x => x.posted).length;

  const historyRows = filtered.map(t => {
    const typeInfo = typeInfoMap[t.type] || {};
    const editable = canEditTransaction(t);
    const postedBadge = t.posted ? '<span class="badge badge-completed">' + lt('Posted') + '</span>' : '<span class="badge badge-warn">' + lt('Draft') + '</span>';
    const typeBadge = '<span class="badge" style="background:' + (typeInfo.color || 'var(--bg-elevated)') + '22">' + esc(lt(typeInfo.label || t.type)) + '</span>';
    const actions = editable ? '<button class="btn btn-ghost btn-sm" data-metal-edit="' + esc(t.id) + '">' + lt('Edit') + '</button> <button class="btn btn-ghost btn-sm" data-metal-delete="' + esc(t.id) + '">' + lt('Delete') + '</button>' : '';
    return '<tr><td class="mono">' + esc(t.date || '') + '</td><td>' + typeBadge + '</td><td>' + esc(t.metal) + '</td><td class="mono">' + esc(t.purity) + '</td><td class="mono align-right">' + num(t.weight).toFixed(3) + ' ' + esc(t.unit || 'g') + '</td><td class="mono align-right">' + (t.rate ? money(t.rate) : '-') + '</td><td class="mono align-right">' + (t.value ? money(t.value) : '-') + '</td><td><code class="mono">' + esc(t.reference || '-') + '</code></td><td>' + esc(t.karigar || t.jobCode || '-') + '</td><td>' + postedBadge + '</td><td>' + actions + '</td></tr>';
  }).join('');

  const exchangeRows = state.exchanges.map(x => 
    '<tr><td>' + esc(x.customer) + '</td><td class="mono">' + num(x.weight).toFixed(3) + ' g</td><td class="mono">' + x.purity + 'K</td><td class="align-right mono">' + money(x.value) + '</td></tr>'
  ).join('');

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.metals[0]}</h1><p class="page-subtitle">${PAGE_TITLES.metals[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-metal-export>${t('Export CSV')}</button><button class="btn btn-secondary" data-metal-post-period>${t('Post Period')}</button><button class="btn btn-champagne" data-metal-add>${t('New Transaction')}</button></div></div></div>
<div class="metric-grid">${card(t('Total Gold'), totalGold.toFixed(3) + ' g', t('Value') + ' ' + money(goldValue))}${card(t('Total Silver'), totalSilver.toFixed(3) + ' g', t('Value') + ' ' + money(silverValue))}${card(t('Transactions'), txns.length, t('Posted') + ' ' + postedCount)}${card(t('Combined Value'), money(goldValue + silverValue), t('At current rates'))}</div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Current Balances by Purity')}</h2></div><div class="card-body" style="padding:0">${rows([t('Metal'), t('Purity'), t('Opening'), t('Current'), t('Rate/g'), t('Value')], balanceRows)}</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Transaction History')}</h2></div><div class="card-body"><div class="toolbar" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><input type="search" id="metalSearch" class="field-input" placeholder="${t('Search...')}" value="${esc(search)}" style="max-width:240px">${select('metalFilterMetal', '', [{ value: 'all', label: t('All') }, { value: 'Gold', label: t('Gold') }, { value: 'Silver', label: t('Silver') }], filterMetal)}${select('metalFilterType', '', ['all', ...typeOptions], filterType)}${select('metalFilterPurity', '', ['all', ...allPurities], filterPurity)}${select('metalFilterPosted', '', ['all', t('Posted'), t('Unposted')], filterPosted)}</div><div style="max-height:480px;overflow:auto">${rows([t('Date'), t('Type'), t('Metal'), t('Purity'), t('Weight'), t('Rate'), t('Value'), t('Reference'), t('Karigar/Job'), t('Status'), t('Actions')], historyRows)}</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('New Metal Transaction')}</h2></div><div class="card-body"><form id="metalTxnForm" class="form">${input('metalDate', t('Date'), 'date', new Date().toISOString().slice(0, 10))}${select('metalType', t('Metal Type'), ['Gold', 'Silver'], 'Gold')}${select('metalTxnType', t('Type'), METAL_TXN_TYPES.map(x => ({ value: x.value, label: t(x.label) })), 'PURCHASE')}${select('metalPurity', t('Purity'), [...GOLD_PURITIES, ...SILVER_PURITIES].sort(), '22K')}${input('metalWeight', t('Weight'), 'number', '', 'min="0.001" step="0.001" required')}${select('metalUnit', t('Unit'), METAL_UNITS, 'gram')}${input('metalRate', t('Rate per Unit'), 'number', '', 'min="0" step="0.01"')}${input('metalValue', t('Total Value'), 'number', '', 'min="0" step="0.01"')}${input('metalReference', t('Reference / Voucher'))}${input('metalKarigar', t('Karigar / Job'))}${textarea('metalNotes', t('Notes'))}<div class="calc-preview" id="metalTxnPreview"></div><div class="field-full"><button class="btn btn-champagne" type="submit" style="width:100%">${t('Record Transaction')}</button></div></form></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Record Old-Gold Receipt')}</h2></div><div class="card-body"><form id="exchange" class="form">${input('customer', t('Customer Name'))}${input('weight', t('Net Metal Weight (g)'), 'number', '', 'min="0.001" step="0.001"')}${select('purity', t('Assessed Purity'), ['24', '22', '21', '20', '18', '14', '12', '9'])}${input('rate', t('Agreed Rate per Fine Gram (NPR)'), 'number', state.rates.gold, 'min="0" step="0.01"')}${input('deduction', t('Agreed Deduction (NPR)'), 'number', '0', 'min="0" step="0.01"')}${textarea('notes', t('Assessment / Test Notes'))}<div class="calc-preview" id="exchangePreview"></div><div class="field-full"><button class="btn btn-champagne" type="submit" style="width:100%">${t('Record Receipt')}</button></div></form><p class="note note-caution" style="margin-top:12px">${t('Receipt register for pilot. Link to metal ledger manually if needed via Metal Management.')}</p></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Old-Gold Receipts')}</h2></div><div class="card-body" style="padding:0">${rows([t('Customer'), t('Weight'), t('Purity'), t('Value')], exchangeRows)}</div></div>`;
}