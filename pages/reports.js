import { state, money, num, rnd, t, icon, input, select, rows, card, esc, fmtDate, lt, stock, totals, calcItem, price, calcMetalBalance, getAllMetalBalances, isJobActiveStatus, PAGE_TITLES, JEWELRY_CATEGORIES, METAL_TXN_TYPES, METAL_UNITS, EXPENSE_CATEGORIES, METAL_TYPES_BY_CATEGORY, GOLD_PURITIES, SILVER_PURITIES } from '../src.js';

function getReportPeriod() {
  const start = state.reportStartDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const end = state.reportEndDate || new Date().toISOString().slice(0, 10);
  return { start, end };
}

function inRange(date) {
  const { start, end } = getReportPeriod();
  return date >= start && date <= end;
}

function salesReport() {
  const { start, end } = getReportPeriod();
  const sales = state.sales.filter(s => inRange(s.date));
  const totalSales = sales.reduce((s, x) => s + x.total, 0);
  const totalTax = sales.reduce((s, x) => s + (x.tax || 0), 0);
  const totalDiscount = sales.reduce((s, x) => s + (x.discount || 0), 0);
  const totalItems = sales.reduce((s, x) => s + (x.items || []).reduce((sum, it) => sum + it.qty, 0), 0);
  const avgSale = sales.length ? rnd(totalSales / sales.length) : 0;
  const byPayment = {};
  const byMetal = {};
  sales.forEach(s => {
    (s.payments || []).forEach(p => { byPayment[p.method] = (byPayment[p.method] || 0) + p.amount; });
    (s.items || []).forEach(it => { const m = it.metalType || it.metal || 'Gold'; byMetal[m] = (byMetal[m] || 0) + it.total; });
  });
  const dateRangeLabel = '(' + t('From') + ' ' + fmtDate(start) + ' ' + t('to') + ' ' + fmtDate(end) + ')';

  const paymentRows = Object.entries(byPayment).map(([m, v]) => 
    '<tr><td>' + esc(m) + '</td><td class="mono align-right">' + money(v) + '</td><td class="mono align-right">' + (totalSales ? rnd(v / totalSales * 100) : 0) + '%</td></tr>'
  ).join('');
  const emptyPaymentRow = '<tr><td colspan="3" class="align-center">' + t('No data') + '</td></tr>';

  const metalRows = Object.entries(byMetal).filter(([, v]) => v > 0).map(([m, v]) => 
    '<tr><td>' + esc(m) + '</td><td class="mono align-right">' + money(v) + '</td><td class="mono align-right">' + (totalSales ? rnd(v / totalSales * 100) : 0) + '%</td></tr>'
  ).join('');
  const emptyMetalRow = '<tr><td colspan="3" class="align-center">' + t('No data') + '</td></tr>';

  const salesDetailRows = sales.map(s => 
    '<tr><td class="mono">' + fmtDate(s.date) + '</td><td><code class="mono">' + esc(s.invoice) + '</code></td><td>' + esc(s.customerName || s.customer || 'Walk-in') + '</td><td class="mono align-right">' + (s.items || []).reduce((sum, it) => sum + it.qty, 0) + '</td><td class="mono align-right">' + money(s.subtotal) + '</td><td class="mono align-right">' + money(s.discount) + '</td><td class="mono align-right">' + money(s.tax) + '</td><td class="mono align-right"><strong>' + money(s.total) + '</strong></td><td>' + (s.payments || []).map(p => esc(p.method) + ' ' + money(p.amount)).join('<br>') + '</td></tr>'
  ).join('');
  const emptySalesRow = '<tr><td colspan="9" class="align-center">' + t('No sales in period') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Sales Report')}</h1><p class="page-subtitle">${PAGE_TITLES.reports[1]} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="sales">${t('Export CSV')}</button>
  <button class="btn btn-outline-champagne" data-report-export-pdf="sales">${t('Export PDF')}</button>
</div></div></div>
<div class="metric-grid">
  ${card(t('Total Sales'), money(totalSales), sales.length + ' ' + t('invoices'))}
  ${card(t('Total Tax'), money(totalTax), t(state.settings.taxLabel) + ' @ ' + state.settings.taxRate + '%')}
  ${card(t('Total Discount'), money(totalDiscount))}
  ${card(t('Avg Sale Value'), money(avgSale), totalItems + ' ' + t('items sold'))}
</div>
<div class="layout">
  <div>
    <div class="card"><div class="card-header"><h2 class="card-title">${t('Sales by Payment Method')}</h2></div><div class="card-body" style="padding:0">${rows([t('Method'), t('Amount'), t('%')], paymentRows || emptyPaymentRow)}</div></div>
    <div class="card"><div class="card-header"><h2 class="card-title">${t('Sales by Metal Type')}</h2></div><div class="card-body" style="padding:0">${rows([t('Metal Type'), t('Amount'), t('%')], metalRows || emptyMetalRow)}</div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Sales Detail')}</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">${rows([t('Date'), t('Invoice'), t('Customer'), t('Items'), t('Subtotal'), t('Discount'), t('Tax'), t('Total'), t('Payments')], salesDetailRows || emptySalesRow)}</div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Filters')}</h2></div><div class="card-body"><form id="salesFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${input('reportStartDate', t('From'), 'date', start, '')}${input('reportEndDate', t('To'), 'date', end, '')}${select('reportFilterCustomer', t('Customer'), ['all', ...state.customers.map(c => ({ value: c.id, label: c.name }))], state.reportFilterCustomer || 'all')}${select('reportFilterCategory', t('Category'), ['all', ...JEWELRY_CATEGORIES.map(c => ({ value: c.id, label: t(c.label) }))], state.reportFilterCategory || 'all')}</form></div></div>`;
}

