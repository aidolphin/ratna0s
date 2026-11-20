import { state, totals, getAllMetalBalances, rnd, money, num, t, icon, card, rows, input, fmtDate, fmtDateTime, esc, PAGE_TITLES, JOB_STATUSES, isJobActiveStatus } from '../src.js';

const shortMoney = v => {
  v = num(v);
  if (v >= 1e7) return (v / 1e7).toFixed(1) + 'Cr';
  if (v >= 1e5) return (v / 1e5).toFixed(1) + 'L';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
  return String(Math.round(v));
};

function lastNDays(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: 'short' })
    });
  }
  return out;
}

function lineChart(data) {
  const W = 720, H = 240, pad = { l: 10, r: 10, t: 18, b: 30 };
  const max = Math.max(1, ...data.map(d => d.value));
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const x = i => data.length === 1 ? pad.l + innerW / 2 : pad.l + (i / (data.length - 1)) * innerW;
  const y = v => pad.t + innerH - (v / max) * innerH;
  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = `M ${x(0).toFixed(1)} ${pad.t + innerH} ` + pts.map(p => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ` L ${x(data.length - 1).toFixed(1)} ${pad.t + innerH} Z`;
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="dash-chart" preserveAspectRatio="xMidYMid meet" role="img"><defs><linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(212,175,55,.45)"/><stop offset="100%" stop-color="rgba(212,175,55,0)"/></linearGradient></defs>`;
  for (let i = 0; i <= 4; i++) {
    const gy = pad.t + (innerH / 4) * i;
    svg += `<line x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}" stroke="rgba(255,255,255,.07)"/><text x="${pad.l}" y="${gy - 4}" class="dash-axis">${shortMoney(max * (1 - i / 4))}</text>`;
  }
  svg += `<path d="${area}" fill="url(#dashArea)"/><path d="${line}" fill="none" stroke="var(--champagne-light)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  pts.forEach((p, i) => {
    svg += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="#0c100f" stroke="var(--champagne-light)" stroke-width="2"><title>${esc(data[i].label)}: ${esc(money(data[i].value))}</title></circle>`;
  });
  data.forEach((d, i) => {
    svg += `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="dash-axis">${esc(d.label)}</text>`;
  });
  return svg + '</svg>';
}

function barChart(groups, series) {
  const W = 720, H = 240, pad = { l: 10, r: 10, t: 18, b: 30 };
  const max = Math.max(1, ...series.flatMap(s => s.values.map(num)));
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const groupW = innerW / groups.length;
  const barW = Math.max(4, Math.min(18, groupW / (series.length + 1)));
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="dash-chart" preserveAspectRatio="xMidYMid meet" role="img">`;
  for (let i = 0; i <= 4; i++) {
    const gy = pad.t + (innerH / 4) * i;
    svg += `<line x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}" stroke="rgba(255,255,255,.07)"/><text x="${pad.l}" y="${gy - 4}" class="dash-axis">${shortMoney(max * (1 - i / 4))}</text>`;
  }
  groups.forEach((g, gi) => {
    const gx = pad.l + groupW * gi + groupW / 2;
    series.forEach((s, si) => {
      const v = num(s.values[gi] || 0);
      const bh = (v / max) * innerH;
      const bx = gx - (series.length * barW) / 2 + si * barW + 1;
      svg += `<rect x="${bx.toFixed(1)}" y="${(pad.t + innerH - bh).toFixed(1)}" width="${Math.max(1, barW - 2).toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${s.color}"><title>${esc(s.label)} · ${esc(g.label)}: ${esc(money(v))}</title></rect>`;
    });
    svg += `<text x="${gx.toFixed(1)}" y="${H - 8}" text-anchor="middle" class="dash-axis">${esc(g.label)}</text>`;
  });
  return svg + '</svg>';
}

