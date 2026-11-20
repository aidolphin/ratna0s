import { state, money, num, t, icon, input, select, textarea, rows, esc, PAGE_TITLES } from '../src.js';

export default function exchange() {
  const exchangeRows = state.exchanges.map(x => 
    `<tr><td>${esc(x.customer)}</td><td class="mono">${num(x.weight).toFixed(3)} g</td><td class="mono">${x.purity}K</td><td class="align-right mono">${money(x.value)}</td></tr>`
  ).join('');
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.exchange[0]}</h1><p class="page-subtitle">${PAGE_TITLES.exchange[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Record Old-Gold Receipt')}</h2></div><div class="card-body"><form id="exchange" class="form">${input('customer', t('Customer Name'))}${input('weight', t('Net Metal Weight (g)'), 'number', '', 'min="0.001" step="0.001"')}${select('purity', t('Assessed Purity'), ['24', '22', '21', '20', '18', '14', '12', '9'])}${input('rate', t('Agreed Rate per Fine Gram (NPR)'), 'number', state.rates.gold, 'min="0" step="0.01"')}${input('deduction', t('Agreed Deduction (NPR)'), 'number', '0', 'min="0" step="0.01"')}${textarea('notes', t('Assessment / Test Notes'))}<div class="calc-preview" id="exchangePreview"></div><div class="field-full"><button class="btn btn-champagne" type="submit" style="width:100%">${t('Record Receipt')}</button></div></form><p class="note note-caution" style="margin-top:12px">${t('Receipt register for pilot. Link to metal ledger manually if needed via Metal Management.')}</p></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Old-Gold Receipts')}</h2></div><div class="card-body" style="padding:0">${rows([t('Customer'), t('Weight'), t('Purity'), t('Value')], exchangeRows)}</div></div>`;
}