import { state, money, num, rnd, t, icon, input, select, textarea, rows, card, esc, fmtDate, PAGE_TITLES, JOB_STAGES } from '../src.js';

function karigarList() {
  const karigarRows = state.karigars.map(k => {
    const activeJobs = state.jobs.filter(j => j.assignedKarigarId === k.id && j.status !== 'Completed').length;
    const totalIssued = rnd(state.jobs.filter(j => j.assignedKarigarId === k.id).reduce((s, j) => s + (j.metalIssues || []).reduce((s2, m) => s2 + num(m.weight), 0), 0));
    const totalReturned = rnd(state.jobs.filter(j => j.assignedKarigarId === k.id).reduce((s, j) => s + (j.materialReturns || []).reduce((s2, r) => s2 + num(r.weight), 0), 0));
    const netMetal = rnd(totalIssued - totalReturned);
    const status = netMetal > 0 ? 'badge-warn' : 'badge-completed';
    const statusText = netMetal > 0 ? t('Metal Outstanding') : t('Settled');
    return '<tr><td><strong>' + esc(k.name) + '</strong></td><td>' + esc((k.specialties || []).join(', ') || '-') + '</td><td class="mono align-right">' + money(num(k.ratePerGram)) + '</td><td>' + esc(k.phone || '-') + '</td><td class="mono align-right">' + money(num(k.totalAdvance || 0)) + '</td><td><span class="badge ' + status + '">' + statusText + '</span></td><td><button class="btn btn-sm btn-outline" data-karigar-edit="' + k.id + '">' + t('Edit') + '</button><button class="btn btn-sm btn-outline" data-karigar-jobs="' + k.id + '">' + t('Jobs') + '</button><button class="btn btn-sm btn-outline" data-karigar-ledger="' + k.id + '">' + t('Ledger') + '</button></td></tr>';
  }).join('');
  const emptyRow = '<tr><td colspan="7" class="align-center">' + t('No karigars registered') + '</td></tr>';
  
  const activeJobsCount = state.jobs.filter(j => j.status !== 'Completed').length;
  const totalMetalOutstanding = rnd(state.karigars.reduce((s, k) => s + rnd(state.jobs.filter(j => j.assignedKarigarId === k.id).reduce((s2, j) => s2 + (j.metalIssues || []).reduce((s3, m) => s3 + num(m.weight), 0) - (j.materialReturns || []).reduce((s3, r) => s3 + num(r.weight), 0), 0), 0), 0)) + ' g';
  const totalLabourDue = money(rnd(state.karigars.reduce((s, k) => s + rnd(state.jobs.filter(j => j.assignedKarigarId === k.id).reduce((s2, j) => s2 + num(j.labourCharges?.total || 0), 0) - num(k.totalAdvance || 0), 0), 0)));
  
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.karigar[0]}</h1><p class="page-subtitle">${PAGE_TITLES.karigar[1]}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-tab="karigar" data-action="new">${t('Add Karigar')}</button>
</div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Karigars')}</h2></div><div class="card-body" style="padding:0">${rows([t('Name'), t('Specialties'), t('Rate/g'), t('Phone'), t('Advance'), t('Status'), t('Actions')], karigarRows || emptyRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Quick Stats')}</h2></div><div class="card-body"><div class="metric-grid">${card(t('Total Karigars'), state.karigars.length)}${card(t('Active Jobs'), activeJobsCount)}${card(t('Total Metal Outstanding'), totalMetalOutstanding)}${card(t('Total Labour Due'), totalLabourDue)}</div></div></div>`;
}

function karigarNew() {
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.karigar[0]} - ${t('Add Karigar')}</h1><p class="page-subtitle">${PAGE_TITLES.karigar[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('New Karigar')}</h2></div><div class="card-body"><form id="karigarForm" class="form">${input('name', t('Full Name'))}${input('phone', t('Phone'), 'tel')}${input('email', t('Email'), 'email')}${select('specialties', t('Specialties (Multi-select)'), ['rings', 'necklaces', 'bracelets', 'earrings', 'bangles', 'chains', 'pendants', 'setting', 'polishing', 'engraving', 'repair'], [], 'multiple placeholder="Select specialties"')}${input('ratePerGram', t('Labour Rate per Gram (NPR)'), 'number', '', 'min="0" step="0.01"')}${input('address', t('Address'))}${textarea('notes', t('Notes'))}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Save Karigar')}</button></div></form></div></div>`;
}

