import { state, stock, calcItem, money, num, rnd, t, icon, input, select, textarea, card, rows, esc, lt, PAGE_TITLES, JEWELRY_CATEGORIES, STATUS_OPTIONS, LOCATIONS, PURITY_OPTIONS, METAL_TYPES_BY_CATEGORY, generateSKU, generateBarcode, generateQRData, recordMovement, save } from '../src.js';

function renderInventoryList(list) {
  if (!list.length) return `<div class="empty"><svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg><p class="empty-title">${t('No items found')}</p><p class="empty-message">${t('Add your first jewellery item above')}</p></div>`;
  return list.map(i => {
    const cat = JEWELRY_CATEGORIES.find(c => c.id === i.category);
    const catIcon = cat ? cat.icon : '';
    const cost = calcItem.totalCost(i);
    const margin = i.sellingPrice ? ((i.sellingPrice - cost) / i.sellingPrice * 100) : 0;
    const statusClass = 'badge-' + (i.status || 'stock').toLowerCase().replace('_', '-');
    return `
    <div class="inv-card" data-id="${esc(i.id)}">
      <div class="inv-card-header">
        <div class="inv-card-main">
          <span class="category-badge ${i.category}">${icon(catIcon)}<span class="nav-label">${cat ? t(cat.label) : i.category}</span></span>
          <h3 class="inv-card-name">${esc(i.name)}</h3>
        </div>
        <div class="inv-card-meta">
          <code class="mono">${esc(i.sku)}</code>
          <span class="purity-badge ${i.category}">${esc(i.purity)}</span>
        </div>
      </div>
      <div class="inv-card-body">
        <div class="inv-card-row"><span class="inv-label">${t('Code')}:</span><span class="inv-value mono">${esc(i.code)}</span></div>
        <div class="inv-card-row"><span class="inv-label">${t('Metal')}:</span><span class="inv-value">${esc(lt(i.metalType || i.metal || ''))}</span></div>
        <div class="inv-card-row"><span class="inv-label">${t('Net (g)')}:</span><span class="inv-value mono">${num(i.netWeight || i.weight).toFixed(3)}g</span></div>
        <div class="inv-card-row"><span class="inv-label">${t('Cost')}:</span><span class="inv-value">${money(cost)}</span></div>
        <div class="inv-card-row"><span class="inv-label">${t('Sell')}:</span><span class="inv-value">${money(i.sellingPrice)}</span></div>
        <div class="inv-card-row"><span class="inv-label">${t('Margin')}:</span><span class="inv-value ${margin < 10 ? '' : 'margin-ok'}">${margin.toFixed(1)}%</span></div>
        <div class="inv-card-row"><span class="inv-label">${t('Status')}:</span><span class="badge ${statusClass}">${t(i.status || 'stock')}</span></div>
        <div class="inv-card-row"><span class="inv-label">${t('Location')}:</span><span class="inv-value">${esc(lt(i.location || 'Showcase'))}</span></div>
      </div>
      <div class="inv-card-actions"><button class="btn btn-ghost btn-sm" data-inv-edit="${esc(i.id)}">${t('Edit')}</button><button class="btn btn-danger btn-sm" data-inv-delete="${esc(i.id)}">${t('Delete')}</button></div>
    </div>`;
  }).join('');
}

