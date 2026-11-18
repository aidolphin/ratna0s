const fs = require('fs');
let content = fs.readFileSync('src.js', 'utf8');

// Replace the reports function with comprehensive version
const newReportsFunction = `function reports(){
  // Get filter state
  const reportType = state.reportType || 'sales';
  const startDate = state.reportStartDate || '';
  const endDate = state.reportEndDate || '';
  const filterSupplier = state.reportFilterSupplier || 'all';
  const filterCustomer = state.reportFilterCustomer || 'all';
  const filterKarigar = state.reportFilterKarigar || 'all';
  const filterCategory = state.reportFilterCategory || 'all';

  // Date filter helper
  function inRange(dateStr) {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
    return true;
  }

  // Calculate date range label
  const dateRangeLabel = (startDate || endDate) 
    ? \`(\${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} \u2192 \${endDate ? new Date(endDate).toLocaleDateString() : 'End'})\`
    : '(All dates)';

  // === SALES REPORT ===
  if (reportType === 'sales') {
    let sales = state.sales.filter(s => inRange(s.date));
    if (filterCustomer !== 'all') sales = sales.filter(s => s.customerId === filterCustomer);
    
    const totalSales = sales.reduce((sum, s) => sum + num(s.total), 0);
    const totalTax = sales.reduce((sum, s) => sum + num(s.tax), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + num(s.discount), 0);
    const totalItems = sales.reduce((sum, s) => sum + (s.items||[]).reduce((si, it) => si + num(it.qty), 0), 0);
    const avgSale = sales.length ? rnd(totalSales / sales.length) : 0;

    // Sales by payment method
    const byPayment = {};
    sales.forEach(s => {
      (s.payments||[]).forEach(p => {
        byPayment[p.method] = (byPayment[p.method] || 0) + num(p.amount);
      });
    });

    // Sales by metal type
    const byMetal = {Gold: 0, Silver: 0, Platinum: 0, Other: 0};
    sales.forEach(s => {
      (s.items||[]).forEach(it => {
        const metal = it.metalType || it.metal || 'Other';
        byMetal[metal] = (byMetal[metal] || 0) + num(it.total);
      });
    });

    return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]} - Sales Report</h1><p class="page-subtitle">\${PAGE_TITLES.reports[1]} \${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="sales">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="sales">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  \${card('Total Sales', money(totalSales), \`\${sales.length} invoices\`)}
  \${card('Total Tax', money(totalTax), \`\${state.settings.taxLabel} @ \${state.settings.taxRate}%\`)}
  \${card('Total Discount', money(totalDiscount))}
  \${card('Avg Sale Value', money(avgSale), \`\${totalItems} items sold\`)}
</div>
<div class="layout">
  <div>
    <div class="card"><div class="card-header"><h2 class="card-title">Sales by Payment Method</h2></div><div class="card-body" style="padding:0">
      \${rows(['Method','Amount','%'], Object.entries(byPayment).map(([m,v])=>\`<tr><td>\${esc(m)}</td><td class="mono align-right">\${money(v)}</td><td class="mono align-right">\${totalSales?rnd(v/totalSales*100):0}%</td></tr>\`).join('') || '<tr><td colspan="3" class="align-center">No data</td></tr>')}
    </div></div>
    <div class="card"><div class="card-header"><h2 class="card-title">Sales by Metal Type</h2></div><div class="card-body" style="padding:0">
      \${rows(['Metal Type','Amount','%'], Object.entries(byMetal).filter(([,v])=>v>0).map(([m,v])=>\`<tr><td>\${esc(m)}</td><td class="mono align-right">\${money(v)}</td><td class="mono align-right">\${totalSales?rnd(v/totalSales*100):0}%</td></tr>\`).join('') || '<tr><td colspan="3" class="align-center">No data</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Sales Detail</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
      \${rows(['Date','Invoice','Customer','Items','Subtotal','Discount','Tax','Total','Payments'], sales.map(s=>\`<tr>
        <td class="mono">\${new Date(s.date).toLocaleDateString()}</td>
        <td><code class="mono">\${esc(s.invoice)}</code></td>
        <td>\${esc(s.customerName||s.customer||'Walk-in')}</td>
        <td class="mono align-right">\${(s.items||[]).reduce((sum,it)=>sum+num(it.qty),0)}</td>
        <td class="mono align-right">\${money(s.subtotal)}</td>
        <td class="mono align-right">\${money(s.discount)}</td>
        <td class="mono align-right">\${money(s.tax)}</td>
        <td class="mono align-right"><strong>\${money(s.total)}</strong></td>
        <td>\${(s.payments||[]).map(p=>\`\${esc(p.method)} \${money(p.amount)}\`).join('<br>')}</td>
      </tr>\`).join('') || '<tr><td colspan="9" class="align-center">No sales in period</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="salesFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    \${input('reportStartDate','From','date',startDate,'')}
    \${input('reportEndDate','To','date',endDate,'')}
    \${select('reportFilterCustomer','Customer',['all',...state.customers.map(c=>({value:c.id,label:c.name}))], filterCustomer)}
    \${select('reportFilterCategory','Category',['all',...ITEM_CATEGORIES], filterCategory)}
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>\`;
  }

  // === PURCHASE REPORT ===
  if (reportType === 'purchases') {
    // Get purchase transactions from metal management
    let purchases = state.metalManagement.transactions
      .filter(t => t.type === 'PURCHASE' && inRange(t.date));
    if (filterSupplier !== 'all') purchases = purchases.filter(t => t.karigar === filterSupplier);

    const totalWeight = purchases.reduce((sum, t) => sum + num(t.weight), 0);
    const totalValue = purchases.reduce((sum, t) => sum + num(t.value), 0);
    const avgRate = totalWeight ? rnd(totalValue / totalWeight) : 0;

    // By metal
    const byMetal = {Gold: {weight: 0, value: 0}, Silver: {weight: 0, value: 0}};
    purchases.forEach(t => {
      if (byMetal[t.metal]) {
        byMetal[t.metal].weight += num(t.weight);
        byMetal[t.metal].value += num(t.value);
      }
    });

    // By supplier (karigar field used for supplier)
    const bySupplier = {};
    purchases.forEach(t => {
      const sup = t.karigar || 'Unknown';
      if (!bySupplier[sup]) bySupplier[sup] = {weight: 0, value: 0, count: 0};
      bySupplier[sup].weight += num(t.weight);
      bySupplier[sup].value += num(t.value);
      bySupplier[sup].count += 1;
    });

    return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]} - Purchase Report</h1><p class="page-subtitle">Metal purchases from suppliers \${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="purchases">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="purchases">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  \${card('Total Purchases', money(totalValue), \`\${purchases.length} transactions\`)}
  \${card('Total Weight', totalWeight.toFixed(3) + ' g', \`Avg rate: \${money(avgRate)}/g\`)}
  \${card('Gold Purchased', byMetal.Gold.weight.toFixed(3) + ' g', money(byMetal.Gold.value))}
  \${card('Silver Purchased', byMetal.Silver.weight.toFixed(3) + ' g', money(byMetal.Silver.value))}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Purchases by Supplier</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">
      \${rows(['Supplier','Transactions','Weight (g)','Value','Avg Rate/g'], Object.entries(bySupplier).map(([s,v])=>\`<tr>
        <td>\${esc(s)}</td>
        <td class="mono align-right">\${v.count}</td>
        <td class="mono align-right">\${v.weight.toFixed(3)}</td>
        <td class="mono align-right">\${money(v.value)}</td>
        <td class="mono align-right">\${money(v.weight?v.value/v.weight:0)}</td>
      </tr>\`).join('') || '<tr><td colspan="5" class="align-center">No purchases in period</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Purchase Detail</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">
      \${rows(['Date','Type','Metal','Purity','Weight (g)','Rate/g','Value','Supplier','Reference','Notes'], purchases.map(t=>\`<tr>
        <td class="mono">\${esc(t.date||'')}</td>
        <td>\${esc(t.type)}</td>
        <td>\${esc(t.metal)}</td>
        <td class="mono">\${esc(t.purity)}</td>
        <td class="mono align-right">\${num(t.weight).toFixed(3)}</td>
        <td class="mono align-right">\${money(t.rate)}</td>
        <td class="mono align-right">\${money(t.value)}</td>
        <td>\${esc(t.karigar||'-')}</td>
        <td><code class="mono">\${esc(t.reference||'-')}</code></td>
        <td>\${esc(t.notes||'-')}</td>
      </tr>\`).join('') || '<tr><td colspan="10" class="align-center">No purchases in period</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="purchaseFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    \${input('reportStartDate','From','date',startDate,'')}
    \${input('reportEndDate','To','date',endDate,'')}
    \${select('reportFilterSupplier','Supplier',['all',...[...new Set(state.metalManagement.transactions.filter(t=>t.type==='PURCHASE').map(t=>t.karigar).filter(Boolean))]], filterSupplier)}
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>\`;
  }

  // === STOCK VALUATION ===
  if (reportType === 'stock') {
    const items = state.items.filter(i => i.status === 'stock');
    const totalItems = items.length;
    const totalWeight = items.reduce((sum, i) => sum + num(i.netWeight || i.weight), 0);
    const totalCost = items.reduce((sum, i) => sum + num(calcItem.totalCost(i)), 0);
    const totalSelling = items.reduce((sum, i) => sum + num(i.sellingPrice), 0);
    const potentialMargin = totalSelling ? rnd((totalSelling - totalCost) / totalSelling * 100) : 0;

    // By category
    const byCat = {};
    items.forEach(i => {
      const cat = i.category || 'other';
      if (!byCat[cat]) byCat[cat] = {count: 0, weight: 0, cost: 0, selling: 0};
      byCat[cat].count++;
      byCat[cat].weight += num(i.netWeight || i.weight);
      byCat[cat].cost += calcItem.totalCost(i);
      byCat[cat].selling += num(i.sellingPrice);
    });

    // By metal
    const byMetal = {Gold: {count: 0, weight: 0, cost: 0, selling: 0}, Silver: {count: 0, weight: 0, cost: 0, selling: 0}};
    items.forEach(i => {
      const m = i.metalType || i.metal || 'Gold';
      if (!byMetal[m]) byMetal[m] = {count: 0, weight: 0, cost: 0, selling: 0};
      byMetal[m].count++;
      byMetal[m].weight += num(i.netWeight || i.weight);
      byMetal[m].cost += calcItem.totalCost(i);
      byMetal[m].selling += num(i.sellingPrice);
    });

    return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]} - Stock Valuation</h1><p class="page-subtitle">Current inventory valuation at cost and selling price \${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="stock">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="stock">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  \${card('Total Items', totalItems + ' pcs', \`\${totalWeight.toFixed(3)} g total weight\`)}
  \${card('Stock at Cost', money(totalCost), 'Weighted average cost')}
  \${card('Stock at Selling', money(totalSelling), \`Potential margin: \${potentialMargin}%\`)}
  \${card('Potential Profit', money(rnd(totalSelling - totalCost)), 'If all sold at marked price')}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Valuation by Category</h2></div><div class="card-body" style="padding:0">
      \${rows(['Category','Items','Weight (g)','Cost Value','Selling Value','Margin %'], Object.entries(byCat).map(([c,v])=>\`<tr>
        <td>\${esc(c.charAt(0).toUpperCase()+c.slice(1))}</td>
        <td class="mono align-right">\${v.count}</td>
        <td class="mono align-right">\${v.weight.toFixed(3)}</td>
        <td class="mono align-right">\${money(v.cost)}</td>
        <td class="mono align-right">\${money(v.selling)}</td>
        <td class="mono align-right">\${v.selling?rnd((v.selling-v.cost)/v.selling*100):0}%</td>
      </tr>\`).join('') || '<tr><td colspan="6" class="align-center">No stock</td></tr>')}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Valuation by Metal</h2></div><div class="card-body" style="padding:0">
      \${rows(['Metal','Items','Weight (g)','Cost Value','Selling Value','Margin %'], Object.entries(byMetal).filter(([,v])=>v.count>0).map(([m,v])=>\`<tr>
        <td>\${esc(m)}</td>
        <td class="mono align-right">\${v.count}</td>
        <td class="mono align-right">\${v.weight.toFixed(3)}</td>
        <td class="mono align-right">\${money(v.cost)}</td>
        <td class="mono align-right">\${money(v.selling)}</td>
        <td class="mono align-right">\${v.selling?rnd((v.selling-v.cost)/v.selling*100):0}%</td>
      </tr>\`).join('') || '<tr><td colspan="6" class="align-center">No stock</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Stock Detail</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
      \${rows(['SKU','Name','Category','Metal','Purity','Net (g)','Cost','Selling','Margin %','Location'], items.map(i=>\`<tr>
        <td><code class="mono">\${esc(i.sku)}</code></td>
        <td>\${esc(i.name)}</td>
        <td>\${esc(i.category)}</td>
        <td>\${esc(i.metalType||i.metal)}</td>
        <td class="mono">\${esc(i.purity)}</td>
        <td class="mono align-right">\${num(i.netWeight||i.weight).toFixed(3)}</td>
        <td class="mono align-right">\${money(calcItem.totalCost(i))}</td>
        <td class="mono align-right">\${money(i.sellingPrice)}</td>
        <td class="mono align-right">\${num(i.marginPercent||0).toFixed(1)}%</td>
        <td>\${esc(i.location||'-')}</td>
      </tr>\`).join('') || '<tr><td colspan="10" class="align-center">No stock items</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="stockFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    \${select('reportFilterCategory','Category',['all',...ITEM_CATEGORIES], filterCategory)}
    \${select('reportFilterMetal','Metal',['all','Gold','Silver','Platinum'], state.reportFilterMetal||'all')}
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>\`;
  }

  // === GOLD/SILVER BALANCES ===
  if (reportType === 'metalbalances') {
    const balances = getAllMetalBalances();
    const goldBalances = Object.values(balances).filter(b => b.metal === 'Gold');
    const silverBalances = Object.values(balances).filter(b => b.metal === 'Silver');
    
    const totalGold = goldBalances.reduce((s, b) => s + b.balance, 0);
    const totalSilver = silverBalances.reduce((s, b) => s + b.balance, 0);
    const goldValue = rnd(totalGold * num(state.rates.gold));
    const silverValue = rnd(totalSilver * num(state.rates.silver));

    // Metal ledger transactions in period
    let txns = state.metalManagement.transactions.filter(t => inRange(t.date));
    if (filterCategory !== 'all') txns = txns.filter(t => t.type === filterCategory);

    const goldIn = txns.filter(t => t.metal === 'Gold' && ['PURCHASE','RETURN','RECEIPT','OPENING_BALANCE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
    const goldOut = txns.filter(t => t.metal === 'Gold' && ['ISSUE','WASTAGE','SALE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
    const silverIn = txns.filter(t => t.metal === 'Silver' && ['PURCHASE','RETURN','RECEIPT','OPENING_BALANCE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
    const silverOut = txns.filter(t => t.metal === 'Silver' && ['ISSUE','WASTAGE','SALE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);

    return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]} - Gold/Silver Balances</h1><p class="page-subtitle">Current metal balances with period movement \${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="metalbalances">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="metalbalances">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  \${card('Total Gold', totalGold.toFixed(3) + ' g', 'Value: ' + money(goldValue))}
  \${card('Total Silver', totalSilver.toFixed(3) + ' g', 'Value: ' + money(silverValue))}
  \${card('Combined Value', money(goldValue + silverValue), 'At current rates')}
  \${card('Gold Rate', money(num(state.rates.gold)) + '/g', 'Silver: ' + money(num(state.rates.silver)) + '/g')}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Gold Balance by Purity</h2></div><div class="card-body" style="padding:0">
      \${rows(['Purity','Opening','In Period','Out Period','Current Balance','Rate/g','Value'], goldBalances.map(b=>{
        const inW = txns.filter(t=>t.metal==='Gold'&&t.purity===b.purity&&['PURCHASE','RETURN','RECEIPT','OPENING_BALANCE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
        const outW = txns.filter(t=>t.metal==='Gold'&&t.purity===b.purity&&['ISSUE','WASTAGE','SALE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
        return \`<tr>
          <td class="mono">\${esc(b.purity)}</td>
          <td class="mono align-right">\${b.opening.toFixed(3)}</td>
          <td class="mono align-right text-success">+\${inW.toFixed(3)}</td>
          <td class="mono align-right text-danger">-\${outW.toFixed(3)}</td>
          <td class="mono align-right"><strong>\${b.balance.toFixed(3)}</strong></td>
          <td class="mono align-right">\${money(num(state.rates.gold))}</td>
          <td class="mono align-right">\${money(rnd(b.balance*num(state.rates.gold)))}</td>
        </tr>\`;
      }).join('') || '<tr><td colspan="7" class="align-center">No gold balances</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Silver Balance by Purity</h2></div><div class="card-body" style="padding:0">
      \${rows(['Purity','Opening','In Period','Out Period','Current Balance','Rate/g','Value'], silverBalances.map(b=>{
        const inW = txns.filter(t=>t.metal==='Silver'&&t.purity===b.purity&&['PURCHASE','RETURN','RECEIPT','OPENING_BALANCE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
        const outW = txns.filter(t=>t.metal==='Silver'&&t.purity===b.purity&&['ISSUE','WASTAGE','SALE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
        return \`<tr>
          <td class="mono">\${esc(b.purity)}</td>
          <td class="mono align-right">\${b.opening.toFixed(3)}</td>
          <td class="mono align-right text-success">+\${inW.toFixed(3)}</td>
          <td class="mono align-right text-danger">-\${outW.toFixed(3)}</td>
          <td class="mono align-right"><strong>\${b.balance.toFixed(3)}</strong></td>
          <td class="mono align-right">\${money(num(state.rates.silver))}</td>
          <td class="mono align-right">\${money(rnd(b.balance*num(state.rates.silver)))}</td>
        </tr>\`;
      }).join('') || '<tr><td colspan="7" class="align-center">No silver balances</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Period Movement Summary</h2></div><div class="card-body" style="padding:0">
  \${rows(['Metal','Opening','Receipts/Purchases','Issues/Sales/Wastage','Closing','Rate/g','Value'], [
    ['Gold', totalGold.toFixed(3), goldIn.toFixed(3), goldOut.toFixed(3), totalGold.toFixed(3), money(num(state.rates.gold)), money(goldValue)],
    ['Silver', totalSilver.toFixed(3), silverIn.toFixed(3), silverOut.toFixed(3), totalSilver.toFixed(3), money(num(state.rates.silver)), money(silverValue)]
  ].map(r=>\`<tr>\${r.map(c=>\`<td class="mono align-right">\${c}</td>\`).join('')}</tr>\`).join('') )}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="metalBalanceFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    \${input('reportStartDate','From','date',startDate,'')}
    \${input('reportEndDate','To','date',endDate,'')}
    \${select('reportFilterCategory','Transaction Type',['all',...METAL_TXN_TYPES.map(t=>t.value)], filterCategory)}
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>\`;
  }

  // === KARIGAR OUTSTANDING ===
  if (reportType === 'karigar') {
    const karigars = state.karigars.map(k => {
      ensureJobShape(k);
      const jobs = getKarigarJobs(k.id).map(j => { ensureJobShape(j); recalcJobFinancials(j); return j; });
      const activeJobs = jobs.filter(j => isJobActiveStatus(j.status));
      const issued = jobs.reduce((s, j) => s + getJobIssuedWeight(j), 0);
      const returned = jobs.reduce((s, j) => s + getJobReturnedWeight(j), 0);
      const net = rnd(Math.max(0, issued - returned));
      const wastage = jobs.reduce((s, j) => s + num(j.wastageActual || 0), 0);
      const labour = jobs.reduce((s, j) => s + num(j.labourCharges?.total || 0), 0);
      const advance = num(k.advance || 0);
      const balance = rnd(labour - advance);
      return {karigar: k, jobs, activeJobs, issued, returned, net, wastage, labour, advance, balance};
    });

    const totalIssued = karigars.reduce((s, k) => s + k.issued, 0);
    const totalReturned = karigars.reduce((s, k) => s + k.returned, 0);
    const totalNet = karigars.reduce((s, k) => s + k.net, 0);
    const totalWastage = karigars.reduce((s, k) => s + k.wastage, 0);
    const totalLabour = karigars.reduce((s, k) => s + k.labour, 0);
    const totalAdvance = karigars.reduce((s, k) => s + k.advance, 0);
    const totalOutstanding = karigars.reduce((s, k) => s + k.balance, 0);

    return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]} - Karigar Outstanding</h1><p class="page-subtitle">Metal issued, returned, wastage and labour outstanding \${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="karigar">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="karigar">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  \${card('Total Metal Issued', totalIssued.toFixed(3) + ' g', 'Across all karigars')}
  \${card('Total Returned', totalReturned.toFixed(3) + ' g', 'Net: ' + totalNet.toFixed(3) + ' g')}
  \${card('Total Wastage', totalWastage.toFixed(3) + ' g', 'Actual wastage')}
  \${card('Labour Outstanding', money(totalOutstanding), \`Total labour: \${money(totalLabour)}, Advances: \${money(totalAdvance)}\`)}
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Karigar Outstanding Summary</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
  \${rows(['Karigar','Specialty','Rate/g','Active Jobs','Issued (g)','Returned (g)','Net (g)','Wastage (g)','Labour Earned','Advance','Outstanding'], karigars.map(k=>\`<tr>
    <td><strong>\${esc(k.karigar.name)}</strong></td>
    <td>\${esc((k.karigar.specialties||[]).join(', ')||'-')}</td>
    <td class="mono align-right">\${money(num(k.karigar.ratePerGram))}</td>
    <td class="mono align-right">\${k.activeJobs.length}</td>
    <td class="mono align-right">\${k.issued.toFixed(3)}</td>
    <td class="mono align-right">\${k.returned.toFixed(3)}</td>
    <td class="mono align-right"><strong>\${k.net.toFixed(3)}</strong></td>
    <td class="mono align-right">\${k.wastage.toFixed(3)}</td>
    <td class="mono align-right">\${money(k.labour)}</td>
    <td class="mono align-right">\${money(k.advance)}</td>
    <td class="mono align-right \${k.balance<0?'text-danger':''}"><strong>\${money(k.balance)}</strong></td>
  </tr>\`).join('') || '<tr><td colspan="11" class="align-center">No karigars</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="karigarFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    \${input('reportStartDate','From','date',startDate,'')}
    \${input('reportEndDate','To','date',endDate,'')}
    \${select('reportFilterKarigar','Karigar',['all',...state.karigars.map(k=>({value:k.id,label:k.name}))], filterKarigar)}
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>\`;
  }

  // === CUSTOMER BALANCES ===
  if (reportType === 'customers') {
    const customers = state.customers.map(c => {
      const sales = state.sales.filter(s => s.customerId === c.id && inRange(s.date));
      const totalSales = sales.reduce((sum, s) => sum + num(s.total), 0);
      const totalPaid = sales.reduce((sum, s) => sum + (s.payments||[]).reduce((ps, p) => ps + num(p.amount), 0), 0);
      const balance = rnd(num(c.balance || 0) + totalSales - totalPaid);
      const creditLimit = num(c.creditLimit || 0);
      const utilization = creditLimit ? rnd(balance / creditLimit * 100) : 0;
      return {customer: c, sales, totalSales, totalPaid, balance, creditLimit, utilization};
    }).filter(c => c.sales.length > 0 || num(c.customer.balance || 0) !== 0 || num(c.customer.creditLimit || 0) > 0);

    const totalReceivable = customers.reduce((s, c) => s + Math.max(0, c.balance), 0);
    const totalCreditLimit = customers.reduce((s, c) => s + c.creditLimit, 0);
    const overdueCustomers = customers.filter(c => c.balance > c.creditLimit && c.creditLimit > 0).length;

    return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]} - Customer Balances</h1><p class="page-subtitle">Outstanding receivables and credit utilization \${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="customers">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="customers">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  \${card('Total Receivables', money(totalReceivable), \`\${customers.length} customers with activity\`)}
  \${card('Total Credit Limits', money(totalCreditLimit), 'Combined limits')}
  \${card('Overdue Accounts', overdueCustomers, 'Exceeding credit limit')}
  \${card('Avg Utilization', customers.length ? rnd(customers.reduce((s,c)=>s+c.utilization,0)/customers.length) + '%' : '0%', 'Of credit limits')}
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Customer Balance Detail</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
  \${rows(['Customer','Phone','Sales (Period)','Paid (Period)','Balance','Credit Limit','Utilization','Status'], customers.map(c=>\`<tr>
    <td><strong>\${esc(c.customer.name)}</strong></td>
    <td>\${esc(c.customer.phone||'-')}</td>
    <td class="mono align-right">\${money(c.totalSales)}</td>
    <td class="mono align-right">\${money(c.totalPaid)}</td>
    <td class="mono align-right \${c.balance<0?'text-success':(c.balance>c.creditLimit&&c.creditLimit>0?'text-danger':'')}"><strong>\${money(c.balance)}</strong></td>
    <td class="mono align-right">\${money(c.creditLimit)}</td>
    <td class="mono align-right">\${c.utilization.toFixed(1)}%</td>
    <td>\${c.balance>c.creditLimit&&c.creditLimit>0?'<span class="badge badge-warn">Over Limit</span>':c.balance<0?'<span class="badge badge-completed">Credit</span>':'<span class="badge badge-inprogress">Active</span>'}</td>
  </tr>\`).join('') || '<tr><td colspan="8" class="align-center">No customer activity in period</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="customerFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    \${input('reportStartDate','From','date',startDate,'')}
    \${input('reportEndDate','To','date',endDate,'')}
    \${select('reportFilterCustomer','Customer',['all',...state.customers.map(c=>({value:c.id,label:c.name}))], filterCustomer)}
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>\`;
  }

  // === SUPPLIER BALANCES ===
  if (reportType === 'suppliers') {
    const suppliers = state.suppliers.map(s => {
      const purchases = state.metalManagement.transactions.filter(t => t.type === 'PURCHASE' && t.karigar === s.name && inRange(t.date));
      const totalPurchases = purchases.reduce((sum, t) => sum + num(t.value), 0);
      const totalWeight = purchases.reduce((sum, t) => sum + num(t.weight), 0);
      const balance = num(s.balance || 0);
      return {supplier: s, purchases, totalPurchases, totalWeight, balance};
    }).filter(s => s.purchases.length > 0 || num(s.supplier.balance || 0) !== 0 || num(s.supplier.totalAmount || 0) > 0);

    const totalPayable = suppliers.reduce((s, sup) => s + Math.max(0, sup.balance), 0);
    const totalPurchaseValue = suppliers.reduce((s, sup) => s + sup.totalPurchases, 0);

    return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]} - Supplier Balances</h1><p class="page-subtitle">Outstanding payables to metal suppliers \${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="suppliers">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="suppliers">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  \${card('Total Payables', money(totalPayable), \`\${suppliers.length} suppliers\`)}
  \${card('Period Purchases', money(totalPurchaseValue), 'Metal purchases in period')}
  \${card('Suppliers with Balance', suppliers.filter(s=>s.balance!==0).length, 'Non-zero balances')}
  \${card('Avg Payment Terms', suppliers.length ? Math.round(suppliers.filter(s=>s.supplier.paymentTerms).reduce((a,s)=>a+num(s.supplier.paymentTerms.match(/\\d+/)?.[0]||0),0)/suppliers.filter(s=>s.supplier.paymentTerms).length) + ' days' : 'N/A')}
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Supplier Balance Detail</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
  \${rows(['Supplier','Contact','Period Purchases','Weight (g)','Balance','Payment Terms','Status'], suppliers.map(s=>\`<tr>
    <td><strong>\${esc(s.supplier.name)}</strong></td>
    <td>\${esc(s.supplier.contactPerson||'-')}</td>
    <td class="mono align-right">\${money(s.totalPurchases)}</td>
    <td class="mono align-right">\${s.totalWeight.toFixed(3)}</td>
    <td class="mono align-right \${s.balance>0?'text-danger':s.balance<0?'text-success':''}"><strong>\${money(s.balance)}</strong></td>
    <td>\${esc(s.supplier.paymentTerms||'-')}</td>
    <td>\${s.balance>0?'<span class="badge badge-warn">Payable</span>':s.balance<0?'<span class="badge badge-completed">Advance</span>':'<span class="badge badge-inprogress">Settled</span>'}</td>
  </tr>\`).join('') || '<tr><td colspan="7" class="align-center">No supplier activity in period</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="supplierFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    \${input('reportStartDate','From','date',startDate,'')}
    \${input('reportEndDate','To','date',endDate,'')}
    \${select('reportFilterSupplier','Supplier',['all',...state.suppliers.map(s=>({value:s.id,label:s.name}))], filterSupplier)}
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>\`;
  }

  // === EXPENSES ===
  if (reportType === 'expenses') {
    let expenses = state.expenses.filter(e => inRange(e.date));
    if (filterCategory !== 'all') expenses = expenses.filter(e => e.category === filterCategory);

    const totals = getExpenseTotals(startDate, endDate);
    const byStatus = {paid: 0, pending: 0, overdue: 0};
    expenses.forEach(e => { if (byStatus[e.status] !== undefined) byStatus[e.status] += num(e.amount); });

    // Monthly breakdown
    const byMonth = {};
    expenses.forEach(e => {
      const month = e.date.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = {total: 0, byCat: {}};
      byMonth[month].total += num(e.amount);
      byMonth[month].byCat[e.category] = (byMonth[month].byCat[e.category] || 0) + num(e.amount);
    });

    return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]} - Expenses</h1><p class="page-subtitle">Business expenses by category and period \${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="expenses">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="expenses">Export PDF</button>
  <button class="btn btn-secondary" data-tab="expenses">Manage Expenses</button>
</div></div></div>
<div class="metric-grid">
  \${card('Total Expenses', money(totals.total), \`\${totals.count} records\`)}
  \${card('Paid', money(byStatus.paid), 'Completed payments')}
  \${card('Pending', money(byStatus.pending), 'Awaiting payment')}
  \${card('Overdue', money(byStatus.overdue), 'Past due')}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Expenses by Category</h2></div><div class="card-body" style="padding:0">
      \${rows(['Category','Amount','%','Count'], Object.entries(totals.byCat).sort((a,b)=>b[1]-a[1]).map(([c,v])=>\`<tr>
        <td>\${esc(c)}</td>
        <td class="mono align-right">\${money(v)}</td>
        <td class="mono align-right">\${totals.total?rnd(v/totals.total*100):0}%</td>
        <td class="mono align-right">\${expenses.filter(e=>e.category===c).length}</td>
      </tr>\`).join('') || '<tr><td colspan="4" class="align-center">No expenses in period</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Monthly Trend</h2></div><div class="card-body" style="padding:0">
      \${rows(['Month','Total','Top Category'], Object.entries(byMonth).sort((a,b)=>b[0].localeCompare(a[0])).map(([m,v])=>{
        const topCat = Object.entries(v.byCat).sort((a,b)=>b[1]-a[1])[0] || ['-',0];
        return \`<tr>
          <td class="mono">\${m}</td>
          <td class="mono align-right">\${money(v.total)}</td>
          <td>\${esc(topCat[0])} (\${money(topCat[1])})</td>
        </tr>\`;
      }).join('') || '<tr><td colspan="3" class="align-center">No data</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Expense Detail</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">
  \${rows(['Date','Category','Amount','Status','Payment Method','Reference','Notes'], expenses.map(e=>\`<tr>
    <td class="mono">\${new Date(e.date).toLocaleDateString()}</td>
    <td>\${esc(e.category)}</td>
    <td class="mono align-right">\${money(e.amount)}</td>
    <td>\${e.status==='paid?'<span class="badge badge-completed">Paid</span>':e.status==='pending?'<span class="badge badge-inprogress">Pending</span>':'<span class="badge badge-warn">Overdue</span>'}</td>
    <td>\${esc(e.paymentMethod)}</td>
    <td><code class="mono">\${esc(e.reference||'-')}</code></td>
    <td>\${esc(e.notes||'-')}</td>
  </tr>\`).join('') || '<tr><td colspan="7" class="align-center">No expenses in period</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="expenseFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    \${input('reportStartDate','From','date',startDate,'')}
    \${input('reportEndDate','To','date',endDate,'')}
    \${select('reportFilterCategory','Category',['all',...EXPENSE_CATEGORIES], filterCategory)}
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>\`;
  }

  // === PROFIT & LOSS ===
  if (reportType === 'pnl') {
    // Revenue
    const sales = state.sales.filter(s => inRange(s.date));
    const revenue = sales.reduce((sum, s) => sum + num(s.total), 0);
    const taxCollected = sales.reduce((sum, s) => sum + num(s.tax), 0);
    const discounts = sales.reduce((sum, s) => sum + num(s.discount), 0);
    const netRevenue = rnd(revenue - discounts);

    // Cost of Goods Sold (COGS) - cost of items sold
    let cogs = 0;
    sales.forEach(s => {
      (s.items||[]).forEach(it => {
        const item = state.items.find(i => i.id === it.itemId);
        if (item) cogs += calcItem.totalCost(item) * num(it.qty);
      });
    });

    // Gross Profit
    const grossProfit = rnd(netRevenue - cogs);
    const grossMargin = netRevenue ? rnd(grossProfit / netRevenue * 100) : 0;

    // Operating Expenses
    const expenses = state.expenses.filter(e => inRange(e.date) && e.status !== 'cancelled');
    const opExpenses = expenses.reduce((sum, e) => sum + num(e.amount), 0);
    const expensesByCat = {};
    expenses.forEach(e => { expensesByCat[e.category] = (expensesByCat[e.category] || 0) + num(e.amount); });

    // Labour costs (karigar labour on completed jobs)
    const labourCost = state.jobs
      .filter(j => inRange(j.completedAt || j.updatedAt || j.createdAt))
      .reduce((sum, j) => sum + num(j.labourCharges?.total || 0), 0);

    // Metal wastage cost
    const wastageCost = state.metalManagement.transactions
      .filter(t => inRange(t.date) && t.type === 'WASTAGE')
      .reduce((sum, t) => sum + num(t.value), 0);

    // Other direct costs
    const directCosts = rnd(labourCost + wastageCost);

    // Net Profit
    const netProfit = rnd(grossProfit - opExpenses - directCosts);
    const netMargin = netRevenue ? rnd(netProfit / netRevenue * 100) : 0;

    return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]} - Profit & Loss</h1><p class="page-subtitle">Financial performance statement \${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="pnl">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="pnl">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  \${card('Net Revenue', money(netRevenue), \`Gross: \${money(revenue)}, Discounts: \${money(discounts)}\`)}
  \${card('COGS', money(cogs), 'Cost of items sold')}
  \${card('Gross Profit', money(grossProfit), \`Margin: \${grossMargin}%\`)}
  \${card('Net Profit', money(netProfit), \`Margin: \${netMargin}%\`)}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Revenue</h2></div><div class="card-body" style="padding:0">
      \${rows(['Item','Amount'], [
        ['Gross Sales', money(revenue)],
        ['Less: Discounts', money(discounts)],
        ['Net Revenue', money(netRevenue)],
        ['Tax Collected (\${state.settings.taxLabel})', money(taxCollected)]
      ].map(r=>\`<tr><td>\${esc(r[0])}</td><td class="mono align-right \${r[0]==='Net Revenue'?'':'text-danger'}\">\${r[1]}</td></tr>\`).join('') )}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Cost of Goods Sold</h2></div><div class="card-body" style="padding:0">
      \${rows(['Item','Amount'], [
        ['Cost of Items Sold', money(cogs)],
      ].map(r=>\`<tr><td>\${esc(r[0])}</td><td class="mono align-right text-danger">\${r[1]}</td></tr>\`).join('') )}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Gross Profit</h2></div><div class="card-body" style="padding:0">
      \${rows(['Item','Amount'], [
        ['Net Revenue', money(netRevenue)],
        ['Less: COGS', money(cogs)],
        ['Gross Profit', money(grossProfit)],
        ['Gross Margin', grossMargin + '%']
      ].map(r=>\`<tr><td>\${esc(r[0])}</td><td class="mono align-right \${r[0]==='Gross Profit'?'text-success':''}\">\${r[1]}</td></tr>\`).join('') )}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Operating Expenses</h2></div><div class="card-body" style="padding:0">
      \${rows(['Category','Amount'], Object.entries(expensesByCat).map(([c,v])=>\`<tr><td>\${esc(c)}</td><td class="mono align-right text-danger">\${money(v)}</td></tr>\`).join('') || '<tr><td colspan="2" class="align-center">No expenses</td></tr>')}
      \${rows(['Category','Amount'], [['Total Operating Expenses', money(opExpenses)]].map(r=>\`<tr style="border-top:2px solid var(--border-strong)"><td><strong>\${esc(r[0])}</strong></td><td class="mono align-right"><strong>\${r[1]}</strong></td></tr>\`).join('') )}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Direct Costs</h2></div><div class="card-body" style="padding:0">
      \${rows(['Item','Amount'], [
        ['Karigar Labour', money(labourCost)],
        ['Metal Wastage', money(wastageCost)],
        ['Total Direct Costs', money(directCosts)]
      ].map(r=>\`<tr><td>\${esc(r[0])}</td><td class="mono align-right \${r[0]==='Total Direct Costs'?'':'text-danger'}\">\${r[1]}</td></tr>\`).join('') )}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Net Profit</h2></div><div class="card-body" style="padding:0">
      \${rows(['Item','Amount'], [
        ['Gross Profit', money(grossProfit)],
        ['Less: Operating Expenses', money(opExpenses)],
        ['Less: Direct Costs', money(directCosts)],
        ['Net Profit / (Loss)', money(netProfit)],
        ['Net Margin', netMargin + '%']
      ].map(r=>\`<tr style="\${r[0]==='Net Profit / (Loss)'?'border-top:2px solid var(--border-strong)':''}"><td>\${esc(r[0])}</td><td class="mono align-right \${r[0]==='Net Profit / (Loss)'?(netProfit>=0?'text-success':'text-danger'):(r[0].includes('Less')?'text-danger':'')}\"><strong>\${r[1]}</strong></td></tr>\`).join('') )}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="pnlFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    \${input('reportStartDate','From','date',startDate,'')}
    \${input('reportEndDate','To','date',endDate,'')}
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>\`;
  }

  // === DAILY CASH REPORT ===
  if (reportType === 'cash') {
    // Get all cash inflows and outflows for the period
    const sales = state.sales.filter(s => inRange(s.date));
    
    // Cash inflows from sales
    const cashInflows = [];
    sales.forEach(s => {
      (s.payments||[]).forEach(p => {
        if (['Cash','Card','UPI','Wallet'].includes(p.method)) {
          cashInflows.push({
            date: s.date,
            type: 'Sale',
            ref: s.invoice,
            party: s.customerName || s.customer || 'Walk-in',
            method: p.method,
            amount: num(p.amount)
          });
        }
      });
    });

    // Cash outflows from expenses (paid)
    const cashOutflows = state.expenses
      .filter(e => inRange(e.date) && e.status === 'paid' && ['Cash','Card','UPI','Wallet','Bank Transfer','Cheque'].includes(e.paymentMethod))
      .map(e => ({
        date: e.date,
        type: 'Expense',
        ref: e.reference || 'EXP',
        party: e.category,
        method: e.paymentMethod,
        amount: num(e.amount)
      }));

    // Supplier payments (from metal transactions with type PURCHASE where payment recorded)
    // For now, we'll use metal purchase transactions as proxy
    const supplierPayments = state.metalManagement.transactions
      .filter(t => inRange(t.date) && t.type === 'PURCHASE')
      .map(t => ({
        date: t.date,
        type: 'Purchase',
        ref: t.reference,
        party: t.karigar || 'Supplier',
        method: 'Bank Transfer',
        amount: num(t.value)
      }));

    // Karigar labour payments (advance payments)
    const karigarPayments = state.karigars
      .filter(k => num(k.advance || 0) > 0)
      .map(k => ({
        date: k.updatedAt || k.createdAt,
        type: 'Labour Advance',
        ref: 'ADV',
        party: k.name,
        method: 'Cash',
        amount: num(k.advance)
      }));

    const allInflows = [...cashInflows];
    const allOutflows = [...cashOutflows, ...supplierPayments, ...karigarPayments];

    const totalIn = allInflows.reduce((s, x) => s + x.amount, 0);
    const totalOut = allOutflows.reduce((s, x) => s + x.amount, 0);
    const netCash = rnd(totalIn - totalOut);

    // By payment method
    const inByMethod = {};
    allInflows.forEach(x => { inByMethod[x.method] = (inByMethod[x.method] || 0) + x.amount; });
    const outByMethod = {};
    allOutflows.forEach(x => { outByMethod[x.method] = (outByMethod[x.method] || 0) + x.amount; });

    // Daily summary
    const byDate = {};
    [...allInflows, ...allOutflows].forEach(x => {
      if (!byDate[x.date]) byDate[x.date] = {in: 0, out: 0};
      if (allInflows.includes(x)) byDate[x.date].in += x.amount;
      else byDate[x.date].out += x.amount;
    });

    return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]} - Daily Cash Report</h1><p class="page-subtitle">Cash flow statement - inflows and outflows \${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="cash">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="cash">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  \${card('Total Inflows', money(totalIn), \`\${allInflows.length} transactions\`)}
  \${card('Total Outflows', money(totalOut), \`\${allOutflows.length} transactions\`)}
  \${card('Net Cash Flow', money(netCash), netCash >= 0 ? 'Positive' : 'Negative')}
  \${card('Cash Sales', money(cashInflows.filter(x=>x.method==='Cash').reduce((s,x)=>s+x.amount,0)), 'Physical cash received')}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Inflows by Method</h2></div><div class="card-body" style="padding:0">
      \${rows(['Method','Amount','Count'], Object.entries(inByMethod).map(([m,v])=>\`<tr><td>\${esc(m)}</td><td class="mono align-right">\${money(v)}</td><td class="mono align-right">\${allInflows.filter(x=>x.method===m).length}</td></tr>\`).join('') || '<tr><td colspan="3" class="align-center">No inflows</td></tr>')}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Outflows by Method</h2></div><div class="card-body" style="padding:0">
      \${rows(['Method','Amount','Count'], Object.entries(outByMethod).map(([m,v])=>\`<tr><td>\${esc(m)}</td><td class="mono align-right">\${money(v)}</td><td class="mono align-right">\${allOutflows.filter(x=>x.method===m).length}</td></tr>\`).join('') || '<tr><td colspan="3" class="align-center">No outflows</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Daily Cash Summary</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">
      \${rows(['Date','Inflows','Outflows','Net'], Object.entries(byDate).sort((a,b)=>b[0].localeCompare(a[0])).map(([d,v])=>\`<tr>
        <td class="mono">\${new Date(d).toLocaleDateString()}</td>
        <td class="mono align-right text-success">\${money(v.in)}</td>
        <td class="mono align-right text-danger">\${money(v.out)}</td>
        <td class="mono align-right \${rnd(v.in-v.out)>=0?'text-success':'text-danger'}"><strong>\${money(rnd(v.in-v.out))}</strong></td>
      </tr>\`).join('') || '<tr><td colspan="4" class="align-center">No cash movements</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Cash Inflow Detail</h2></div><div class="card-body" style="padding:0;max-height:300px;overflow:auto">
  \${rows(['Date','Type','Ref','Party','Method','Amount'], allInflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>\`<tr>
    <td class="mono">\${new Date(x.date).toLocaleDateString()}</td>
    <td>\${esc(x.type)}</td>
    <td><code class="mono">\${esc(x.ref)}</code></td>
    <td>\${esc(x.party)}</td>
    <td>\${esc(x.method)}</td>
    <td class="mono align-right text-success">\${money(x.amount)}</td>
  </tr>\`).join('') || '<tr><td colspan="6" class="align-center">No inflows</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Cash Outflow Detail</h2></div><div class="card-body" style="padding:0;max-height:300px;overflow:auto">
  \${rows(['Date','Type','Ref','Party','Method','Amount'], allOutflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>\`<tr>
    <td class="mono">\${new Date(x.date).toLocaleDateString()}</td>
    <td>\${esc(x.type)}</td>
    <td><code class="mono">\${esc(x.ref)}</code></td>
    <td>\${esc(x.party)}</td>
    <td>\${esc(x.method)}</td>
    <td class="mono align-right text-danger">\${money(x.amount)}</td>
  </tr>\`).join('') || '<tr><td colspan="6" class="align-center">No outflows</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="cashFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    \${input('reportStartDate','From','date',startDate,'')}
    \${input('reportEndDate','To','date',endDate,'')}
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>\`;
  }

  // Default - show report selector
  return \`
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">\${PAGE_TITLES.reports[0]}</h1><p class="page-subtitle">\${PAGE_TITLES.reports[1]}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" id="export">Export JSON Backup</button>
</div></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Select Report</h2></div><div class="card-body">
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
    \${[
      {id:'sales',title:'Sales Report',desc:'Revenue, invoices, payment methods, metal breakdown'},
      {id:'purchases',title:'Purchase Report',desc:'Metal purchases from suppliers, weight & value'},
      {id:'stock',title:'Stock Valuation',desc:'Inventory at cost & selling price, margin analysis'},
      {id:'metalbalances',title:'Gold/Silver Balances',desc:'Metal ledger balances by purity with period movement'},
      {id:'karigar',title:'Karigar Outstanding',desc:'Metal issued, returned, wastage, labour due'},
      {id:'customers',title:'Customer Balances',desc:'Receivables, credit limits, overdue accounts'},
      {id:'suppliers',title:'Supplier Balances',desc:'Payables to metal suppliers, payment terms'},
      {id:'expenses',title:'Expenses',desc:'Business expenses by category, monthly trend'},
      {id:'pnl',title:'Profit & Loss',desc:'Revenue, COGS, expenses, net profit analysis'},
      {id:'cash',title:'Daily Cash Report',desc:'Cash inflows/outflows, daily summary, payment methods'}
    ].map(r=>\`<button class="btn btn-secondary" style="height:120px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:16px" data-report-type="\${r.id}"><strong style="font-size:1.1rem">\${r.title}</strong><span class="small muted" style="margin-top:4px">\${r.desc}</span></button>\`).join('')}
  </div>
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Quick Summary</h2></div><div class="card-body" style="padding:0">
  \${(function(){
    const t=totals();
    const balances=getAllMetalBalances();
    const goldBal=rnd(Object.values(balances).filter(b=>b.metal==='Gold').reduce((s,b)=>s+b.balance,0));
    const silverBal=rnd(Object.values(balances).filter(b=>b.metal==='Silver').reduce((s,b)=>s+b.balance,0));
    return rows(['Metric','Value'], [
      ['Recorded Sales', money(t.sales)],
      ['Stock Items', stock().length + ' pcs'],
      ['Gold Balance', goldBal.toFixed(3) + ' g'],
      ['Silver Balance', silverBal.toFixed(3) + ' g'],
      ['Active Jobs', state.jobs.filter(j=>isJobActiveStatus(j.status)).length],
      ['Total Karigars', state.karigars.length],
      ['Customers', state.customers.length],
      ['Suppliers', state.suppliers.length]
    ].map(r=>\`<tr><td>\${esc(r[0])}</td><td class="mono align-right">\${r[1]}</td></tr>\`).join(''));
  })()}
</div></div>\`;
}`;

// Find and replace the reports function
const startMarker = 'function reports(){';
const endMarker = 'function settings(){';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + newReportsFunction + '\n\n' + content.slice(endIdx);
  fs.writeFileSync('src.js', content);
  console.log('Reports function replaced successfully');
} else {
  console.log('Could not find markers');
  console.log('startIdx:', startIdx, 'endIdx:', endIdx);
}