function karigarEdit(editId) {
  const k = state.karigars.find(x => x.id === editId);
  if (!k) return karigarList();
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.karigar[0]} - ${t('Edit Karigar')}</h1><p class="page-subtitle">${PAGE_TITLES.karigar[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Edit Karigar')}</h2></div><div class="card-body"><form id="karigarForm" class="form" data-edit-id="${editId}">${input('name', t('Full Name'), 'text', k.name)}${input('phone', t('Phone'), 'tel', k.phone)}${input('email', t('Email'), 'email', k.email)}${select('specialties', t('Specialties'), ['rings', 'necklaces', 'bracelets', 'earrings', 'bangles', 'chains', 'pendants', 'setting', 'polishing', 'engraving', 'repair'], (k.specialties || []).map(s => ({ value: s, label: s })), 'multiple placeholder="Select specialties"')}${input('ratePerGram', t('Labour Rate per Gram (NPR)'), 'number', k.ratePerGram, 'min="0" step="0.01"')}${input('address', t('Address'), 'text', k.address)}${textarea('notes', t('Notes'), k.notes)}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Update Karigar')}</button></div></form></div></div>`;
}

function karigarJobs(karigarId) {
  const k = state.karigars.find(x => x.id === karigarId);
  if (!k) return karigarList();
  const jobs = state.jobs.filter(j => j.assignedKarigarId === karigarId);
  const jobRows = jobs.map(j => {
    const item = state.items.find(i => i.id === j.itemId);
    const issued = rnd((j.metalIssues || []).reduce((s, m) => s + num(m.weight), 0));
    const returned = rnd((j.materialReturns || []).reduce((s, r) => s + num(r.weight), 0));
    const wastage = num(j.wastageActual || 0);
    const labour = num(j.labourCharges?.total || 0);
    const progress = j.stage === 'Completed' ? 100 : JOB_STAGES.indexOf(j.stage);
    return '<tr><td><code class="mono">' + esc(j.id.slice(-8)) + '</code></td><td>' + esc(item?.name || j.itemId) + '</td><td>' + t(j.stage) + '</td><td><div class="progress"><div class="progress-bar" style="width:' + progress + '%"></div></div>' + progress + '%</td><td class="mono align-right">' + issued.toFixed(3) + ' g</td><td class="mono align-right">' + returned.toFixed(3) + ' g</td><td class="mono align-right">' + wastage.toFixed(3) + ' g</td><td class="mono align-right">' + money(labour) + '</td><td><button class="btn btn-sm btn-outline" data-job-detail="' + j.id + '">' + t('Detail') + '</button></td></tr>';
  }).join('');
  const emptyJobRow = '<tr><td colspan="9" class="align-center">' + t('No jobs assigned') + '</td></tr>';
  
  const ledgerRows = [...(k.metalLedger || [])].reverse().map(e => 
    '<tr><td class="mono">' + fmtDate(e.date) + '</td><td><code class="mono">' + esc((e.jobId || '').slice(-8)) + '</code></td><td>' + t(e.type) + '</td><td>' + esc(e.metal) + '</td><td class="mono">' + esc(e.purity) + '</td><td class="mono align-right ' + (e.type === 'ISSUE' ? 'text-success' : 'text-danger') + '">' + (e.type === 'ISSUE' ? '+' : '-') + num(e.weight).toFixed(3) + '</td><td class="mono align-right">' + money(e.rate || 0) + '</td><td>' + esc(e.notes || '-') + '</td></tr>'
  ).join('');
  const emptyLedgerRow = '<tr><td colspan="8" class="align-center">' + t('No metal movements') + '</td></tr>';
  
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.karigar[0]} - ${esc(k.name)} - ${t('Jobs')}</h1><p class="page-subtitle">${t('Job assignments and progress')}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Assigned Jobs')}</h2></div><div class="card-body" style="padding:0">${rows([t('Job ID'), t('Item'), t('Stage'), t('Progress'), t('Metal Issued'), t('Returned'), t('Wastage'), t('Labour'), t('Actions')], jobRows || emptyJobRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Metal Ledger')}</h2></div><div class="card-body" style="padding:0">${rows([t('Date'), t('Job'), t('Type'), t('Metal'), t('Purity'), t('Weight (g)'), t('Rate'), t('Notes')], ledgerRows || emptyLedgerRow)}</div></div>`;
}