function purchasesReport() {
  const { start, end } = getReportPeriod();
  const purchases = (state.metalManagement?.transactions || []).filter(t => inRange(t.date) && t.type === 'PURCHASE');
  const totalValue = purchases.reduce((s, t) => s + num(t.value), 0);
  const totalWeight = purchases.reduce((s, t) => s + num(t.weight), 0);
  const avgRate = totalWeight ? rnd(totalValue / totalWeight) : 0;
  const byMetal = { Gold: { weight: 0, value: 0 }, Silver: { weight: 0, value: 0 } };
  purchases.forEach(t => { if (byMetal[t.metal]) { byMetal[t.metal].weight += num(t.weight); byMetal[t.metal].value += num(t.value); } });
  const bySupplier = {};
  purchases.forEach(t => { const s = t.karigar || t.customer || 'Unknown'; bySupplier[s] = bySupplier[s] || { count: 0, weight: 0, value: 0 }; bySupplier[s].count++; bySupplier[s].weight += num(t.weight); bySupplier[s].value += num(t.value); });
  const dateRangeLabel = '(' + t('From') + ' ' + fmtDate(start) + ' ' + t('to') + ' ' + fmtDate(end) + ')';

  const supplierRows = Object.entries(bySupplier).map(([s, v]) => 
    '<tr><td>' + esc(s) + '</td><td class="mono align-right">' + v.count + '</td><td class="mono align-right">' + v.weight.toFixed(3) + '</td><td class="mono align-right">' + money(v.value) + '</td><td class="mono align-right">' + money(v.weight ? v.value / v.weight : 0) + '</td></tr>'
  ).join('');
  const emptySupplierRow = '<tr><td colspan="5" class="align-center">' + t('No purchases in period') + '</td></tr>';

  const purchaseDetailRows = purchases.map(t => 
    '<tr><td class="mono">' + esc(t.date || '') + '</td><td>' + esc(lt(t.type)) + '</td><td>' + esc(t.metal) + '</td><td class="mono">' + esc(t.purity) + '</td><td class="mono align-right">' + num(t.weight).toFixed(3) + '</td><td class="mono align-right">' + money(t.rate) + '</td><td class="mono align-right">' + money(t.value) + '</td><td>' + esc(t.karigar || '-') + '</td><td><code class="mono">' + esc(t.reference || '-') + '</code></td><td>' + esc(t.notes || '-') + '</td></tr>'
  ).join('');
  const emptyPurchaseRow = '<tr><td colspan="10" class="align-center">' + t('No purchases in period') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Purchase Report')}</h1><p class="page-subtitle">${t('Metal purchases from suppliers')} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="purchases">${t('Export CSV')}</button>
  <button class="btn btn-secondary" data-report-export-pdf="purchases">${t('Export PDF')}</button>
</div></div></div>
<div class="metric-grid">
  ${card(t('Total Purchases'), money(totalValue), purchases.length + ' ' + t('transactions'))}
  ${card(t('Total Weight'), totalWeight.toFixed(3) + ' g', t('Avg rate') + ': ' + money(avgRate) + '/g')}
  ${card(t('Gold Purchased'), byMetal.Gold.weight.toFixed(3) + ' g', money(byMetal.Gold.value))}
  ${card(t('Silver Purchased'), byMetal.Silver.weight.toFixed(3) + ' g', money(byMetal.Silver.value))}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Purchases by Supplier')}</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">${rows([t('Supplier'), t('Transactions'), t('Weight (g)'), t('Value'), t('Avg Rate/g')], supplierRows || emptySupplierRow)}</div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Purchase Detail')}</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">${rows([t('Date'), t('Type'), t('Metal'), t('Purity'), t('Weight (g)'), t('Rate/g'), t('Value'), t('Supplier'), t('Reference'), t('Notes')], purchaseDetailRows || emptyPurchaseRow)}</div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Filters')}</h2></div><div class="card-body"><form id="purchaseFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${input('reportStartDate', t('From'), 'date', start, '')}${input('reportEndDate', t('To'), 'date', end, '')}${select('reportFilterSupplier', t('Supplier'), ['all', ...[...new Set(state.metalManagement?.transactions?.filter(t => t.type === 'PURCHASE')?.map(t => t.karigar)?.filter(Boolean) || [])]], state.reportFilterSupplier || 'all')}</form></div></div>`;
}

function stockReport() {
  const items = state.items.filter(i => i.status === 'stock');
  const totalItems = items.length;
  const totalWeight = rnd(items.reduce((s, i) => s + num(i.netWeight || i.weight), 0));
  const totalCost = rnd(items.reduce((s, i) => s + calcItem.totalCost(i), 0));
  const totalSelling = rnd(items.reduce((s, i) => s + num(i.sellingPrice || calcItem.totalCost(i)), 0));
  const potentialMargin = totalSelling ? rnd((totalSelling - totalCost) / totalSelling * 100) : 0;
  const byCat = {};
  const byMetal = {};
  items.forEach(i => {
    const cat = i.category || 'other';
    const metal = i.metalType || i.metal || 'Gold';
    byCat[cat] = byCat[cat] || { count: 0, weight: 0, cost: 0, selling: 0 };
    byCat[cat].count++; byCat[cat].weight += num(i.netWeight || i.weight); byCat[cat].cost += calcItem.totalCost(i); byCat[cat].selling += num(i.sellingPrice || calcItem.totalCost(i));
    byMetal[metal] = byMetal[metal] || { count: 0, weight: 0, cost: 0, selling: 0 };
    byMetal[metal].count++; byMetal[metal].weight += num(i.netWeight || i.weight); byMetal[metal].cost += calcItem.totalCost(i); byMetal[metal].selling += num(i.sellingPrice || calcItem.totalCost(i));
  });
  const dateRangeLabel = '(' + t('As of') + ' ' + fmtDate() + ')';

  const catRows = Object.entries(byCat).map(([c, v]) => 
    '<tr><td>' + esc(c.charAt(0).toUpperCase() + c.slice(1)) + '</td><td class="mono align-right">' + v.count + '</td><td class="mono align-right">' + v.weight.toFixed(3) + '</td><td class="mono align-right">' + money(v.cost) + '</td><td class="mono align-right">' + money(v.selling) + '</td><td class="mono align-right">' + (v.selling ? rnd((v.selling - v.cost) / v.selling * 100) : 0) + '%</td></tr>'
  ).join('');
  const emptyCatRow = '<tr><td colspan="6" class="align-center">' + t('No stock') + '</td></tr>';

  const metalRows = Object.entries(byMetal).filter(([, v]) => v.count > 0).map(([m, v]) => 
    '<tr><td>' + esc(m) + '</td><td class="mono align-right">' + v.count + '</td><td class="mono align-right">' + v.weight.toFixed(3) + '</td><td class="mono align-right">' + money(v.cost) + '</td><td class="mono align-right">' + money(v.selling) + '</td><td class="mono align-right">' + (v.selling ? rnd((v.selling - v.cost) / v.selling * 100) : 0) + '%</td></tr>'
  ).join('');
  const emptyMetalRow = '<tr><td colspan="6" class="align-center">' + t('No stock') + '</td></tr>';

  const stockDetailRows = items.map(i => 
    '<tr><td><code class="mono">' + esc(i.sku) + '</code></td><td>' + esc(i.name) + '</td><td>' + esc(i.category) + '</td><td>' + esc(lt(i.metalType || i.metal)) + '</td><td class="mono">' + esc(i.purity) + '</td><td class="mono align-right">' + num(i.netWeight || i.weight).toFixed(3) + '</td><td class="mono align-right">' + money(calcItem.totalCost(i)) + '</td><td class="mono align-right">' + money(i.sellingPrice) + '</td><td class="mono align-right">' + num(i.marginPercent || 0).toFixed(1) + '%</td><td>' + esc(i.location || '-') + '</td></tr>'
  ).join('');
  const emptyStockRow = '<tr><td colspan="10" class="align-center">' + t('No stock') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Stock Valuation')}</h1><p class="page-subtitle">${t('Current inventory valuation at cost and selling price')} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="stock">${t('Export CSV')}</button>
  <button class="btn btn-secondary" data-report-export-pdf="stock">${t('Export PDF')}</button>
</div></div></div>
<div class="metric-grid">
  ${card(t('Total Items'), totalItems + ' pcs', totalWeight.toFixed(3) + ' g ' + t('total weight'))}
  ${card(t('Stock at Cost'), money(totalCost), t('Weighted average cost'))}
  ${card(t('Stock at Selling'), money(totalSelling), t('Potential margin') + ': ' + potentialMargin + '%')}
  ${card(t('Potential Profit'), money(rnd(totalSelling - totalCost)), t('If all sold at marked price'))}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Valuation by Category')}</h2></div><div class="card-body" style="padding:0">${rows([t('Category'), t('Items'), t('Weight (g)'), t('Cost Value'), t('Selling Value'), t('Margin %')], catRows || emptyCatRow)}</div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Valuation by Metal')}</h2></div><div class="card-body" style="padding:0">${rows([t('Metal'), t('Items'), t('Weight (g)'), t('Cost Value'), t('Selling Value'), t('Margin %')], metalRows || emptyMetalRow)}</div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Stock Detail')}</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">${rows([t('SKU'), t('Name'), t('Category'), t('Metal'), t('Purity'), t('Net (g)'), t('Cost'), t('Selling'), t('Margin %'), t('Location')], stockDetailRows || emptyStockRow)}</div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Filters')}</h2></div><div class="card-body"><form id="stockFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${select('reportFilterCategory', t('Category'), ['all', ...JEWELRY_CATEGORIES.map(c => ({ value: c.id, label: t(c.label) }))], state.reportFilterCategory || 'all')}${select('reportFilterMetal', t('Metal'), ['all', 'Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold'], state.reportFilterMetal || 'all')}</form></div></div>`;
}