function dashHero() {
  const shop = state.settings.shop || 'RatnaOS';
  const today = fmtDate(new Date().toISOString());
  return `
<section class="dash-hero">
  <div class="dash-hero-content">
    <p class="dash-hero-eyebrow">${esc(PAGE_TITLES.dashboard[0])}</p>
    <h2 class="dash-hero-title">${esc(shop)}</h2>
    <p class="dash-hero-sub">${esc(today)} · ${esc(PAGE_TITLES.dashboard[1])}</p>
    <div class="dash-hero-cta">
      <button class="btn btn-champagne" data-tab="inventory">${icon('plus')}<span>${t('Add Jewellery')}</span></button>
      <button class="btn btn-secondary" data-tab="pos">${icon('cart')}<span>${t('New Sale')}</span></button>
    </div>
  </div>
  <div class="dash-hero-rates">
    <div class="dash-rate"><span>${t('Gold')}</span><strong>${money(state.rates.gold)}<small>/g</small></strong></div>
    <div class="dash-rate"><span>${t('Silver')}</span><strong>${money(state.rates.silver)}<small>/g</small></strong></div>
  </div>
</section>`;
}

function dashJobs() {
  const counts = JOB_STATUSES.map(s => ({ status: s, count: state.jobs.filter(j => j.status === s).length }));
  const max = Math.max(1, ...counts.map(c => c.count));
  return `<div class="dash-jobs">${counts.map(c => {
    const pct = Math.round((c.count / max) * 100);
    return `<div class="dash-job"><div class="dash-job-head"><span>${esc(t(c.status))}</span><strong>${c.count}</strong></div><div class="dash-bar"><span style="width:${pct}%"></span></div></div>`;
  }).join('')}</div>`;
}

function dashActions() {
  const actions = [
    ['inventory', 'gem', 'Add Jewellery'],
    ['pos', 'cart', 'New Sale'],
    ['karigar', 'users', 'Karigar & Jobs'],
    ['production', 'layers', 'Production Stages'],
    ['metals', 'scale', 'Metal Management'],
    ['exchange', 'refresh', 'Old Gold Exchange'],
  ];
  if (window.RatnaOS?.auth?.hasPermission?.('accounting:read')) actions.push(['accounting', 'wallet', 'Accounting']);
  return `<div class="dash-actions">${actions.map(([tab, ic, label]) =>
    `<button class="dash-action" data-tab="${tab}">${icon(ic)}<span>${t(label)}</span></button>`
  ).join('')}</div>`;
}

