import { state, money, num, rnd, t, input, select, textarea, rows, card, esc, fmtDate, isJobActiveStatus, PAGE_TITLES, JOB_STAGES } from '../src.js';

function jobStages(j) {
  return (Array.isArray(j.stages) && j.stages.length) ? j.stages : JOB_STAGES.map(s => ({ id: s.id, label: s.label, status: 'pending', startedAt: null, completedAt: null, notes: '' }));
}
function jobProgress(j) {
  if (j.status === 'Completed') return 100;
  const stages = jobStages(j);
  const done = stages.filter(s => s.status === 'completed').length;
  return stages.length ? Math.round((done / stages.length) * 100) : 0;
}
function jobStatusClass(j) {
  if (j.status === 'Completed') return 'badge-completed';
  if (j.status === 'QC') return 'badge-qc';
  if (j.status === 'Rework') return 'badge-rework';
  if (j.status === 'Cancelled') return 'badge-warn';
  return 'badge-inprogress';
}
function stageBadge(status) {
  const cls = status === 'completed' ? 'badge-completed' : status === 'in_progress' ? 'badge-inprogress' : 'badge-pending';
  const label = status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Pending';
  return '<span class="badge ' + cls + '">' + t(label) + '</span>';
}

function productionList() {
  const jobRows = state.jobs.map(j => {
    const item = state.items.find(i => i.id === j.itemId);
    const karigar = state.karigars.find(k => k.id === j.assignedKarigarId);
    const issued = rnd((j.metalIssues || []).reduce((s, m) => s + num(m.weight), 0));
    const returned = rnd((j.materialReturns || []).reduce((s, r) => s + num(r.weight), 0));
    const wastage = num(j.wastageActual || 0);
    const labour = num(j.labourCharges?.total || 0);
    const progress = jobProgress(j);
    const name = item?.name || j.description || j.itemId || '-';
    const code = j.code || (j.id ? j.id.slice(-8) : '');
    return '<tr>'
      + '<td><code class="mono">' + esc(code) + '</code></td>'
      + '<td>' + esc(name) + '</td>'
      + '<td>' + esc(karigar?.name || j.assignedKarigarName || t('Unassigned')) + '</td>'
      + '<td><span class="badge ' + jobStatusClass(j) + '">' + esc(t(j.status || 'Pending')) + '</span></td>'
      + '<td><div style="display:flex;align-items:center;gap:8px;min-width:110px"><div class="progress" style="flex:1"><div class="progress-bar" style="width:' + progress + '%"></div></div><span class="small mono">' + progress + '%</span></div></td>'
      + '<td class="mono align-right">' + issued.toFixed(3) + ' g</td>'
      + '<td class="mono align-right">' + returned.toFixed(3) + ' g</td>'
      + '<td class="mono align-right">' + wastage.toFixed(3) + ' g</td>'
      + '<td class="mono align-right">' + money(labour) + '</td>'
      + '<td class="mono">' + fmtDate(j.createdAt) + '</td>'
      + '<td><button class="btn btn-sm btn-outline" data-job-detail="' + j.id + '">' + t('Detail') + '</button> '
      + '<button class="btn btn-sm btn-outline" data-job-stage="' + j.id + '">' + t('Stage') + '</button> '
      + '<button class="btn btn-sm btn-outline" data-job-issue="' + j.id + '">' + t('Issue') + '</button> '
      + '<button class="btn btn-sm btn-outline" data-job-return="' + j.id + '">' + t('Return') + '</button></td>'
      + '</tr>';
  }).join('');
  const emptyJobRow = '<tr><td colspan="11" class="align-center">' + t('No production jobs') + '</td></tr>';

  const totalJobs = state.jobs.length;
  const activeJobs = state.jobs.filter(j => isJobActiveStatus(j.status)).length;
  const completedJobs = state.jobs.filter(j => j.status === 'Completed').length;
  const totalMetalIssued = rnd(state.jobs.reduce((s, j) => s + (j.metalIssues || []).reduce((s2, m) => s2 + num(m.weight), 0), 0)) + ' g';
  const totalReturned = rnd(state.jobs.reduce((s, j) => s + (j.materialReturns || []).reduce((s2, r) => s2 + num(r.weight), 0), 0)) + ' g';
  const totalWastage = rnd(state.jobs.reduce((s, j) => s + num(j.wastageActual || 0), 0)) + ' g';
  const totalLabour = money(rnd(state.jobs.reduce((s, j) => s + num(j.labourCharges?.total || 0), 0)));
  const completedJobsList = state.jobs.filter(j => j.status === 'Completed');
  const avgCompletion = completedJobsList.length ? Math.round(completedJobsList.reduce((s, j) => s + (new Date(j.updatedAt || j.createdAt) - new Date(j.createdAt)) / (1000 * 60 * 60 * 24), 0) / completedJobsList.length) + ' days' : 'N/A';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.production[0]}</h1><p class="page-subtitle">${PAGE_TITLES.production[1]}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-tab="production" data-action="new">${t('Create Job')}</button>