function metalBalancesReport() {
  const { start, end } = getReportPeriod();
  const txns = (state.metalManagement?.transactions || []).filter(t => inRange(t.date));
  const goldBalances = GOLD_PURITIES.map(p => ({ purity: p, opening: calcMetalBalance('Gold', p, start), balance: calcMetalBalance('Gold', p) }));
  const silverBalances = SILVER_PURITIES.map(p => ({ purity: p, opening: calcMetalBalance('Silver', p, start), balance: calcMetalBalance('Silver', p) }));
  const totalGold = rnd(goldBalances.reduce((s, b) => s + b.balance, 0));
  const totalSilver = rnd(silverBalances.reduce((s, b) => s + b.balance, 0));
  const goldValue = rnd(goldBalances.reduce((s, b) => s + b.balance * num(state.rates.gold), 0));
  const silverValue = rnd(silverBalances.reduce((s, b) => s + b.balance * num(state.rates.silver), 0));
  const goldIn = rnd(txns.filter(t => t.metal === 'Gold' && ['PURCHASE', 'RETURN', 'RECEIPT', 'OPENING_BALANCE'].includes(t.type)).reduce((s, t) => s + num(t.weight), 0));
  const goldOut = rnd(txns.filter(t => t.metal === 'Gold' && ['ISSUE', 'WASTAGE', 'SALE'].includes(t.type)).reduce((s, t) => s + num(t.weight), 0));
  const silverIn = rnd(txns.filter(t => t.metal === 'Silver' && ['PURCHASE', 'RETURN', 'RECEIPT', 'OPENING_BALANCE'].includes(t.type)).reduce((s, t) => s + num(t.weight), 0));
  const silverOut = rnd(txns.filter(t => t.metal === 'Silver' && ['ISSUE', 'WASTAGE', 'SALE'].includes(t.type)).reduce((s, t) => s + num(t.weight), 0));
  const dateRangeLabel = '(' + t('From') + ' ' + fmtDate(start) + ' ' + t('to') + ' ' + fmtDate(end) + ')';

  const goldRows = goldBalances.map(b => {
    const inW = txns.filter(t => t.metal === 'Gold' && t.purity === b.purity && ['PURCHASE', 'RETURN', 'RECEIPT', 'OPENING_BALANCE'].includes(t.type)).reduce((s, t) => s + num(t.weight), 0);
    const outW = txns.filter(t => t.metal === 'Gold' && t.purity === b.purity && ['ISSUE', 'WASTAGE', 'SALE'].includes(t.type)).reduce((s, t) => s + num(t.weight), 0);
    return '<tr><td class="mono">' + esc(b.purity) + '</td><td class="mono align-right">' + b.opening.toFixed(3) + '</td><td class="mono align-right text-success">+' + inW.toFixed(3) + '</td><td class="mono align-right text-danger">-' + outW.toFixed(3) + '</td><td class="mono align-right"><strong>' + b.balance.toFixed(3) + '</strong></td><td class="mono align-right">' + money(num(state.rates.gold)) + '</td><td class="mono align-right">' + money(rnd(b.balance * num(state.rates.gold))) + '</td></tr>';
  }).join('');
  const emptyGoldRow = '<tr><td colspan="7" class="align-center">' + t('No gold balances') + '</td></tr>';

  const silverRows = silverBalances.map(b => {
    const inW = txns.filter(t => t.metal === 'Silver' && t.purity === b.purity && ['PURCHASE', 'RETURN', 'RECEIPT', 'OPENING_BALANCE'].includes(t.type)).reduce((s, t) => s + num(t.weight), 0);
    const outW = txns.filter(t => t.metal === 'Silver' && t.purity === b.purity && ['ISSUE', 'WASTAGE', 'SALE'].includes(t.type)).reduce((s, t) => s + num(t.weight), 0);
    return '<tr><td class="mono">' + esc(b.purity) + '</td><td class="mono align-right">' + b.opening.toFixed(3) + '</td><td class="mono align-right text-success">+' + inW.toFixed(3) + '</td><td class="mono align-right text-danger">-' + outW.toFixed(3) + '</td><td class="mono align-right"><strong>' + b.balance.toFixed(3) + '</strong></td><td class="mono align-right">' + money(num(state.rates.silver)) + '</td><td class="mono align-right">' + money(rnd(b.balance * num(state.rates.silver))) + '</td></tr>';
  }).join('');
  const emptySilverRow = '<tr><td colspan="7" class="align-center">' + t('No silver balances') + '</td></tr>';

  const movementRows = [
    ['Gold', totalGold.toFixed(3), goldIn.toFixed(3), goldOut.toFixed(3), totalGold.toFixed(3), money(num(state.rates.gold)), money(goldValue)],
    ['Silver', totalSilver.toFixed(3), silverIn.toFixed(3), silverOut.toFixed(3), totalSilver.toFixed(3), money(num(state.rates.silver)), money(silverValue)]
  ].map(r => '<tr>' + r.map(c => '<td class="mono align-right">' + c + '</td>').join('') + '</tr>').join('');

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Gold/Silver Balances')}</h1><p class="page-subtitle">${t('Current metal balances with period movement')} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="metalbalances">${t('Export CSV')}</button>
  <button class="btn btn-secondary" data-report-export-pdf="metalbalances">${t('Export PDF')}</button>
</div></div></div>
<div class="metric-grid">
  ${card(t('Total Gold'), totalGold.toFixed(3) + ' g', t('Value') + ': ' + money(goldValue))}
  ${card(t('Total Silver'), totalSilver.toFixed(3) + ' g', t('Value') + ': ' + money(silverValue))}
  ${card(t('Combined Value'), money(goldValue + silverValue), t('At current rates'))}
  ${card(t('Gold Rate'), money(num(state.rates.gold)) + '/g', t('Silver') + ': ' + money(num(state.rates.silver)) + '/g')}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Gold Balance by Purity')}</h2></div><div class="card-body" style="padding:0">${rows([t('Purity'), t('Opening'), t('In Period'), t('Out Period'), t('Current Balance'), t('Rate/g'), t('Value')], goldRows || emptyGoldRow)}</div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Silver Balance by Purity')}</h2></div><div class="card-body" style="padding:0">${rows([t('Purity'), t('Opening'), t('In Period'), t('Out Period'), t('Current Balance'), t('Rate/g'), t('Value')], silverRows || emptySilverRow)}</div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Period Movement Summary')}</h2></div><div class="card-body" style="padding:0">${rows([t('Metal'), t('Opening'), t('Receipts/Purchases'), t('Issues/Sales/Wastage'), t('Closing'), t('Rate/g'), t('Value')], movementRows)}</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Filters')}</h2></div><div class="card-body"><form id="metalBalanceFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${input('reportStartDate', t('From'), 'date', start, '')}${input('reportEndDate', t('To'), 'date', end, '')}${select('reportFilterCategory', t('Transaction Type'), ['all', ...METAL_TXN_TYPES.map(t => t.value)], state.reportFilterCategory || 'all')}</form></div></div>`;
}