export default function dashboard() {
  const sums = totals();
  const openJobs = state.jobs.filter(j => isJobActiveStatus(j.status)).length;
  const balances = getAllMetalBalances();
  const goldBal = Object.values(balances).filter(b => b.metal === 'Gold').reduce((s, b) => s + b.balance, 0);
  const silverBal = Object.values(balances).filter(b => b.metal === 'Silver').reduce((s, b) => s + b.balance, 0);

  const days = lastNDays(7);
  const salesSeries = days.map(d => ({
    ...d,
    value: rnd(state.sales.filter(s => (s.date || '').slice(0, 10) === d.key).reduce((a, s) => a + num(s.total), 0))
  }));
  const expenseSeries = days.map(d => ({
    ...d,
    value: rnd(state.expenses.filter(e => (e.date || '').slice(0, 10) === d.key && e.status !== 'cancelled').reduce((a, e) => a + num(e.amount), 0))
  }));
  const weekSales = rnd(salesSeries.reduce((a, d) => a + d.value, 0));
  const weekExpenses = rnd(expenseSeries.reduce((a, d) => a + d.value, 0));
  const salesChartHtml = state.sales.length ? lineChart(salesSeries) : `<p class="muted">${t('No sales data yet')}</p>`;
  const cashChartHtml = (state.sales.length || state.expenses.length)
    ? barChart(days, [
        { label: t('Sales'), color: 'var(--champagne-light)', values: salesSeries.map(d => d.value) },
        { label: t('Expenses'), color: '#e08a8a', values: expenseSeries.map(d => d.value) }
      ])
    : `<p class="muted">${t('No data yet')}</p>`;

  const catTotals = {};
  state.sales.forEach(s => (s.items || []).forEach(it => {
    const key = it.category || it.metal || 'Other';
    catTotals[key] = (catTotals[key] || 0) + num(it.total || 0);
  }));
  const cats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = Math.max(1, ...cats.map(c => c[1]));
  const catBars = cats.length ? cats.map(([name, val]) => {
    const pct = Math.round((val / maxCat) * 100);
    return `<div class="dash-cat"><div class="dash-cat-head"><span>${esc(t(name))}</span><strong>${money(val)}</strong></div><div class="dash-bar"><span style="width:${pct}%"></span></div></div>`;
  }).join('') : `<p class="muted">${t('No sales data yet')}</p>`;

  const recentRows = state.sales.slice(0, 7).map(s => {
    const name = s.customerName || s.customer || '-';
    const initial = (name || '?').trim().charAt(0).toUpperCase();
    return `<tr><td class="mono">${fmtDate(s.date)}</td><td><code class="mono">${esc(s.invoice)}</code></td><td><span class="dash-cust"><span class="dash-avatar">${esc(initial)}</span>${esc(name)}</span></td><td class="align-right mono">${money(s.total)}</td></tr>`;
  }).join('');
  const recentEmpty = `<tr><td colspan="4" class="align-center muted">${t('No sales yet')}</td></tr>`;

  return `
${dashHero()}
<div class="metric-grid dash-metrics">${card(t('Stock Value'), money(sums.value), t('Indicative'), 'sparkle', 'inventory')} ${card(t('Total Sales'), money(sums.sales), t('Recorded'), 'cart', 'reports')} ${card(t('Open Jobs'), openJobs, t('In progress'), 'clock', 'karigar')} ${card(t('Metal Ledger (Au/Ag)'), `${rnd(goldBal).toFixed(3)}g / ${rnd(silverBal).toFixed(3)}g`, t('Current balances'), 'scale', 'metals')}</div>
<div class="dash-charts">
  <div class="card dash-chart-card">
    <div class="card-header"><div class="dash-chart-head"><h2 class="card-title">${t('Sales Trend')} · ${t('Last 7 days')}</h2><span class="dash-chart-total">${money(weekSales)}</span></div></div>
    <div class="card-body dash-chart-scroll">${salesChartHtml}</div>
  </div>
  <div class="card dash-chart-card">
    <div class="card-header"><h2 class="card-title">${t('Sales by Category')}</h2></div>
    <div class="card-body"><div class="dash-cat-list">${catBars}</div></div>
  </div>
</div>
<div class="card dash-chart-card">
  <div class="card-header"><div class="dash-chart-head"><h2 class="card-title">${t('Income vs Expenses')} · ${t('Last 7 days')}</h2><div class="dash-legend"><span class="dash-legend-item"><i style="background:var(--champagne-light)"></i>${t('Sales')}</span><span class="dash-legend-item"><i style="background:#e08a8a"></i>${t('Expenses')}</span></div></div></div>
  <div class="card-body dash-chart-scroll">${cashChartHtml}</div>
</div>
<div class="layout"><div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Recent Transactions')}</h2><button class="btn btn-ghost btn-sm" data-tab="reports">${t('View all')}</button></div><div class="card-body" style="padding:0">${rows([t('Date'), t('Invoice'), t('Customer'), t('Amount')], recentRows || recentEmpty)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Daily Metal Rates')}</h2></div><div class="card-body"><form id="rates" class="form" style="margin-top:0">${input('gold', `${t('Gold')} (${state.settings.currency} / ${t('fine g')})`, 'number', state.rates.gold, 'min="0" step="0.01"')}${input('silver', `${t('Silver')} (${state.settings.currency} / g)`, 'number', state.rates.silver, 'min="0" step="0.01"')}<div class="field-full" style="display:flex;gap:var(--space-2);flex-wrap:wrap"><button class="btn btn-champagne" type="submit" style="flex:1">${t('Update Rates')}</button><button class="btn btn-ghost btn-sm" type="button" data-rate-sync>${icon('refresh')}<span>${t('Sync now')}</span></button></div><p class="small muted" style="margin:var(--space-2) 0 0">${state.rates.updatedAt ? `${t('Updated')}: ${fmtDateTime(state.rates.updatedAt)}` : `${t('Manual rates')}`}${state.settings.rateSync?.lastStatus === 'error' ? ` · <span style="color:var(--error)">${esc(state.settings.rateSync.lastMessage || '')}</span>` : ''}</p></form></div></div>
</div><div>
  <div class="card"><div class="card-header"><h2 class="card-title">${t('Job Status')}</h2></div><div class="card-body">${dashJobs()}</div></div>
  <div class="card"><div class="card-header"><h2 class="card-title">${t('Quick Actions')}</h2></div><div class="card-body">${dashActions()}</div></div>
</div></div>`;
}