</div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Production Jobs')}</h2></div><div class="card-body" style="padding:0">${rows([t('Job ID'), t('Item'), t('Karigar'), t('Stage'), t('Progress'), t('Metal Issued'), t('Returned'), t('Wastage'), t('Labour'), t('Created'), t('Actions')], jobRows || emptyJobRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Production Overview')}</h2></div><div class="card-body"><div class="metric-grid">${card(t('Total Jobs'), totalJobs)}${card(t('Active Jobs'), activeJobs)}${card(t('Completed'), completedJobs)}${card(t('Total Metal Issued'), totalMetalIssued)}${card(t('Total Returned'), totalReturned)}${card(t('Total Wastage'), totalWastage)}${card(t('Total Labour'), totalLabour)}${card(t('Avg Completion'), avgCompletion)}</div></div></div>`;
}

function productionNew() {
  const items = state.items.filter(i => i.status === 'design' || i.status === 'stock');
  const itemOptions = items.map(i => ({ value: i.id, label: i.name + ' (' + i.sku + ') - ' + i.category }));
  const karigarOptions = state.karigars.map(k => ({ value: k.id, label: k.name + ' - ' + (k.specialties || []).join(', ') }));
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.production[0]} - ${t('Create Job')}</h1><p class="page-subtitle">${PAGE_TITLES.production[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-production-back>${t('Back')}</button></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('New Production Job')}</h2></div><div class="card-body"><form id="jobForm" class="form">${select('itemId', t('Item *'), itemOptions, state.jobItemId)}${select('assignedKarigarId', t('Assigned Karigar'), karigarOptions, state.jobAssignedKarigarId)}${input('targetDate', t('Target Completion Date'), 'date', new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))}${textarea('notes', t('Job Notes / Instructions'))}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Create Job')}</button></div></form></div></div>`;
}