function karigarReport() {
  const { start, end } = getReportPeriod();
  const karigars = state.karigars.map(k => {
    const jobs = state.jobs.filter(j => j.assignedKarigarId === k.id);
    const activeJobs = jobs.filter(j => j.status !== 'Completed').length;
    const issued = rnd(jobs.reduce((s, j) => s + (j.metalIssues || []).reduce((s2, m) => s2 + num(m.weight), 0), 0));
    const returned = rnd(jobs.reduce((s, j) => s + (j.materialReturns || []).reduce((s2, r) => s2 + num(r.weight), 0), 0));
    const net = rnd(issued - returned);
    const wastage = rnd(jobs.reduce((s, j) => s + num(j.wastageActual || 0), 0));
    const labour = rnd(jobs.reduce((s, j) => s + num(j.labourCharges?.total || 0), 0));
    const advance = rnd(k.totalAdvance || 0);
    const balance = rnd(labour - advance);
    return { karigar: k, activeJobs, issued, returned, net, wastage, labour, advance, balance };
  }).filter(k => k.activeJobs > 0 || k.issued > 0 || k.returned > 0 || k.wastage > 0 || k.labour > 0 || k.advance > 0);
  const totalIssued = rnd(karigars.reduce((s, k) => s + k.issued, 0));
  const totalReturned = rnd(karigars.reduce((s, k) => s + k.returned, 0));
  const totalNet = rnd(totalIssued - totalReturned);
  const totalWastage = rnd(karigars.reduce((s, k) => s + k.wastage, 0));
  const totalLabour = rnd(karigars.reduce((s, k) => s + k.labour, 0));
  const totalAdvance = rnd(karigars.reduce((s, k) => s + k.advance, 0));
  const totalOutstanding = rnd(karigars.reduce((s, k) => s + k.balance, 0));
  const dateRangeLabel = '(' + t('From') + ' ' + fmtDate(start) + ' ' + t('to') + ' ' + fmtDate(end) + ')';

  const karigarRows = karigars.map(k => 
    '<tr><td><strong>' + esc(k.karigar.name) + '</strong></td><td>' + esc((k.karigar.specialties || []).join(', ') || '-') + '</td><td class="mono align-right">' + money(num(k.karigar.ratePerGram)) + '</td><td class="mono align-right">' + k.activeJobs + '</td><td class="mono align-right">' + k.issued.toFixed(3) + '</td><td class="mono align-right">' + k.returned.toFixed(3) + '</td><td class="mono align-right"><strong>' + k.net.toFixed(3) + '</strong></td><td class="mono align-right">' + k.wastage.toFixed(3) + '</td><td class="mono align-right">' + money(k.labour) + '</td><td class="mono align-right">' + money(k.advance) + '</td><td class="mono align-right ' + (k.balance < 0 ? 'text-danger' : '') + '"><strong>' + money(k.balance) + '</strong></td></tr>'
  ).join('');
  const emptyKarigarRow = '<tr><td colspan="11" class="align-center">' + t('No karigar activity in period') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Karigar Outstanding')}</h1><p class="page-subtitle">${t('Metal issued, returned, wastage and labour outstanding')} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="karigar">${t('Export CSV')}</button>
  <button class="btn btn-secondary" data-report-export-pdf="karigar">${t('Export PDF')}</button>
</div></div></div>
<div class="metric-grid">
  ${card(t('Total Metal Issued'), totalIssued.toFixed(3) + ' g', t('Across all karigars'))}
  ${card(t('Total Returned'), totalReturned.toFixed(3) + ' g', t('Net') + ': ' + totalNet.toFixed(3) + ' g')}
  ${card(t('Total Wastage'), totalWastage.toFixed(3) + ' g', t('Actual wastage'))}
  ${card(t('Labour Outstanding'), money(totalOutstanding), t('Total labour') + ': ' + money(totalLabour) + ', ' + t('Advances') + ': ' + money(totalAdvance))}
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Karigar Outstanding Summary')}</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">${rows([t('Karigar'), t('Specialty'), t('Rate/g'), t('Active Jobs'), t('Issued (g)'), t('Returned (g)'), t('Net (g)'), t('Wastage (g)'), t('Labour Earned'), t('Advance'), t('Outstanding')], karigarRows || emptyKarigarRow)}</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Filters')}</h2></div><div class="card-body"><form id="karigarFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${input('reportStartDate', t('From'), 'date', start, '')}${input('reportEndDate', t('To'), 'date', end, '')}${select('reportFilterKarigar', t('Karigar'), ['all', ...state.karigars.map(k => ({ value: k.id, label: k.name }))], state.reportFilterKarigar || 'all')}</form></div></div>`;
}

