import { state, money, num, t, icon, input, select, textarea, rows, card, esc, fmtDate, PAGE_TITLES, PAYMENT_METHODS, JOB_STAGES } from '../src.js';

function settingsGeneral() {
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.settings[0]} - ${t('General')}</h1><p class="page-subtitle">${PAGE_TITLES.settings[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Business Information')}</h2></div><div class="card-body"><form id="settingsGeneral" class="form">${input('businessName', t('Business Name'), 'text', state.settings.businessName)}${input('businessAddress', t('Address'), 'text', state.settings.businessAddress)}${input('businessPhone', t('Phone'), 'tel', state.settings.businessPhone)}${input('businessEmail', t('Email'), 'email', state.settings.businessEmail)}${input('businessGST', t('GST / PAN Number'), 'text', state.settings.businessGST)}${select('currency', t('Base Currency'), ['NPR', 'USD', 'EUR', 'INR'].map(c => ({ value: c, label: c })), state.settings.currency)}${select('language', t('Default Language'), [{value:'en',label:'English'},{value:'ne',label:'नेपाली'},{value:'hi',label:'हिन्दी'}], state.settings.language)}${input('timezone', t('Timezone'), 'text', state.settings.timezone || 'Asia/Kathmandu')}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Save General Settings')}</button></div></form></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Tax Configuration')}</h2></div><div class="card-body"><form id="settingsTax" class="form">${input('taxLabel', t('Tax Label (e.g., VAT, GST)'), 'text', state.settings.taxLabel)}${input('taxRate', t('Tax Rate (%)'), 'number', state.settings.taxRate, 'min="0" max="100" step="0.1"')}${select('taxInclusive', t('Prices Include Tax'), [{value:'true',label:t('Yes')},{value:'false',label:t('No')}], state.settings.taxInclusive ? 'true' : 'false')}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Save Tax Settings')}</button></div></form></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Invoice Settings')}</h2></div><div class="card-body"><form id="settingsInvoice" class="form">${input('invoicePrefix', t('Invoice Prefix'), 'text', state.settings.invoicePrefix)}${input('invoiceNextNumber', t('Next Invoice Number'), 'number', state.settings.invoiceNextNumber, 'min="1"')}${textarea('invoiceFooter', t('Invoice Footer Text'), state.settings.invoiceFooter)}${select('invoiceTemplate', t('Invoice Template'), ['standard', 'detailed', 'minimal'].map(x => ({ value: x, label: t(x) })), state.settings.invoiceTemplate)}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Save Invoice Settings')}</button></div></form></div></div>`;
}

function settingsRates() {
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.settings[0]} - ${t('Metal Rates')}</h1><p class="page-subtitle">${PAGE_TITLES.settings[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Current Metal Rates')}</h2></div><div class="card-body"><form id="settingsRates" class="form">${input('rates.gold', t('Gold Rate (NPR/g)'), 'number', state.rates.gold, 'min="0" step="0.01"')}${input('rates.silver', t('Silver Rate (NPR/g)'), 'number', state.rates.silver, 'min="0" step="0.01"')}${input('rates.platinum', t('Platinum Rate (NPR/g)'), 'number', state.rates.platinum, 'min="0" step="0.01"')}${input('rates.roseGold', t('Rose Gold Rate (NPR/g)'), 'number', state.rates.roseGold, 'min="0" step="0.01"')}${input('rates.whiteGold', t('White Gold Rate (NPR/g)'), 'number', state.rates.whiteGold, 'min="0" step="0.01"')}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Update Rates')}</button></div></form><p class="note note-caution" style="margin-top:12px">${t('Rates are used for valuation. Update daily for accurate pricing.')}</p></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Making Charges')}</h2></div><div class="card-body"><form id="settingsMaking" class="form">${select('makingChargeType', t('Charge Type'), ['percentage', 'per_gram', 'fixed'].map(x => ({ value: x, label: t(x) })), state.settings.makingChargeType)}${input('makingChargeValue', t('Charge Value'), 'number', state.settings.makingChargeValue, 'min="0" step="0.01"')}${select('makingChargeByCategory', t('Apply By Category'), [{value:'true',label:t('Yes')},{value:'false',label:t('No')}], state.settings.makingChargeByCategory ? 'true' : 'false')}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Save Making Charges')}</button></div></form></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Wastage Allowances')}</h2></div><div class="card-body"><form id="settingsWastage" class="form">${input('wastageGold', t('Gold Wastage %'), 'number', state.settings.wastageGold, 'min="0" max="10" step="0.01"')}${input('wastageSilver', t('Silver Wastage %'), 'number', state.settings.wastageSilver, 'min="0" max="10" step="0.01"')}${input('wastageDiamond', t('Diamond Wastage %'), 'number', state.settings.wastageDiamond, 'min="0" max="10" step="0.01"')}${input('wastageGemstone', t('Gemstone Wastage %'), 'number', state.settings.wastageGemstone, 'min="0" max="10" step="0.01"')}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Save Wastage Allowances')}</button></div></form></div></div>`;
}