function productionDetail(jobId) {
  const j = state.jobs.find(x => x.id === jobId);
  if (!j) return productionList();
  const item = state.items.find(i => i.id === j.itemId);
  const karigar = state.karigars.find(k => k.id === j.assignedKarigarId) || (j.assignedKarigarName ? { name: j.assignedKarigarName } : null);
  const issued = rnd((j.metalIssues || []).reduce((s, m) => s + num(m.weight), 0));
  const returned = rnd((j.materialReturns || []).reduce((s, r) => s + num(r.weight), 0));
  const net = rnd(issued - returned);
  const wastage = num(j.wastageActual || 0);
  const labour = num(j.labourCharges?.total || 0);
  const progress = jobProgress(j);
  const targetDate = j.targetDate || j.deadline || j.due || '';
  const itemName = item?.name || j.description || j.itemId || t('Unknown');

  const overviewCards =
    card(t('Item'), esc(itemName), 'SKU: ' + esc(item?.sku || '-')) +
    card(t('Karigar'), esc(karigar?.name || t('Unassigned')), karigar ? 'Rate: ' + money(num(karigar.ratePerGram)) + '/g' : '') +
    card(t('Stage'), t(j.status || 'Pending'), '<span class="badge ' + jobStatusClass(j) + '">' + t(j.status || 'Pending') + '</span>') +
    card(t('Progress'), progress + '%', '<div class="progress" style="margin-top:8px"><div class="progress-bar" style="width:' + progress + '%"></div></div>') +
    card(t('Target Date'), fmtDate(targetDate), targetDate && new Date(targetDate) < new Date() && j.status !== 'Completed' ? '<span class="badge badge-warn">' + t('Overdue') + '</span>' : '') +
    card(t('Created'), fmtDate(j.createdAt));

  const accountabilityCards =
    card(t('Metal Issued'), issued.toFixed(3) + ' g', t('Total issued to karigar')) +
    card(t('Metal Returned'), returned.toFixed(3) + ' g', t('Total returned from karigar')) +
    card(t('Net Outstanding'), net.toFixed(3) + ' g', net > 0 ? t('With karigar') : t('Settled')) +
    card(t('Wastage Recorded'), wastage.toFixed(3) + ' g', t('Actual wastage')) +
    card(t('Labour Charges'), money(labour), '') +
    card(t('Wastage %'), issued > 0 ? rnd((wastage / issued) * 100) + '%' : '0%', t('Of issued weight'));

  const issueRows = (j.metalIssues || []).map(m =>
    '<tr><td class="mono">' + fmtDate(m.date) + '</td><td>' + esc(m.metal) + '</td><td class="mono">' + esc(m.purity) + '</td><td class="mono align-right">' + num(m.weight).toFixed(3) + '</td><td class="mono align-right">' + money(m.rate) + '</td><td class="mono align-right">' + money(num(m.weight) * num(m.rate)) + '</td><td><code class="mono">' + esc(m.voucher || m.reference || '-') + '</code></td><td>' + esc(m.notes || '-') + '</td></tr>'
  ).join('');
  const emptyIssueRow = '<tr><td colspan="8" class="align-center">' + t('No metal issued') + '</td></tr>';

  const returnRows = (j.materialReturns || []).map(r =>
    '<tr><td class="mono">' + fmtDate(r.date) + '</td><td>' + esc(r.type || 'RETURN') + '</td><td>' + esc(r.metal) + '</td><td class="mono">' + esc(r.purity) + '</td><td class="mono align-right">' + num(r.weight).toFixed(3) + '</td><td><code class="mono">' + esc(r.voucher || r.reference || '-') + '</code></td><td>' + esc(r.notes || '-') + '</td></tr>'
  ).join('');
  const emptyReturnRow = '<tr><td colspan="7" class="align-center">' + t('No metal returned') + '</td></tr>';

  const stageRows = jobStages(j).map(s =>
    '<tr><td>' + esc(t(s.label || s.id)) + '</td><td>' + stageBadge(s.status) + '</td><td class="mono">' + (s.startedAt ? fmtDate(s.startedAt) : '-') + '</td><td class="mono">' + (s.completedAt ? fmtDate(s.completedAt) : '-') + '</td><td>' + esc(s.notes || '-') + '</td></tr>'
  ).join('');
  const emptyStageRow = '<tr><td colspan="5" class="align-center">' + t('No stage changes') + '</td></tr>';

  const qcRows = (j.qualityChecks || []).slice().reverse().map(q =>
    '<tr><td class="mono">' + fmtDate(q.date) + '</td><td>' + esc(q.stage || 'QC') + '</td><td>' + (q.result === 'Pass' || q.passed ? '<span class="badge badge-completed">' + t('Passed') + '</span>' : '<span class="badge badge-warn">' + t('Failed') + '</span>') + '</td><td>' + esc(q.checker || q.inspector || '-') + '</td><td>' + esc(q.notes || '-') + '</td></tr>'
  ).join('');
  const emptyQcRow = '<tr><td colspan="5" class="align-center">' + t('No quality checks') + '</td></tr>';

  const photoHtml = (j.photos || []).map(p => {
    const src = typeof p === 'string' ? p : (p.data || '');
    return '<img src="' + src + '" style="max-width:150px;margin:4px;border-radius:8px;border:1px solid var(--border-whisper)" alt="' + t('Job photo') + '">';
  }).join('');
  const emptyPhotoHtml = '<p class="muted">' + t('No photos uploaded') + '</p>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.production[0]} - <code class="mono">${esc((j.code || jobId).slice(-8))}</code></h1><p class="page-subtitle">${PAGE_TITLES.production[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-production-back>${t('Back')}</button><button class="btn btn-champagne" data-job-stage="${j.id}">${t('Edit Stages')}</button></div></div></div>
<div class="layout">
  <div>
    <div class="card"><div class="card-header"><h2 class="card-title">${t('Job Overview')}</h2></div><div class="card-body"><div class="metric-grid">${overviewCards}</div>
      <div style="margin-top:16px"><strong>${t('Notes')}:</strong><p style="margin-top:4px;white-space:pre-wrap">${esc(j.notes || '-')}</p></div></div></div>
    <div class="card"><div class="card-header"><h2 class="card-title">${t('Metal Accountability')}</h2></div><div class="card-body"><div class="metric-grid">${accountabilityCards}</div>
      <h3 style="margin:16px 0 8px">${t('Issue History')}</h3>${rows([t('Date'), t('Metal'), t('Purity'), t('Weight (g)'), t('Rate/g'), t('Value'), t('Reference'), t('Notes')], issueRows || emptyIssueRow)}
      <h3 style="margin:16px 0 8px">${t('Return History')}</h3>${rows([t('Date'), t('Type'), t('Metal'), t('Purity'), t('Weight (g)'), t('Reference'), t('Notes')], returnRows || emptyReturnRow)}</div></div>
  </div>
  <div>
    <div class="card"><div class="card-header"><h2 class="card-title">${t('Stage History')}</h2></div><div class="card-body" style="padding:0">${rows([t('Stage'), t('Status'), t('Started'), t('Completed'), t('Notes')], stageRows || emptyStageRow)}</div></div>
    <div class="card"><div class="card-header"><h2 class="card-title">${t('Quality Checks')}</h2></div><div class="card-body" style="padding:0">${rows([t('Date'), t('Stage'), t('Result'), t('Inspector'), t('Notes')], qcRows || emptyQcRow)}</div></div>
    <div class="card"><div class="card-header"><h2 class="card-title">${t('Photos')}</h2></div><div class="card-body" style="padding:0;text-align:center">${photoHtml || emptyPhotoHtml}<div style="margin-top:12px"><input type="file" accept="image/*" multiple data-job-photos="${j.id}" style="display:none" id="photos${j.id}"><button class="btn btn-secondary" data-job-add-photos="${j.id}">${t('Add Photos')}</button></div></div></div>
  </div>
</div>`;
}

export default function production() {
  const view = state.productionView || 'list';
  if (view === 'new') return productionNew();
  if (view === 'detail') return productionDetail(state.productionViewId);
  return productionList();
}