function customersReport() {
  const { start, end } = getReportPeriod();
  const sales = state.sales.filter(s => inRange(s.date));
  const customers = state.customers.map(c => {
    const custSales = sales.filter(s => s.customer === c.id || s.customerName === c.name);
    const totalSales = custSales.reduce((s, x) => s + x.total, 0);
    const totalPaid = custSales.reduce((s, x) => s + (x.payments || []).reduce((ps, p) => ps + p.amount, 0), 0);
    const balance = rnd(num(c.balance || 0) + totalSales - totalPaid);
    const creditLimit = num(c.creditLimit || 0);
    const utilization = creditLimit > 0 ? rnd((balance / creditLimit) * 100) : 0;
    return { customer: c, totalSales, totalPaid, balance, creditLimit, utilization };
  }).filter(c => c.totalSales > 0 || c.balance !== 0 || c.customer.creditLimit > 0);
  const totalReceivable = rnd(customers.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0));
  const totalCreditLimit = rnd(customers.reduce((s, c) => s + c.creditLimit, 0));
  const overdueCustomers = customers.filter(c => c.balance > c.creditLimit && c.creditLimit > 0).length;
  const dateRangeLabel = '(' + t('From') + ' ' + fmtDate(start) + ' ' + t('to') + ' ' + fmtDate(end) + ')';

  const customerRows = customers.map(c => 
    '<tr><td><strong>' + esc(c.customer.name) + '</strong></td><td>' + esc(c.customer.phone || '-') + '</td><td class="mono align-right">' + money(c.totalSales) + '</td><td class="mono align-right">' + money(c.totalPaid) + '</td><td class="mono align-right ' + (c.balance < 0 ? 'text-success' : (c.balance > c.creditLimit && c.creditLimit > 0 ? 'text-danger' : '')) + '"><strong>' + money(c.balance) + '</strong></td><td class="mono align-right">' + money(c.creditLimit) + '</td><td class="mono align-right">' + c.utilization.toFixed(1) + '%</td><td>' + (c.balance > c.creditLimit && c.creditLimit > 0 ? '<span class="badge badge-warn">' + t('Over Limit') + '</span>' : c.balance < 0 ? '<span class="badge badge-completed">' + t('Credit') + '</span>' : '<span class="badge badge-inprogress">' + t('Active') + '</span>') + '</td></tr>'
  ).join('');
  const emptyCustomerRow = '<tr><td colspan="8" class="align-center">' + t('No customer activity in period') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Customer Balances')}</h1><p class="page-subtitle">${t('Outstanding receivables and credit utilization')} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="customers">${t('Export CSV')}</button>
  <button class="btn btn-secondary" data-report-export-pdf="customers">${t('Export PDF')}</button>
</div></div></div>
<div class="metric-grid">
  ${card(t('Total Receivables'), money(totalReceivable), customers.length + ' ' + t('customers with activity'))}
  ${card(t('Total Credit Limits'), money(totalCreditLimit), t('Combined limits'))}
  ${card(t('Overdue Accounts'), overdueCustomers, t('Exceeding credit limit'))}
  ${card(t('Avg Utilization'), customers.length ? rnd(customers.reduce((s, c) => s + c.utilization, 0) / customers.length) + '%' : '0%', t('Of credit limits'))}
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Customer Balance Detail')}</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">${rows([t('Customer'), t('Phone'), t('Sales (Period)'), t('Paid (Period)'), t('Balance'), t('Credit Limit'), t('Utilization'), t('Status')], customerRows || emptyCustomerRow)}</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Filters')}</h2></div><div class="card-body"><form id="customerFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${input('reportStartDate', t('From'), 'date', start, '')}${input('reportEndDate', t('To'), 'date', end, '')}${select('reportFilterCustomer', t('Customer'), ['all', ...state.customers.map(c => ({ value: c.id, label: c.name }))], state.reportFilterCustomer || 'all')}</form></div></div>`;
}

function suppliersReport() {
  const { start, end } = getReportPeriod();
  const suppliers = state.suppliers.map(s => {
    const purchases = (state.metalManagement?.transactions || []).filter(t => inRange(t.date) && t.type === 'PURCHASE' && (t.karigar === s.name || t.customer === s.name));
    const totalPurchases = purchases.reduce((sum, t) => sum + num(t.value), 0);
    const totalWeight = purchases.reduce((sum, t) => sum + num(t.weight), 0);
    return { supplier: s, totalPurchases, totalWeight, balance: num(s.balance || 0) };
  }).filter(s => s.totalPurchases > 0 || s.balance !== 0 || num(s.supplier.totalAmount || 0) > 0);
  const totalPayable = rnd(suppliers.filter(s => s.balance > 0).reduce((s, sup) => s + sup.balance, 0));
  const totalPurchaseValue = rnd(suppliers.reduce((s, sup) => s + sup.totalPurchases, 0));
  const dateRangeLabel = '(' + t('From') + ' ' + fmtDate(start) + ' ' + t('to') + ' ' + fmtDate(end) + ')';

  const supplierRows = suppliers.map(s => 
    '<tr><td><strong>' + esc(s.supplier.name) + '</strong></td><td>' + esc(s.supplier.contactPerson || '-') + '</td><td class="mono align-right">' + money(s.totalPurchases) + '</td><td class="mono align-right">' + s.totalWeight.toFixed(3) + '</td><td class="mono align-right ' + (s.balance > 0 ? 'text-danger' : s.balance < 0 ? 'text-success' : '') + '"><strong>' + money(s.balance) + '</strong></td><td>' + esc(s.supplier.paymentTerms || '-') + '</td><td>' + (s.balance > 0 ? '<span class="badge badge-warn">' + t('Payable') + '</span>' : s.balance < 0 ? '<span class="badge badge-completed">' + t('Advance') + '</span>' : '<span class="badge badge-inprogress">' + t('Settled') + '</span>') + '</td></tr>'
  ).join('');
  const emptySupplierRow = '<tr><td colspan="7" class="align-center">' + t('No supplier activity in period') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Supplier Balances')}</h1><p class="page-subtitle">${t('Outstanding payables to metal suppliers')} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="suppliers">${t('Export CSV')}</button>
  <button class="btn btn-secondary" data-report-export-pdf="suppliers">${t('Export PDF')}</button>
</div></div></div>
<div class="metric-grid">
  ${card(t('Total Payables'), money(totalPayable), suppliers.length + ' ' + t('suppliers'))}
  ${card(t('Period Purchases'), money(totalPurchaseValue), t('Metal purchases in period'))}
  ${card(t('Suppliers with Balance'), suppliers.filter(s => s.balance !== 0).length, t('Non-zero balances'))}
  ${card(t('Avg Payment Terms'), suppliers.length ? Math.round(suppliers.filter(s => s.supplier.paymentTerms).reduce((a, s) => a + num(s.supplier.paymentTerms.match(/\\d+/) ?.[0] || 0), 0) / suppliers.filter(s => s.supplier.paymentTerms).length) + ' days' : 'N/A')}
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Supplier Balance Detail')}</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">${rows([t('Supplier'), t('Contact'), t('Period Purchases'), t('Weight (g)'), t('Balance'), t('Payment Terms'), t('Status')], supplierRows || emptySupplierRow)}</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Filters')}</h2></div><div class="card-body"><form id="supplierFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${input('reportStartDate', t('From'), 'date', start, '')}${input('reportEndDate', t('To'), 'date', end, '')}${select('reportFilterSupplier', t('Supplier'), ['all', ...state.suppliers.map(s => ({ value: s.id, label: s.name }))], state.reportFilterSupplier || 'all')}</form></div></div>`;
}

