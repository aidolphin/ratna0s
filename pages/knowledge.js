import { state, money, num, t, input, select, textarea, rows, card, esc, fmtDate, PAGE_TITLES, JEWELRY_CATEGORIES, PURITY_STANDARDS, GEMSTONE_TYPES, GEMSTONE_CUTS, GEMSTONE_CLARITY, GEMSTONE_COLORS, NEPALI_UNITS } from '../src.js';
import { KNOWLEDGE_DATA, UNITS as KC_UNITS, METALS as KC_METALS } from '../knowledge.js';

function knowledgeList() {
  const active = state.knowledgeTab || 'categories';
  const categoryButtons = [
    {id:'categories',label:t('Jewellery Categories')},
    {id:'metals',label:t('Metal Types')},
    {id:'purity',label:t('Purity Standards')},
    {id:'gemstones',label:t('Gemstone Types')},
    {id:'cuts',label:t('Gemstone Cuts')},
    {id:'clarity',label:t('Clarity Grades')},
    {id:'colors',label:t('Color Grades')},
    {id:'units',label:t('Weight Units')},
    {id:'nepali',label:t('Nepali Units')},
    {id:'formulas',label:t('Calculation Formulas')},
    {id:'hallmarks',label:t('Hallmark Standards')},
    {id:'terminology',label:t('Industry Terminology')}
  ].map(c => '<button type="button" class="knowledge-tab' + (active === c.id ? ' active' : '') + '" data-knowledge-tab="' + c.id + '">' + c.label + '</button>').join('');

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.knowledge[0]}</h1><p class="page-subtitle">${PAGE_TITLES.knowledge[1]}</p></div></div></div>
<div class="knowledge-layout">
  <div class="card knowledge-sidebar">
    <div class="card-header"><h2 class="card-title">${t('Knowledge Categories')}</h2></div>
    <div class="card-body knowledge-cats">${categoryButtons}</div>
  </div>
  <div id="knowledgeContent" class="card knowledge-content">${renderKnowledgeTab(active)}</div>
</div>`;
}

function renderKnowledgeTab(tab) {
  switch (tab) {
    case 'categories':
      const catRows = JEWELRY_CATEGORIES.map(c =>
        '<tr><td><code class="mono">' + esc(c.id) + '</code></td><td>' + esc(t(c.label)) + '</td><td>' + esc(t(c.category || '-')) + '</td><td>' + esc((c.subTypes || []).join(', ')) + '</td></tr>'
      ).join('');
      return `
<div class="card-header"><h2 class="card-title">${t('Jewellery Categories')}</h2></div>
<div class="card-body">${rows([t('ID'), t('Name'), t('Category'), t('Typical Items')], catRows)}</div>`;

    case 'metals':
      const metalRows = KC_METALS.map(m =>
        '<tr><td><code class="mono">' + esc(m.symbol || m.id) + '</code></td><td>' + esc(state.settings.language === 'ne' && m.ne ? m.ne : m.en) + '</td><td class="mono">' + esc(m.density || '-') + '</td><td>' + esc(t(m.id)) + '</td></tr>'
      ).join('');
      return `
<div class="card-header"><h2 class="card-title">${t('Metal Types')}</h2></div>
<div class="card-body">${rows([t('Code'), t('Name'), t('Density (g/cm³)'), t('Type')], metalRows)}</div>`;

    case 'purity':
      const purityRows = PURITY_STANDARDS.map(p => 
        '<tr><td class="mono">' + esc(p.karat) + '</td><td class="mono">' + esc(p.fineness) + '</td><td class="mono">' + p.goldPercent + '%</td><td class="mono">' + p.alloyPercent + '%</td><td>' + esc(t(p.commonUse)) + '</td><td>' + esc(p.hallmark || '-') + '</td></tr>'
      ).join('');
      return `
<div class="card-header"><h2 class="card-title">${t('Purity Standards')}</h2></div>
<div class="card-body">${rows([t('Karat'), t('Fineness'), t('Gold %'), t('Alloy %'), t('Common Use'), t('Hallmark')], purityRows)}</div>`;

    case 'gemstones':
      const gemRows = GEMSTONE_TYPES.map(g => 
        '<tr><td>' + esc(t(g.name)) + '</td><td>' + esc(g.mineral) + '</td><td class="mono">' + g.hardness + '</td><td>' + esc(g.colorRange) + '</td><td>' + esc(t(g.rarity)) + '</td><td>' + esc(g.commonCuts.join(', ')) + '</td><td>' + (g.birthstoneMonth ? t(g.birthstoneMonth) : '-') + '</td></tr>'
      ).join('');
      return `
<div class="card-header"><h2 class="card-title">${t('Gemstone Types')}</h2></div>
<div class="card-body">${rows([t('Name'), t('Mineral'), t('Hardness (Mohs)'), t('Color Range'), t('Rarity'), t('Common Cuts'), t('Birthstone Month')], gemRows)}</div>`;

    case 'cuts':
      const cutRows = GEMSTONE_CUTS.map(c => 
        '<tr><td>' + esc(t(c.name)) + '</td><td class="mono">' + c.facets + '</td><td>' + esc(t(c.shape)) + '</td><td>' + esc(t(c.brilliance)) + '</td><td>' + esc(c.bestFor.join(', ')) + '</td><td>' + esc(t(c.description)) + '</td></tr>'
      ).join('');
      return `
