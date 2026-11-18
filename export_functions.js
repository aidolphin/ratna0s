function clearReportFilters(){
  state.reportStartDate='';
  state.reportEndDate='';
  state.reportFilterSupplier='all';
  state.reportFilterCustomer='all';
  state.reportFilterKarigar='all';
  state.reportFilterCategory='all';
  state.reportFilterMetal='all';
}

function exportReportCSV(type){
  const exportFn={
    sales: exportSalesCSV,
    purchases: exportPurchasesCSV,
    stock: exportStockCSV,
    metalbalances: exportMetalBalancesCSV,
    karigar: exportKarigarCSV,
    customers: exportCustomersCSV,
    suppliers: exportSuppliersCSV,
    expenses: exportExpensesCSV,
    pnl: exportPNLCSV,
    cash: exportCashCSV
  }[type];
  if(exportFn) exportFn();
  else alert('CSV export not implemented for '+type);
}

function exportReportPDF(type){
  const exportFn={
    sales: exportSalesPDF,
    purchases: exportPurchasesPDF,
    stock: exportStockPDF,
    metalbalances: exportMetalBalancesPDF,
    karigar: exportKarigarPDF,
    customers: exportCustomersPDF,
    suppliers: exportSuppliersPDF,
    expenses: exportExpensesPDF,
    pnl: exportPnlPDF,
    cash: exportCashPDF
  }[type];
  if(exportFn) exportFn();
  else alert('PDF export not implemented for '+type);
}

function getFilteredData(type){
  const startDate = state.reportStartDate || '';
  const endDate = state.reportEndDate || '';
  const inRange = (dateStr) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
    return true;
  };
  
  switch(type){
    case 'sales':
      return state.sales.filter(s => inRange(s.date));
    case 'purchases':
      return state.metalManagement.transactions.filter(t => t.type === 'PURCHASE' && inRange(t.date));
    case 'stock':
      return state.items.filter(i => i.status === 'stock');
    case 'metalbalances':
      return state.metalManagement.transactions.filter(t => inRange(t.date));
    case 'karigar':
      return state.karigars;
    case 'customers':
      return state.customers;
    case 'suppliers':
      return state.suppliers;
    case 'expenses':
      return state.expenses.filter(e => inRange(e.date));
    case 'pnl':
      return {sales: state.sales.filter(s => inRange(s.date)), expenses: state.expenses.filter(e => inRange(e.date) && e.status !== 'cancelled')};
    case 'cash':
      return {sales: state.sales.filter(s => inRange(s.date)), expenses: state.expenses.filter(e => inRange(e.date) && e.status === 'paid')};
  }
  return [];
}