function expensesReport() {
  const { start, end } = getReportPeriod();
  const expenses = state.expenses.filter(e => inRange(e.date));
  const totals = { total: 0, count: expenses.length, byCat: {}, byStatus: { paid: 0, pending: 0, overdue: 0 } };
  expenses.forEach(e => { totals.total += num(e.amount); totals.byCat[e.category] = (totals.byCat[e.category] || 0) + num(e.amount); totals.byStatus[e.status] = (totals.byStatus[e.status] || 0) + num(e.amount); });
  const byMonth = {};
  expenses.forEach(e => { const m = e.date.slice(0, 7); byMonth[m] = byMonth[m] || { total: 0, cat: {} }; byMonth[m].total += num(e.amount); byMonth[m].cat[e.category] = (byMonth[m].cat[e.category] || 0) + num(e.amount); });
  const dateRangeLabel = '(' + t('From') + ' ' + fmtDate(start) + ' ' + t('to') + ' ' + fmtDate(end) + ')';

  const catRows = Object.entries(totals.byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => 
    '<tr><td>' + esc(c) + '</td><td class="mono align-right">' + money(v) + '</td><td class="mono align-right">' + (totals.total ? rnd(v / totals.total * 100) : 0) + '%</td><td class="mono align-right">' + state.expenses.filter(e => e.category === c && inRange(e.date)).length + '</td></tr>'
  ).join('');
  const emptyCatRow = '<tr><td colspan="4" class="align-center">' + t('No expenses in period') + '</td></tr>';

  const monthRows = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([m, v]) => {
    const topCat = Object.entries(v.cat).sort((a, b) => b[1] - a[1])[0];
    return '<tr><td>' + m + '</td><td class="mono align-right">' + money(v.total) + '</td><td>' + (topCat ? esc(topCat[0]) + ' (' + money(topCat[1]) + ')' : '-') + '</td></tr>';
  }).join('');
  const emptyMonthRow = '<tr><td colspan="3" class="align-center">' + t('No data') + '</td></tr>';

  const expenseDetailRows = expenses.map(e => 
    '<tr><td class="mono">' + fmtDate(e.date) + '</td><td>' + esc(e.category) + '</td><td class="mono align-right">' + money(e.amount) + '</td><td>' + (e.status === 'paid' ? '<span class="badge badge-completed">' + t('Paid') + '</span>' : e.status === 'pending' ? '<span class="badge badge-inprogress">' + t('Pending') + '</span>' : '<span class="badge badge-warn">' + t('Overdue') + '</span>') + '</td><td>' + esc(e.paymentMethod) + '</td><td><code class="mono">' + esc(e.reference || '-') + '</code></td><td>' + esc(e.notes || '-') + '</td></tr>'
  ).join('');
  const emptyExpenseRow = '<tr><td colspan="7" class="align-center">' + t('No expenses in period') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Expenses')}</h1><p class="page-subtitle">${t('Business expenses by category and period')} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="expenses">${t('Export CSV')}</button>
  <button class="btn btn-secondary" data-report-export-pdf="expenses">${t('Export PDF')}</button>
  <button class="btn btn-secondary" data-tab="expenses">${t('Manage Expenses')}</button>
</div></div></div>
<div class="metric-grid">
  ${card(t('Total Expenses'), money(totals.total), totals.count + ' ' + t('records'))}
  ${card(t('Paid'), money(totals.byStatus.paid), t('Completed payments'))}
  ${card(t('Pending'), money(totals.byStatus.pending), t('Awaiting payment'))}
  ${card(t('Overdue'), money(totals.byStatus.overdue), t('Past due'))}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Expenses by Category')}</h2></div><div class="card-body" style="padding:0">${rows([t('Category'), t('Amount'), t('%'), t('Count')], catRows || emptyCatRow)}</div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Monthly Trend')}</h2></div><div class="card-body" style="padding:0">${rows([t('Month'), t('Total'), t('Top Category')], monthRows || emptyMonthRow)}</div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Expense Detail')}</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">${rows([t('Date'), t('Category'), t('Amount'), t('Status'), t('Payment Method'), t('Reference'), t('Notes')], expenseDetailRows || emptyExpenseRow)}</div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Filters')}</h2></div><div class="card-body"><form id="expenseFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${input('reportStartDate', t('From'), 'date', start, '')}${input('reportEndDate', t('To'), 'date', end, '')}${select('reportFilterCategory', t('Category'), ['all', ...EXPENSE_CATEGORIES], state.reportFilterCategory || 'all')}</form></div></div>`;
}