function karigarLedger(karigarId) {
  const k = state.karigars.find(x => x.id === karigarId);
  if (!k) return karigarList();
  
  const metalLedgerRows = [...(k.metalLedger || [])].reverse().map(e => {
    const val = num(e.weight) * num(e.rate || 0);
    return '<tr><td class="mono">' + fmtDate(e.date) + '</td><td><code class="mono">' + esc((e.jobId || '').slice(-8)) + '</code></td><td>' + t(e.type) + '</td><td>' + esc(e.metal) + '</td><td class="mono">' + esc(e.purity) + '</td><td class="mono align-right ' + (e.type === 'ISSUE' ? 'text-success' : 'text-danger') + '">' + (e.type === 'ISSUE' ? '+' : '-') + num(e.weight).toFixed(3) + '</td><td class="mono align-right">' + money(e.rate || 0) + '</td><td class="mono align-right">' + money(val) + '</td><td>' + esc(e.notes || '-') + '</td></tr>';
  }).join('');
  const emptyMetalLedgerRow = '<tr><td colspan="9" class="align-center">' + t('No metal movements') + '</td></tr>';
  
  const financialLedgerRows = [...(k.financialLedger || [])].reverse().map(e => 
    '<tr><td class="mono">' + fmtDate(e.date) + '</td><td>' + t(e.type) + '</td><td>' + esc(e.description) + '</td><td class="mono align-right">' + (e.debit ? money(e.debit) : '-') + '</td><td class="mono align-right">' + (e.credit ? money(e.credit) : '-') + '</td><td class="mono align-right">' + money(e.balance) + '</td></tr>'
  ).join('');
  const emptyFinancialLedgerRow = '<tr><td colspan="6" class="align-center">' + t('No financial movements') + '</td></tr>';
  
  const totalIssued = rnd(k.metalLedger?.filter(e => e.type === 'ISSUE').reduce((s, e) => s + num(e.weight), 0) || 0);
  const totalReturned = rnd(k.metalLedger?.filter(e => e.type === 'RETURN').reduce((s, e) => s + num(e.weight), 0) || 0);
  const netOutstanding = totalIssued - totalReturned;
  const totalAdvance = num(k.totalAdvance || 0);
  const totalLabourEarned = rnd(k.financialLedger?.filter(e => e.type === 'LABOUR').reduce((s, e) => s + num(e.credit || 0), 0) || 0);
  const currentOutstanding = totalLabourEarned - totalAdvance;
  
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.karigar[0]} - ${esc(k.name)} - ${t('Ledger')}</h1><p class="page-subtitle">${t('Complete metal and financial ledger')}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Metal Ledger')}</h2></div><div class="card-body" style="padding:0">${rows([t('Date'), t('Job'), t('Type'), t('Metal'), t('Purity'), t('Weight (g)'), t('Rate'), t('Value'), t('Notes')], metalLedgerRows || emptyMetalLedgerRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Financial Ledger')}</h2></div><div class="card-body" style="padding:0">${rows([t('Date'), t('Type'), t('Description'), t('Debit'), t('Credit'), t('Balance')], financialLedgerRows || emptyFinancialLedgerRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Summary')}</h2></div><div class="card-body"><div class="metric-grid">${card(t('Total Metal Issued'), totalIssued + ' g')}${card(t('Total Metal Returned'), totalReturned + ' g')}${card(t('Net Outstanding'), netOutstanding + ' g')}${card(t('Total Advance'), money(totalAdvance))}${card(t('Total Labour Earned'), money(totalLabourEarned))}${card(t('Current Outstanding'), money(currentOutstanding))}</div></div></div>`;
}

export default function karigar() {
  const view = state.karigarView || 'list';
  if (view === 'new') return karigarNew();
  if (view === 'edit') return karigarEdit(state.karigarEditId);
  if (view === 'jobs') return karigarJobs(state.karigarViewId);
  if (view === 'ledger') return karigarLedger(state.karigarViewId);
  return karigarList();
}