function downloadCSV(filename, headers, rows){
  const csv = [headers.join(','), ...rows.map(r => r.map(c => '"'+String(c).replace(/"/g,'""')+'"').join(','))].join('\n');
  download(filename, csv, 'text/csv');
}

function generatePDFContent(title, subtitle, tables){
  const dateStr = new Date().toLocaleDateString();
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${esc(title)}</title>
<style>
body{font-family:Arial,sans-serif;padding:20px;color:#222}
h1{margin:0 0 4px;font-size:22px}
.subtitle{color:#666;margin-bottom:16px;font-size:13px}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:11px}
th,td{border:1px solid #ddd;padding:6px;text-align:left}
th{background:#f5f5f5;font-weight:600}
.align-right{text-align:right}
.mono{font-family:monospace}
.section-title{margin:20px 0 8px;font-size:14px;font-weight:600;color:#1a3a3a}
</style></head>
<body>
<h1>${esc(title)}</h1>
<div class="subtitle">${esc(subtitle)} · Generated: ${dateStr}</div>
${tables.map(t => `<div class="section-title">${esc(t.title)}</div>${t.html}`).join('')}
</body></html>`;
  return html;
}

function exportSalesCSV(){
  const data = getFilteredData('sales');
  const filterCustomer = state.reportFilterCustomer || 'all';
  let sales = data;
  if (filterCustomer !== 'all') sales = sales.filter(s => s.customerId === filterCustomer);
  
  const rows = sales.map(s => [
    new Date(s.date).toLocaleDateString(),
    s.invoice,
    s.customerName || s.customer || 'Walk-in',
    (s.items||[]).reduce((sum,it)=>sum+num(it.qty),0),
    num(s.subtotal).toFixed(2),
    num(s.discount).toFixed(2),
    num(s.tax).toFixed(2),
    num(s.total).toFixed(2),
    (s.payments||[]).map(p=>`${p.method} ${num(p.amount).toFixed(2)}`).join('; ')
  ]);
  downloadCSV('sales-report-'+new Date().toISOString().slice(0,10)+'.csv',
    ['Date','Invoice','Customer','Items','Subtotal','Discount','Tax','Total','Payments'], rows);
}

function exportPurchasesCSV(){
  const data = getFilteredData('purchases');
  const filterSupplier = state.reportFilterSupplier || 'all';
  let purchases = data;
  if (filterSupplier !== 'all') purchases = purchases.filter(t => t.karigar === filterSupplier);
  
  const rows = purchases.map(t => [
    t.date||'',
    t.type,
    t.metal,
    t.purity,
    num(t.weight).toFixed(3),
    num(t.rate).toFixed(2),
    num(t.value).toFixed(2),
    t.karigar||'-',
    t.reference||'-',
    t.notes||'-'
  ]);
  downloadCSV('purchase-report-'+new Date().toISOString().slice(0,10)+'.csv',
    ['Date','Type','Metal','Purity','Weight (g)','Rate/g','Value','Supplier','Reference','Notes'], rows);
}

function exportStockCSV(){
  const items = getFilteredData('stock');
  const filterCategory = state.reportFilterCategory || 'all';
  const filterMetal = state.reportFilterMetal || 'all';
  let list = items;
  if (filterCategory !== 'all') list = list.filter(i => i.category === filterCategory);
  if (filterMetal !== 'all') list = list.filter(i => (i.metalType||i.metal) === filterMetal);
  
  const rows = list.map(i => [
    i.sku||'',
    i.code||'',
    i.name||'',
    i.category||'',
    i.metalType||i.metal||'',
    String(i.purity||''),
    num(i.netWeight||i.weight).toFixed(3),
    num(calcItem.totalCost(i)).toFixed(2),
    num(i.sellingPrice).toFixed(2),
    num(i.marginPercent||0).toFixed(1)+'%',
    i.location||'-'
  ]);
  downloadCSV('stock-valuation-'+new Date().toISOString().slice(0,10)+'.csv',
    ['SKU','Code','Name','Category','Metal','Purity','Net Weight (g)','Cost','Selling Price','Margin %','Location'], rows);
}

function exportMetalBalancesCSV(){
  const txns = getFilteredData('metalbalances');
  const filterCategory = state.reportFilterCategory || 'all';
  let list = txns;
  if (filterCategory !== 'all') list = list.filter(t => t.type === filterCategory);
  const balances = getAllMetalBalances();
  
  const rows = [];
  Object.values(balances).forEach(b => {
    const inW = txns.filter(t=>t.metal===b.metal&&t.purity===b.purity&&['PURCHASE','RETURN','RECEIPT','OPENING_BALANCE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
    const outW = txns.filter(t=>t.metal===b.metal&&t.purity===b.purity&&['ISSUE','WASTAGE','SALE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
    const rate = b.metal==='Gold'?num(state.rates.gold):num(state.rates.silver);
    rows.push([
      b.metal, b.purity,
      b.opening.toFixed(3), inW.toFixed(3), outW.toFixed(3), b.balance.toFixed(3),
      num(rate).toFixed(2), num(rnd(b.balance*rate)).toFixed(2)
    ]);
  });
  downloadCSV('metal-balances-'+new Date().toISOString().slice(0,10)+'.csv',
    ['Metal','Purity','Opening','In Period','Out Period','Current Balance','Rate/g','Value'], rows);
}

function exportKarigarCSV(){
  const karigars = state.karigars.map(k => {
    const jobs = getKarigarJobs(k.id).map(j => { ensureJobShape(j); recalcJobFinancials(j); return j; });
    const issued = jobs.reduce((s, j) => s + getJobIssuedWeight(j), 0);
    const returned = jobs.reduce((s, j) => s + getJobReturnedWeight(j), 0);
    const net = rnd(Math.max(0, issued - returned));
    const wastage = jobs.reduce((s, j) => s + num(j.wastageActual || 0), 0);
    const labour = jobs.reduce((s, j) => s + num(j.labourCharges?.total || 0), 0);
    const advance = num(k.advance || 0);
    const balance = rnd(labour - advance);
    return {karigar: k, issued, returned, net, wastage, labour, advance, balance};
  });
  
  const rows = karigars.map(k => [
    k.karigar.name,
    (k.karigar.specialties||[]).join(', '),
    num(k.karigar.ratePerGram||0).toFixed(2),
    k.issued.toFixed(3),
    k.returned.toFixed(3),
    k.net.toFixed(3),
    k.wastage.toFixed(3),
    num(k.labour).toFixed(2),
    num(k.advance).toFixed(2),
    num(k.balance).toFixed(2)
  ]);
  downloadCSV('karigar-outstanding-'+new Date().toISOString().slice(0,10)+'.csv',
    ['Karigar','Specialties','Rate/g','Issued (g)','Returned (g)','Net (g)','Wastage (g)','Labour Earned','Advance','Outstanding'], rows);
}

function exportCustomersCSV(){
  const customers = state.customers.map(c => {
    const sales = state.sales.filter(s => s.customerId === c.id);
    const totalSales = sales.reduce((sum, s) => sum + num(s.total), 0);
    const totalPaid = sales.reduce((sum, s) => sum + (s.payments||[]).reduce((ps, p) => ps + num(p.amount), 0), 0);
    const balance = rnd(num(c.balance || 0) + totalSales - totalPaid);
    const creditLimit = num(c.creditLimit || 0);
    const utilization = creditLimit ? rnd(balance / creditLimit * 100) : 0;
    return {customer: c, totalSales, totalPaid, balance, creditLimit, utilization};
  }).filter(c => c.totalSales > 0 || num(c.customer.balance || 0) !== 0 || num(c.customer.creditLimit || 0) > 0);
  
  const rows = customers.map(c => [
    c.customer.name,
    c.customer.phone||'-',
    c.customer.email||'-',
    num(c.totalSales).toFixed(2),
    num(c.totalPaid).toFixed(2),
    num(c.balance).toFixed(2),
    num(c.creditLimit).toFixed(2),
    c.utilization.toFixed(1)+'%',
    c.balance>c.creditLimit&&c.creditLimit>0?'Over Limit':(c.balance<0?'Credit':'Active')
  ]);
  downloadCSV('customer-balances-'+new Date().toISOString().slice(0,10)+'.csv',
    ['Customer','Phone','Email','Total Sales','Total Paid','Balance','Credit Limit','Utilization %','Status'], rows);
}

function exportSuppliersCSV(){
  const suppliers = state.suppliers.map(s => {
    const purchases = state.metalManagement.transactions.filter(t => t.type === 'PURCHASE' && t.karigar === s.name);
    const totalPurchases = purchases.reduce((sum, t) => sum + num(t.value), 0);
    const totalWeight = purchases.reduce((sum, t) => sum + num(t.weight), 0);
    const balance = num(s.balance || 0);
    return {supplier: s, totalPurchases, totalWeight, balance};
  }).filter(s => s.totalPurchases > 0 || num(s.supplier.balance || 0) !== 0 || num(s.supplier.totalAmount || 0) > 0);
  
  const rows = suppliers.map(s => [
    s.supplier.name,
    s.supplier.contactPerson||'-',
    s.supplier.phone||'-',
    num(s.totalPurchases).toFixed(2),
    s.totalWeight.toFixed(3),
    num(s.balance).toFixed(2),
    s.supplier.paymentTerms||'-',
    s.balance>0?'Payable':(s.balance<0?'Advance':'Settled')
  ]);
  downloadCSV('supplier-balances-'+new Date().toISOString().slice(0,10)+'.csv',
    ['Supplier','Contact Person','Phone','Total Purchases','Weight (g)','Balance','Payment Terms','Status'], rows);
}

function exportExpensesCSV(){
  const data = getFilteredData('expenses');
  const filterCategory = state.reportFilterCategory || 'all';
  let expenses = data;
  if (filterCategory !== 'all') expenses = expenses.filter(e => e.category === filterCategory);
  
  const rows = expenses.map(e => [
    new Date(e.date).toLocaleDateString(),
    e.category,
    num(e.amount).toFixed(2),
    e.status,
    e.paymentMethod,
    e.reference||'-',
    e.notes||'-'
  ]);
  downloadCSV('expenses-report-'+new Date().toISOString().slice(0,10)+'.csv',
    ['Date','Category','Amount','Status','Payment Method','Reference','Notes'], rows);
}

function exportPNLCSV(){
  const {sales, expenses} = getFilteredData('pnl');
  
  const revenue = sales.reduce((sum, s) => sum + num(s.total), 0);
  const taxCollected = sales.reduce((sum, s) => sum + num(s.tax), 0);
  const discounts = sales.reduce((sum, s) => sum + num(s.discount), 0);
  const netRevenue = rnd(revenue - discounts);
  
  let cogs = 0;
  sales.forEach(s => {(s.items||[]).forEach(it => {const item = state.items.find(i => i.id === it.itemId); if(item) cogs += calcItem.totalCost(item) * num(it.qty);});});
  
  const grossProfit = rnd(netRevenue - cogs);
  const grossMargin = netRevenue ? rnd(grossProfit / netRevenue * 100) : 0;
  
  const opExpenses = expenses.reduce((sum, e) => sum + num(e.amount), 0);
  
  const labourCost = state.jobs
    .filter(j => {
      const d = j.completedAt || j.updatedAt || j.createdAt;
      const startDate = state.reportStartDate || '';
      const endDate = state.reportEndDate || '';
      if (startDate && new Date(d) < new Date(startDate)) return false;
      if (endDate && new Date(d) > new Date(endDate + 'T23:59:59')) return false;
      return true;
    })
    .reduce((sum, j) => sum + num(j.labourCharges?.total || 0), 0);
  
  const wastageCost = state.metalManagement.transactions
    .filter(t => {
      if (!state.reportStartDate && !state.reportEndDate) return t.type === 'WASTAGE';
      const d = t.date;
      if (state.reportStartDate && new Date(d) < new Date(state.reportStartDate)) return false;
      if (state.reportEndDate && new Date(d) > new Date(state.reportEndDate + 'T23:59:59')) return false;
      return t.type === 'WASTAGE';
    })
    .reduce((sum, t) => sum + num(t.value), 0);
  
  const directCosts = rnd(labourCost + wastageCost);
  const netProfit = rnd(grossProfit - opExpenses - directCosts);
  const netMargin = netRevenue ? rnd(netProfit / netRevenue * 100) : 0;
  
  const rows = [
    ['REVENUE',''],
    ['Gross Sales', money(revenue)],
    ['Less: Discounts', money(discounts)],
    ['Net Revenue', money(netRevenue)],
    ['Tax Collected ('+state.settings.taxLabel+')', money(taxCollected)],
    ['',''],
    ['COST OF GOODS SOLD',''],
    ['Cost of Items Sold', money(cogs)],
    ['',''],
    ['GROSS PROFIT',''],
    ['Net Revenue', money(netRevenue)],
    ['Less: COGS', money(cogs)],
    ['Gross Profit', money(grossProfit)],
    ['Gross Margin', grossMargin+'%'],
    ['',''],
    ['OPERATING EXPENSES',''],
    ...Object.entries(expenses.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+num(e.amount);return acc;},{})).map(([c,v])=>[c, money(v)]),
    ['Total Operating Expenses', money(opExpenses)],
    ['',''],
    ['DIRECT COSTS',''],
    ['Karigar Labour', money(labourCost)],
    ['Metal Wastage', money(wastageCost)],
    ['Total Direct Costs', money(directCosts)],
    ['',''],
    ['NET PROFIT',''],
    ['Gross Profit', money(grossProfit)],
    ['Less: Operating Expenses', money(opExpenses)],
    ['Less: Direct Costs', money(directCosts)],
    ['Net Profit / (Loss)', money(netProfit)],
    ['Net Margin', netMargin+'%']
  ];
  downloadCSV('profit-loss-'+new Date().toISOString().slice(0,10)+'.csv',
    ['Item','Amount'], rows);
}

function exportCashCSV(){
  const {sales, expenses} = getFilteredData('cash');
  
  const cashInflows = [];
  sales.forEach(s => {(s.payments||[]).forEach(p => {if (['Cash','Card','UPI','Wallet'].includes(p.method)) {cashInflows.push({date:s.date,type:'Sale',ref:s.invoice,party:s.customerName||s.customer||'Walk-in',method:p.method,amount:num(p.amount)});});});
  
  const cashOutflows = expenses
    .filter(e => ['Cash','Card','UPI','Wallet','Bank Transfer','Cheque'].includes(e.paymentMethod))
    .map(e => ({date:e.date,type:'Expense',ref:e.reference||'EXP',party:e.category,method:e.paymentMethod,amount:num(e.amount)}));
  
  const supplierPayments = state.metalManagement.transactions
    .filter(t => t.type === 'PURCHASE')
    .map(t => ({date:t.date,type:'Purchase',ref:t.reference,party:t.karigar||'Supplier',method:'Bank Transfer',amount:num(t.value)}));
  
  const karigarPayments = state.karigars
    .filter(k => num(k.advance || 0) > 0)
    .map(k => ({date:k.updatedAt||k.createdAt,type:'Labour Advance',ref:'ADV',party:k.name,method:'Cash',amount:num(k.advance)}));
  
  const allInflows = [...cashInflows];
  const allOutflows = [...cashOutflows, ...supplierPayments, ...karigarPayments];
  
  const rows = [
    ...allInflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>[new Date(x.date).toLocaleDateString(),x.type,x.ref,x.party,x.method,num(x.amount).toFixed(2)]),
    ['','','','','',''],
    ...allOutflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>[new Date(x.date).toLocaleDateString(),x.type,x.ref,x.party,x.method,num(x.amount).toFixed(2)])
  ];
  downloadCSV('cash-report-'+new Date().toISOString().slice(0,10)+'.csv',
    ['Date','Type','Reference','Party','Method','Amount'], rows);
}

function exportSalesPDF(){
  const data = getFilteredData('sales');
  const filterCustomer = state.reportFilterCustomer || 'all';
  let sales = data;
  if (filterCustomer !== 'all') sales = sales.filter(s => s.customerId === filterCustomer);
  
  const totalSales = sales.reduce((sum, s) => sum + num(s.total), 0);
  const totalTax = sales.reduce((sum, s) => sum + num(s.tax), 0);
  const totalDiscount = sales.reduce((sum, s) => sum + num(s.discount), 0);
  const totalItems = sales.reduce((sum, s) => sum + (s.items||[]).reduce((si, it) => si + num(it.qty), 0), 0);
  
  const detailRows = sales.map(s=>`<tr><td class="mono">${new Date(s.date).toLocaleDateString()}</td><td><code class="mono">${esc(s.invoice)}</code></td><td>${esc(s.customerName||s.customer||'Walk-in')}</td><td class="mono align-right">${(s.items||[]).reduce((sum,it)=>sum+num(it.qty),0)}</td><td class="mono align-right">${money(s.subtotal)}</td><td class="mono align-right">${money(s.discount)}</td><td class="mono align-right">${money(s.tax)}</td><td class="mono align-right"><strong>${money(s.total)}</strong></td><td>${(s.payments||[]).map(p=>`${esc(p.method)} ${money(p.amount)}`).join('<br>')}</td></tr>`).join('');
  
  const html = generatePDFContent('Sales Report', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Summary', html: `<table><tr><th>Metric</th><th class="align-right mono">Value</th></tr><tr><td>Total Sales</td><td class="align-right mono">${money(totalSales)}</td></tr><tr><td>Invoices</td><td class="align-right mono">${sales.length}</td></tr><tr><td>Items Sold</td><td class="align-right mono">${totalItems}</td></tr><tr><td>Total Discount</td><td class="align-right mono">${money(totalDiscount)}</td></tr><tr><td>Total Tax</td><td class="align-right mono">${money(totalTax)}</td></tr></table>`},
    {title: 'Sales Detail', html: `<table><thead><tr><th>Date</th><th>Invoice</th><th>Customer</th><th class="align-right mono">Items</th><th class="align-right mono">Subtotal</th><th class="align-right mono">Discount</th><th class="align-right mono">Tax</th><th class="align-right mono">Total</th><th>Payments</th></tr></thead><tbody>${detailRows||'<tr><td colspan="9" class="align-center">No sales</td></tr>'}</tbody></table>`}
  ]);
  download('sales-report-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}

function exportPurchasesPDF(){
  const data = getFilteredData('purchases');
  const filterSupplier = state.reportFilterSupplier || 'all';
  let purchases = data;
  if (filterSupplier !== 'all') purchases = purchases.filter(t => t.karigar === filterSupplier);
  
  const totalValue = purchases.reduce((sum, t) => sum + num(t.value), 0);
  const totalWeight = purchases.reduce((sum, t) => sum + num(t.weight), 0);
  
  const detailRows = purchases.map(t=>`<tr><td class="mono">${esc(t.date||'')}</td><td>${esc(t.type)}</td><td>${esc(t.metal)}</td><td class="mono">${esc(t.purity)}</td><td class="mono align-right">${num(t.weight).toFixed(3)}</td><td class="mono align-right">${money(t.rate)}</td><td class="mono align-right">${money(t.value)}</td><td>${esc(t.karigar||'-')}</td><td><code class="mono">${esc(t.reference||'-')}</code></td><td>${esc(t.notes||'-')}</td></tr>`).join('');
  
  const html = generatePDFContent('Purchase Report', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Summary', html: `<table><tr><th>Metric</th><th class="align-right mono">Value</th></tr><tr><td>Total Purchases</td><td class="align-right mono">${money(totalValue)}</td></tr><tr><td>Transactions</td><td class="align-right mono">${purchases.length}</td></tr><tr><td>Total Weight</td><td class="align-right mono">${totalWeight.toFixed(3)} g</td></tr><tr><td>Avg Rate/g</td><td class="align-right mono">${totalWeight?money(rnd(totalValue/totalWeight)):'-'}</td></tr></table>`},
    {title: 'Purchase Detail', html: `<table><thead><tr><th>Date</th><th>Type</th><th>Metal</th><th>Purity</th><th class="align-right mono">Weight (g)</th><th class="align-right mono">Rate/g</th><th class="align-right mono">Value</th><th>Supplier</th><th>Reference</th><th>Notes</th></tr></thead><tbody>${detailRows||'<tr><td colspan="10" class="align-center">No purchases</td></tr>'}</tbody></table>`}
  ]);
  download('purchase-report-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}

function exportStockPDF(){
  const items = getFilteredData('stock');
  const filterCategory = state.reportFilterCategory || 'all';
  const filterMetal = state.reportFilterMetal || 'all';
  let list = items;
  if (filterCategory !== 'all') list = list.filter(i => i.category === filterCategory);
  if (filterMetal !== 'all') list = list.filter(i => (i.metalType||i.metal) === filterMetal);
  
  const totalItems = list.length;
  const totalWeight = list.reduce((sum, i) => sum + num(i.netWeight || i.weight), 0);
  const totalCost = list.reduce((sum, i) => sum + num(calcItem.totalCost(i)), 0);
  const totalSelling = list.reduce((sum, i) => sum + num(i.sellingPrice), 0);
  
  const detailRows = list.map(i=>`<tr><td><code class="mono">${esc(i.sku)}</code></td><td>${esc(i.name)}</td><td>${esc(i.category)}</td><td>${esc(i.metalType||i.metal)}</td><td class="mono">${esc(i.purity)}</td><td class="mono align-right">${num(i.netWeight||i.weight).toFixed(3)}</td><td class="mono align-right">${money(calcItem.totalCost(i))}</td><td class="mono align-right">${money(i.sellingPrice)}</td><td class="mono align-right">${num(i.marginPercent||0).toFixed(1)}%</td><td>${esc(i.location||'-')}</td></tr>`).join('');
  
  const html = generatePDFContent('Stock Valuation Report', `As of ${new Date().toLocaleDateString()}`, [
    {title: 'Summary', html: `<table><tr><th>Metric</th><th class="align-right mono">Value</th></tr><tr><td>Total Items</td><td class="align-right mono">${totalItems} pcs</td></tr><tr><td>Total Weight</td><td class="align-right mono">${totalWeight.toFixed(3)} g</td></tr><tr><td>Stock at Cost</td><td class="align-right mono">${money(totalCost)}</td></tr><tr><td>Stock at Selling</td><td class="align-right mono">${money(totalSelling)}</td></tr><tr><td>Potential Profit</td><td class="align-right mono">${money(rnd(totalSelling-totalCost))}</td></tr></table>`},
    {title: 'Stock Detail', html: `<table><thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Metal</th><th>Purity</th><th class="align-right mono">Net (g)</th><th class="align-right mono">Cost</th><th class="align-right mono">Selling</th><th class="align-right mono">Margin %</th><th>Location</th></tr></thead><tbody>${detailRows||'<tr><td colspan="10" class="align-center">No stock</td></tr>'}</tbody></table>`}
  ]);
  download('stock-valuation-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}

function exportMetalBalancesPDF(){
  const txns = getFilteredData('metalbalances');
  const filterCategory = state.reportFilterCategory || 'all';
  let list = txns;
  if (filterCategory !== 'all') list = list.filter(t => t.type === filterCategory);
  const balances = getAllMetalBalances();
  
  const goldBalances = Object.values(balances).filter(b => b.metal === 'Gold');
  const silverBalances = Object.values(balances).filter(b => b.metal === 'Silver');
  const totalGold = goldBalances.reduce((s, b) => s + b.balance, 0);
  const totalSilver = silverBalances.reduce((s, b) => s + b.balance, 0);
  const goldValue = rnd(totalGold * num(state.rates.gold));
  const silverValue = rnd(totalSilver * num(state.rates.silver));
  
  const goldRows = goldBalances.map(b=>{
    const inW = txns.filter(t=>t.metal==='Gold'&&t.purity===b.purity&&['PURCHASE','RETURN','RECEIPT','OPENING_BALANCE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
    const outW = txns.filter(t=>t.metal==='Gold'&&t.purity===b.purity&&['ISSUE','WASTAGE','SALE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
    return `<tr><td class="mono">${esc(b.purity)}</td><td class="mono align-right">${b.opening.toFixed(3)}</td><td class="mono align-right text-success">+${inW.toFixed(3)}</td><td class="mono align-right text-danger">-${outW.toFixed(3)}</td><td class="mono align-right"><strong>${b.balance.toFixed(3)}</strong></td><td class="mono align-right">${money(num(state.rates.gold))}</td><td class="mono align-right">${money(rnd(b.balance*num(state.rates.gold)))}</td></tr>`;
  }).join('');
  
  const silverRows = silverBalances.map(b=>{
    const inW = txns.filter(t=>t.metal==='Silver'&&t.purity===b.purity&&['PURCHASE','RETURN','RECEIPT','OPENING_BALANCE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
    const outW = txns.filter(t=>t.metal==='Silver'&&t.purity===b.purity&&['ISSUE','WASTAGE','SALE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
    return `<tr><td class="mono">${esc(b.purity)}</td><td class="mono align-right">${b.opening.toFixed(3)}</td><td class="mono align-right text-success">+${inW.toFixed(3)}</td><td class="mono align-right text-danger">-${outW.toFixed(3)}</td><td class="mono align-right"><strong>${b.balance.toFixed(3)}</strong></td><td class="mono align-right">${money(num(state.rates.silver))}</td><td class="mono align-right">${money(rnd(b.balance*num(state.rates.silver)))}</td></tr>`;
  }).join('');
  
  const html = generatePDFContent('Gold/Silver Balances Report', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Summary', html: `<table><tr><th>Metal</th><th class="align-right mono">Balance (g)</th><th class="align-right mono">Rate/g</th><th class="align-right mono">Value</th></tr><tr><td>Gold</td><td class="align-right mono">${totalGold.toFixed(3)}</td><td class="align-right mono">${money(num(state.rates.gold))}</td><td class="align-right mono">${money(goldValue)}</td></tr><tr><td>Silver</td><td class="align-right mono">${totalSilver.toFixed(3)}</td><td class="align-right mono">${money(num(state.rates.silver))}</td><td class="align-right mono">${money(silverValue)}</td></tr><tr><td><strong>Combined</strong></td><td></td><td></td><td class="align-right mono"><strong>${money(goldValue+silverValue)}</strong></td></tr></table>`},
    {title: 'Gold Balance by Purity', html: `<table><thead><tr><th>Purity</th><th class="align-right mono">Opening</th><th class="align-right mono">In</th><th class="align-right mono">Out</th><th class="align-right mono">Current</th><th class="align-right mono">Rate/g</th><th class="align-right mono">Value</th></tr></thead><tbody>${goldRows||'<tr><td colspan="7" class="align-center">No gold balances</td></tr>'}</tbody></table>`},
    {title: 'Silver Balance by Purity', html: `<table><thead><tr><th>Purity</th><th class="align-right mono">Opening</th><th class="align-right mono">In</th><th class="align-right mono">Out</th><th class="align-right mono">Current</th><th class="align-right mono">Rate/g</th><th class="align-right mono">Value</th></tr></thead><tbody>${silverRows||'<tr><td colspan="7" class="align-center">No silver balances</td></tr>'}</tbody></table>`}
  ]);
  download('metal-balances-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}

function exportKarigarPDF(){
  const karigars = state.karigars.map(k => {
    const jobs = getKarigarJobs(k.id).map(j => { ensureJobShape(j); recalcJobFinancials(j); return j; });
    const issued = jobs.reduce((s, j) => s + getJobIssuedWeight(j), 0);
    const returned = jobs.reduce((s, j) => s + getJobReturnedWeight(j), 0);
    const net = rnd(Math.max(0, issued - returned));
    const wastage = jobs.reduce((s, j) => s + num(j.wastageActual || 0), 0);
    const labour = jobs.reduce((s, j) => s + num(j.labourCharges?.total || 0), 0);
    const advance = num(k.advance || 0);
    const balance = rnd(labour - advance);
    return {karigar: k, jobs, issued, returned, net, wastage, labour, advance, balance};
  });
  
  const totalIssued = karigars.reduce((s, k) => s + k.issued, 0);
  const totalReturned = karigars.reduce((s, k) => s + k.returned, 0);
  const totalNet = karigars.reduce((s, k) => s + k.net, 0);
  const totalWastage = karigars.reduce((s, k) => s + k.wastage, 0);
  const totalLabour = karigars.reduce((s, k) => s + k.labour, 0);
  const totalAdvance = karigars.reduce((s, k) => s + k.advance, 0);
  const totalOutstanding = karigars.reduce((s, k) => s + k.balance, 0);
  
  const rows = karigars.map(k=>`<tr><td><strong>${esc(k.karigar.name)}</strong></td><td>${esc((k.karigar.specialties||[]).join(', ')||'-')}</td><td class="mono align-right">${money(num(k.karigar.ratePerGram))}</td><td class="mono align-right">${k.issued.toFixed(3)}</td><td class="mono align-right">${k.returned.toFixed(3)}</td><td class="mono align-right"><strong>${k.net.toFixed(3)}</strong></td><td class="mono align-right">${k.wastage.toFixed(3)}</td><td class="mono align-right">${money(k.labour)}</td><td class="mono align-right">${money(k.advance)}</td><td class="mono align-right ${k.balance<0?'text-danger':''}"><strong>${money(k.balance)}</strong></td></tr>`).join('');
  
  const html = generatePDFContent('Karigar Outstanding Report', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Summary', html: `<table><tr><th>Metric</th><th class="align-right mono">Value</th></tr><tr><td>Total Metal Issued</td><td class="align-right mono">${totalIssued.toFixed(3)} g</td></tr><tr><td>Total Returned</td><td class="align-right mono">${totalReturned.toFixed(3)} g</td></tr><tr><td>Net Outstanding</td><td class="align-right mono">${totalNet.toFixed(3)} g</td></tr><tr><td>Total Wastage</td><td class="align-right mono">${totalWastage.toFixed(3)} g</td></tr><tr><td>Total Labour Earned</td><td class="align-right mono">${money(totalLabour)}</td></tr><tr><td>Total Advances</td><td class="align-right mono">${money(totalAdvance)}</td></tr><tr><td>Labour Outstanding</td><td class="align-right mono">${money(totalOutstanding)}</td></tr></table>`},
    {title: 'Karigar Detail', html: `<table><thead><tr><th>Karigar</th><th>Specialties</th><th class="align-right mono">Rate/g</th><th class="align-right mono">Issued (g)</th><th class="align-right mono">Returned (g)</th><th class="align-right mono">Net (g)</th><th class="align-right mono">Wastage (g)</th><th class="align-right mono">Labour Earned</th><th class="align-right mono">Advance</th><th class="align-right mono">Outstanding</th></tr></thead><tbody>${rows||'<tr><td colspan="11" class="align-center">No karigars</td></tr>'}</tbody></table>`}
  ]);
  download('karigar-outstanding-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}

function exportCustomersPDF(){
  const customers = state.customers.map(c => {
    const sales = state.sales.filter(s => s.customerId === c.id);
    const totalSales = sales.reduce((sum, s) => sum + num(s.total), 0);
    const totalPaid = sales.reduce((sum, s) => sum + (s.payments||[]).reduce((ps, p) => ps + num(p.amount), 0), 0);
    const balance = rnd(num(c.balance || 0) + totalSales - totalPaid);
    const creditLimit = num(c.creditLimit || 0);
    const utilization = creditLimit ? rnd(balance / creditLimit * 100) : 0;
    return {customer: c, totalSales, totalPaid, balance, creditLimit, utilization};
  }).filter(c => c.totalSales > 0 || num(c.customer.balance || 0) !== 0 || num(c.customer.creditLimit || 0) > 0);
  
  const totalReceivable = customers.reduce((s, c) => s + Math.max(0, c.balance), 0);
  const totalCreditLimit = customers.reduce((s, c) => s + c.creditLimit, 0);
  const overdueCustomers = customers.filter(c => c.balance > c.creditLimit && c.creditLimit > 0).length;
  
  const rows = customers.map(c=>`<tr><td><strong>${esc(c.customer.name)}</strong></td><td>${esc(c.customer.phone||'-')}</td><td class="mono align-right">${money(c.totalSales)}</td><td class="mono align-right">${money(c.totalPaid)}</td><td class="mono align-right ${c.balance<0?'text-success':(c.balance>c.creditLimit&&c.creditLimit>0?'text-danger':'')}"><strong>${money(c.balance)}</strong></td><td class="mono align-right">${money(c.creditLimit)}</td><td class="mono align-right">${c.utilization.toFixed(1)}%</td><td>${c.balance>c.creditLimit&&c.creditLimit>0?'Over Limit':c.balance<0?'Credit':'Active'}</td></tr>`).join('');
  
  const html = generatePDFContent('Customer Balances Report', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Summary', html: `<table><tr><th>Metric</th><th class="align-right mono">Value</th></tr><tr><td>Total Receivables</td><td class="align-right mono">${money(totalReceivable)}</td></tr><tr><td>Total Credit Limits</td><td class="align-right mono">${money(totalCreditLimit)}</td></tr><tr><td>Overdue Accounts</td><td class="align-right mono">${overdueCustomers}</td></tr><tr><td>Customers with Activity</td><td class="align-right mono">${customers.length}</td></tr></table>`},
    {title: 'Customer Detail', html: `<table><thead><tr><th>Customer</th><th>Phone</th><th class="align-right mono">Sales</th><th class="align-right mono">Paid</th><th class="align-right mono">Balance</th><th class="align-right mono">Credit Limit</th><th class="align-right mono">Utilization %</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="8" class="align-center">No customer activity</td></tr>'}</tbody></table>`}
  ]);
  download('customer-balances-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}

function exportSuppliersPDF(){
  const suppliers = state.suppliers.map(s => {
    const purchases = state.metalManagement.transactions.filter(t => t.type === 'PURCHASE' && t.karigar === s.name);
    const totalPurchases = purchases.reduce((sum, t) => sum + num(t.value), 0);
    const totalWeight = purchases.reduce((sum, t) => sum + num(t.weight), 0);
    const balance = num(s.balance || 0);
    return {supplier: s, totalPurchases, totalWeight, balance};
  }).filter(s => s.totalPurchases > 0 || num(s.supplier.balance || 0) !== 0 || num(s.supplier.totalAmount || 0) > 0);
  
  const totalPayable = suppliers.reduce((s, sup) => s + Math.max(0, sup.balance), 0);
  const totalPurchaseValue = suppliers.reduce((s, sup) => s + sup.totalPurchases, 0);
  
  const rows = suppliers.map(s=>`<tr><td><strong>${esc(s.supplier.name)}</strong></td><td>${esc(s.supplier.contactPerson||'-')}</td><td class="mono align-right">${money(s.totalPurchases)}</td><td class="mono align-right">${s.totalWeight.toFixed(3)}</td><td class="mono align-right ${s.balance>0?'text-danger':s.balance<0?'text-success':''}"><strong>${money(s.balance)}</strong></td><td>${esc(s.supplier.paymentTerms||'-')}</td><td>${s.balance>0?'Payable':s.balance<0?'Advance':'Settled'}</td></tr>`).join('');
  
  const html = generatePDFContent('Supplier Balances Report', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Summary', html: `<table><tr><th>Metric</th><th class="align-right mono">Value</th></tr><tr><td>Total Payables</td><td class="align-right mono">${money(totalPayable)}</td></tr><tr><td>Period Purchases</td><td class="align-right mono">${money(totalPurchaseValue)}</td></tr><tr><td>Suppliers with Balance</td><td class="align-right mono">${suppliers.filter(s=>s.balance!==0).length}</td></tr></table>`},
    {title: 'Supplier Detail', html: `<table><thead><tr><th>Supplier</th><th>Contact</th><th class="align-right mono">Purchases</th><th class="align-right mono">Weight (g)</th><th class="align-right mono">Balance</th><th>Payment Terms</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="align-center">No supplier activity</td></tr>'}</tbody></table>`}
  ]);
  download('supplier-balances-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}

function exportExpensesPDF(){
  const data = getFilteredData('expenses');
  const filterCategory = state.reportFilterCategory || 'all';
  let expenses = data;
  if (filterCategory !== 'all') expenses = expenses.filter(e => e.category === filterCategory);
  
  const totals = getExpenseTotals(state.reportStartDate, state.reportEndDate);
  const byStatus = {paid: 0, pending: 0, overdue: 0};
  expenses.forEach(e => { if (byStatus[e.status] !== undefined) byStatus[e.status] += num(e.amount); });
  
  const byCatRows = Object.entries(totals.byCat).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td>${esc(c)}</td><td class="mono align-right">${money(v)}</td><td class="mono align-right">${totals.total?rnd(v/totals.total*100):0}%</td><td class="mono align-right">${expenses.filter(e=>e.category===c).length}</td></tr>`).join('');
  
  const detailRows = expenses.map(e=>`<tr><td class="mono">${new Date(e.date).toLocaleDateString()}</td><td>${esc(e.category)}</td><td class="mono align-right">${money(e.amount)}</td><td>${e.status==='paid'?'Paid':e.status==='pending'?'Pending':'Overdue'}</td><td>${esc(e.paymentMethod)}</td><td><code class="mono">${esc(e.reference||'-')}</code></td><td>${esc(e.notes||'-')}</td></tr>`).join('');
  
  const html = generatePDFContent('Expenses Report', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Summary', html: `<table><tr><th>Metric</th><th class="align-right mono">Value</th></tr><tr><td>Total Expenses</td><td class="align-right mono">${money(totals.total)}</td></tr><tr><td>Paid</td><td class="align-right mono">${money(byStatus.paid)}</td></tr><tr><td>Pending</td><td class="align-right mono">${money(byStatus.pending)}</td></tr><tr><td>Overdue</td><td class="align-right mono">${money(byStatus.overdue)}</td></tr></table>`},
    {title: 'By Category', html: `<table><thead><tr><th>Category</th><th class="align-right mono">Amount</th><th class="align-right mono">%</th><th class="align-right mono">Count</th></tr></thead><tbody>${byCatRows||'<tr><td colspan="4" class="align-center">No expenses</td></tr>'}</tbody></table>`},
    {title: 'Expense Detail', html: `<table><thead><tr><th>Date</th><th>Category</th><th class="align-right mono">Amount</th><th>Status</th><th>Payment Method</th><th>Reference</th><th>Notes</th></tr></thead><tbody>${detailRows||'<tr><td colspan="7" class="align-center">No expenses</td></tr>'}</tbody></table>`}
  ]);
  download('expenses-report-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}

function exportPnlPDF(){
  const {sales, expenses} = getFilteredData('pnl');
  
  const revenue = sales.reduce((sum, s) => sum + num(s.total), 0);
  const taxCollected = sales.reduce((sum, s) => sum + num(s.tax), 0);
  const discounts = sales.reduce((sum, s) => sum + num(s.discount), 0);
  const netRevenue = rnd(revenue - discounts);
  
  let cogs = 0;
  sales.forEach(s => {(s.items||[]).forEach(it => {const item = state.items.find(i => i.id === it.itemId); if(item) cogs += calcItem.totalCost(item) * num(it.qty);});});
  
  const grossProfit = rnd(netRevenue - cogs);
  const grossMargin = netRevenue ? rnd(grossProfit / netRevenue * 100) : 0;
  
  const opExpenses = expenses.reduce((sum, e) => sum + num(e.amount), 0);
  const expensesByCat = {};
  expenses.forEach(e => { expensesByCat[e.category] = (expensesByCat[e.category] || 0) + num(e.amount); });
  
  const labourCost = state.jobs
    .filter(j => {
      const d = j.completedAt || j.updatedAt || j.createdAt;
      const startDate = state.reportStartDate || '';
      const endDate = state.reportEndDate || '';
      if (startDate && new Date(d) < new Date(startDate)) return false;
      if (endDate && new Date(d) > new Date(endDate + 'T23:59:59')) return false;
      return true;
    })
    .reduce((sum, j) => sum + num(j.labourCharges?.total || 0), 0);
  
  const wastageCost = state.metalManagement.transactions
    .filter(t => {
      if (!state.reportStartDate && !state.reportEndDate) return t.type === 'WASTAGE';
      const d = t.date;
      if (state.reportStartDate && new Date(d) < new Date(state.reportStartDate)) return false;
      if (state.reportEndDate && new Date(d) > new Date(state.reportEndDate + 'T23:59:59')) return false;
      return t.type === 'WASTAGE';
    })
    .reduce((sum, t) => sum + num(t.value), 0);
  
  const directCosts = rnd(labourCost + wastageCost);
  const netProfit = rnd(grossProfit - opExpenses - directCosts);
  const netMargin = netRevenue ? rnd(netProfit / netRevenue * 100) : 0;
  
  const catRows = Object.entries(expensesByCat).map(([c,v])=>`<tr><td>${esc(c)}</td><td class="mono align-right">${money(v)}</td></tr>`).join('');
  
  const html = generatePDFContent('Profit & Loss Statement', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Revenue', html: `<table><tr><th>Item</th><th class="align-right mono">Amount</th></tr><tr><td>Gross Sales</td><td class="align-right mono">${money(revenue)}</td></tr><tr><td>Less: Discounts</td><td class="align-right mono">${money(discounts)}</td></tr><tr><td><strong>Net Revenue</strong></td><td class="align-right mono"><strong>${money(netRevenue)}</strong></td></tr><tr><td>Tax Collected (${state.settings.taxLabel})</td><td class="align-right mono">${money(taxCollected)}</td></tr></table>`},
    {title: 'Cost of Goods Sold', html: `<table><tr><th>Item</th><th class="align-right mono">Amount</th></tr><tr><td>Cost of Items Sold</td><td class="align-right mono">${money(cogs)}</td></tr></table>`},
    {title: 'Gross Profit', html: `<table><tr><th>Item</th><th class="align-right mono">Amount</th></tr><tr><td>Net Revenue</td><td class="align-right mono">${money(netRevenue)}</td></tr><tr><td>Less: COGS</td><td class="align-right mono">${money(cogs)}</td></tr><tr><td><strong>Gross Profit</strong></td><td class="align-right mono"><strong>${money(grossProfit)}</strong></td></tr><tr><td>Gross Margin</td><td class="align-right mono">${grossMargin}%</td></tr></table>`},
    {title: 'Operating Expenses', html: `<table><tr><th>Category</th><th class="align-right mono">Amount</th></tr>${catRows}<tr style="border-top:2px solid #333"><td><strong>Total Operating Expenses</strong></td><td class="align-right mono"><strong>${money(opExpenses)}</strong></td></tr></table>`},
    {title: 'Direct Costs', html: `<table><tr><th>Item</th><th class="align-right mono">Amount</th></tr><tr><td>Karigar Labour</td><td class="align-right mono">${money(labourCost)}</td></tr><tr><td>Metal Wastage</td><td class="align-right mono">${money(wastageCost)}</td></tr><tr style="border-top:2px solid #333"><td><strong>Total Direct Costs</strong></td><td class="align-right mono"><strong>${money(directCosts)}</strong></td></tr></table>`},
    {title: 'Net Profit', html: `<table><tr><th>Item</th><th class="align-right mono">Amount</th></tr><tr><td>Gross Profit</td><td class="align-right mono">${money(grossProfit)}</td></tr><tr><td>Less: Operating Expenses</td><td class="align-right mono">${money(opExpenses)}</td></tr><tr><td>Less: Direct Costs</td><td class="align-right mono">${money(directCosts)}</td></tr><tr style="border-top:2px solid #333"><td><strong>Net Profit / (Loss)</strong></td><td class="align-right mono ${netProfit>=0?'':'text-danger'}"><strong>${money(netProfit)}</strong></td></tr><tr><td>Net Margin</td><td class="align-right mono">${netMargin}%</td></tr></table>`}
  ]);
  download('profit-loss-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}

function exportCashPDF(){
  const {sales, expenses} = getFilteredData('cash');
  
  const cashInflows = [];
  sales.forEach(s => {(s.payments||[]).forEach(p => {if (['Cash','Card','UPI','Wallet'].includes(p.method)) {cashInflows.push({date:s.date,type:'Sale',ref:s.invoice,party:s.customerName||s.customer||'Walk-in',method:p.method,amount:num(p.amount)});});});
  
  const cashOutflows = expenses
    .filter(e => ['Cash','Card','UPI','Wallet','Bank Transfer','Cheque'].includes(e.paymentMethod))
    .map(e => ({date:e.date,type:'Expense',ref:e.reference||'EXP',party:e.category,method:e.paymentMethod,amount:num(e.amount)}));
  
  const supplierPayments = state.metalManagement.transactions
    .filter(t => t.type === 'PURCHASE')
    .map(t => ({date:t.date,type:'Purchase',ref:t.reference,party:t.karigar||'Supplier',method:'Bank Transfer',amount:num(t.value)}));
  
  const karigarPayments = state.karigars
    .filter(k => num(k.advance || 0) > 0)
    .map(k => ({date:k.updatedAt||k.createdAt,type:'Labour Advance',ref:'ADV',party:k.name,method:'Cash',amount:num(k.advance)}));
  
  const allInflows = [...cashInflows];
  const allOutflows = [...cashOutflows, ...supplierPayments, ...karigarPayments];
  
  const totalIn = allInflows.reduce((s, x) => s + x.amount, 0);
  const totalOut = allOutflows.reduce((s, x) => s + x.amount, 0);
  const netCash = rnd(totalIn - totalOut);
  
  const inRows = allInflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<tr><td class="mono">${new Date(x.date).toLocaleDateString()}</td><td>${esc(x.type)}</td><td><code class="mono">${esc(x.ref)}</code></td><td>${esc(x.party)}</td><td>${esc(x.method)}</td><td class="mono align-right">${money(x.amount)}</td></tr>`).join('');
  const outRows = allOutflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<tr><td class="mono">${new Date(x.date).toLocaleDateString()}</td><td>${esc(x.type)}</td><td><code class="mono">${esc(x.ref)}</code></td><td>${esc(x.party)}</td><td>${esc(x.method)}</td><td class="mono align-right">${money(x.amount)}</td></tr>`).join('');
  
  const html = generatePDFContent('Daily Cash Report', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Summary', html: `<table><tr><th>Metric</th><th class="align-right mono">Value</th></tr><tr><td>Total Inflows</td><td class="align-right mono">${money(totalIn)}</td></tr><tr><td>Total Outflows</td><td class="align-right mono">${money(totalOut)}</td></tr><tr><td><strong>Net Cash Flow</strong></td><td class="align-right mono ${netCash>=0?'':'text-danger'}"><strong>${money(netCash)}</strong></td></tr></table>`},
    {title: 'Cash Inflows', html: `<table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Party</th><th>Method</th><th class="align-right mono">Amount</th></tr></thead><tbody>${inRows||'<tr><td colspan="6" class="align-center">No inflows</td></tr>'}</tbody></table>`},
    {title: 'Cash Outflows', html: `<table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Party</th><th>Method</th><th class="align-right mono">Amount</th></tr></thead><tbody>${outRows||'<tr><td colspan="6" class="align-center">No outflows</td></tr>'}</tbody></table>`}
  ]);
  download('cash-report-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}