function pnlReport() {
  const { start, end } = getReportPeriod();
  const sales = state.sales.filter(s => inRange(s.date));
  const revenue = sales.reduce((s, x) => s + x.total, 0);
  const discounts = sales.reduce((s, x) => s + (x.discount || 0), 0);
  const taxCollected = sales.reduce((s, x) => s + (x.tax || 0), 0);
  const netRevenue = rnd(revenue - discounts);
  const cogs = rnd(sales.reduce((s, x) => s + (x.items || []).reduce((sum, it) => sum + calcItem.totalCost(it), 0), 0));
  const grossProfit = rnd(netRevenue - cogs);
  const grossMargin = netRevenue ? rnd(grossProfit / netRevenue * 100) : 0;
  const expenses = state.expenses.filter(e => inRange(e.date) && e.status === 'paid');
  const expensesByCat = {};
  expenses.forEach(e => { expensesByCat[e.category] = (expensesByCat[e.category] || 0) + num(e.amount); });
  const opExpenses = rnd(Object.values(expensesByCat).reduce((s, v) => s + v, 0));
  const karigarLabour = rnd(state.jobs.filter(j => inRange(j.createdAt || j.updatedAt || '')).reduce((s, j) => s + num(j.labourCharges?.total || 0), 0));
  const wastageCost = rnd(state.jobs.filter(j => inRange(j.createdAt || j.updatedAt || '')).reduce((s, j) => s + num(j.wastageActual || 0) * num(j.metalType === 'Silver' ? state.rates.silver : state.rates.gold), 0));
  const directCosts = rnd(karigarLabour + wastageCost);
  const netProfit = rnd(grossProfit - opExpenses - directCosts);
  const netMargin = netRevenue ? rnd(netProfit / netRevenue * 100) : 0;
  const dateRangeLabel = '(' + t('From') + ' ' + fmtDate(start) + ' ' + t('to') + ' ' + fmtDate(end) + ')';

  const opExpenseRows = Object.entries(expensesByCat).map(([c, v]) => 
    '<tr><td>' + esc(c) + '</td><td class="mono align-right text-danger">' + money(v) + '</td></tr>'
  ).join('');
  const emptyOpExpenseRow = '<tr><td colspan="2" class="align-center">' + t('No expenses') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Profit & Loss')}</h1><p class="page-subtitle">${t('Financial performance statement')} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="pnl">${t('Export CSV')}</button>
  <button class="btn btn-secondary" data-report-export-pdf="pnl">${t('Export PDF')}</button>
</div></div></div>
<div class="metric-grid">
  ${card(t('Net Revenue'), money(netRevenue), t('Gross') + ': ' + money(revenue) + ', ' + t('Discounts') + ': ' + money(discounts))}
  ${card(t('COGS'), money(cogs), t('Cost of items sold'))}
  ${card(t('Gross Profit'), money(grossProfit), t('Margin') + ': ' + grossMargin + '%')}
  ${card(t('Net Profit'), money(netProfit), t('Margin') + ': ' + netMargin + '%')}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Revenue')}</h2></div><div class="card-body" style="padding:0">${rows([t('Item'), t('Amount')], [[t('Gross Sales'), money(revenue)], [t('Less: Discounts'), money(discounts)], [t('Net Revenue'), money(netRevenue)], [t('Tax Collected') + ' (' + state.settings.taxLabel + ')', money(taxCollected)]].map(r => '<tr><td>' + esc(r[0]) + '</td><td class="mono align-right ' + (r[0] === t('Net Revenue') ? '' : 'text-danger') + '">' + r[1] + '</td></tr>').join('') )}</div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Cost of Goods Sold')}</h2></div><div class="card-body" style="padding:0">${rows([t('Item'), t('Amount')], [[t('Cost of Items Sold'), money(cogs)]].map(r => '<tr><td>' + esc(r[0]) + '</td><td class="mono align-right text-danger">' + r[1] + '</td></tr>').join('') )}</div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Gross Profit')}</h2></div><div class="card-body" style="padding:0">${rows([t('Item'), t('Amount')], [[t('Net Revenue'), money(netRevenue)], [t('Less: COGS'), money(cogs)], [t('Gross Profit'), money(grossProfit)], [t('Gross Margin'), grossMargin + '%']].map(r => '<tr><td>' + esc(r[0]) + '</td><td class="mono align-right ' + (r[0] === t('Gross Profit') ? 'text-success' : '') + '">' + r[1] + '</td></tr>').join('') )}</div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Operating Expenses')}</h2></div><div class="card-body" style="padding:0">${rows([t('Category'), t('Amount')], opExpenseRows || emptyOpExpenseRow)}${rows([t('Category'), t('Amount')], [[t('Total Operating Expenses'), money(opExpenses)]].map(r => '<tr style="border-top:2px solid var(--border-strong)"><td><strong>' + esc(r[0]) + '</strong></td><td class="mono align-right"><strong>' + r[1] + '</strong></td></tr>').join('') )}</div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Direct Costs')}</h2></div><div class="card-body" style="padding:0">${rows([t('Item'), t('Amount')], [[t('Karigar Labour'), money(karigarLabour)], [t('Metal Wastage'), money(wastageCost)], [t('Total Direct Costs'), money(directCosts)]].map(r => '<tr><td>' + esc(r[0]) + '</td><td class="mono align-right ' + (r[0] === t('Total Direct Costs') ? '' : 'text-danger') + '">' + r[1] + '</td></tr>').join('') )}</div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Net Profit')}</h2></div><div class="card-body" style="padding:0">${rows([t('Item'), t('Amount')], [[t('Gross Profit'), money(grossProfit)], [t('Less: Operating Expenses'), money(opExpenses)], [t('Less: Direct Costs'), money(directCosts)], [t('Net Profit / (Loss)'), money(netProfit)], [t('Net Margin'), netMargin + '%']].map(r => '<tr style="' + (r[0] === t('Net Profit / (Loss)') ? 'border-top:2px solid var(--border-strong)' : '') + '"><td>' + esc(r[0]) + '</td><td class="mono align-right ' + (r[0] === t('Net Profit / (Loss)') ? (netProfit >= 0 ? 'text-success' : 'text-danger') : (r[0].includes(t('Less')) ? 'text-danger' : '')) + '"><strong>' + r[1] + '</strong></td></tr>').join('') )}</div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Filters')}</h2></div><div class="card-body"><form id="pnlFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${input('reportStartDate', t('From'), 'date', start, '')}${input('reportEndDate', t('To'), 'date', end, '')}</form></div></div>`;
}

function cashReport() {
  const { start, end } = getReportPeriod();
  const inflows = [...state.sales.filter(s => inRange(s.date)).flatMap(s => (s.payments || []).map(p => ({ date: s.date, type: 'Sale', ref: s.invoice, party: s.customerName || s.customer || 'Walk-in', method: p.method, amount: p.amount }))), ...state.expenses.filter(e => inRange(e.date) && e.status === 'paid').map(e => ({ date: e.date, type: 'Expense Refund', ref: e.reference, party: e.category, method: e.paymentMethod, amount: e.amount }))];
  const outflows = [...state.expenses.filter(e => inRange(e.date) && e.status === 'paid').map(e => ({ date: e.date, type: 'Expense', ref: e.reference, party: e.category, method: e.paymentMethod, amount: e.amount })), ...state.sales.filter(s => inRange(s.date)).flatMap(s => (s.refunds || []).map(r => ({ date: r.date, type: 'Refund', ref: s.invoice, party: s.customerName || s.customer || 'Walk-in', method: r.method, amount: r.amount })))];
  const allInflows = inflows;
  const allOutflows = outflows;
  const totalIn = allInflows.reduce((s, x) => s + num(x.amount), 0);
  const totalOut = allOutflows.reduce((s, x) => s + num(x.amount), 0);
  const netCash = rnd(totalIn - totalOut);
  const inByMethod = {};
  const outByMethod = {};
  allInflows.forEach(x => { inByMethod[x.method] = (inByMethod[x.method] || 0) + num(x.amount); });
  allOutflows.forEach(x => { outByMethod[x.method] = (outByMethod[x.method] || 0) + num(x.amount); });
  const byDate = {};
  allInflows.forEach(x => { byDate[x.date] = byDate[x.date] || { in: 0, out: 0 }; byDate[x.date].in += num(x.amount); });
  allOutflows.forEach(x => { byDate[x.date] = byDate[x.date] || { in: 0, out: 0 }; byDate[x.date].out += num(x.amount); });
  const cashInflows = allInflows.filter(x => x.method === 'Cash');
  const dateRangeLabel = '(' + t('From') + ' ' + fmtDate(start) + ' ' + t('to') + ' ' + fmtDate(end) + ')';

  const inMethodRows = Object.entries(inByMethod).map(([m, v]) => 
    '<tr><td>' + esc(m) + '</td><td class="mono align-right">' + money(v) + '</td><td class="mono align-right">' + allInflows.filter(x => x.method === m).length + '</td></tr>'
  ).join('');
  const emptyInMethodRow = '<tr><td colspan="3" class="align-center">' + t('No inflows') + '</td></tr>';

  const outMethodRows = Object.entries(outByMethod).map(([m, v]) => 
    '<tr><td>' + esc(m) + '</td><td class="mono align-right">' + money(v) + '</td><td class="mono align-right">' + allOutflows.filter(x => x.method === m).length + '</td></tr>'
  ).join('');
  const emptyOutMethodRow = '<tr><td colspan="3" class="align-center">' + t('No outflows') + '</td></tr>';

  const dailyRows = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).map(([d, v]) => 
    '<tr><td class="mono">' + fmtDate(d) + '</td><td class="mono align-right text-success">' + money(v.in) + '</td><td class="mono align-right text-danger">' + money(v.out) + '</td><td class="mono align-right ' + (rnd(v.in - v.out) >= 0 ? 'text-success' : 'text-danger') + '"><strong>' + money(rnd(v.in - v.out)) + '</strong></td></tr>'
  ).join('');
  const emptyDailyRow = '<tr><td colspan="4" class="align-center">' + t('No cash movements') + '</td></tr>';

  const inflowDetailRows = allInflows.sort((a, b) => new Date(b.date) - new Date(a.date)).map(x => 
    '<tr><td class="mono">' + fmtDate(x.date) + '</td><td>' + esc(x.type) + '</td><td><code class="mono">' + esc(x.ref) + '</code></td><td>' + esc(x.party) + '</td><td>' + esc(x.method) + '</td><td class="mono align-right text-success">' + money(x.amount) + '</td></tr>'
  ).join('');
  const emptyInflowRow = '<tr><td colspan="6" class="align-center">' + t('No inflows') + '</td></tr>';

  const outflowDetailRows = allOutflows.sort((a, b) => new Date(b.date) - new Date(a.date)).map(x => 
    '<tr><td class="mono">' + fmtDate(x.date) + '</td><td>' + esc(x.type) + '</td><td><code class="mono">' + esc(x.ref) + '</code></td><td>' + esc(x.party) + '</td><td>' + esc(x.method) + '</td><td class="mono align-right text-danger">' + money(x.amount) + '</td></tr>'
  ).join('');
  const emptyOutflowRow = '<tr><td colspan="6" class="align-center">' + t('No outflows') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Daily Cash Report')}</h1><p class="page-subtitle">${t('Cash flow statement - inflows and outflows')} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="cash">${t('Export CSV')}</button>
  <button class="btn btn-secondary" data-report-export-pdf="cash">${t('Export PDF')}</button>