function settingsUsers() {
  const users = window.RatnaOS?.auth?.listUsers?.() || state.users || [];
  const currentUsername = window.RatnaOS?.auth?.getCurrentUser?.()?.username || state.currentUserId;
  const userRows = users.map(u => {
    const activeBadge = u.active ? '<span class="badge badge-completed">' + t('Active') + '</span>' : '<span class="badge badge-warn">' + t('Inactive') + '</span>';
    const toggleBtn = u.id !== currentUsername ? '<button class="btn btn-sm btn-outline" data-user-toggle="' + esc(u.id) + '">' + (u.active ? t('Deactivate') : t('Activate')) + '</button>' : '';
    return '<tr><td>' + esc(u.name) + '</td><td>' + esc(u.email) + '</td><td>' + t(u.role) + '</td><td>' + activeBadge + '</td><td class="mono">' + (u.lastLogin ? fmtDate(u.lastLogin) : '-') + '</td><td>' + toggleBtn + '</td></tr>';
  }).join('');
  const emptyUserRow = '<tr><td colspan="6" class="align-center">' + t('No users') + '</td></tr>';

  const permRows = [
    ['users.manage', true, true, false, false, false, false],
    ['inventory.manage', true, true, true, false, false, true],
    ['pos.access', true, true, true, false, false, true],
    ['production.manage', true, true, false, false, true, true],
    ['financial.view', true, true, false, true, false, true],
    ['financial.manage', true, true, false, true, false, false],
    ['reports.view', true, true, true, true, false, true],
    ['settings.manage', true, false, false, false, false, false],
    ['karigar.manage', true, true, false, false, false, false],
    ['metal.manage', true, true, false, false, true, false],
  ].map(([p, a, m, s, ac, k, v]) => 
    '<tr><td><code class="mono">' + esc(p) + '</code></td>' + [a,m,s,ac,k,v].map(x => '<td class="align-center">' + (x ? icon('check', 16) : icon('x', 16)) + '</td>').join('') + '</tr>'
  ).join('');

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.settings[0]} - ${t('Users & Roles')}</h1><p class="page-subtitle">${PAGE_TITLES.settings[1]}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-tab="settings" data-action="newUser">${t('Add User')}</button>
</div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('System Users')}</h2></div><div class="card-body" style="padding:0">${rows([t('Name'), t('Email'), t('Role'), t('Status'), t('Last Login'), t('Actions')], userRows || emptyUserRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Role Permissions')}</h2></div><div class="card-body" style="padding:0">${rows([t('Permission'), t('Admin'), t('Manager'), t('Sales'), t('Accountant'), t('Karigar'), t('Viewer')], permRows)}</div></div>`;
}

function settingsUsersNew() {
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.settings[0]} - ${t('Add User')}</h1><p class="page-subtitle">${PAGE_TITLES.settings[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('New User')}</h2></div><div class="card-body"><form id="userForm" class="form">${input('name', t('Full Name *'))}${input('email', t('Email *'), 'email')}${input('password', t('Password *'), 'password')}${select('role', t('Role *'), ['admin', 'manager', 'sales', 'accountant', 'karigar', 'viewer'].map(r => ({ value: r, label: t(r) })))}${input('phone', t('Phone'), 'tel')}${textarea('notes', t('Notes'))}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Create User')}</button></div></form></div></div>`;
}

function settingsBackup() {
  const backupRows = (state.backups || []).slice().reverse().map(b => 
    '<tr><td class="mono">' + fmtDate(b.date) + '</td><td>' + t(b.type) + '</td><td class="mono">' + b.size + '</td><td>' + esc(b.notes || '-') + '</td><td><button class="btn btn-sm btn-outline" data-backup-restore="' + b.id + '">' + t('Restore') + '</button><button class="btn btn-sm btn-outline" data-backup-download="' + b.id + '">' + t('Download') + '</button><button class="btn btn-sm btn-outline btn-danger" data-backup-delete="' + b.id + '">' + t('Delete') + '</button></td></tr>'
  ).join('');
  const emptyBackupRow = '<tr><td colspan="5" class="align-center">' + t('No backups available') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.settings[0]} - ${t('Backup & Restore')}</h1><p class="page-subtitle">${PAGE_TITLES.settings[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Create Backup')}</h2></div><div class="card-body"><form id="backupForm" class="form">${select('backupType', t('Backup Type'), ['full', 'data_only', 'config_only'].map(x => ({ value: x, label: t(x) })), 'full')}${textarea('backupNotes', t('Notes'))}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Create Backup')}</button></div></form></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Available Backups')}</h2></div><div class="card-body" style="padding:0">${rows([t('Date'), t('Type'), t('Size'), t('Notes'), t('Actions')], backupRows || emptyBackupRow)}</div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Auto Backup')}</h2></div><div class="card-body"><form id="autoBackupForm" class="form">${select('autoBackupEnabled', t('Enabled'), [{value:'true',label:t('Yes')},{value:'false',label:t('No')}], state.settings.autoBackupEnabled ? 'true' : 'false')}${select('autoBackupFrequency', t('Frequency'), ['daily', 'weekly', 'monthly'].map(f => ({ value: f, label: t(f) })), state.settings.autoBackupFrequency)}${input('autoBackupTime', t('Time'), 'time', state.settings.autoBackupTime || '02:00')}${input('autoBackupRetention', t('Retention (days)'), 'number', state.settings.autoBackupRetention, 'min="1"')}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Save Auto Backup Settings')}</button></div></form></div></div>`;
}