<div class="card-header"><h2 class="card-title">${t('Gemstone Cuts')}</h2></div>
<div class="card-body">${rows([t('Cut'), t('Facets'), t('Shape'), t('Brilliance'), t('Best For'), t('Description')], cutRows)}</div>`;

    case 'clarity':
      const clarityRows = GEMSTONE_CLARITY.map(c => 
        '<tr><td>' + esc(t(c.grade)) + '</td><td class="mono">' + esc(c.abbreviation) + '</td><td>' + esc(t(c.description)) + '</td><td>' + esc(t(c.visibility)) + '</td></tr>'
      ).join('');
      return `
<div class="card-header"><h2 class="card-title">${t('Clarity Grades')}</h2></div>
<div class="card-body">${rows([t('Grade'), t('Abbreviation'), t('Description'), t('Visibility')], clarityRows)}</div>`;

    case 'colors':
      const colorRows = GEMSTONE_COLORS.map(c => 
        '<tr><td>' + esc(t(c.grade)) + '</td><td>' + esc(c.range) + '</td><td>' + esc(t(c.description)) + '</td><td>' + esc(t(c.valueImpact)) + '</td></tr>'
      ).join('');
      return `
<div class="card-header"><h2 class="card-title">${t('Color Grades')}</h2></div>
<div class="card-body">${rows([t('Grade'), t('Range'), t('Description'), t('Value Impact')], colorRows)}</div>`;

    case 'units':
      const unitRows = KC_UNITS.filter(u => u.type === 'mass').map(u => {
        const g = num(u.toBase);
        const fmt = (v, d) => Number.isInteger(v) ? String(v) : v.toFixed(d);
        const name = (state.settings.language === 'ne' && u.ne) ? u.ne : u.en;
        return '<tr><td>' + esc(name) + '</td><td class="mono">' + esc(u.abbr || u.id) + '</td><td class="mono">' + fmt(g, 4) + '</td><td class="mono">' + fmt(g / 0.06479891, 2) + '</td><td class="mono">' + fmt(g / 0.2, 2) + '</td><td class="small muted">' + esc(u.source || '-') + '</td></tr>';
      }).join('');
      return `
<div class="card-header"><h2 class="card-title">${t('Weight Units (International)')}</h2></div>
<div class="card-body">${rows([t('Unit'), t('Symbol'), t('Grams'), t('Grains'), t('Carats'), t('Source')], unitRows)}</div>`;

    case 'nepali':
      const nepaliRows = NEPALI_UNITS.map(u => 
        '<tr><td>' + esc(t(u.name)) + '</td><td class="mono">' + esc(u.symbol) + '</td><td class="mono">' + u.grams + 'g</td><td class="mono">' + u.grains + ' gr</td><td class="mono">' + u.tolaEquivalent + '</td><td>' + esc(t(u.useCase)) + '</td></tr>'
      ).join('');
      return `
<div class="card-header"><h2 class="card-title">${t('Nepali Weight Units')}</h2></div>
<div class="card-body"><p class="muted" style="margin-bottom:12px">${t('Traditional units used in Nepal jewellery trade')}</p>${rows([t('Unit'), t('Symbol'), t('Grams'), t('Grains'), t('Tola Equivalent'), t('Use Case')], nepaliRows)}</div>`;

    case 'formulas':
      const formulaCards = Object.entries(KNOWLEDGE_DATA.formulas || {}).map(([key, f]) => {
        let html = '<div class="card" style="padding:16px"><h3>' + t(f.name) + '</h3><p class="muted">' + t(f.description) + '</p><pre style="background:var(--bg-elevated);padding:12px;border-radius:8px;overflow:auto"><code>' + esc(f.formula) + '</code></pre>';
        if (f.example) html += '<p><strong>' + t('Example') + ':</strong> ' + esc(f.example) + '</p>';
        if (f.variables) html += '<p><strong>' + t('Variables') + ':</strong> ' + Object.entries(f.variables).map(([k,v]) => k + ' = ' + t(v)).join(', ') + '</p>';
        html += '</div>';
        return html;
      }).join('');
      return `
<div class="card-header"><h2 class="card-title">${t('Calculation Formulas')}</h2></div>
<div class="card-body">
  <div style="display:grid;gap:16px">
    ${formulaCards}
  </div>
</div>`;

    case 'hallmarks':
      const hallmarkRows = (KNOWLEDGE_DATA.hallmarks || []).map(h => 
        '<tr><td>' + esc(t(h.country)) + '</td><td>' + esc(t(h.authority)) + '</td><td class="mono">' + esc(h.mark) + '</td><td>' + esc(h.purity) + '</td><td>' + (h.mandatory ? t('Yes') : t('No')) + '</td></tr>'
      ).join('');
      const emptyHallmarkRow = '<tr><td colspan="5" class="align-center">' + t('No hallmark data') + '</td></tr>';
      return `
<div class="card-header"><h2 class="card-title">${t('Hallmark Standards')}</h2></div>
<div class="card-body">${rows([t('Country'), t('Authority'), t('Mark'), t('Purity Indicated'), t('Mandatory')], hallmarkRows || emptyHallmarkRow)}</div>`;

    case 'terminology':
      const termRows = (KNOWLEDGE_DATA.terminology || []).map(term => 
        '<tr><td><strong>' + esc(term.term) + '</strong></td><td>' + esc(term.definition) + '</td><td>' + esc(term.category) + '</td></tr>'
      ).join('');
      const emptyTermRow = '<tr><td colspan="3" class="align-center">' + t('No terminology data') + '</td></tr>';
      return `
<div class="card-header"><h2 class="card-title">${t('Industry Terminology')}</h2></div>
<div class="card-body">${rows([t('Term'), t('Definition'), t('Category')], termRows || emptyTermRow)}</div>`;

    default:
      return '<div class="card-body"><p class="align-center muted">' + t('Select a category from the sidebar') + '</p></div>';
  }
}

export default function knowledge() {
  return knowledgeList();
}