</div></div></div>
<div class="metric-grid">
  ${card(t('Total Inflows'), money(totalIn), allInflows.length + ' ' + t('transactions'))}
  ${card(t('Total Outflows'), money(totalOut), allOutflows.length + ' ' + t('transactions'))}
  ${card(t('Net Cash Flow'), money(netCash), netCash >= 0 ? t('Positive') : t('Negative'))}
  ${card(t('Cash Sales'), money(cashInflows.reduce((s, x) => s + num(x.amount), 0)), t('Physical cash received'))}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Inflows by Method')}</h2></div><div class="card-body" style="padding:0">${rows([t('Method'), t('Amount'), t('Count')], inMethodRows || emptyInMethodRow)}</div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Outflows by Method')}</h2></div><div class="card-body" style="padding:0">${rows([t('Method'), t('Amount'), t('Count')], outMethodRows || emptyOutMethodRow)}</div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${t('Daily Cash Summary')}</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">${rows([t('Date'), t('Inflows'), t('Outflows'), t('Net')], dailyRows || emptyDailyRow)}</div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Cash Inflow Detail')}</h2></div><div class="card-body" style="padding:0;max-height:300px;overflow:auto">${rows([t('Date'), t('Type'), t('Ref'), t('Party'), t('Method'), t('Amount')], inflowDetailRows || emptyInflowRow)}</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Cash Outflow Detail')}</h2></div><div class="card-body" style="padding:0;max-height:300px;overflow:auto">${rows([t('Date'), t('Type'), t('Ref'), t('Party'), t('Method'), t('Amount')], outflowDetailRows || emptyOutflowRow)}</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Filters')}</h2></div><div class="card-body"><form id="cashFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${input('reportStartDate', t('From'), 'date', start, '')}${input('reportEndDate', t('To'), 'date', end, '')}</form></div></div>`;
}

const reportMap = { sales: salesReport, purchases: purchasesReport, stock: stockReport, metalbalances: metalBalancesReport, karigar: karigarReport, customers: customersReport, suppliers: suppliersReport, expenses: expensesReport, pnl: pnlReport, cash: cashReport };

export default function reports() {
  const reportType = state.reportType || 'sales';
  const fn = reportMap[reportType];
  if (fn) return fn();

  const totalsFn = totals();
  const balances = getAllMetalBalances();
  const goldBal = rnd(Object.values(balances).filter(b => b.metal === 'Gold').reduce((s, b) => s + b.balance, 0));
  const silverBal = rnd(Object.values(balances).filter(b => b.metal === 'Silver').reduce((s, b) => s + b.balance, 0));
  const stockCount = stock().length;

  const summaryCards = 
    card(t('Total Sales'), money(totalsFn.sales), t('Today')) +
    card(t('Stock Items'), stockCount + ' pcs') +
    card(t('Gold Balance'), goldBal.toFixed(3) + ' g') +
    card(t('Silver Balance'), silverBal.toFixed(3) + ' g') +
    card(t('Active Jobs'), state.jobs.filter(j => isJobActiveStatus(j.status)).length) +
    card(t('Total Karigars'), state.karigars.length);

  const reportButtons = [
    {id:'sales',title:t('Sales Report'),desc:t('Revenue, invoices, payment methods, metal breakdown')},
    {id:'purchases',title:t('Purchase Report'),desc:t('Metal purchases from suppliers, weight & value')},
    {id:'stock',title:t('Stock Valuation'),desc:t('Inventory at cost & selling price, margin analysis')},
    {id:'metalbalances',title:t('Gold/Silver Balances'),desc:t('Metal ledger balances by purity with period movement')},
    {id:'karigar',title:t('Karigar Outstanding'),desc:t('Metal issued, returned, wastage, labour due')},
    {id:'customers',title:t('Customer Balances'),desc:t('Receivables, credit limits, overdue accounts')},
    {id:'suppliers',title:t('Supplier Balances'),desc:t('Payables to metal suppliers, payment terms')},
    {id:'expenses',title:t('Expenses'),desc:t('Business expenses by category, monthly trend')},
    {id:'pnl',title:t('Profit & Loss'),desc:t('Revenue, COGS, expenses, net profit analysis')},
    {id:'cash',title:t('Daily Cash Report'),desc:t('Cash inflows/outflows, daily summary, payment methods')}
  ].map(r => '<button class="btn btn-secondary" style="height:120px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:16px" data-report-type="' + r.id + '"><strong style="font-size:1.1rem">' + r.title + '</strong><span class="small muted" style="margin-top:4px">' + r.desc + '</span></button>').join('');

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]}</h1><p class="page-subtitle">${PAGE_TITLES.reports[1]}</p></div><div class="page-header-actions">
  <button class="btn btn-outline-champagne" id="export">${t('Export JSON Backup')}</button>
</div></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Select Report')}</h2></div><div class="card-body">
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
    ${reportButtons}
  </div>
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Quick Summary')}</h2></div><div class="card-body" style="padding:0">
  <div class="metric-grid">${summaryCards}</div>
</div></div>`;
}