function settingsAudit() {
  const auditRows = (state.auditLog || []).filter(a => {
    if (state.auditStartDate && a.date < state.auditStartDate) return false;
    if (state.auditEndDate && a.date > state.auditEndDate) return false;
    if (state.auditUser && state.auditUser !== 'all' && a.userId !== state.auditUser) return false;
    if (state.auditAction && state.auditAction !== 'all' && a.action !== state.auditAction) return false;
    if (state.auditEntity && state.auditEntity !== 'all' && a.entity !== state.auditEntity) return false;
    return true;
  }).slice(-100).reverse().map(a => 
    '<tr><td class="mono">' + fmtDate(a.date) + ' ' + (a.time || '') + '</td><td>' + esc(a.userName || a.userId) + '</td><td><span class="badge">' + t(a.action) + '</span></td><td>' + t(a.entity) + '</td><td><code class="mono">' + esc(a.entityId?.slice(-8) || '-') + '</code></td><td><pre style="margin:0;font-size:0.75rem;max-width:300px">' + esc(JSON.stringify(a.changes || {}, null, 2)) + '</pre></td><td class="mono">' + esc(a.ip || '-') + '</td></tr>'
  ).join('');
  const emptyAuditRow = '<tr><td colspan="7" class="align-center">' + t('No audit entries') + '</td></tr>';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.settings[0]} - ${t('Audit Log')}</h1><p class="page-subtitle">${PAGE_TITLES.settings[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Filter')}</h2></div><div class="card-body"><form id="auditFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">${input('auditStartDate', t('From'), 'date', state.auditStartDate || new Date(Date.now() - 7*86400000).toISOString().slice(0, 10))}${input('auditEndDate', t('To'), 'date', state.auditEndDate || new Date().toISOString().slice(0, 10))}${select('auditUser', t('User'), ['all', ...(state.users || []).map(u => ({ value: u.id, label: u.name }))], state.auditUser || 'all')}${select('auditAction', t('Action'), ['all', 'create', 'update', 'delete', 'login', 'logout', 'export', 'print'].map(a => ({ value: a, label: t(a) })), state.auditAction || 'all')}${select('auditEntity', t('Entity'), ['all', 'item', 'sale', 'job', 'user', 'karigar', 'customer', 'supplier', 'settings'].map(e => ({ value: e, label: t(e) })), state.auditEntity || 'all')}</form></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Audit Trail')}</h2></div><div class="card-body" style="padding:0;max-height:600px;overflow:auto">${rows([t('Date'), t('User'), t('Action'), t('Entity'), t('Entity ID'), t('Changes'), t('IP')], auditRows || emptyAuditRow)}</div></div>`;
}

function settingsAdvanced() {
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.settings[0]} - ${t('Advanced')}</h1><p class="page-subtitle">${PAGE_TITLES.settings[1]}</p></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('System Configuration')}</h2></div><div class="card-body"><form id="settingsAdvanced" class="form">${select('maintenanceMode', t('Maintenance Mode'), [{value:'true',label:t('Enabled')},{value:'false',label:t('Disabled')}], state.settings.maintenanceMode ? 'true' : 'false')}${input('sessionTimeout', t('Session Timeout (minutes)'), 'number', state.settings.sessionTimeout, 'min="5" max="1440"')}${input('maxLoginAttempts', t('Max Login Attempts'), 'number', state.settings.maxLoginAttempts, 'min="1" max="20"')}${input('lockoutDuration', t('Lockout Duration (minutes)'), 'number', state.settings.lockoutDuration, 'min="1" max="1440"')}${select('require2FA', t('Require 2FA for Admins'), [{value:'true',label:t('Yes')},{value:'false',label:t('No')}], state.settings.require2FA ? 'true' : 'false')}${select('auditRetention', t('Audit Log Retention (days)'), ['90', '180', '365', '730'].map(d => ({ value: d, label: d })), state.settings.auditRetention || '365')}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Save Advanced Settings')}</button></div></form></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Integration Settings')}</h2></div><div class="card-body"><form id="settingsIntegration" class="form">${input('smsProvider', t('SMS Provider'), 'text', state.settings.smsProvider)}${input('smsApiKey', t('SMS API Key'), 'password', state.settings.smsApiKey)}${input('emailProvider', t('Email Provider'), 'text', state.settings.emailProvider)}${input('emailApiKey', t('Email API Key'), 'password', state.settings.emailApiKey)}${input('webhookUrl', t('Webhook URL'), 'url', state.settings.webhookUrl)}${input('webhookSecret', t('Webhook Secret'), 'password', state.settings.webhookSecret)}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Save Integration Settings')}</button></div></form></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Danger Zone')}</h2></div><div class="card-body"><div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn-danger" data-action="clearCache">${t('Clear All Cache')}</button><button class="btn btn-danger" data-action="reindexSearch">${t('Reindex Search')}</button><button class="btn btn-danger" data-action="resetDemoData" style="margin-left:auto">${t('Reset to Demo Data')}</button></div><p class="note note-caution" style="margin-top:12px">${t('These actions are irreversible. Use with caution.')}</p></div></div>`;
}

function settingsTabs() {
  const tabs = [
    ['general', t('General')],
    ['rates', t('Metal Rates')],
    ['users', t('Users & Roles')],
    ['backup', t('Backup & Restore')],
    ['audit', t('Audit Log')],
    ['advanced', t('Advanced')]
  ];
  const view = state.settingsView || 'general';
  return tabs.map(([key, label]) => `<button class="tab ${view === key ? 'active' : ''}" data-settings-tab="${key}">${esc(label)}</button>`).join('');
}

export default function settings() {
  const view = state.settingsView || 'general';
  const tabsHtml = '<div class="tabs" style="margin:8px 0 16px;flex-wrap:wrap">' + settingsTabs() + '</div>';
  if (view === 'rates') return tabsHtml + settingsRates();
  if (view === 'users') return tabsHtml + settingsUsers();
  if (view === 'usersNew') return tabsHtml + settingsUsersNew();
  if (view === 'backup') return tabsHtml + settingsBackup();
  if (view === 'audit') return tabsHtml + settingsAudit();
  if (view === 'advanced') return tabsHtml + settingsAdvanced();
  return tabsHtml + settingsGeneral();
}