export default function inventory() {
  const searchQuery = state.invSearch || '';
  const filterCategory = state.invFilterCategory || 'all';
  const filterStatus = state.invFilterStatus || 'all';
  const filterMetal = state.invFilterMetal || 'all';
  const filterPurity = state.invFilterPurity || 'all';
  const sortBy = state.invSortBy || 'createdAt';
  const sortDir = state.invSortDir || 'desc';
  let list = state.items.slice();
  if (searchQuery) { const q = searchQuery.toLowerCase(); list = list.filter(i => [i.code, i.sku, i.name, i.metalType, i.category].join(' ').toLowerCase().includes(q)); }
  if (filterCategory !== 'all') list = list.filter(i => i.category === filterCategory);
  if (filterStatus !== 'all') list = list.filter(i => i.status === filterStatus);
  if (filterMetal !== 'all') list = list.filter(i => (i.metalType || i.metal) === filterMetal);
  if (filterPurity !== 'all') list = list.filter(i => String(i.purity) === filterPurity);
  list.sort((a, b) => { let av = a[sortBy], bv = b[sortBy]; if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv || '').toLowerCase(); } if (sortDir === 'asc') return av > bv ? 1 : -1; return av < bv ? 1 : -1; });
  const metals = [...new Set(state.items.map(i => i.metalType || i.metal).filter(Boolean))];
  const purities = [...new Set(state.items.map(i => String(i.purity)).filter(Boolean))].sort();
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.inventory[0]}</h1><p class="page-subtitle">${PAGE_TITLES.inventory[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-inv-export>${t('Export CSV')}</button><button class="btn btn-champagne" data-inv-add>${icon('plus')} ${t('New Item')}</button></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">${t('Add / Edit Jewellery Item')}</h2></div><div class="card-body"><form id="itemForm" class="form" data-edit-id="">
  <input type="hidden" name="id" id="itemId"><input type="hidden" name="category" id="itemCategory" value="gold">
  <div class="tabs" id="itemTypeTabs" style="margin-bottom:12px"><button type="button" class="tab active" data-cat="gold">${t('Gold')}</button><button type="button" class="tab" data-cat="silver">${t('Silver')}</button><button type="button" class="tab" data-cat="diamond">${t('Diamond')}</button><button type="button" class="tab" data-cat="gemstone">${t('Gemstone')}</button></div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">${input('code', 'Item Code', 'text', '', '')}${input('sku', 'SKU', 'text', '', 'readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">${input('name', 'Item Name', 'text', '', 'required')}${select('metalType', 'Metal Type', METAL_TYPES_BY_CATEGORY.gold.map(v => ({ value: v, label: lt(v) })), 'Gold')}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${select('purity', 'Purity', PURITY_OPTIONS, '22K')}${input('grossWeight', 'Gross (g)', 'number', '', 'min="0" step="0.001" required')}${input('stoneWeight', 'Stone (g)', 'number', '0', 'min="0" step="0.001"')}${input('netWeight', 'Net (g)', 'number', '', 'min="0" step="0.001" readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${input('makingCharge', 'Making (NPR)', 'number', '0', 'min="0" step="0.01"')}${input('wastagePercent', 'Wastage %', 'number', '0', 'min="0" step="0.1"')}${input('wastageWeight', 'Wastage (g)', 'number', '0', 'min="0" step="0.001" readonly')}${input('costPrice', 'Cost (NPR)', 'number', '', 'min="0" step="0.01" readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${input('sellingPrice', 'Selling (NPR)', 'number', '', 'min="0" step="0.01"')}${input('marginPercent', 'Margin %', 'number', '', 'readonly')}${input('barcode', 'Barcode', 'text', '', 'readonly')}${input('qrCode', 'QR Data', 'text', '', 'readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${select('status', 'Status', STATUS_OPTIONS.map(v => ({ value: v, label: t(v) })), 'stock')}${select('location', 'Location', LOCATIONS.map(v => ({ value: v, label: t(v) })), 'Showcase')}${input('tags', 'Tags (comma)', 'text', '', '')}</div>
  <div id="stoneDetailsSection" style="display:none"><h4>${t('Stone Details')}</h4><div id="stoneDetailsRows"></div><button type="button" class="btn btn-secondary btn-sm" data-add-stone>${icon('plus')} ${t('Add Stone Row')}</button></div>
  <div><h4>Images</h4><input type="file" id="itemImages" accept="image/*" multiple style="display:none"><button type="button" class="btn btn-secondary btn-sm" data-add-images>Upload Images</button><div id="imagePreview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div></div>
  <div class="field-full" style="display:flex;gap:8px"><button class="btn btn-champagne" type="submit"><span id="submitBtnText">Add to Inventory</span></button><button type="button" class="btn btn-secondary" data-inv-cancel style="display:none">${t('Cancel Edit')}</button></div>
</form></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Inventory')}</h2></div><div class="card-body"><div class="toolbar" style="display:flex;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-5)"><input type="search" id="invSearch" class="field-input" placeholder="${t('Search items...')}" value="${esc(searchQuery)}" style="max-width:300px">${select('invFilterCategory', '', ['all', ...JEWELRY_CATEGORIES.map(c => ({ value: c.id, label: t(c.label) }))], filterCategory)}${select('invFilterStatus', '', [{ value: 'all', label: t('All') }, ...STATUS_OPTIONS.map(v => ({ value: v, label: t(v) }))], filterStatus)}${select('invFilterMetal', '', [{ value: 'all', label: t('All') }, ...metals.map(v => ({ value: v, label: lt(v) }))], filterMetal)}${select('invFilterPurity', '', ['all', ...purities], filterPurity)}${select('invSortBy', '', [{ value: 'createdAt', label: t('Newest first') }, { value: 'name', label: t('Name') }, { value: 'sku', label: t('SKU') }, { value: 'netWeight', label: t('Net weight') }, { value: 'sellingPrice', label: t('Selling Price') }, { value: 'status', label: t('Status') }], sortBy)}<button class="btn btn-ghost btn-sm" data-inv-sort-dir="${sortDir}" title="${sortDir === 'asc' ? t('Ascending') : t('Descending')}">${sortDir === 'asc' ? '↑' : '↓'}</button></div><div id="invList" class="inv-list">${renderInventoryList(list)}</div></div></div>`;
}