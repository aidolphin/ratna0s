import './style.css';
import {
  t, tAll, LOCALES, COUNTRIES, LANGUAGE_OPTIONS, COUNTRY_OPTIONS,
  setLanguage, getLanguage, setCountry, getCountry, countryProfile, applyCountryPreset,
  formatMoney, formatNumber, formatDate, formatDateTime, formatDateLong, formatWeight, localizeDom, toDevanagariDigits,
  setNumeralStyle, getNumeralStyle
} from './i18n.js';
import {
  JEWELLERY_CATALOGUE, REGIONAL_COLLECTIONS, METALS, GOLD_PURITIES as KC_GOLD_PURITIES, SILVER_PURITIES as KC_SILVER_PURITIES,
  MEASUREMENT_TYPES, UNITS as KC_UNITS, UNIT_BY_ID, RING_SIZE_SYSTEMS, REGIONS, REGIONAL_TERMS, TOOLS,
  GEMSTONES, PROCESSES, CURRENCIES, INTERNATIONAL_STANDARDS, RING_SIZE_TABLE, CONFIRMATION_ITEMS, ringSizeNearest, ringSizeToCircumference,
  convert as convertUnits, convertRounded, karatToFineness, finenessToKarat, searchKnowledge
} from './knowledge.js';
import {
  ensureAccounting, postSale, postExpense, postMetalTxn, postSupplierPayment,
  trialBalance, accountLedger, backfill, accountingSummary, formatMinor, fromMinor,
  reverseJournal, ACCOUNTS, addAccount, updateAccount, archiveAccount, accountsForEntry,
  postVoucher, voucherRegister, postOpeningBalances, addFiscalYear, closeFiscalYear,
  reopenFiscalYear, cashBook, fiscalYearById, isDateInClosedYear, makeLine, toMinor
} from './accounting.js';
import {
  ensureTax, addTaxRule, endTaxRule, verifyTaxRule, ruleFor, vatRateFor, tdsCategories,
  postVatPurchase, vatRegisters, vatLiability, addVatPeriod, vatPeriodSummary,
  prepareVatReturn, payVatPeriod, postTdsEntry, depositTds, tdsOutstanding, taxSummary,
  taxRegisterRows
} from './tax.js';

// Expose the translator so the classic reliability.js layer can localize its messages
if(typeof window!=='undefined'){
  window.RatnaOS=window.RatnaOS||{};
  window.RatnaOS.t=t;
  window.RatnaOS.i18n={t,setLanguage,getLanguage,setCountry,getCountry,countryProfile,formatDate,formatDateTime,formatMoney,formatWeight,LOCALES,COUNTRIES};
}

const KEY='ratnaos-pilot-v1';
const initial=()=>({rates:{gold:15000,silver:180},items:[],sales:[],exchanges:[],jobs:[],audit:[],materials:{metals:[],gemstones:[],consumables:[]},boms:[],metalIssues:[],stockMovements:[],customers:[],karigars:[],suppliers:[],expenses:[],metalManagement:{openingBalances:{},transactions:[],postedPeriods:[]},quotes:[],settings:{shop:'RatnaOS Jewellery',currency:'NPR',taxRate:13,taxLabel:'VAT',invoicePrefix:'INV',country:'NP',language:'en',taxInclusive:true,weightUnit:'tola',calendar:'bs',vatNumber:'',rateSync:{enabled:false,url:'',goldPath:'gold',silverPath:'silver',unit:'tola',lastSync:null,lastAttempt:null,lastStatus:'',lastMessage:''}}});
let state;
try{state=JSON.parse(localStorage.getItem(KEY))||initial()}catch{state=initial()}
state.kcOverrides=state.kcOverrides||{};
state.settings=state.settings||{};
state.settings.confirmations=state.settings.confirmations||{};
state={...initial(),...state};
state.rates={...initial().rates,...(state.rates||{})};
state.settings={...initial().settings,...(state.settings||{})};
state.materials={metals:[],gemstones:[],consumables:[],...(state.materials||{})};
state.metalManagement={openingBalances:{},transactions:[],postedPeriods:[],...(state.metalManagement||{})};
['items','sales','exchanges','jobs','audit','boms','metalIssues','stockMovements','customers','karigars','suppliers','expenses','quotes'].forEach(k=>{if(!Array.isArray(state[k])) state[k]=[];});
ensureAccounting(state);

const money=n=>formatMoney(n,state.settings);
const translateDigits=v=>/[0-9]/.test(String(v))&&!/[<>]/.test(String(v))?toDevanagariDigits(v):v;
const fmtDate=v=>formatDate(v,state.settings);
const fmtDateTime=v=>formatDateTime(v,state.settings);
const fmtLongDate=v=>formatDateLong(v,state.settings);
const fmtWeight=g=>formatWeight(g,state.settings);
const fmtNum=v=>formatNumber(v);
const num=x=>Number(x||0);
const rnd=n=>Math.round((n+Number.EPSILON)*100)/100;
const id=()=>crypto.randomUUID();
const lt=v=>v?t(String(v)):'';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=(event,detail)=>{state.audit.unshift({id:id(),date:new Date().toISOString(),event:t(event),detail});localStorage.setItem(KEY,JSON.stringify(state));render()};
const stock=()=>state.items.filter(i=>i.status==='stock');
const fine=i=>calcItem.fineWeight(i);
const rateFor=i=>calcItem.metalRate(i);
const price=i=>i.sellingPrice||calcItem.totalCost(i);
const totals=()=>({sales:state.sales.reduce((s,x)=>s+x.total,0),gold:stock().filter(i=>(i.metalType||i.metal)==='Gold').reduce((s,i)=>s+calcItem.fineWeight(i),0),silver:stock().filter(i=>(i.metalType||i.metal)==='Silver').reduce((s,i)=>s+num(i.netWeight||i.weight),0),value:stock().reduce((s,i)=>s+price(i),0),items:stock().length});
const data=form=>Object.fromEntries(new FormData(form).entries());
const validatePositive=n=>Number.isFinite(n)&&n>0;
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

const UNITS={gram:1,milligram:0.001,tola:11.664,aana:0.729,lal:0.11664,ratti:0.1215,carat:0.2};
const toGram=(v,unit)=>num(v)*num(UNITS[unit]||1);
const fromGram=(v,unit)=>num(v)/num(UNITS[unit]||1);
const convert=(v,from,to)=>fromGram(toGram(v,from),to);

const JEWELRY_CATEGORIES = [
  { id: 'ring', label: 'Rings', icon: 'ring', category: 'gold', subTypes: ['Engagement', 'Wedding', 'Eternity', 'Signet', 'Cocktail', 'Stackable', 'Promise', 'Midi'] },
  { id: 'necklace', label: 'Necklaces', icon: 'necklace', category: 'gold', subTypes: ['Chain', 'Pendant', 'Choker', 'Collar', 'Opera', 'Lariat', 'Bib', 'Station'] },
  { id: 'earring', label: 'Earrings', icon: 'earring', category: 'gold', subTypes: ['Stud', 'Hoop', 'Drop', 'Chandelier', 'Huggie', 'Cuff', 'Threader', 'Jacket'] },
  { id: 'bracelet', label: 'Bracelets', icon: 'bracelet', category: 'gold', subTypes: ['Bangle', 'Cuff', 'Chain', 'Tennis', 'Charm', 'Link', 'Beaded', 'Slave'] },
  { id: 'pendant', label: 'Pendants', icon: 'pendant', category: 'gold', subTypes: ['Solitaire', 'Halo', 'Cluster', 'Initial', 'Religious', 'Gemstone', 'Pearl', 'Locket'] },
  { id: 'bangle', label: 'Bangles', icon: 'bangle', category: 'gold', subTypes: ['Solid', 'Hinged', 'Flexible', 'Diamond-cut', 'Enamel', 'Kundan', 'Polki', 'Temple'] },
  { id: 'anklet', label: 'Anklets', icon: 'anklet', category: 'silver', subTypes: ['Chain', 'Charm', 'Beaded', 'Payal', 'Ghungroo', 'Layered'] },
  { id: 'nosepin', label: 'Nose Pins', icon: 'nosepin', category: 'gold', subTypes: ['Stud', 'Hoop', 'Septum', 'Nath', 'Phul', 'Latkan', 'Diamond', 'Pearl'] },
  { id: 'maangtikka', label: 'Maang Tikka', icon: 'maangtikka', category: 'gold', subTypes: ['Traditional', 'Contemporary', 'Matha Patti', 'Borla', 'Rakhdi', 'Jhoomar'] },
  { id: 'earcuff', label: 'Ear Cuffs', icon: 'earcuff', category: 'gold', subTypes: ['Simple', 'Chain', 'Gemstone', 'Climber', 'Wrap', 'Double'] },
  { id: 'brooch', label: 'Brooches', icon: 'brooch', category: 'platinum', subTypes: ['Floral', 'Animal', 'Geometric', 'Cameo', 'Enamel', 'Jeweled', 'Vintage'] },
  { id: 'cufflink', label: 'Cufflinks', icon: 'cufflink', category: 'platinum', subTypes: ['Classic', 'Chain', 'Gemstone', 'Engraved', 'Novelty', 'Silk Knot'] },
  { id: 'tiepin', label: 'Tie Pins', icon: 'tiepin', category: 'platinum', subTypes: ['Classic', 'Gemstone', 'Pearl', 'Monogram', 'Themed'] },
  { id: 'watch', label: 'Watches', icon: 'watch', category: 'platinum', subTypes: ['Dress', 'Sports', 'Chronograph', 'Skeleton', 'Tourbillon', 'Smart'] },
  { id: 'coin', label: 'Gold Coins', icon: 'coin', category: 'gold', subTypes: ['1g', '2g', '5g', '8g', '10g', '20g', '50g', '100g'] },
  { id: 'bar', label: 'Gold Bars', icon: 'bar', category: 'gold', subTypes: ['5g', '10g', '20g', '50g', '100g', '250g', '500g', '1kg'] },
  { id: 'loose-diamond', label: 'Loose Diamonds', icon: 'diamond', category: 'diamond', subTypes: ['Round', 'Princess', 'Oval', 'Cushion', 'Emerald', 'Pear', 'Marquise', 'Heart'] },
  { id: 'loose-gemstone', label: 'Loose Gemstones', icon: 'gemstone', category: 'gemstone', subTypes: ['Ruby', 'Sapphire', 'Emerald', 'Tanzanite', 'Tourmaline', 'Spinel', 'Topaz', 'Garnet'] },
  { id: 'pearl', label: 'Pearls', icon: 'pearl', category: 'gemstone', subTypes: ['Akoya', 'South Sea', 'Tahitian', 'Freshwater', 'Keshi', 'Mabe', 'Baroque'] },
];

const ITEM_CATEGORIES = JEWELRY_CATEGORIES.map(c => c.id);
const PURITY_OPTIONS = ['24K','22K','21K','20K','18K','14K','12K','9K','999','925','950','PT950','PT900','PT850'];
const METAL_TYPES = ['Gold','Silver','Platinum','Rose Gold','White Gold','Two-Tone','Tri-Color'];
const STONE_TYPES = ['Diamond','Ruby','Sapphire','Emerald','Cubic Zirconia','Coral','Pearl','Navaratna','Spinel','Tourmaline','Topaz','Garnet','Opal','Tanzanite','Aquamarine','Morganite','Peridot','Amethyst','Citrine','Moonstone','Labradorite'];
const STATUS_OPTIONS = ['stock','reserved','in_production','sold','returned','damaged'];
const LOCATIONS = ['Showcase','Vault','Karigar','Workshop','Safe','Transit','Customer','Exhibition','Repair'];
const MOVEMENT_TYPES = ['IN','OUT','ADJUSTMENT'];
const MOVEMENT_REASONS = {IN:['Purchase','Production','Return from Karigar','Exchange In','Repair Return','Stock Found','Exhibition Return'],OUT:['Sale','Issue to Karigar','Exchange Out','Repair Send','Stock Transfer','Gift/Sample','Exhibition Send'],ADJUSTMENT:['Physical Count','Damage','Loss','Wastage','Revaluation','Stone Replacement','Resizing']};
const PAYMENT_METHODS = ['Cash','Bank Transfer','Card','Wallet','UPI','Credit','Cheque','Gold Exchange','Installment'];

const METAL_TXN_TYPES = [
  {value:'OPENING_BALANCE',label:'Opening Balance',icon:'📊',color:'var(--info)'},
  {value:'PURCHASE',label:'Purchase',icon:'📥',color:'var(--success)'},
  {value:'ISSUE',label:'Issue to Production',icon:'📤',color:'var(--warning)'},
  {value:'RETURN',label:'Return from Production',icon:'🔄',color:'var(--info)'},
  {value:'RECEIPT',label:'Old Gold Receipt',icon:'♻️',color:'var(--gold-primary)'},
  {value:'WASTAGE',label:'Wastage/Loss',icon:'🗑️',color:'var(--error)'},
  {value:'ADJUSTMENT',label:'Adjustment',icon:'⚖️',color:'var(--text-muted)'}
];
const GOLD_PURITIES = ['24K','22K','21K','20K','18K','14K','12K','9K'];
const SILVER_PURITIES = ['999','950','925','900','800'];
const PLATINUM_PURITIES = ['PT950','PT900','PT850'];
const METAL_UNITS = ['gram','tola','kg','pennyweight','ounce'];

const JOB_STATUSES = ['Pending','In Progress','QC','Rework','Completed'];
const JOB_STAGES = [
  {id:'received',label:'Material Received',order:1,icon:'📥'},
  {id:'casting',label:'Casting',order:2,icon:'🔥'},
  {id:'filing',label:'Filing/Finishing',order:3,icon:'🔧'},
  {id:'stone_setting',label:'Stone Setting',order:4,icon:'💎'},
  {id:'polishing',label:'Polishing',order:5,icon:'✨'},
  {id:'qc',label:'Quality Check',order:6,icon:'🔍'},
  {id:'packing',label:'Packing',order:7,icon:'📦'},
  {id:'delivered',label:'Delivered',order:8,icon:'🚚'}
];
const LABOUR_METHODS = ['perGram','perTola','flat','pctMetal'];
const KARIGAR_SPECIALTIES = ['Casting','Filing','Stone Setting','Polishing','Engraving','Enameling','Chain Making','Wire Drawing','Filigree','Kundan','Meenakari','Thewa','Jadau','Other'];
const QC_RESULTS = ['Pass','Fail','Conditional Pass'];
const PRIORITY_OPTIONS = ['low','normal','high','urgent'];

const JEWELRY_ICONS = {
  ring: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="3"/></svg>`,
  necklace: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2c-3.5 0-6.5 2-7.5 5 1.5 4.5 5.5 7 7.5 7s6-2.5 7.5-7c-1-3-4-5-7.5-5z"/><circle cx="12" cy="14" r="2"/></svg>`,
  earring: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4a6 6 0 0 0-6 6c0 3.5 3.5 5 6 9s6-5.5 6-9a6 6 0 0 0-6-6z"/><circle cx="12" cy="10" r="2"/></svg>`,
  bracelet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="12" rx="7" ry="5"/><ellipse cx="12" cy="12" rx="4" ry="2"/></svg>`,
  pendant: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4l4 12h-8l4-12z"/><circle cx="12" cy="6" r="1.5"/></svg>`,
  bangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="12" rx="8" ry="6"/><ellipse cx="12" cy="12" rx="5" ry="3.5"/></svg>`,
  anklet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="16" rx="6" ry="3"/><path d="M6 16c0-2 2-3 6-3s6 1 6 3"/></svg>`,
  nosepin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="2"/><path d="M12 14v4M10 16h4"/></svg>`,
  maangtikka: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4v6M8 7h8"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="14" r="1.5"/></svg>`,
  earcuff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 12a6 6 0 0 1-12 0"/><circle cx="12" cy="12" r="2"/></svg>`,
  brooch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="12" rx="7" ry="5"/><path d="M12 7v10M7 12h10"/></svg>`,
  cufflink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="7" width="14" height="10" rx="2"/><line x1="12" y1="10" x2="12" y2="15"/></svg>`,
  tiepin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="4" x2="12" y2="20"/><circle cx="12" cy="8" r="3"/></svg>`,
  watch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><path d="M12 6v6l4 2"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>`,
  bar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="8" width="16" height="8" rx="1"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`,
  diamond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l7 7-7 7-7-7 7-7z"/></svg>`,
  gemstone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l8 5v8l-8 5-8-5V8l8-5z"/><path d="M12 3v18M4 8l8 5 8-5"/></svg>`,
  pearl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="7"/><circle cx="10" cy="10" r="1.5"/></svg>`,
};

// Calculations
const calcItem={
  fineWeight:(i)=>rnd(num(i.netWeight??i.weight)*num(i.purity)/24),
  metalRate:(i)=>(i.metalType||i.metal)==='Silver'?num(state.rates.silver):num(state.rates.gold),
  metalCost:(i)=>rnd(calcItem.fineWeight(i)*calcItem.metalRate(i)),
  wastageCost:(i)=>rnd(calcItem.metalCost(i)*num(i.wastagePercent)/100),
  makingCost:(i)=>num(i.makingCharge??i.making),
  stoneCost:(i)=>{let c=0;(i.stoneDetails||[]).forEach(st=>{c+=num(st.weight)*num(st.rate)+num(st.setting);});return rnd(c||num(i.stones));},
  totalCost:(i)=>rnd(calcItem.metalCost(i)+calcItem.wastageCost(i)+calcItem.makingCost(i)+calcItem.stoneCost(i)),
  margin:(i)=>i.sellingPrice>0?rnd((i.sellingPrice-calcItem.totalCost(i))/i.sellingPrice*100):0,
  marginAmount:(i)=>rnd(num(i.sellingPrice)-calcItem.totalCost(i))
};
function calcTax(amount){
  const rate=num(state.settings.taxRate)/100;
  if(!rate) return 0;
  // Inclusive pricing: the amount already contains VAT, so tax is the contained portion.
  return state.settings.taxInclusive ? rnd(amount-(amount/(1+rate))) : rnd(amount*rate);
}
// ---- Daily metal rate sync (pluggable JSON source; no fabricated prices) ----
const RATE_SYNC_DEFAULT={enabled:false,url:'',goldPath:'gold',silverPath:'silver',unit:'tola',lastSync:null,lastAttempt:null,lastStatus:'',lastMessage:''};
function rateSyncSettings(){return {...RATE_SYNC_DEFAULT,...(state.settings.rateSync||{})};}
function pickPath(obj,path){
  return String(path||'').split('.').filter(Boolean).reduce((o,k)=> (o==null?o:o[k]), obj);
}
function toPerGram(value,unit){
  const v=num(value);
  if(!(v>0)) return 0;
  if(unit==='tola') return v/11.6638;
  if(unit==='10gram') return v/10;
  return v;
}
async function syncDailyRates({auto=false}={}){
  const cfg=rateSyncSettings();
  const notify=(m,t)=>window.RatnaOS?.showNotification?.(m,t);
  if(!cfg.url){
    state.settings.rateSync={...cfg,lastStatus:'error',lastMessage:'Rate source URL not configured'};
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
    if(!auto) notify(t('Rate source URL not configured'),'warning');
    render(); return {ok:false,error:'no-url'};
  }
  try{
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),12000);
    const res=await fetch(cfg.url,{signal:ctrl.signal,headers:{Accept:'application/json'}});
    clearTimeout(timer);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data=await res.json();
    const gold=toPerGram(pickPath(data,cfg.goldPath),cfg.unit);
    const silver=toPerGram(pickPath(data,cfg.silverPath),cfg.unit);
    if(!(gold>0)||!(silver>0)) throw new Error('Missing gold/silver values at configured paths');
    if(gold>1000000||silver>100000||silver>=gold) throw new Error('Rate values rejected: out of range');
    state.rates={gold:rnd(gold),silver:rnd(silver),updatedAt:new Date().toISOString(),source:cfg.url};
    state.settings.rateSync={...cfg,lastSync:new Date().toISOString(),lastStatus:'ok',lastMessage:`Gold ${money(rnd(gold))}/g · Silver ${money(rnd(silver))}/g`};
    save('Metal rates synced',cfg.url);
    notify(t('Daily rates updated'),'success');
    return {ok:true};
  }catch(err){
    const msg=String(err&&err.message||err);
    state.settings.rateSync={...rateSyncSettings(),lastStatus:'error',lastMessage:msg};
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
    if(!auto){ notify(t('Rate sync failed')+': '+msg,'error'); render(); }
    return {ok:false,error:msg};
  }
}
function maybeAutoSyncRates(){
  const cfg=rateSyncSettings();
  if(!cfg.enabled||!cfg.url) return;
  const today=new Date().toISOString().slice(0,10);
  if(cfg.lastSync&&String(cfg.lastSync).slice(0,10)===today) return;
  if(cfg.lastAttempt&&String(cfg.lastAttempt).slice(0,10)===today) return;
  state.settings.rateSync={...cfg,lastAttempt:new Date().toISOString()};
  try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
  syncDailyRates({auto:true});
}

function calcGross(taxable,tax){return state.settings.taxInclusive?rnd(taxable):rnd(taxable+tax);}
function calcDiscount(amount,pct){return rnd(amount*pct/100);}
function calcCartItem(item,qty=1){
  const basePrice=num(item.sellingPrice)||calcItem.totalCost(item);
  const subtotal=rnd(basePrice*qty); const discount=0; const taxable=rnd(subtotal-discount);
  const tax=calcTax(taxable); const total=calcGross(taxable,tax);
  return {item,itemId:item.id,qty,basePrice,subtotal,discount,taxable,tax,total};
}
function calcCartTotals(cart){
  const subtotal=rnd(cart.reduce((s,x)=>s+x.subtotal,0));
  const discount=rnd(cart.reduce((s,x)=>s+x.discount,0));
  const taxable=rnd(subtotal-discount);
  const tax=rnd(cart.reduce((s,x)=>s+x.tax,0));
  const total=calcGross(taxable,tax);
  return {subtotal,discount,taxable,tax,total};
}

// Metal ledger helpers
function getMetalKey(metal,purity){return `${metal}_${purity}`;}
function getOpeningBalance(metal,purity){return num(state.metalManagement?.openingBalances?.[getMetalKey(metal,purity)]);}
function setOpeningBalance(metal,purity,weight){if(!state.metalManagement.openingBalances) state.metalManagement.openingBalances={}; state.metalManagement.openingBalances[getMetalKey(metal,purity)]=num(weight);}
function calcMetalBalance(metal,purity,asOfDate=null){
  let balance=getOpeningBalance(metal,purity);
  let txns=(state.metalManagement?.transactions||[]).filter(t=>t.metal===metal&&t.purity===purity&&t.posted!==false);
  if(asOfDate) txns=txns.filter(t=>new Date(t.date)<=new Date(asOfDate));
  txns.forEach(t=>{if(['OPENING_BALANCE','PURCHASE','RETURN','RECEIPT'].includes(t.type)) balance+=num(t.weight); if(['ISSUE','WASTAGE'].includes(t.type)) balance-=num(t.weight); if(t.type==='ADJUSTMENT') balance+=num(t.adjustment||0);});
  return rnd(balance);
}
function getAllMetalBalances(){
  const purities={Gold:GOLD_PURITIES,Silver:SILVER_PURITIES}; const balances={};
  ['Gold','Silver'].forEach(m=>purities[m].forEach(p=>{const bal=calcMetalBalance(m,p); if(bal!==0||getOpeningBalance(m,p)!==0){balances[getMetalKey(m,p)]={metal:m,purity:p,balance:bal,opening:getOpeningBalance(m,p)};}}));
  return balances;
}
function canEditTransaction(txn){if(!txn.posted) return true; const period=txn.date?.slice(0,7); return !state.metalManagement.postedPeriods.includes(period);}
function postPeriod(period){if(!state.metalManagement.postedPeriods.includes(period)){state.metalManagement.postedPeriods.push(period);state.metalManagement.postedPeriods.sort();}}
function isPeriodPosted(period){return state.metalManagement.postedPeriods.includes(period);}
function generateMetalTxnNumber(type){const prefix=(type||'TXN').slice(0,3).toUpperCase();const date=new Date();const seq=(state.metalManagement.transactions.filter(t=>t.type===type&&t.date&&t.date.startsWith(date.toISOString().slice(0,10))).length+1).toString().padStart(4,'0');return `${prefix}-${date.toISOString().slice(0,10).replace(/-/g,'')}-${seq}`;}
function recordMetalTxn(data){
  const txn={id:id(),type:data.type,metal:data.metal,purity:data.purity,unit:data.unit||'gram',weight:num(data.weight),rate:num(data.rate||0),value:num(data.value||0),adjustment:num(data.adjustment||0),reference:data.reference||'',notes:data.notes||'',karigar:data.karigar||'',jobCode:data.jobCode||'',customer:data.customer||'',date:data.date||new Date().toISOString().slice(0,10),posted:data.posted!==false,postedAt:new Date().toISOString(),createdAt:new Date().toISOString(),schemaVersion:1};
  state.metalManagement.transactions.unshift(txn);
  if (txn.posted !== false) postMetalTxn(state, txn);
  save('Metal transaction recorded',`${txn.type} ${txn.metal} ${txn.purity} ${num(txn.weight).toFixed(3)}g`);
  return txn;
}
// Supplier helpers
function getSupplier(id){return state.suppliers.find(s=>s.id===id);}
function generateSupplierCode(){const date=new Date();const seq=(state.suppliers.filter(s=>(s.createdAt||'').startsWith(date.toISOString().slice(0,10))).length+1).toString().padStart(3,'0');return `SUP-${date.toISOString().slice(0,10).replace(/-/g,'')}-${seq}`;}
function updateSupplierStats(supplierId,amount){const s=getSupplier(supplierId); if(s){s.totalPurchases=(s.totalPurchases||0)+1; s.totalAmount=rnd((s.totalAmount||0)+amount); s.balance=rnd((s.balance||0)+amount); s.updatedAt=new Date().toISOString();}}
function recordSupplierPayment(supplierId,amount,method,reference,notes){const s=getSupplier(supplierId); if(s){s.balance=rnd((s.balance||0)-amount); s.updatedAt=new Date().toISOString(); const payment={id:'pay_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),date:new Date().toISOString().slice(0,10),amount:num(amount),method:method||'Cash',reference:reference||'',supplierId,supplierName:s.name}; postSupplierPayment(state,payment); save('Supplier payment',`${s.name} - ${money(amount)}`);}}

// Expense helpers
function getExpense(id){return state.expenses.find(e=>e.id===id);}
const EXPENSE_CATEGORIES=['Rent','Utilities','Salaries','Marketing','Transport','Insurance','Maintenance','Professional Fees','Office Supplies','Taxes','Licenses','Bank Charges','Other'];
const EXPENSE_STATUSES=['paid','pending','overdue','cancelled'];
function generateExpenseNumber(){const date=new Date();const seq=(state.expenses.filter(e=>(e.date||e.createdAt||'').startsWith(date.toISOString().slice(0,10))).length+1).toString().padStart(4,'0');return `EXP-${date.toISOString().slice(0,10).replace(/-/g,'')}-${seq}`;}
function getExpenseTotals(startDate,endDate){let list=state.expenses; if(startDate) list=list.filter(e=>new Date(e.date)>=new Date(startDate)); if(endDate) list=list.filter(e=>new Date(e.date)<=new Date(endDate)); const byCat={}; let total=0; list.forEach(e=>{if(e.status!=='cancelled'){total+=num(e.amount); byCat[e.category]=(byCat[e.category]||0)+num(e.amount);}}); return {total,byCat,count:list.length};}


// Karigar/Job helpers
function getKarigar(id){return state.karigars.find(k=>k.id===id);}
function getJob(jobId){return state.jobs.find(j=>j.id===jobId);}
function getKarigarJobs(karigarId){return state.jobs.filter(j=>j.assignedKarigarId===karigarId);}
function generateJobNumber(){const date=new Date();const seq=(state.jobs.filter(j=>(j.date||j.createdAt||'').startsWith(date.toISOString().slice(0,10))).length+1).toString().padStart(4,'0');return `JOB-${date.toISOString().slice(0,10).replace(/-/g,'')}-${seq}`;}
function isJobActiveStatus(status){return status!=='Completed';}
function jobStatusBadge(status){const map={'Pending':'badge-pending','In Progress':'badge-inprogress',QC:'badge-qc',Rework:'badge-rework',Completed:'badge-completed'};return `<span class="badge ${map[status]||'badge-open'}">${esc(t(status||'Pending'))}</span>`;}
function ensureJobShape(job){
  if(!job) return job;
  if(!Array.isArray(job.stages)||!job.stages.length){job.stages=JOB_STAGES.map(s=>({id:s.id,label:s.label,status:'pending',startedAt:null,completedAt:null,notes:''}));}
  job.photos=Array.isArray(job.photos)?job.photos:[];
  job.qualityChecks=Array.isArray(job.qualityChecks)?job.qualityChecks:[];
  job.labourCharges=job.labourCharges||{method:'perGram',rate:0,total:0};
  job.wastageAllowed=num(job.wastageAllowed||0); job.wastageActual=num(job.wastageActual||0);
  job.metalIssues=Array.isArray(job.metalIssues)?job.metalIssues:[];
  job.materialReturns=Array.isArray(job.materialReturns)?job.materialReturns:[];
  job.assignedKarigarName=job.assignedKarigarName||job.karigar||'';
  job.karigar=job.karigar||job.assignedKarigarName||'';
  job.due=job.due||job.deadline||''; job.deadline=job.deadline||job.due||'';
  job.code=job.code||generateJobNumber();
  job.description=job.description||job.name||'Job';
  job.metalType=job.metalType||'Gold'; job.purity=job.purity||'22K';
  job.priority=job.priority||'normal';
  job.qcStatus=job.qcStatus||'pending';
  const legacy=job.status||'Pending';
  job.status=legacy==='Open'?'In Progress':(JOB_STATUSES.includes(legacy)?legacy:'Pending');
  return job;
}
function getJobIssuedWeight(job){return rnd((job.metalIssues||[]).reduce((s,m)=>s+num(m.weight||m.issued||0),0));}
function getJobReturnedWeight(job){return rnd((job.materialReturns||[]).reduce((s,r)=>s+num(r.weight||r.returned||0),0));}
function getJobNetIssued(job){return rnd(getJobIssuedWeight(job)-getJobReturnedWeight(job));}
function recalcJobFinancials(job){
  const issued=getJobIssuedWeight(job), returned=getJobReturnedWeight(job), net=rnd(Math.max(0,issued-returned));
  const method=job.labourCharges?.method||'perGram'; const rate=num(job.labourCharges?.rate||0); let labour=0;
  if(method==='perGram') labour=rnd(net*rate);
  else if(method==='perTola') labour=rnd((net/11.664)*rate);
  else if(method==='flat') labour=rate;
  else if(method==='pctMetal'){const metalRate=(job.metalType==='Silver'?num(state.rates.silver):num(state.rates.gold)); labour=rnd(net*metalRate*rate/100);} 
  job.labourCharges={...job.labourCharges,method,rate,total:labour};
  job.wastageActual=rnd(Math.max(0,net-num(job.outputWeight||0)));
  job.netWeight=net; job.issuedWeight=issued; job.returnedWeight=returned;
  return {issued,returned,net,labour};
}
function syncJobKarigar(job){if(job.assignedKarigarId){const k=getKarigar(job.assignedKarigarId);if(k){job.assignedKarigarName=k.name;job.karigar=k.name;}} if(job.assignedKarigarName) job.karigar=job.assignedKarigarName;}
function updateKarigarStats(karigarId){const k=getKarigar(karigarId); if(!k) return; const jobs=getKarigarJobs(karigarId).map(j=>{ensureJobShape(j);recalcJobFinancials(j);return j;}); k.totalJobs=jobs.length; k.totalWeightIssued=rnd(jobs.reduce((s,j)=>s+getJobIssuedWeight(j),0)); k.totalWeightReturned=rnd(jobs.reduce((s,j)=>s+getJobReturnedWeight(j),0)); k.totalWastage=rnd(jobs.reduce((s,j)=>s+num(j.wastageActual||0),0)); k.totalLabourEarned=rnd(jobs.reduce((s,j)=>s+num(j.labourCharges?.total||0),0)); k.updatedAt=new Date().toISOString();}
function recordJobMetalTxn(job,type,metal,purity,weight,reference,notes,karigar){
  const txn={type,metal,purity,unit:'gram',weight:num(weight),rate:metal==='Gold'?num(state.rates.gold):num(state.rates.silver),value:num(weight)*(metal==='Gold'?num(state.rates.gold):num(state.rates.silver)),reference:reference||generateMetalTxnNumber(type),notes:notes||`Job ${job.code}: ${type}`,karigar:karigar||job.assignedKarigarName||'',jobCode:job.code,date:new Date().toISOString().slice(0,10),posted:true};
  recordMetalTxn(txn); return txn;
}
function createJob(data){
  const karigar=getKarigar(data.assignedKarigarId);
  const due=data.deadline||data.due||'';
  const job=ensureJobShape({id:id(),code:data.code||generateJobNumber(),name:data.name||data.description||'Job',description:data.description||data.name||'',status:'Pending',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),date:new Date().toISOString().slice(0,10),assignedKarigarId:data.assignedKarigarId||null,assignedKarigarName:karigar?.name||data.karigar||'',karigar:karigar?.name||data.karigar||'',due,deadline:due,priority:data.priority||'normal',metalType:data.metalType||'Gold',purity:data.purity||'22K',wastageAllowed:num(data.wastageAllowed||0),labourCharges:{method:data.labourMethod||'perGram',rate:num(data.labourRate||0),total:0},notes:data.notes||''});
  state.jobs.unshift(job);
  if(karigar) updateKarigarStats(karigar.id);
  save('Job created',`${job.code} - ${job.karigar||'Unassigned'}`);
  return job;
}
function addJobIssue(job,data){
  ensureJobShape(job);
  const karigar=job.assignedKarigarName||job.karigar||'';
  const weight=num(data.weight); const metal=data.metal||job.metalType||'Gold'; const purity=data.purity||job.purity||'22K';
  const voucher=data.voucher||generateMetalTxnNumber('ISSUE');
  const issue={id:id(),voucher,date:data.date||new Date().toISOString().slice(0,10),metal,purity,weight,notes:data.notes||'',karigar};
  job.metalIssues.push(issue);
  recordJobMetalTxn(job,'ISSUE',metal,purity,weight,voucher,data.notes||`Metal issued for ${job.code}`,karigar);
  job.updatedAt=new Date().toISOString(); recalcJobFinancials(job);
  if(job.assignedKarigarId) updateKarigarStats(job.assignedKarigarId);
  localStorage.setItem(KEY,JSON.stringify(state));
  return issue;
}
function addJobReturn(job,data){
  ensureJobShape(job);
  const karigar=job.assignedKarigarName||job.karigar||'';
  const weight=num(data.weight); const metal=data.metal||job.metalType||'Gold'; const purity=data.purity||job.purity||'22K';
  const type=data.type||'RETURN'; const voucher=data.voucher||generateMetalTxnNumber(type==='WASTAGE'?'WASTAGE':'RETURN');
  const ret={id:id(),voucher,date:data.date||new Date().toISOString().slice(0,10),metal,purity,weight,type,notes:data.notes||'',karigar};
  job.materialReturns.push(ret);
  if(type==='WASTAGE') recordJobMetalTxn(job,'WASTAGE',metal,purity,weight,voucher,data.notes||`Wastage for ${job.code}`,karigar);
  else recordJobMetalTxn(job,'RETURN',metal,purity,weight,voucher,data.notes||`Material return for ${job.code}`,karigar);
  job.updatedAt=new Date().toISOString(); recalcJobFinancials(job);
  if(job.assignedKarigarId) updateKarigarStats(job.assignedKarigarId);
  localStorage.setItem(KEY,JSON.stringify(state));
  return ret;
}
function setJobStatus(job,status){ensureJobShape(job); const prev=job.status; job.status=status; job.updatedAt=new Date().toISOString(); if(status==='In Progress'&&!job.startedAt) job.startedAt=new Date().toISOString(); if(status==='Completed') job.completedAt=new Date().toISOString(); if(status==='QC') job.qcStatus='pending'; if(status==='Rework') job.qcStatus='fail'; recalcJobFinancials(job); if(job.assignedKarigarId) updateKarigarStats(job.assignedKarigarId); save('Job status updated',`${job.code}: ${prev} → ${status}`);}
function addJobPhoto(job,dataUrl,name,note){ensureJobShape(job); job.photos.push({id:id(),data:dataUrl,name:name||'photo',note:note||'',date:new Date().toISOString()}); job.updatedAt=new Date().toISOString(); save('Job photo added',job.code);} 
function addJobQC(job,data){ensureJobShape(job); const qc={id:id(),date:data.date||new Date().toISOString().slice(0,10),result:data.result||'Pass',stage:data.stage||'QC',checker:data.checker||'',notes:data.notes||''}; job.qualityChecks.push(qc); job.qcStatus=qc.result==='Pass'?'pass':qc.result==='Fail'?'fail':'conditional'; if(qc.result==='Fail') job.status='Rework'; if(qc.result==='Pass' && job.status==='QC') job.status='Completed'; job.updatedAt=new Date().toISOString(); recalcJobFinancials(job); if(job.assignedKarigarId) updateKarigarStats(job.assignedKarigarId); save('Quality check recorded',`${job.code}: ${qc.result}`); return qc;}
function updateJobStage(job,stageId,patch){ensureJobShape(job); let st=job.stages.find(s=>s.id===stageId); if(!st){const def=JOB_STAGES.find(s=>s.id===stageId); st={id:stageId,label:def?.label||stageId,status:'pending',startedAt:null,completedAt:null,notes:''}; job.stages.push(st);} Object.assign(st,patch||{}); if(st.status==='in_progress'&&!st.startedAt) st.startedAt=new Date().toISOString(); if(st.status==='completed'&&!st.completedAt) st.completedAt=new Date().toISOString(); const done=job.stages.filter(s=>s.status==='completed').length; const inprog=job.stages.some(s=>s.status==='in_progress'); if(job.status==='Pending'&&(inprog||done>0)) job.status='In Progress'; if(stageId==='qc'&&st.status==='in_progress') job.status='QC'; job.updatedAt=new Date().toISOString(); save('Production stage updated',`${job.code}: ${st.label||stageId}`);} 
function fileToDataUrl(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}
function downloadJobCardPDF(job){ensureJobShape(job);recalcJobFinancials(job);const k=getKarigar(job.assignedKarigarId);const issued=getJobIssuedWeight(job),returned=getJobReturnedWeight(job),net=getJobNetIssued(job);const html=`<html><head><title>${esc(job.code)} Job Card</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{margin:0 0 8px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#f5f5f5}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}</style></head><body><h1>${esc(state.settings.shop||'RatnaOS')} - Job Card</h1><div class="grid"><div><b>Job:</b> ${esc(job.code)}<br><b>Description:</b> ${esc(job.description||'')}<br><b>Status:</b> ${esc(job.status)}<br><b>Priority:</b> ${esc(job.priority||'normal')}</div><div><b>Karigar:</b> ${esc(job.assignedKarigarName||k?.name||'-')}<br><b>Deadline:</b> ${esc(job.deadline||job.due||'-')}<br><b>Metal:</b> ${esc(job.metalType||'-')} ${esc(job.purity||'')}<br><b>Labour:</b> ${money(num(job.labourCharges?.total||0))}</div></div><h3>Metal Summary</h3><table><tr><th>Issued (g)</th><th>Returned (g)</th><th>Net (g)</th><th>Wastage Allowed (g)</th><th>Wastage Actual (g)</th></tr><tr><td>${issued.toFixed(3)}</td><td>${returned.toFixed(3)}</td><td>${net.toFixed(3)}</td><td>${num(job.wastageAllowed).toFixed(3)}</td><td>${num(job.wastageActual).toFixed(3)}</td></tr></table><h3>Issue Vouchers</h3><table><tr><th>Date</th><th>Voucher</th><th>Metal</th><th>Weight (g)</th><th>Notes</th></tr>${(job.metalIssues||[]).map(m=>`<tr><td>${esc(m.date||'')}</td><td>${esc(m.voucher||'')}</td><td>${esc(m.metal||'')} ${esc(m.purity||'')}</td><td>${num(m.weight).toFixed(3)}</td><td>${esc(m.notes||'')}</td></tr>`).join('')||'<tr><td colspan="5">None</td></tr>'}</table><h3>Material Returns</h3><table><tr><th>Date</th><th>Voucher</th><th>Type</th><th>Metal</th><th>Weight (g)</th><th>Notes</th></tr>${(job.materialReturns||[]).map(r=>`<tr><td>${esc(r.date||'')}</td><td>${esc(r.voucher||'')}</td><td>${esc(r.type||'RETURN')}</td><td>${esc(r.metal||'')} ${esc(r.purity||'')}</td><td>${num(r.weight).toFixed(3)}</td><td>${esc(r.notes||'')}</td></tr>`).join('')||'<tr><td colspan="6">None</td></tr>'}</table><h3>Stages</h3><table><tr><th>Stage</th><th>Status</th><th>Started</th><th>Completed</th><th>Notes</th></tr>${(job.stages||[]).map(s=>`<tr><td>${esc(s.label||s.id)}</td><td>${esc(s.status||'pending')}</td><td>${esc((s.startedAt||'').slice(0,16).replace('T',' '))}</td><td>${esc((s.completedAt||'').slice(0,16).replace('T',' '))}</td><td>${esc(s.notes||'')}</td></tr>`).join('')}</table><h3>Quality Checks</h3><table><tr><th>Date</th><th>Stage</th><th>Result</th><th>Checker</th><th>Notes</th></tr>${(job.qualityChecks||[]).map(q=>`<tr><td>${esc(q.date||'')}</td><td>${esc(q.stage||'')}</td><td>${esc(q.result||'')}</td><td>${esc(q.checker||'')}</td><td>${esc(q.notes||'')}</td></tr>`).join('')||'<tr><td colspan="5">None</td></tr>'}</table><script>window.onload=()=>window.print()</script></body></html>`; const w=window.open('','_blank'); if(w){w.document.write(html); w.document.close();}}


// Inventory/POS helpers
function generateSKU(category,metal,purity){
  const prefix=category==='gold'?'G':category==='silver'?'S':category==='diamond'?'D':'GM';
  const metalCode=metal==='Gold'?'AU':metal==='Silver'?'AG':metal==='Platinum'?'PT':metal==='Diamond'?'DIA':'ST';
  const purityCode=String(purity||'').replace('K','').replace('PT','');
  const seq=(state.items.filter(i=>i.category===category).length+1).toString().padStart(4,'0');
  return `${prefix}-${metalCode}${purityCode}-${seq}`;
}
function generateBarcode(sku){return String(sku).replace(/-/g,'').padStart(13,'0').slice(0,13);}
function generateQRData(item){return JSON.stringify({v:1,sku:item.sku,name:item.name,metal:item.metalType,purity:item.purity,gross:item.grossWeight,net:item.netWeight,stone:item.stoneWeight,price:item.sellingPrice,currency:state.settings.currency});}
function recordMovement(itemId,type,reason,qty,weight,ref,notes){const item=state.items.find(i=>i.id===itemId); if(!item) return; state.stockMovements.unshift({id:id(),itemId,itemCode:item.code,itemName:item.name,type,reason,quantity:qty,weight,reference:ref,notes,date:new Date().toISOString()});}
function generateInvoiceNumber(){const prefix=state.settings.invoicePrefix||'INV'; const date=new Date(); const seq=(state.sales.filter(s=>s.date && s.date.startsWith(date.toISOString().slice(0,10))).length+1).toString().padStart(4,'0'); return `${prefix}-${date.toISOString().slice(0,10).replace(/-/g,'')}-${seq}`;}
function getCustomer(id){return state.customers.find(c=>c.id===id);}
function updateCustomerStats(customerId,saleTotal){const c=getCustomer(customerId); if(c){c.totalPurchases=(c.totalPurchases||0)+1; c.totalSpent=rnd((c.totalSpent||0)+saleTotal); c.updatedAt=new Date().toISOString(); if(c.creditLimit>0) c.balance=rnd((c.balance||0)+saleTotal);}}

// Migrations
function migrateItems(){let changed=false; state.items.forEach(item=>{if(item.schemaVersion===2) return; changed=true; item.schemaVersion=2; item.sku=item.sku||item.code||generateSKU(item.category||'gold',item.metalType||item.metal||'Gold',item.purity||'22K'); item.barcode=item.barcode||generateBarcode(item.sku); item.qrCode=item.qrCode||''; item.category=item.category||(item.metal==='Gold'?'gold':item.metal==='Silver'?'silver':'gemstone'); item.grossWeight=typeof item.grossWeight==='number'?item.grossWeight:num(item.weight); item.netWeight=typeof item.netWeight==='number'?item.netWeight:num(item.weight); item.stoneWeight=typeof item.stoneWeight==='number'?item.stoneWeight:0; item.makingCharge=typeof item.makingCharge==='number'?item.makingCharge:num(item.making); item.wastagePercent=typeof item.wastagePercent==='number'?item.wastagePercent:0; item.wastageWeight=rnd(num(item.netWeight)*num(item.wastagePercent)/100); item.purity=num(item.purity)||22; item.metalType=item.metalType||item.metal||'Gold'; item.stoneDetails=item.stoneDetails||[]; item.status=item.status||'stock'; item.location=item.location||'Showcase'; item.tags=item.tags||[]; item.images=item.images||[]; item.costPrice=typeof item.costPrice==='number'?item.costPrice:calcItem.totalCost(item); item.sellingPrice=typeof item.sellingPrice==='number'?item.sellingPrice:item.costPrice; item.marginPercent=calcItem.margin(item); item.createdAt=item.createdAt||new Date().toISOString(); item.updatedAt=new Date().toISOString();}); if(changed) localStorage.setItem(KEY,JSON.stringify(state));}
function migrateCustomers(){state.customers.forEach(c=>{if(c.schemaVersion===1) return; c.schemaVersion=1; c.id=c.id||id(); c.createdAt=c.createdAt||new Date().toISOString(); c.updatedAt=new Date().toISOString(); c.totalPurchases=c.totalPurchases||0; c.totalSpent=c.totalSpent||0; c.creditLimit=c.creditLimit||0; c.balance=c.balance||0;});}
function migrateKarigars(){state.karigars.forEach(k=>{if(k.schemaVersion===1) return; k.schemaVersion=1; k.id=k.id||id(); k.createdAt=k.createdAt||new Date().toISOString(); k.updatedAt=new Date().toISOString(); k.specialties=k.specialties||[]; k.ratePerGram=num(k.ratePerGram||0); k.ratePerTola=num(k.ratePerTola||0); k.phone=k.phone||''; k.address=k.address||''; k.status=k.status||'active'; k.totalJobs=k.totalJobs||0; k.totalWeightIssued=k.totalWeightIssued||0; k.totalWeightReturned=k.totalWeightReturned||0; k.totalWastage=k.totalWastage||0; k.totalLabourEarned=k.totalLabourEarned||0;});}
function migrateJobs(){state.jobs.forEach(j=>{ensureJobShape(j); if(j.schemaVersion===3) return; j.schemaVersion=3; j.id=j.id||id(); j.createdAt=j.createdAt||new Date().toISOString(); j.updatedAt=new Date().toISOString(); recalcJobFinancials(j); syncJobKarigar(j);});}
function migrateSuppliers(){state.suppliers.forEach(s=>{if(s.schemaVersion===1) return; s.schemaVersion=1; s.id=s.id||id(); s.createdAt=s.createdAt||new Date().toISOString(); s.updatedAt=s.updatedAt||new Date().toISOString(); s.totalPurchases=s.totalPurchases||0; s.totalAmount=s.totalAmount||0; s.balance=s.balance||0; s.paymentTerms=s.paymentTerms||''; s.contactPerson=s.contactPerson||'';});}
function migrateExpenses(){state.expenses.forEach(e=>{if(e.schemaVersion===1) return; e.schemaVersion=1; e.id=e.id||id(); e.createdAt=e.createdAt||new Date().toISOString(); e.updatedAt=e.updatedAt||new Date().toISOString(); e.category=e.category||'General'; e.paymentMethod=e.paymentMethod||'Cash'; e.status=e.status||'paid'; e.reference=e.reference||''; e.notes=e.notes||'';});}
function migrateMetalManagement(){if(!state.metalManagement.transactions) state.metalManagement.transactions=[]; state.metalManagement.transactions.forEach(t=>{if(t.schemaVersion===1) return; t.schemaVersion=1; t.id=t.id||id(); t.posted=t.posted!==false; t.createdAt=t.createdAt||new Date().toISOString(); t.postedAt=t.postedAt||t.createdAt;});}
migrateItems(); migrateCustomers(); migrateKarigars(); migrateJobs(); migrateSuppliers(); migrateExpenses(); migrateMetalManagement();

// UI helpers
let tab='dashboard';
let query='';
let sidebarOpen=false;

// Role-based navigation filtering
function getAllowedTabs() {
  if (!window.RatnaOS?.auth?.isAuthenticated()) return ['dashboard'];
  const permissions = window.RatnaOS.auth.hasPermission ? window.RatnaOS.auth : null;
  const has = (perm) => window.RatnaOS.auth.hasPermission(perm);
  
  const tabPermissions = {
    dashboard: () => true,
    inventory: () => has('inventory:read'),
    pos: () => has('sales:create'),
    metals: () => has('metals:read'),
    exchange: () => has('metals:read'),
    karigar: () => has('karigar:read') || has('jobs:read'),
    production: () => has('production:read') || has('bom:read'),
    reports: () => has('reports:read'),
    accounting: () => has('accounting:read'),
    tax: () => has('tax:read'),
    knowledge: () => has('knowledge:read'),
    suppliers: () => has('suppliers:read'),
    expenses: () => has('expenses:read'),
    settings: () => has('settings:read')
  };
  
  return Object.keys(tabPermissions).filter(tab => tabPermissions[tab]());
}

const NAV_ICONS={
  dashboard:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  inventory:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  pos:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  metals:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
  exchange:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/><path d="M3 12h18"/></svg>`,
  karigar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  production:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  reports:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  knowledge:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16"/><path d="M9 8h7"/><path d="M9 12h5"/></svg>`,
  accounting:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 3h16v18H4z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h4"/><path d="M16 15h.01"/></svg>`,
  tax:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l3 18H3z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h3"/></svg>`,
  suppliers:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-4-4H17a4 4 0 0 0-4 4v2"/><circle cx="21" cy="7" r="4"/></svg>`,
  expenses:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>`,
  settings:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09c-.658.003-1.25.396-1.51 1z"/></svg>`
};

// Apple-style (SF Symbols inspired) icon set — 24×24, 1.75 stroke, rounded caps
const ICON_PATHS = {
  menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1a5.5 5.5 0 0 1 5.5-5.5h2A5.5 5.5 0 0 1 15.5 19v1"/><path d="M16.5 5.2a3.5 3.5 0 0 1 0 6.6"/><path d="M18.5 20v-1a5.4 5.4 0 0 0-2.2-4.4"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4"/><line x1="6" y1="12" x2="16" y2="12"/>',
  edit: '<path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4z"/><line x1="13.5" y1="6.5" x2="17.5" y2="10.5"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4.8A.8.8 0 0 1 9.8 4h4.4a.8.8 0 0 1 .8.8V7"/><path d="M6.5 7l.8 12.2a1.8 1.8 0 0 0 1.8 1.8h5.8a1.8 1.8 0 0 0 1.8-1.8L17.5 7"/><line x1="10.5" y1="11" x2="10.5" y2="17"/><line x1="13.5" y1="11" x2="13.5" y2="17"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7V3"/><path d="M8 21v-7h8v7"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="7" rx="2"/><path d="M7 14h10v7H7z"/>',
  download: '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 19h16"/>',
  upload: '<path d="M12 16V4"/><path d="M7 8l5-5 5 5"/><path d="M4 19h16"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.6L16 9.5"/>',
  alert: '<path d="M12 3.8l9 16.2H3z"/><line x1="12" y1="9.5" x2="12" y2="14"/><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>',
  crown: '<path d="M3 8l4 3 5-7 5 7 4-3-2 12H5z"/><path d="M5 20h14"/>',
  gem: '<path d="M7 3h10l4 6-9 12L3 9z"/><path d="M3 9h18"/><path d="M12 21L8 9l4-6 4 6-4 12z"/>',
  diamond: '<path d="M12 2.5l8.5 8.5-8.5 10-8.5-10z"/><path d="M3.5 11h17"/>',
  cart: '<circle cx="9.5" cy="19.5" r="1.6"/><circle cx="17.5" cy="19.5" r="1.6"/><path d="M3 4h2.5l2.3 10.5h10.4L21 7H6"/>',
  wallet: '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5z"/><path d="M3 9h18"/><circle cx="16.5" cy="14" r="1.2"/>',
  chart: '<path d="M4 20V9"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20V7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.4 2.2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
  chevronRight: '<path d="M9 5l7 7-7 7"/>',
  chevronDown: '<path d="M5 9l7 7 7-7"/>',
  arrowUp: '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 4v15"/><path d="M18 13l-6 6-6-6"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.3"/><path d="M20 5v6h-6"/>',
  lock: '<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  phone: '<path d="M6.5 3.5l3 3-2 2.5a12 12 0 0 0 5.5 5.5l2.5-2 3 3-1.5 2.5a2 2 0 0 1-2.3.9C9.6 17.4 6.1 13.9 4.1 7.3A2 2 0 0 1 5 5z"/>',
  mapPin: '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 8z"/><circle cx="12" cy="13.5" r="3.4"/>',
  star: '<path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.5l-5.4 2.9 1-6.1L3.2 10l6.1-.9z"/>',
  heart: '<path d="M12 20.5S3.5 15.2 3.5 9.2A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.5 2.9c0 6-8.5 11.3-8.5 11.3z"/>',
  scale: '<path d="M12 3v18"/><path d="M5 21h14"/><path d="M7 7h10"/><path d="M7 7l-3.5 7h7z"/><path d="M17 7l-3.5 7h7z"/>',
  scissors: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5L20 19"/><path d="M8 16.5L20 5"/>',
  gift: '<rect x="3.5" y="9" width="17" height="12" rx="2"/><path d="M3.5 13h17"/><path d="M12 9v12"/><path d="M12 9C10 9 7 8.2 7 6a2.5 2.5 0 0 1 5 0c0 2 0 3 0 3z"/><path d="M12 9c2 0 5-.8 5-3a2.5 2.5 0 0 0-5 0c0 2 0 3 0 3z"/>',
  flame: '<path d="M12 21c4 0 6.5-2.6 6.5-6 0-4.5-4.5-6.5-4.5-11 0 0-2 2.5-2 5.5 0 1.8-1 2.5-1.8 1.7C9.4 10.3 9 8 9 8c-1.5 2-3.5 4.2-3.5 7 0 3.4 2.5 6 6.5 6z"/>'
};
function icon(name, cls = ''){
  const p = ICON_PATHS[name];
  if(!p) return '';
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

const _PAGE_TITLES={
  dashboard:['Dashboard','Overview'],
  inventory:['Inventory','Stock register'],
  pos:['Point of Sale','Billing counter'],
  metals:['Metal Management','Balances & issue'],
  exchange:['Old Gold Exchange','Assessment register'],
  karigar:['Karigar & Jobs','Jobs & karigars'],
  production:['Production Stages','Job pipeline'],
  reports:['Reports & Analytics','Financial reports'],
  accounting:['Accounting','Ledger, journals and trial balance'],
  tax:['Tax & Compliance','VAT, TDS registers and returns'],
  knowledge:['Knowledge Center','Catalogue & reference'],
  suppliers:['Suppliers','Vendors & payables'],
  expenses:['Expenses','Business expenses'],
  settings:['Settings','Workspace setup']
};
const PAGE_TITLES=new Proxy(_PAGE_TITLES,{get(o,k){const v=o[k];return Array.isArray(v)?v.map(x=>t(x)):(typeof v==='string'?t(v):v);}});


const input=(name,label,type='text',value='',extra='')=>`<div class="field"><label class="field-label" for="${name}">${t(label)}</label><input class="field-input" id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
const select=(name,label,opts,val='',extra='')=>`<div class="field" ${extra.includes('data-field-wrap')?'': ''}><label class="field-label" for="${name}">${t(label)}</label><select class="field-select" id="${name}" name="${name}" ${extra}>${opts.map(x=>{const v=(typeof x==='object')?x.value:x; const l=(typeof x==='object')?x.label:x; return `<option value="${esc(v)}" ${String(v)===String(val)?'selected':''}>${esc(l)}</option>`}).join('')}</select></div>`;
const textarea=(name,label,val='',extra='')=>`<div class="field"><label class="field-label" for="${name}">${t(label)}</label><textarea class="field-textarea" id="${name}" name="${name}" ${extra}>${esc(val)}</textarea></div>`;
const card=(label,value,sub='',iconName='',tab='')=>`<div class="metric-card${tab?' metric-link':''}"${tab?` data-tab="${tab}" role="button" tabindex="0"`:''}>${iconName?`<span class="metric-icon">${icon(iconName)}</span>`:''}<div class="metric-label">${t(label)}</div><div class="metric-value">${translateDigits(value)}</div>${sub?`<div class="metric-sub">${sub}</div>`:''}</div>`;
const rows=(headers,body)=>`<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${t(h)}</th>`).join('')}</tr></thead><tbody>${body||`<tr><td colspan="${headers.length}" class="align-center"><div class="empty"><p class="empty-title">No records yet</p></div></td></tr>`}</tbody></table></div>`;


function dashboard(){
  const sums=totals();
  const openJobs=state.jobs.filter(j=>isJobActiveStatus(j.status)).length;
  const balances=getAllMetalBalances();
  const goldBal=Object.values(balances).filter(b=>b.metal==='Gold').reduce((s,b)=>s+b.balance,0);
  const silverBal=Object.values(balances).filter(b=>b.metal==='Silver').reduce((s,b)=>s+b.balance,0);
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.dashboard[0]}</h1><p class="page-subtitle">${PAGE_TITLES.dashboard[1]}</p></div><div class="page-header-actions"><button class="btn btn-champagne" data-tab="inventory">${icon('plus')}<span>${t('Add Jewellery')}</span></button><button class="btn btn-secondary" data-tab="pos">${icon('cart')}<span>${t('New Sale')}</span></button></div></div></div>
<div class="metric-grid">${card('Stock Value',money(sums.value),t('Indicative'),'sparkle','inventory')} ${card('Total Sales',money(sums.sales),t('Recorded'),'cart','reports')} ${card('Open Jobs',openJobs,t('In progress'),'clock','karigar')} ${card('Metal Ledger (Au/Ag)',`${rnd(goldBal).toFixed(3)}g / ${rnd(silverBal).toFixed(3)}g`,t('Current balances'),'scale','metals')}</div>
<div class="layout"><div>
  <div class="card"><div class="card-header"><h2 class="card-title">Recent Transactions</h2><button class="btn btn-ghost btn-sm" data-tab="reports">View all</button></div><div class="card-body" style="padding:0">${rows(['Date','Invoice','Customer','Amount'],state.sales.slice(0,7).map(s=>`<tr><td>${fmtDate(s.date)}</td><td><code class="mono">${esc(s.invoice)}</code></td><td>${esc(s.customerName||s.customer||'-')}</td><td class="align-right mono">${money(s.total)}</td></tr>`).join(''))}</div></div>
  <div class="card"><div class="card-header"><h2 class="card-title">Daily Metal Rates</h2></div><div class="card-body"><form id="rates" class="form" style="margin-top:0">${input('gold',`${t('Gold')} (${state.settings.currency} / ${t('fine g')})`,'number',state.rates.gold,'min="0" step="0.01"')}${input('silver',`${t('Silver')} (${state.settings.currency} / g)`,'number',state.rates.silver,'min="0" step="0.01"')}<div class="field-full" style="display:flex;gap:var(--space-2);flex-wrap:wrap"><button class="btn btn-champagne" type="submit" style="flex:1">${t('Update Rates')}</button><button class="btn btn-ghost btn-sm" type="button" data-rate-sync>${icon('refresh')}<span>${t('Sync now')}</span></button></div><p class="small muted" style="margin:var(--space-2) 0 0">${state.rates.updatedAt?`${t('Updated')}: ${fmtDateTime(state.rates.updatedAt)}`:`${t('Manual rates')}`}${state.settings.rateSync?.lastStatus==='error'?` · <span style="color:var(--error)">${esc(state.settings.rateSync.lastMessage||'')}</span>`:''}</p></form></div></div>
</div><div>
  <div class="card"><div class="card-header"><h2 class="card-title">Job Status</h2></div><div class="card-body"><div style="display:flex;flex-direction:column;gap:10px">${JOB_STATUSES.map(s=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--bg-surface);border-radius:var(--radius-md);border:1px solid var(--border-subtle)"><span>${esc(t(s))}</span>${jobStatusBadge(s).replace(s, String(state.jobs.filter(j=>j.status===s).length)+'')}</div>`).join('')}</div></div></div>
  <div class="card"><div class="card-header"><h2 class="card-title">Quick Actions</h2></div><div class="card-body" style="display:flex;flex-direction:column;gap:10px"><button class="btn btn-secondary" data-tab="karigar">Karigar & Jobs</button><button class="btn btn-secondary" data-tab="production">Production Stages</button><button class="btn btn-secondary" data-tab="metals">Metal Management</button><button class="btn btn-secondary" data-tab="exchange">Old Gold Exchange</button>${window.RatnaOS?.auth?.hasPermission?.('accounting:read')?`<button class="btn btn-secondary" data-tab="accounting">${t('Accounting')}</button>`:''}</div></div>
</div></div>`;
}

function inventory(){
  const searchQuery=state.invSearch||'';
  const filterCategory=state.invFilterCategory||'all';
  const filterStatus=state.invFilterStatus||'all';
  const filterMetal=state.invFilterMetal||'all';
  const filterPurity=state.invFilterPurity||'all';
  const sortBy=state.invSortBy||'createdAt';
  const sortDir=state.invSortDir||'desc';
  let list=state.items.slice();
  if(searchQuery){const q=searchQuery.toLowerCase(); list=list.filter(i=>[i.code,i.sku,i.name,i.metalType,i.category].join(' ').toLowerCase().includes(q));}
  if(filterCategory!=='all') list=list.filter(i=>i.category===filterCategory);
  if(filterStatus!=='all') list=list.filter(i=>i.status===filterStatus);
  if(filterMetal!=='all') list=list.filter(i=>(i.metalType||i.metal)===filterMetal);
  if(filterPurity!=='all') list=list.filter(i=>String(i.purity)===filterPurity);
  list.sort((a,b)=>{let av=a[sortBy],bv=b[sortBy]; if(typeof av==='string'){av=av.toLowerCase();bv=(bv||'').toLowerCase();} if(sortDir==='asc') return av>bv?1:-1; return av<bv?1:-1;});
  const metals=[...new Set(state.items.map(i=>i.metalType||i.metal).filter(Boolean))];
  const purities=[...new Set(state.items.map(i=>String(i.purity)).filter(Boolean))].sort();
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.inventory[0]}</h1><p class="page-subtitle">${PAGE_TITLES.inventory[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-inv-export>Export CSV</button><button class="btn btn-champagne" data-inv-add>${icon('plus')} ${t('New Item')}</button></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">Add / Edit Jewellery Item</h2></div><div class="card-body"><form id="itemForm" class="form" data-edit-id="">
  <input type="hidden" name="id" id="itemId"><input type="hidden" name="category" id="itemCategory" value="gold">
  <div class="tabs" id="itemTypeTabs" style="margin-bottom:12px"><button type="button" class="tab active" data-cat="gold">Gold</button><button type="button" class="tab" data-cat="silver">Silver</button><button type="button" class="tab" data-cat="diamond">Diamond</button><button type="button" class="tab" data-cat="gemstone">Gemstone</button></div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">${input('code','Item Code','text','','')}${input('sku','SKU','text','','readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">${input('name','Item Name','text','','')}${select('metalType','Metal Type',METAL_TYPES,'Gold')}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${select('purity','Purity',PURITY_OPTIONS,'22K')}${input('grossWeight','Gross (g)','number','','min="0" step="0.001"')}${input('stoneWeight','Stone (g)','number','0','min="0" step="0.001"')}${input('netWeight','Net (g)','number','','min="0" step="0.001" readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${input('makingCharge','Making (NPR)','number','0','min="0" step="0.01"')}${input('wastagePercent','Wastage %','number','0','min="0" step="0.1"')}${input('wastageWeight','Wastage (g)','number','0','min="0" step="0.001" readonly')}${input('costPrice','Cost (NPR)','number','','min="0" step="0.01" readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${input('sellingPrice','Selling (NPR)','number','','min="0" step="0.01"')}${input('marginPercent','Margin %','number','','readonly')}${input('barcode','Barcode','text','','readonly')}${input('qrCode','QR Data','text','','readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${select('status','Status',STATUS_OPTIONS.map(v=>({value:v,label:t(v)})),'stock')}${select('location','Location',LOCATIONS.map(v=>({value:v,label:t(v)})),'Showcase')}${input('tags','Tags (comma)','text','','')}</div>
  <div id="stoneDetailsSection" style="display:none"><h4>${t('Stone Details')}</h4><div id="stoneDetailsRows"></div><button type="button" class="btn btn-secondary btn-sm" data-add-stone>${icon('plus')} ${t('Add Stone Row')}</button></div>
  <div><h4>Images</h4><input type="file" id="itemImages" accept="image/*" multiple style="display:none"><button type="button" class="btn btn-secondary btn-sm" data-add-images>Upload Images</button><div id="imagePreview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div></div>
  <div class="field-full" style="display:flex;gap:8px"><button class="btn btn-gold" type="submit"><span id="submitBtnText">Add to Inventory</span></button><button type="button" class="btn btn-secondary" data-inv-cancel style="display:none">Cancel Edit</button></div>
</form></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">${t('Inventory')}</h2></div><div class="card-body"><div class="toolbar" style="display:flex;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-5)"><input type="search" id="invSearch" class="field-input" placeholder="Search items..." value="${esc(searchQuery)}" style="max-width:300px">${select('invFilterCategory','', ['all',...JEWELRY_CATEGORIES.map(c=>({value:c.id,label:c.label}))], filterCategory)}${select('invFilterStatus','', [{value:'all',label:t('All')},...STATUS_OPTIONS.map(v=>({value:v,label:t(v)}))], filterStatus)}${select('invFilterMetal','', [{value:'all',label:t('All')},...metals.map(v=>({value:v,label:lt(v)}))], filterMetal)}${select('invFilterPurity','', ['all',...purities], filterPurity)}${select('invSortBy','', [{value:'createdAt',label:t('Newest first')},{value:'name',label:t('Name')},{value:'sku',label:t('SKU')},{value:'netWeight',label:t('Net weight')},{value:'sellingPrice',label:t('Selling Price')},{value:'status',label:t('Status')}], sortBy)}<button class="btn btn-ghost btn-sm" data-inv-sort-dir="${sortDir}" title="${sortDir==='asc'?t('Ascending'):t('Descending')}">${sortDir==='asc'?'↑':'↓'}</button></div>${rows(['SKU','Code','Name','Category','Metal','Purity','Net (g)','Cost','Sell','Status','Location','Actions'], list.map(i=>{const cat=JEWELRY_CATEGORIES.find(c=>c.id===i.category); const catIcon=cat?JEWELRY_ICONS[cat.icon]:''; return `<tr><td><code class="mono">${esc(i.sku)}</code></td><td><code class="mono">${esc(i.code)}</code></td><td>${esc(i.name)}</td><td><span class="category-badge ${i.category}">${catIcon}<span class="nav-label">${cat?t(cat.label):i.category}</span></span></td><td>${esc(lt(i.metalType||i.metal||''))}</td><td class="mono">${esc(i.purity)}</td><td class="mono align-right">${num(i.netWeight||i.weight).toFixed(3)}</td><td class="mono align-right">${money(calcItem.totalCost(i))}</td><td class="mono align-right">${money(i.sellingPrice)}</td><td><span class="badge badge-${i.status}">${esc(lt(i.status))}</span></td><td>${esc(lt(i.location||''))}</td><td><button class="btn btn-ghost btn-sm" data-inv-edit="${esc(i.id)}" title="Edit">${icon('edit')}</button> <button class="btn btn-ghost btn-sm" data-inv-delete="${esc(i.id)}" title="Delete">${icon('trash')}</button></td></tr>`;}).join(''))}</div></div>`;
}

function pos(){
  const availableStock=stock();
  const customers=state.customers||[];
  const cart=state.posCart||[];
  const cartTotals=calcCartTotals(cart);
  const currentRates=state.rates;
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.pos[0]}</h1><p class="page-subtitle">${PAGE_TITLES.pos[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-pos-clear-cart ${cart.length?'':'style="display:none"'}>Clear Cart</button><button class="btn btn-champagne" data-pos-new-customer>New Customer</button></div></div></div>
<div class="layout"><div>
  <div class="card"><div class="card-header"><h2 class="card-title">Rates</h2></div><div class="card-body"><form id="posRates" class="form">${input('gold','Gold Rate','number',currentRates.gold,'min="0" step="0.01"')}${input('silver','Silver Rate','number',currentRates.silver,'min="0" step="0.01"')}<div class="field-full"><button class="btn btn-primary" type="submit">Update Rates & Recalculate</button></div></form></div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">Items</h2></div><div class="card-body"><input type="search" id="posItemSearch" class="field-input" placeholder="Search items..." style="margin-bottom:var(--space-3)"><div style="max-height:300px;overflow:auto">${rows(['SKU','Name','Category','Metal','Purity','Net','Sell','Action'], availableStock.filter(i=>{const q=(state.posItemSearch||'').toLowerCase(); return !q || [i.sku,i.name,i.code].join(' ').toLowerCase().includes(q);}).map(i=>{const cat=JEWELRY_CATEGORIES.find(c=>c.id===i.category); const catIcon=cat?JEWELRY_ICONS[cat.icon]:''; return `<tr><td><code class="mono">${esc(i.sku)}</code></td><td>${esc(i.name)}</td><td><span class="category-badge ${i.category}">${catIcon}<span class="nav-label">${cat?t(cat.label):i.category}</span></span></td><td>${esc(lt(i.metalType||i.metal))}</td><td class="mono">${esc(i.purity)}</td><td class="mono align-right">${num(i.netWeight||i.weight).toFixed(3)}</td><td class="mono align-right">${money(i.sellingPrice||price(i))}</td><td><button class="btn btn-champagne btn-sm" data-pos-add-item="${esc(i.id)}">Add</button></td></tr>`;}).join(''))}</div></div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">Customer</h2></div><div class="card-body"><select class="field-select" id="posCustomerSelect"><option value="">Walk-in Customer</option>${customers.map(c=>`<option value="${esc(c.id)}">${esc(c.name)} ${c.phone?'('+esc(c.phone)+')':''}</option>`).join('')}</select><div id="posCustomerDetails" style="display:none;margin-top:12px"></div></div></div>
</div><div style="width:420px;flex-shrink:0">
  <div class="card"><div class="card-header"><h2 class="card-title">${t('Cart')} (${cart.length})</h2></div><div class="card-body">${cart.length?`<table class="table"><thead><tr><th>Item</th><th>Qty</th><th>Total</th><th></th></tr></thead><tbody>${cart.map((c,idx)=>`<tr><td>${esc(c.item.name)}<div class="small muted mono">${esc(c.item.sku)}</div></td><td><input type="number" class="field-input" style="width:70px" value="${c.qty}" min="1" data-pos-qty="${idx}"></td><td class="mono align-right">${money(c.total)}</td><td><button class="btn btn-ghost btn-sm" data-pos-remove-item="${idx}">×</button></td></tr>`).join('')}</tbody></table>`:`<p class="muted">${t('Cart is empty')}</p>`}
  <div style="margin-top:12px">${t('Subtotal:')} <strong class="mono">${money(cartTotals.subtotal)}</strong><br>${t('Discount:')} <strong class="mono">${money(cartTotals.discount)}</strong><br>${t('Tax:')} <strong class="mono">${money(cartTotals.tax)}</strong><br>${t('Grand Total:')} <strong class="mono" style="color:var(--gold-primary)">${money(cartTotals.total)}</strong></div>
  <div class="field" style="margin-top:12px"><label class="field-label">Extra Discount %</label><input class="field-input" id="posExtraDiscount" type="number" value="0" min="0" max="100" step="0.1"></div>
  <div style="margin-top:12px"><label class="field-label">Payments</label><div id="posPaymentRows">${cart.length?`<div class="payment-row" style="display:flex;gap:8px;margin-bottom:8px"><select class="field-select" name="payMethod" style="flex:1">${PAYMENT_METHODS.map(m=>`<option value="${m}">${m}</option>`).join('')}</select><input class="field-input" name="payAmount" type="number" style="width:120px" min="0" step="0.01" value="${cartTotals.total.toFixed(2)}"><button type="button" class="btn btn-ghost btn-sm" data-pos-remove-pay>×</button></div>`:''}</div><button type="button" class="btn btn-secondary btn-sm" data-pos-add-pay style="width:100%">${t('Add Payment')}</button><div id="posPaymentSummary" style="margin-top:8px"></div></div>
  <div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-gold" style="flex:1" data-pos-checkout>Complete Sale</button><button class="btn btn-secondary" data-pos-save-quote>Save Quote</button></div></div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">Recent Sales</h2></div><div class="card-body" style="padding:0;max-height:280px;overflow:auto">${rows(['Invoice','Date','Customer','Total','Actions'], state.sales.slice(0,10).map(s=>`<tr><td><code class="mono">${esc(s.invoice)}</code></td><td class="mono">${fmtDate(s.date)}</td><td>${esc(s.customerName||s.customer||'-')}</td><td class="mono align-right">${money(s.total)}</td><td><button class="btn btn-ghost btn-sm" data-pos-view-invoice="${esc(s.id)}">View</button></td></tr>`).join(''))}</div></div>
</div></div>`;
}

function metals(){
  const txns=state.metalManagement?.transactions||[];
  const balances=getAllMetalBalances();
  const filterMetal=state.metalFilterMetal||'all';
  const filterType=state.metalFilterType||'all';
  const filterPurity=state.metalFilterPurity||'all';
  const filterPosted=state.metalFilterPosted||'all';
  const searchQuery=(state.metalSearch||'').toLowerCase();
  let filtered=txns.slice();
  if(searchQuery) filtered=filtered.filter(t=>[t.type,t.metal,t.purity,t.reference,t.notes,t.karigar,t.jobCode,t.customer].join(' ').toLowerCase().includes(searchQuery));
  if(filterMetal!=='all') filtered=filtered.filter(t=>t.metal===filterMetal);
  if(filterType!=='all') filtered=filtered.filter(t=>t.type===filterType);
  if(filterPurity!=='all') filtered=filtered.filter(t=>t.purity===filterPurity);
  if(filterPosted==='posted') filtered=filtered.filter(t=>t.posted);
  if(filterPosted==='unposted') filtered=filtered.filter(t=>!t.posted);
  const typeOptions=METAL_TXN_TYPES.map(x=>({value:x.value,label:x.label}));
  const allPurities=[...GOLD_PURITIES,...SILVER_PURITIES];
  const totalGold=Object.values(balances).filter(b=>b.metal==='Gold').reduce((s,b)=>s+b.balance,0);
  const totalSilver=Object.values(balances).filter(b=>b.metal==='Silver').reduce((s,b)=>s+b.balance,0);
  const goldValue=rnd(totalGold*num(state.rates.gold)); const silverValue=rnd(totalSilver*num(state.rates.silver));
  const balanceRows=Object.values(balances).map(b=>`<tr><td>${esc(b.metal)}</td><td class="mono">${esc(b.purity)}</td><td class="mono align-right">${b.opening.toFixed(3)} g</td><td class="mono align-right"><strong>${b.balance.toFixed(3)} g</strong></td><td class="mono align-right">${money(b.metal==='Gold'?num(state.rates.gold):num(state.rates.silver))}</td><td class="mono align-right">${money(b.balance*(b.metal==='Gold'?num(state.rates.gold):num(state.rates.silver)))}</td></tr>`).join('');
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.metals[0]}</h1><p class="page-subtitle">${PAGE_TITLES.metals[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-metal-export>Export CSV</button><button class="btn btn-secondary" data-metal-post-period>Post Period</button><button class="btn btn-champagne" data-metal-add>New Transaction</button></div></div></div>
<div class="metric-grid">${card('Total Gold', totalGold.toFixed(3)+' g', t('Value')+' '+money(goldValue))}${card('Total Silver', totalSilver.toFixed(3)+' g', t('Value')+' '+money(silverValue))}${card('Transactions', txns.length, `${t('Posted')} ${txns.filter(x=>x.posted).length}`)}${card('Combined Value', money(goldValue+silverValue), 'At current rates')}</div>
<div class="card"><div class="card-header"><h2 class="card-title">Current Balances by Purity</h2></div><div class="card-body" style="padding:0">${rows(['Metal','Purity','Opening','Current','Rate/g','Value'], balanceRows)}</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Transaction History</h2></div><div class="card-body"><div class="toolbar" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><input type="search" id="metalSearch" class="field-input" placeholder="Search..." value="${esc(state.metalSearch||'')}" style="max-width:240px">${select('metalFilterMetal','',[{value:'all',label:t('All')},{value:'Gold',label:t('Gold')},{value:'Silver',label:t('Silver')}],filterMetal)}${select('metalFilterType','',['all',...typeOptions],filterType)}${select('metalFilterPurity','',['all',...allPurities],filterPurity)}${select('metalFilterPosted','',['all','posted','unposted'],filterPosted)}</div><div style="max-height:480px;overflow:auto">${rows(['Date','Type','Metal','Purity','Weight','Rate','Value','Reference','Karigar/Job','Status','Actions'], filtered.map(t=>{const typeInfo=METAL_TXN_TYPES.find(x=>x.value===t.type)||{}; const editable=canEditTransaction(t); return `<tr><td class="mono">${esc(t.date||'')}</td><td><span class="badge" style="background:${typeInfo.color||'var(--bg-elevated)'}22">${esc(lt(typeInfo.label||t.type))}</span></td><td>${esc(t.metal)}</td><td class="mono">${esc(t.purity)}</td><td class="mono align-right">${num(t.weight).toFixed(3)} ${esc(t.unit||'g')}</td><td class="mono align-right">${t.rate?money(t.rate):'-'}</td><td class="mono align-right">${t.value?money(t.value):'-'}</td><td><code class="mono">${esc(t.reference||'-')}</code></td><td>${esc(t.karigar||t.jobCode||'-')}</td><td>${t.posted?`<span class="badge badge-completed">${lt('Posted')}</span>`:`<span class="badge badge-warn">${lt('Draft')}</span>`}</td><td>${editable?`<button class="btn btn-ghost btn-sm" data-metal-edit="${esc(t.id)}">${lt('Edit')}</button> <button class="btn btn-ghost btn-sm" data-metal-delete="${esc(t.id)}">${lt('Delete')}</button>`:''}</td></tr>`;}).join(''))}</div><p class="note note-caution" style="margin-top:12px">${t('Job metal issues/returns/wastage are recorded as ledger transactions automatically and affect balances.')}</p></div></div>`;
}

function exchange(){
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.exchange[0]}</h1><p class="page-subtitle">${PAGE_TITLES.exchange[1]}</p></div></div></div>
<div class="layout"><div>
  <div class="card"><div class="card-header"><h2 class="card-title">Record Old-Gold Receipt</h2></div><div class="card-body"><form id="exchange" class="form">${input('customer','Customer Name')}${input('weight','Net Metal Weight (g)','number','','min="0.001" step="0.001"')}${select('purity','Assessed Purity',['24','22','21','20','18','14','12','9'])}${input('rate','Agreed Rate per Fine Gram (NPR)','number',state.rates.gold,'min="0" step="0.01"')}${input('deduction','Agreed Deduction (NPR)','number','0','min="0" step="0.01"')}${textarea('notes','Assessment / Test Notes')}<div class="field-full"><button class="btn btn-champagne" type="submit" style="width:100%">Record Receipt</button></div></form><p class="note note-caution" style="margin-top:12px">Receipt register for pilot. Link to metal ledger manually if needed via Metal Management.</p></div></div>
</div><div>
  <div class="card"><div class="card-header"><h2 class="card-title">Old-Gold Receipts</h2></div><div class="card-body" style="padding:0">${rows(['Customer','Weight','Purity','Value'], state.exchanges.map(x=>`<tr><td>${esc(x.customer)}</td><td class="mono">${num(x.weight).toFixed(3)} g</td><td class="mono">${x.purity}K</td><td class="align-right mono">${money(x.value)}</td></tr>`).join(''))}</div></div>
</div></div>`;
}


function reports(){
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
    ? `(${startDate ? fmtDate(startDate) : 'Start'} → ${endDate ? fmtDate(endDate) : 'End'})`
    : `(${t('All dates')})`;

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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - ${t('Sales Report')}</h1><p class="page-subtitle">${PAGE_TITLES.reports[1]} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="sales">Export CSV</button>
  <button class="btn btn-outline-champagne" data-report-export-pdf="sales">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  ${card('Total Sales', money(totalSales), `${sales.length} ${t('invoices')}`)}
  ${card('Total Tax', money(totalTax), `${t(state.settings.taxLabel)} @ ${state.settings.taxRate}%`)}
  ${card('Total Discount', money(totalDiscount))}
  ${card('Avg Sale Value', money(avgSale), `${totalItems} ${t('items sold')}`)}
</div>
<div class="layout">
  <div>
    <div class="card"><div class="card-header"><h2 class="card-title">Sales by Payment Method</h2></div><div class="card-body" style="padding:0">
      ${rows(['Method','Amount','%'], Object.entries(byPayment).map(([m,v])=>`<tr><td>${esc(m)}</td><td class="mono align-right">${money(v)}</td><td class="mono align-right">${totalSales?rnd(v/totalSales*100):0}%</td></tr>`).join('') || `<tr><td colspan="3" class="align-center">${t('No data')}</td></tr>`)}
    </div></div>
    <div class="card"><div class="card-header"><h2 class="card-title">Sales by Metal Type</h2></div><div class="card-body" style="padding:0">
      ${rows(['Metal Type','Amount','%'], Object.entries(byMetal).filter(([,v])=>v>0).map(([m,v])=>`<tr><td>${esc(m)}</td><td class="mono align-right">${money(v)}</td><td class="mono align-right">${totalSales?rnd(v/totalSales*100):0}%</td></tr>`).join('') || `<tr><td colspan="3" class="align-center">${t('No data')}</td></tr>`)}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Sales Detail</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
      ${rows(['Date','Invoice','Customer','Items','Subtotal','Discount','Tax','Total','Payments'], sales.map(s=>`<tr>
        <td class="mono">${fmtDate(s.date)}</td>
        <td><code class="mono">${esc(s.invoice)}</code></td>
        <td>${esc(s.customerName||s.customer||'Walk-in')}</td>
        <td class="mono align-right">${(s.items||[]).reduce((sum,it)=>sum+num(it.qty),0)}</td>
        <td class="mono align-right">${money(s.subtotal)}</td>
        <td class="mono align-right">${money(s.discount)}</td>
        <td class="mono align-right">${money(s.tax)}</td>
        <td class="mono align-right"><strong>${money(s.total)}</strong></td>
        <td>${(s.payments||[]).map(p=>`${esc(p.method)} ${money(p.amount)}`).join('<br>')}</td>
      </tr>`).join('') || `<tr><td colspan="9" class="align-center">${t('No sales in period')}</td></tr>`)}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="salesFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${input('reportStartDate','From','date',startDate,'')}
    ${input('reportEndDate','To','date',endDate,'')}
    ${select('reportFilterCustomer','Customer',['all',...state.customers.map(c=>({value:c.id,label:c.name}))], filterCustomer)}
    ${select('reportFilterCategory','Category',['all',...JEWELRY_CATEGORIES.map(c=>({value:c.id,label:c.label}))], filterCategory)}
    <button class="btn btn-champagne" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - Purchase Report</h1><p class="page-subtitle">Metal purchases from suppliers ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="purchases">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="purchases">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  ${card('Total Purchases', money(totalValue), `${purchases.length} transactions`)}
  ${card('Total Weight', totalWeight.toFixed(3) + ' g', `Avg rate: ${money(avgRate)}/g`)}
  ${card('Gold Purchased', byMetal.Gold.weight.toFixed(3) + ' g', money(byMetal.Gold.value))}
  ${card('Silver Purchased', byMetal.Silver.weight.toFixed(3) + ' g', money(byMetal.Silver.value))}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Purchases by Supplier</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">
      ${rows(['Supplier','Transactions','Weight (g)','Value','Avg Rate/g'], Object.entries(bySupplier).map(([s,v])=>`<tr>
        <td>${esc(s)}</td>
        <td class="mono align-right">${v.count}</td>
        <td class="mono align-right">${v.weight.toFixed(3)}</td>
        <td class="mono align-right">${money(v.value)}</td>
        <td class="mono align-right">${money(v.weight?v.value/v.weight:0)}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="align-center">No purchases in period</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Purchase Detail</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">
      ${rows(['Date','Type','Metal','Purity','Weight (g)','Rate/g','Value','Supplier','Reference','Notes'], purchases.map(t=>`<tr>
        <td class="mono">${esc(t.date||'')}</td>
        <td>${esc(lt((METAL_TXN_TYPES.find(x=>x.value===t.type)||{}).label||t.type))}</td>
        <td>${esc(t.metal)}</td>
        <td class="mono">${esc(t.purity)}</td>
        <td class="mono align-right">${num(t.weight).toFixed(3)}</td>
        <td class="mono align-right">${money(t.rate)}</td>
        <td class="mono align-right">${money(t.value)}</td>
        <td>${esc(t.karigar||'-')}</td>
        <td><code class="mono">${esc(t.reference||'-')}</code></td>
        <td>${esc(t.notes||'-')}</td>
      </tr>`).join('') || '<tr><td colspan="10" class="align-center">No purchases in period</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="purchaseFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${input('reportStartDate','From','date',startDate,'')}
    ${input('reportEndDate','To','date',endDate,'')}
    ${select('reportFilterSupplier','Supplier',['all',...[...new Set(state.metalManagement.transactions.filter(t=>t.type==='PURCHASE').map(t=>t.karigar).filter(Boolean))]], filterSupplier)}
    <button class="btn btn-champagne" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - Stock Valuation</h1><p class="page-subtitle">Current inventory valuation at cost and selling price ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="stock">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="stock">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  ${card('Total Items', totalItems + ' pcs', `${totalWeight.toFixed(3)} g total weight`)}
  ${card('Stock at Cost', money(totalCost), 'Weighted average cost')}
  ${card('Stock at Selling', money(totalSelling), `Potential margin: ${potentialMargin}%`)}
  ${card('Potential Profit', money(rnd(totalSelling - totalCost)), 'If all sold at marked price')}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Valuation by Category</h2></div><div class="card-body" style="padding:0">
      ${rows(['Category','Items','Weight (g)','Cost Value','Selling Value','Margin %'], Object.entries(byCat).map(([c,v])=>`<tr>
        <td>${esc(c.charAt(0).toUpperCase()+c.slice(1))}</td>
        <td class="mono align-right">${v.count}</td>
        <td class="mono align-right">${v.weight.toFixed(3)}</td>
        <td class="mono align-right">${money(v.cost)}</td>
        <td class="mono align-right">${money(v.selling)}</td>
        <td class="mono align-right">${v.selling?rnd((v.selling-v.cost)/v.selling*100):0}%</td>
      </tr>`).join('') || '<tr><td colspan="6" class="align-center">No stock</td></tr>')}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Valuation by Metal</h2></div><div class="card-body" style="padding:0">
      ${rows(['Metal','Items','Weight (g)','Cost Value','Selling Value','Margin %'], Object.entries(byMetal).filter(([,v])=>v.count>0).map(([m,v])=>`<tr>
        <td>${esc(m)}</td>
        <td class="mono align-right">${v.count}</td>
        <td class="mono align-right">${v.weight.toFixed(3)}</td>
        <td class="mono align-right">${money(v.cost)}</td>
        <td class="mono align-right">${money(v.selling)}</td>
        <td class="mono align-right">${v.selling?rnd((v.selling-v.cost)/v.selling*100):0}%</td>
      </tr>`).join('') || '<tr><td colspan="6" class="align-center">No stock</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Stock Detail</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
      ${rows(['SKU','Name','Category','Metal','Purity','Net (g)','Cost','Selling','Margin %','Location'], items.map(i=>`<tr>
        <td><code class="mono">${esc(i.sku)}</code></td>
        <td>${esc(i.name)}</td>
        <td>${esc(i.category)}</td>
        <td>${esc(lt(i.metalType||i.metal))}</td>
        <td class="mono">${esc(i.purity)}</td>
        <td class="mono align-right">${num(i.netWeight||i.weight).toFixed(3)}</td>
        <td class="mono align-right">${money(calcItem.totalCost(i))}</td>
        <td class="mono align-right">${money(i.sellingPrice)}</td>
        <td class="mono align-right">${num(i.marginPercent||0).toFixed(1)}%</td>
        <td>${esc(i.location||'-')}</td>
      </tr>`).join('') || '<tr><td colspan="10" class="align-center">No stock items</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="stockFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${select('reportFilterCategory','Category',['all',...JEWELRY_CATEGORIES.map(c=>({value:c.id,label:c.label}))], filterCategory)}
    ${select('reportFilterMetal','Metal',['all','Gold','Silver','Platinum','Rose Gold','White Gold'], state.reportFilterMetal||'all')}
    <button class="btn btn-champagne" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - Gold/Silver Balances</h1><p class="page-subtitle">Current metal balances with period movement ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="metalbalances">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="metalbalances">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  ${card('Total Gold', totalGold.toFixed(3) + ' g', 'Value: ' + money(goldValue))}
  ${card('Total Silver', totalSilver.toFixed(3) + ' g', 'Value: ' + money(silverValue))}
  ${card('Combined Value', money(goldValue + silverValue), 'At current rates')}
  ${card('Gold Rate', money(num(state.rates.gold)) + '/g', 'Silver: ' + money(num(state.rates.silver)) + '/g')}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Gold Balance by Purity</h2></div><div class="card-body" style="padding:0">
      ${rows(['Purity','Opening','In Period','Out Period','Current Balance','Rate/g','Value'], goldBalances.map(b=>{
        const inW = txns.filter(t=>t.metal==='Gold'&&t.purity===b.purity&&['PURCHASE','RETURN','RECEIPT','OPENING_BALANCE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
        const outW = txns.filter(t=>t.metal==='Gold'&&t.purity===b.purity&&['ISSUE','WASTAGE','SALE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
        return `<tr>
          <td class="mono">${esc(b.purity)}</td>
          <td class="mono align-right">${b.opening.toFixed(3)}</td>
          <td class="mono align-right text-success">+${inW.toFixed(3)}</td>
          <td class="mono align-right text-danger">-${outW.toFixed(3)}</td>
          <td class="mono align-right"><strong>${b.balance.toFixed(3)}</strong></td>
          <td class="mono align-right">${money(num(state.rates.gold))}</td>
          <td class="mono align-right">${money(rnd(b.balance*num(state.rates.gold)))}</td>
        </tr>`;
      }).join('') || '<tr><td colspan="7" class="align-center">No gold balances</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Silver Balance by Purity</h2></div><div class="card-body" style="padding:0">
      ${rows(['Purity','Opening','In Period','Out Period','Current Balance','Rate/g','Value'], silverBalances.map(b=>{
        const inW = txns.filter(t=>t.metal==='Silver'&&t.purity===b.purity&&['PURCHASE','RETURN','RECEIPT','OPENING_BALANCE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
        const outW = txns.filter(t=>t.metal==='Silver'&&t.purity===b.purity&&['ISSUE','WASTAGE','SALE'].includes(t.type)).reduce((s,t)=>s+num(t.weight),0);
        return `<tr>
          <td class="mono">${esc(b.purity)}</td>
          <td class="mono align-right">${b.opening.toFixed(3)}</td>
          <td class="mono align-right text-success">+${inW.toFixed(3)}</td>
          <td class="mono align-right text-danger">-${outW.toFixed(3)}</td>
          <td class="mono align-right"><strong>${b.balance.toFixed(3)}</strong></td>
          <td class="mono align-right">${money(num(state.rates.silver))}</td>
          <td class="mono align-right">${money(rnd(b.balance*num(state.rates.silver)))}</td>
        </tr>`;
      }).join('') || '<tr><td colspan="7" class="align-center">No silver balances</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Period Movement Summary</h2></div><div class="card-body" style="padding:0">
  ${rows(['Metal','Opening','Receipts/Purchases','Issues/Sales/Wastage','Closing','Rate/g','Value'], [
    ['Gold', totalGold.toFixed(3), goldIn.toFixed(3), goldOut.toFixed(3), totalGold.toFixed(3), money(num(state.rates.gold)), money(goldValue)],
    ['Silver', totalSilver.toFixed(3), silverIn.toFixed(3), silverOut.toFixed(3), totalSilver.toFixed(3), money(num(state.rates.silver)), money(silverValue)]
  ].map(r=>`<tr>${r.map(c=>`<td class="mono align-right">${c}</td>`).join('')}</tr>`).join('') )}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="metalBalanceFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${input('reportStartDate','From','date',startDate,'')}
    ${input('reportEndDate','To','date',endDate,'')}
    ${select('reportFilterCategory','Transaction Type',['all',...METAL_TXN_TYPES.map(t=>t.value)], filterCategory)}
    <button class="btn btn-champagne" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - Karigar Outstanding</h1><p class="page-subtitle">Metal issued, returned, wastage and labour outstanding ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="karigar">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="karigar">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  ${card('Total Metal Issued', totalIssued.toFixed(3) + ' g', 'Across all karigars')}
  ${card('Total Returned', totalReturned.toFixed(3) + ' g', 'Net: ' + totalNet.toFixed(3) + ' g')}
  ${card('Total Wastage', totalWastage.toFixed(3) + ' g', 'Actual wastage')}
  ${card('Labour Outstanding', money(totalOutstanding), `Total labour: ${money(totalLabour)}, Advances: ${money(totalAdvance)}`)}
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Karigar Outstanding Summary</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
  ${rows(['Karigar','Specialty','Rate/g','Active Jobs','Issued (g)','Returned (g)','Net (g)','Wastage (g)','Labour Earned','Advance','Outstanding'], karigars.map(k=>`<tr>
    <td><strong>${esc(k.karigar.name)}</strong></td>
    <td>${esc((k.karigar.specialties||[]).join(', ')||'-')}</td>
    <td class="mono align-right">${money(num(k.karigar.ratePerGram))}</td>
    <td class="mono align-right">${k.activeJobs.length}</td>
    <td class="mono align-right">${k.issued.toFixed(3)}</td>
    <td class="mono align-right">${k.returned.toFixed(3)}</td>
    <td class="mono align-right"><strong>${k.net.toFixed(3)}</strong></td>
    <td class="mono align-right">${k.wastage.toFixed(3)}</td>
    <td class="mono align-right">${money(k.labour)}</td>
    <td class="mono align-right">${money(k.advance)}</td>
    <td class="mono align-right ${k.balance<0?'text-danger':''}"><strong>${money(k.balance)}</strong></td>
  </tr>`).join('') || '<tr><td colspan="11" class="align-center">No karigars</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="karigarFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${input('reportStartDate','From','date',startDate,'')}
    ${input('reportEndDate','To','date',endDate,'')}
    ${select('reportFilterKarigar','Karigar',['all',...state.karigars.map(k=>({value:k.id,label:k.name}))], filterKarigar)}
    <button class="btn btn-champagne" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - Customer Balances</h1><p class="page-subtitle">Outstanding receivables and credit utilization ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="customers">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="customers">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  ${card('Total Receivables', money(totalReceivable), `${customers.length} customers with activity`)}
  ${card('Total Credit Limits', money(totalCreditLimit), 'Combined limits')}
  ${card('Overdue Accounts', overdueCustomers, 'Exceeding credit limit')}
  ${card('Avg Utilization', customers.length ? rnd(customers.reduce((s,c)=>s+c.utilization,0)/customers.length) + '%' : '0%', 'Of credit limits')}
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Customer Balance Detail</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
  ${rows(['Customer','Phone','Sales (Period)','Paid (Period)','Balance','Credit Limit','Utilization','Status'], customers.map(c=>`<tr>
    <td><strong>${esc(c.customer.name)}</strong></td>
    <td>${esc(c.customer.phone||'-')}</td>
    <td class="mono align-right">${money(c.totalSales)}</td>
    <td class="mono align-right">${money(c.totalPaid)}</td>
    <td class="mono align-right ${c.balance<0?'text-success':(c.balance>c.creditLimit&&c.creditLimit>0?'text-danger':'')}"><strong>${money(c.balance)}</strong></td>
    <td class="mono align-right">${money(c.creditLimit)}</td>
    <td class="mono align-right">${c.utilization.toFixed(1)}%</td>
    <td>${c.balance>c.creditLimit&&c.creditLimit>0?'<span class="badge badge-warn">Over Limit</span>':c.balance<0?'<span class="badge badge-completed">Credit</span>':'<span class="badge badge-inprogress">Active</span>'}</td>
  </tr>`).join('') || '<tr><td colspan="8" class="align-center">No customer activity in period</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="customerFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${input('reportStartDate','From','date',startDate,'')}
    ${input('reportEndDate','To','date',endDate,'')}
    ${select('reportFilterCustomer','Customer',['all',...state.customers.map(c=>({value:c.id,label:c.name}))], filterCustomer)}
    <button class="btn btn-champagne" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - Supplier Balances</h1><p class="page-subtitle">Outstanding payables to metal suppliers ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="suppliers">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="suppliers">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  ${card('Total Payables', money(totalPayable), `${suppliers.length} suppliers`)}
  ${card('Period Purchases', money(totalPurchaseValue), 'Metal purchases in period')}
  ${card('Suppliers with Balance', suppliers.filter(s=>s.balance!==0).length, 'Non-zero balances')}
  ${card('Avg Payment Terms', suppliers.length ? Math.round(suppliers.filter(s=>s.supplier.paymentTerms).reduce((a,s)=>a+num(s.supplier.paymentTerms.match(/\d+/)?.[0]||0),0)/suppliers.filter(s=>s.supplier.paymentTerms).length) + ' days' : 'N/A')}
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Supplier Balance Detail</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
  ${rows(['Supplier','Contact','Period Purchases','Weight (g)','Balance','Payment Terms','Status'], suppliers.map(s=>`<tr>
    <td><strong>${esc(s.supplier.name)}</strong></td>
    <td>${esc(s.supplier.contactPerson||'-')}</td>
    <td class="mono align-right">${money(s.totalPurchases)}</td>
    <td class="mono align-right">${s.totalWeight.toFixed(3)}</td>
    <td class="mono align-right ${s.balance>0?'text-danger':s.balance<0?'text-success':''}"><strong>${money(s.balance)}</strong></td>
    <td>${esc(s.supplier.paymentTerms||'-')}</td>
    <td>${s.balance>0?'<span class="badge badge-warn">Payable</span>':s.balance<0?'<span class="badge badge-completed">Advance</span>':'<span class="badge badge-inprogress">Settled</span>'}</td>
  </tr>`).join('') || '<tr><td colspan="7" class="align-center">No supplier activity in period</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="supplierFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${input('reportStartDate','From','date',startDate,'')}
    ${input('reportEndDate','To','date',endDate,'')}
    ${select('reportFilterSupplier','Supplier',['all',...state.suppliers.map(s=>({value:s.id,label:s.name}))], filterSupplier)}
    <button class="btn btn-champagne" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - Expenses</h1><p class="page-subtitle">Business expenses by category and period ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="expenses">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="expenses">Export PDF</button>
  <button class="btn btn-secondary" data-tab="expenses">Manage Expenses</button>
</div></div></div>
<div class="metric-grid">
  ${card('Total Expenses', money(totals.total), `${totals.count} records`)}
  ${card('Paid', money(byStatus.paid), 'Completed payments')}
  ${card('Pending', money(byStatus.pending), 'Awaiting payment')}
  ${card('Overdue', money(byStatus.overdue), 'Past due')}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Expenses by Category</h2></div><div class="card-body" style="padding:0">
      ${rows(['Category','Amount','%','Count'], Object.entries(totals.byCat).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr>
        <td>${esc(c)}</td>
        <td class="mono align-right">${money(v)}</td>
        <td class="mono align-right">${totals.total?rnd(v/totals.total*100):0}%</td>
        <td class="mono align-right">${expenses.filter(e=>e.category===c).length}</td>
      </tr>`).join('') || '<tr><td colspan="4" class="align-center">No expenses in period</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Monthly Trend</h2></div><div class="card-body" style="padding:0">
      ${rows(['Month','Total','Top Category'], Object.entries(byMonth).sort((a,b)=>b[0].localeCompare(a[0])).map(([m,v])=>{
        const topCat = Object.entries(v.byCat).sort((a,b)=>b[1]-a[1])[0] || ['-',0];
        return `<tr>
          <td class="mono">${m}</td>
          <td class="mono align-right">${money(v.total)}</td>
          <td>${esc(topCat[0])} (${money(topCat[1])})</td>
        </tr>`;
      }).join('') || `<tr><td colspan="3" class="align-center">${t('No data')}</td></tr>`)}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Expense Detail</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">
  ${rows(['Date','Category','Amount','Status','Payment Method','Reference','Notes'], expenses.map(e=>`<tr>
    <td class="mono">${fmtDate(e.date)}</td>
    <td>${esc(e.category)}</td>
    <td class="mono align-right">${money(e.amount)}</td>
    <td>${e.status==='paid'?'<span class="badge badge-completed">Paid</span>':e.status==='pending'?'<span class="badge badge-inprogress">Pending</span>':'<span class="badge badge-warn">Overdue</span>'}</td>
    <td>${esc(e.paymentMethod)}</td>
    <td><code class="mono">${esc(e.reference||'-')}</code></td>
    <td>${esc(e.notes||'-')}</td>
  </tr>`).join('') || '<tr><td colspan="7" class="align-center">No expenses in period</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="expenseFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${input('reportStartDate','From','date',startDate,'')}
    ${input('reportEndDate','To','date',endDate,'')}
    ${select('reportFilterCategory','Category',['all',...EXPENSE_CATEGORIES], filterCategory)}
    <button class="btn btn-champagne" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - Profit & Loss</h1><p class="page-subtitle">Financial performance statement ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="pnl">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="pnl">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  ${card('Net Revenue', money(netRevenue), `Gross: ${money(revenue)}, Discounts: ${money(discounts)}`)}
  ${card('COGS', money(cogs), 'Cost of items sold')}
  ${card('Gross Profit', money(grossProfit), `Margin: ${grossMargin}%`)}
  ${card('Net Profit', money(netProfit), `Margin: ${netMargin}%`)}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Revenue</h2></div><div class="card-body" style="padding:0">
      ${rows(['Item','Amount'], [
        ['Gross Sales', money(revenue)],
        ['Less: Discounts', money(discounts)],
        ['Net Revenue', money(netRevenue)],
        ['Tax Collected (${state.settings.taxLabel})', money(taxCollected)]
      ].map(r=>`<tr><td>${esc(r[0])}</td><td class="mono align-right ${r[0]==='Net Revenue'?'':'text-danger'}">${r[1]}</td></tr>`).join('') )}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Cost of Goods Sold</h2></div><div class="card-body" style="padding:0">
      ${rows(['Item','Amount'], [
        ['Cost of Items Sold', money(cogs)],
      ].map(r=>`<tr><td>${esc(r[0])}</td><td class="mono align-right text-danger">${r[1]}</td></tr>`).join('') )}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Gross Profit</h2></div><div class="card-body" style="padding:0">
      ${rows(['Item','Amount'], [
        ['Net Revenue', money(netRevenue)],
        ['Less: COGS', money(cogs)],
        ['Gross Profit', money(grossProfit)],
        ['Gross Margin', grossMargin + '%']
      ].map(r=>`<tr><td>${esc(r[0])}</td><td class="mono align-right ${r[0]==='Gross Profit'?'text-success':''}">${r[1]}</td></tr>`).join('') )}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Operating Expenses</h2></div><div class="card-body" style="padding:0">
      ${rows(['Category','Amount'], Object.entries(expensesByCat).map(([c,v])=>`<tr><td>${esc(c)}</td><td class="mono align-right text-danger">${money(v)}</td></tr>`).join('') || '<tr><td colspan="2" class="align-center">No expenses</td></tr>')}
      ${rows(['Category','Amount'], [['Total Operating Expenses', money(opExpenses)]].map(r=>`<tr style="border-top:2px solid var(--border-strong)"><td><strong>${esc(r[0])}</strong></td><td class="mono align-right"><strong>${r[1]}</strong></td></tr>`).join('') )}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Direct Costs</h2></div><div class="card-body" style="padding:0">
      ${rows(['Item','Amount'], [
        ['Karigar Labour', money(labourCost)],
        ['Metal Wastage', money(wastageCost)],
        ['Total Direct Costs', money(directCosts)]
      ].map(r=>`<tr><td>${esc(r[0])}</td><td class="mono align-right ${r[0]==='Total Direct Costs'?'':'text-danger'}">${r[1]}</td></tr>`).join('') )}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Net Profit</h2></div><div class="card-body" style="padding:0">
      ${rows(['Item','Amount'], [
        ['Gross Profit', money(grossProfit)],
        ['Less: Operating Expenses', money(opExpenses)],
        ['Less: Direct Costs', money(directCosts)],
        ['Net Profit / (Loss)', money(netProfit)],
        ['Net Margin', netMargin + '%']
      ].map(r=>`<tr style="${r[0]==='Net Profit / (Loss)'?'border-top:2px solid var(--border-strong)':''}"><td>${esc(r[0])}</td><td class="mono align-right ${r[0]==='Net Profit / (Loss)'?(netProfit>=0?'text-success':'text-danger'):(r[0].includes('Less')?'text-danger':'')}"><strong>${r[1]}</strong></td></tr>`).join('') )}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="pnlFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${input('reportStartDate','From','date',startDate,'')}
    ${input('reportEndDate','To','date',endDate,'')}
    <button class="btn btn-champagne" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - Daily Cash Report</h1><p class="page-subtitle">Cash flow statement - inflows and outflows ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-champagne" data-report-export-csv="cash">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="cash">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  ${card('Total Inflows', money(totalIn), `${allInflows.length} transactions`)}
  ${card('Total Outflows', money(totalOut), `${allOutflows.length} transactions`)}
  ${card('Net Cash Flow', money(netCash), netCash >= 0 ? 'Positive' : 'Negative')}
  ${card('Cash Sales', money(cashInflows.filter(x=>x.method==='Cash').reduce((s,x)=>s+x.amount,0)), 'Physical cash received')}
</div>
<div class="layout">
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Inflows by Method</h2></div><div class="card-body" style="padding:0">
      ${rows(['Method','Amount','Count'], Object.entries(inByMethod).map(([m,v])=>`<tr><td>${esc(m)}</td><td class="mono align-right">${money(v)}</td><td class="mono align-right">${allInflows.filter(x=>x.method===m).length}</td></tr>`).join('') || '<tr><td colspan="3" class="align-center">No inflows</td></tr>')}
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Outflows by Method</h2></div><div class="card-body" style="padding:0">
      ${rows(['Method','Amount','Count'], Object.entries(outByMethod).map(([m,v])=>`<tr><td>${esc(m)}</td><td class="mono align-right">${money(v)}</td><td class="mono align-right">${allOutflows.filter(x=>x.method===m).length}</td></tr>`).join('') || '<tr><td colspan="3" class="align-center">No outflows</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Daily Cash Summary</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">
      ${rows(['Date','Inflows','Outflows','Net'], Object.entries(byDate).sort((a,b)=>b[0].localeCompare(a[0])).map(([d,v])=>`<tr>
        <td class="mono">${fmtDate(d)}</td>
        <td class="mono align-right text-success">${money(v.in)}</td>
        <td class="mono align-right text-danger">${money(v.out)}</td>
        <td class="mono align-right ${rnd(v.in-v.out)>=0?'text-success':'text-danger'}"><strong>${money(rnd(v.in-v.out))}</strong></td>
      </tr>`).join('') || '<tr><td colspan="4" class="align-center">No cash movements</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Cash Inflow Detail</h2></div><div class="card-body" style="padding:0;max-height:300px;overflow:auto">
  ${rows(['Date','Type','Ref','Party','Method','Amount'], allInflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<tr>
    <td class="mono">${fmtDate(x.date)}</td>
    <td>${esc(x.type)}</td>
    <td><code class="mono">${esc(x.ref)}</code></td>
    <td>${esc(x.party)}</td>
    <td>${esc(x.method)}</td>
    <td class="mono align-right text-success">${money(x.amount)}</td>
  </tr>`).join('') || '<tr><td colspan="6" class="align-center">No inflows</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Cash Outflow Detail</h2></div><div class="card-body" style="padding:0;max-height:300px;overflow:auto">
  ${rows(['Date','Type','Ref','Party','Method','Amount'], allOutflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<tr>
    <td class="mono">${fmtDate(x.date)}</td>
    <td>${esc(x.type)}</td>
    <td><code class="mono">${esc(x.ref)}</code></td>
    <td>${esc(x.party)}</td>
    <td>${esc(x.method)}</td>
    <td class="mono align-right text-danger">${money(x.amount)}</td>
  </tr>`).join('') || '<tr><td colspan="6" class="align-center">No outflows</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="cashFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${input('reportStartDate','From','date',startDate,'')}
    ${input('reportEndDate','To','date',endDate,'')}
    <button class="btn btn-champagne" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
  }

  // Default - show report selector
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]}</h1><p class="page-subtitle">${PAGE_TITLES.reports[1]}</p></div><div class="page-header-actions">
  <button class="btn btn-outline-champagne" id="export">Export JSON Backup</button>
</div></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Select Report</h2></div><div class="card-body">
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
    ${[
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
    ].map(r=>`<button class="btn btn-secondary" style="height:120px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:16px" data-report-type="${r.id}"><strong style="font-size:1.1rem">${r.title}</strong><span class="small muted" style="margin-top:4px">${r.desc}</span></button>`).join('')}
  </div>
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Quick Summary</h2></div><div class="card-body" style="padding:0">
  ${(function(){
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
    ].map(r=>`<tr><td>${esc(r[0])}</td><td class="mono align-right">${r[1]}</td></tr>`).join(''));
  })()}
</div></div>`;
}
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
  else alert(t('CSV export not implemented for')+' '+type);
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
  else alert(t('PDF export not implemented for')+' '+type);
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
  const dateStr = fmtDate();
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
    fmtDate(s.date),
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
    fmtDate(e.date),
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
  sales.forEach(s => {(s.payments||[]).forEach(p => {if (['Cash','Card','UPI','Wallet'].includes(p.method)) {cashInflows.push({date:s.date,type:'Sale',ref:s.invoice,party:s.customerName||s.customer||'Walk-in',method:p.method,amount:num(p.amount)});} });});
  
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
    ...allInflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>[fmtDate(x.date),x.type,x.ref,x.party,x.method,num(x.amount).toFixed(2)]),
    ['','','','','',''],
    ...allOutflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>[fmtDate(x.date),x.type,x.ref,x.party,x.method,num(x.amount).toFixed(2)])
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
  
  const detailRows = sales.map(s=>`<tr><td class="mono">${fmtDate(s.date)}</td><td><code class="mono">${esc(s.invoice)}</code></td><td>${esc(s.customerName||s.customer||'Walk-in')}</td><td class="mono align-right">${(s.items||[]).reduce((sum,it)=>sum+num(it.qty),0)}</td><td class="mono align-right">${money(s.subtotal)}</td><td class="mono align-right">${money(s.discount)}</td><td class="mono align-right">${money(s.tax)}</td><td class="mono align-right"><strong>${money(s.total)}</strong></td><td>${(s.payments||[]).map(p=>`${esc(p.method)} ${money(p.amount)}`).join('<br>')}</td></tr>`).join('');
  
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
  
  const detailRows = purchases.map(t=>`<tr><td class="mono">${esc(t.date||'')}</td><td>${esc(lt(typeInfo.label||t.type))}</td><td>${esc(t.metal)}</td><td class="mono">${esc(t.purity)}</td><td class="mono align-right">${num(t.weight).toFixed(3)}</td><td class="mono align-right">${money(t.rate)}</td><td class="mono align-right">${money(t.value)}</td><td>${esc(t.karigar||'-')}</td><td><code class="mono">${esc(t.reference||'-')}</code></td><td>${esc(t.notes||'-')}</td></tr>`).join('');
  
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
  
  const detailRows = list.map(i=>`<tr><td><code class="mono">${esc(i.sku)}</code></td><td>${esc(i.name)}</td><td>${esc(i.category)}</td><td>${esc(lt(i.metalType||i.metal))}</td><td class="mono">${esc(i.purity)}</td><td class="mono align-right">${num(i.netWeight||i.weight).toFixed(3)}</td><td class="mono align-right">${money(calcItem.totalCost(i))}</td><td class="mono align-right">${money(i.sellingPrice)}</td><td class="mono align-right">${num(i.marginPercent||0).toFixed(1)}%</td><td>${esc(i.location||'-')}</td></tr>`).join('');
  
  const html = generatePDFContent('Stock Valuation Report', `As of ${fmtDate()}`, [
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
  
  const detailRows = expenses.map(e=>`<tr><td class="mono">${fmtDate(e.date)}</td><td>${esc(e.category)}</td><td class="mono align-right">${money(e.amount)}</td><td>${e.status==='paid'?'Paid':e.status==='pending'?'Pending':'Overdue'}</td><td>${esc(e.paymentMethod)}</td><td><code class="mono">${esc(e.reference||'-')}</code></td><td>${esc(e.notes||'-')}</td></tr>`).join('');
  
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
  sales.forEach(s => {(s.payments||[]).forEach(p => {if (['Cash','Card','UPI','Wallet'].includes(p.method)) {cashInflows.push({date:s.date,type:'Sale',ref:s.invoice,party:s.customerName||s.customer||'Walk-in',method:p.method,amount:num(p.amount)});} });});
  
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
  
  const inRows = allInflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<tr><td class="mono">${fmtDate(x.date)}</td><td>${esc(x.type)}</td><td><code class="mono">${esc(x.ref)}</code></td><td>${esc(x.party)}</td><td>${esc(x.method)}</td><td class="mono align-right">${money(x.amount)}</td></tr>`).join('');
  const outRows = allOutflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<tr><td class="mono">${fmtDate(x.date)}</td><td>${esc(x.type)}</td><td><code class="mono">${esc(x.ref)}</code></td><td>${esc(x.party)}</td><td>${esc(x.method)}</td><td class="mono align-right">${money(x.amount)}</td></tr>`).join('');
  
  const html = generatePDFContent('Daily Cash Report', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Summary', html: `<table><tr><th>Metric</th><th class="align-right mono">Value</th></tr><tr><td>Total Inflows</td><td class="align-right mono">${money(totalIn)}</td></tr><tr><td>Total Outflows</td><td class="align-right mono">${money(totalOut)}</td></tr><tr><td><strong>Net Cash Flow</strong></td><td class="align-right mono ${netCash>=0?'':'text-danger'}"><strong>${money(netCash)}</strong></td></tr></table>`},
    {title: 'Cash Inflows', html: `<table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Party</th><th>Method</th><th class="align-right mono">Amount</th></tr></thead><tbody>${inRows||'<tr><td colspan="6" class="align-center">No inflows</td></tr>'}</tbody></table>`},
    {title: 'Cash Outflows', html: `<table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Party</th><th>Method</th><th class="align-right mono">Amount</th></tr></thead><tbody>${outRows||'<tr><td colspan="6" class="align-center">No outflows</td></tr>'}</tbody></table>`}
  ]);
  download('cash-report-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}function rateSyncCard(){
  const cfg=rateSyncSettings();
  return `<div class="card section" id="rateSyncCard"><div class="card-header"><h2 class="card-title">${t('Daily Rate Sync')}</h2></div><div class="card-body">
<form id="rateSyncForm" class="form">
${select('rateSyncEnabled','Auto Sync',[{value:'yes',label:t('Yes')},{value:'no',label:t('No')}],cfg.enabled?'yes':'no')}
${input('rateSyncUrl','Rate Source URL (JSON)','url',cfg.url,'placeholder="https://example.com/rates.json"')}
${input('rateSyncGoldPath','Gold Field Path','text',cfg.goldPath)}
${input('rateSyncSilverPath','Silver Field Path','text',cfg.silverPath)}
${select('rateSyncUnit','Source Unit',[{value:'tola',label:'Per Tola'},{value:'gram',label:'Per Gram'},{value:'10gram',label:'Per 10 Gram'}],cfg.unit)}
<div class="field-full" style="display:flex;gap:var(--space-2);flex-wrap:wrap"><button class="btn btn-champagne" type="submit">${t('Save')}</button><button class="btn btn-secondary" type="button" data-rate-sync>${icon('refresh')}<span>${t('Sync Now')}</span></button></div>
</form>
<p class="small muted" style="margin-top:var(--space-2)">${cfg.lastSync?`${t('Last sync')}: ${fmtDateTime(cfg.lastSync)} · ${esc(cfg.lastMessage||'')}`:t('No rate source configured. Enter a JSON endpoint you are licensed to use.')}</p>
</div></div>`;
}

function regionalProfileCard(){
  return `<div class="card section" id="regionalProfile"><div class="card-header"><h2 class="card-title">${t('Regional Profile')}</h2></div><div class="card-body"><div class="detail-grid">
<div><span class="muted">${t('Country')}</span><div><strong>${esc(t(countryProfile().name))}</strong></div></div>
<div><span class="muted">${t('Currency')}</span><div class="mono">${money(1234567.89)}</div></div>
<div><span class="muted">${t('Tax')}</span><div>${esc(t(state.settings.taxLabel))} ${num(state.settings.taxRate)}% ${state.settings.taxInclusive?`(${t('inclusive')})`:`(${t('exclusive')})`}</div></div>
<div><span class="muted">${t('Date Format')}</span><div class="mono">${esc(countryProfile().dateFormat)} · ${fmtDate(new Date())}</div></div>
<div><span class="muted">${t('Calendar')}</span><div>${state.settings.calendar==='bs'?t('Bikram Sambat (BS)'):state.settings.calendar==='both'?t('BS + AD'):t('Gregorian (AD)')}</div></div>
<div><span class="muted">${t('VAT / PAN Number')}</span><div class="mono">${esc(state.settings.vatNumber||'-')}</div></div>
<div><span class="muted">${t('Weight Unit')}</span><div>${esc(t(state.settings.weightUnit||countryProfile().weightUnit))}</div></div>
<div><span class="muted">${t('Fiscal Year')}</span><div>${esc(t(countryProfile().fiscalYearStart))}</div></div>
<div><span class="muted">${t('Dial Code')}</span><div class="mono">${esc(state.settings.dial||countryProfile().dial)}</div></div>
<div><span class="muted">${t('Language')}</span><div>${esc(LOCALES[getLanguage()]?.native||getLanguage())}</div></div>
</div></div></div>`;
}

function settings(){
  const isAdmin = window.RatnaOS?.auth?.hasPermission('settings:backup');
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.settings[0]}</h1><p class="page-subtitle">${PAGE_TITLES.settings[1]}</p></div></div></div>
<div class="layout"><div><div class="card"><div class="card-header"><h2 class="card-title">Shop Settings</h2></div><div class="card-body"><form id="settings" class="form">${input('shop','Shop Name','text',state.settings.shop)}${select('language','Language',LANGUAGE_OPTIONS,state.settings.language||getLanguage())}${select('country','Country',COUNTRY_OPTIONS,state.settings.country||getCountry())}${input('currency','Currency Code','text',state.settings.currency)}${input('taxRate','Tax Rate %','number',state.settings.taxRate,'min="0" step="0.01"')}${input('taxLabel','Tax Label','text',state.settings.taxLabel||'VAT')}${select('weightUnit','Weight Unit',[{value:'gram',label:'Gram (g)'},{value:'tola',label:'Tola'},{value:'aana',label:'Aana'},{value:'ratti',label:'Ratti'}],state.settings.weightUnit||'gram')}${input('invoicePrefix','Invoice Prefix','text',state.settings.invoicePrefix||'INV')}<div class="field"><label class="field-label" for="taxInclusive">${t('Tax Inclusive Pricing')}</label><select class="field-select" id="taxInclusive" name="taxInclusive"><option value="yes" ${state.settings.taxInclusive?'selected':''}>${t('Yes')}</option><option value="no" ${state.settings.taxInclusive?'':'selected'}>${t('No')}</option></select></div>${input('dial','Country Dial Code','text',state.settings.dial||countryProfile().dial)}${input('vatNumber','VAT / PAN Number','text',state.settings.vatNumber||'')}${select('numeralStyle','Digits',[{value:'devanagari',label:'Devanagari (१२३)'},{value:'latin',label:'Latin (123)'}],state.settings.numeralStyle||'devanagari')}${select('calendar','Calendar',[{value:'bs',label:'Bikram Sambat (BS)'},{value:'ad',label:'Gregorian (AD)'},{value:'both',label:'BS + AD'}],state.settings.calendar||countryProfile().calendar||'ad')}<div class="field-full"><button class="btn btn-champagne" type="submit">${t('Save Settings')}</button></div></form></div></div>
${regionalProfileCard()}
${rateSyncCard()}
${confirmationCard()}

${isAdmin ? `
<div class="card section"><div class="card-header"><h2 class="card-title">Backup & Restore</h2></div><div class="card-body">
<div class="detail-grid">
<div><span class="muted">Auto-Backup</span><div><span class="badge badge-completed">Enabled (hourly)</span></div></div>
<div><span class="muted">Max Backups</span><div class="mono">50</div></div>
<div><span class="muted">Last Backup</span><div id="lastBackupTime" class="mono">Checking...</div></div>
</div>
<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
<button class="btn btn-champagne" data-backup-create>Create Backup Now</button>
<button class="btn btn-secondary" data-backup-list>View Backups</button>
<button class="btn btn-outline-champagne" data-backup-export>Export All Backups</button>
</div>
<div id="backupListModal" style="display:none;margin-top:16px"></div>
</div></div>
` : ''}
<div><div class="card"><div class="card-header"><h2 class="card-title">About</h2></div><div class="card-body"><p style="font-family:'Playfair Display',serif;font-size:1.4rem;color:var(--gold-primary);margin:0 0 8px">RatnaOS</p><p class="muted">${t('Local-first pilot. Data stored in browser localStorage. Karigar/Production jobs record metal issue/return/wastage transactions that automatically update metal ledger balances.')}</p></div></div></div></div>`;
}

// Backup Management Functions
function showBackupList() {
  const container = document.getElementById('backupListModal');
  if (!container) return;
  const backups = window.RatnaOS.backup.list();
  if (!backups.length) {
    container.style.display = 'block';
    container.innerHTML = '<p class="muted">No backups found</p>';
    return;
  }
  container.style.display = 'block';
  container.innerHTML = `
    <h4 style="margin-bottom:12px">Available Backups (${backups.length})</h4>
    <div style="max-height:300px;overflow:auto">
      ${backups.map(b => `
        <div class="card" style="margin-bottom:8px;padding:12px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="mono">${esc(b.id)}</div>
            <div class="small muted">${fmtDateTime(b.timestamp)} · ${esc(b.type)} · ${(b.size/1024).toFixed(1)} KB</div>
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-secondary btn-sm" data-backup-restore="${esc(b.id)}">Restore</button>
            <button class="btn btn-ghost btn-sm" data-backup-delete="${esc(b.id)}">Delete</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function exportAllBackups() {
  const backups = window.RatnaOS.backup.list();
  if (!backups.length) return window.RatnaOS.showNotification('No backups to export', 'warning');
  const data = JSON.stringify(backups, null, 2);
  download('ratnaos-all-backups-'+new Date().toISOString().slice(0,10)+'.json', data, 'application/json');
  window.RatnaOS.showNotification('All backups exported', 'success');
}

// Full-page Login Screen
function renderLoginPage() {
  document.querySelector('#app').innerHTML = `
    <div class="login-page">
      <div class="login-container">
        <div class="login-brand">
          <div class="login-logo">${icon('gem')}</div>
          <h1 class="login-title">RatnaOS</h1>
          <div class="lang-switch" role="group" aria-label="${esc(t('Language'))}" style="margin-top:8px">${[['en','EN'],['ne','ने'],['hi','हि']].map(([code,label])=>`<button type="button" class="lang-btn ${getLanguage()===code?'active':''}" data-lang-set="${code}" aria-pressed="${getLanguage()===code?'true':'false'}" title="${esc(LOCALES[code]?.native||label)}">${label}</button>`).join('')}</div>
          <p class="login-subtitle">${t('Jewellery Control System')}</p>
        </div>
        <div class="login-card">
          <h2 class="login-heading">${t('Sign in to your account')}</h2>
          <form id="loginForm" class="login-form">
            <div class="field">
              <label class="field-label" for="username">${t('Username')}</label>
              <div class="field-with-icon">
                ${icon('user')}
                <input class="field-input" id="username" name="username" type="text" required autocomplete="username" placeholder="admin, manager, sales, production, accountant, viewer">
              </div>
            </div>
            <div class="field">
              <label class="field-label" for="password">${t('Password')}</label>
              <div class="field-with-icon">
                ${icon('lock')}
                <input class="field-input" id="password" name="password" type="password" required autocomplete="current-password" placeholder="Default: [role]123">
              </div>
            </div>
            <div id="loginError" class="login-error" style="display:none"></div>
            <button class="btn btn-champagne btn-block login-submit" type="submit">${icon('logout')}<span>${t('Sign In')}</span></button>
          </form>
          <div class="login-demo">
            <p class="small muted">${t('Demo Credentials')}</p>
            <div class="demo-accounts">
              <button type="button" class="demo-btn" data-user="admin" data-pass="admin123">${t('Admin')}</button>
              <button type="button" class="demo-btn" data-user="manager" data-pass="manager123">${t('Manager')}</button>
              <button type="button" class="demo-btn" data-user="sales" data-pass="sales123">${t('Sales')}</button>
              <button type="button" class="demo-btn" data-user="production" data-pass="prod123">${t('Production')}</button>
              <button type="button" class="demo-btn" data-user="accountant" data-pass="account123">${t('Accountant')}</button>
              <button type="button" class="demo-btn" data-user="viewer" data-pass="viewer123">${t('Viewer')}</button>
            </div>
            <p class="small muted" style="margin-top:12px">${t('Click any button to auto-fill credentials')}</p>
          </div>
        </div>
        <p class="login-footer">${t('Pilot Build')} · ${t('Local browser storage only')}</p>
      </div>
    </div>
  `;

  localizeDom(document.querySelector('#app'));

  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = form.username.value.trim();
    const password = form.password.value;

    try {
      const result = window.RatnaOS.auth.login(username, password);
      if (result.success) {
        if (result.mustChangePassword) {
          showChangePasswordModal(username);
        } else {
          render();
        }
      } else {
        errorEl.textContent = result.error || 'Login failed';
        errorEl.style.display = 'block';
        form.password.value = '';
      }
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    }
  });

  // Demo account quick-fill buttons
  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      form.username.value = btn.dataset.user;
      form.password.value = btn.dataset.pass;
    });
  });

  // Focus username field
  setTimeout(() => form.username.focus(), 100);
}

function showChangePasswordModal(username) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <h3 class="modal-title">Change Password Required</h3>
      </div>
      <div class="modal-body">
        <form id="changePassForm">
          <p class="small muted">Please change your default password. Enter your current password to verify.</p>
          <div class="field">
            <label class="field-label">Current Password</label>
            <input class="field-input" name="currentPassword" type="password" required placeholder="Your current password">
          </div>
          <div class="field">
            <label class="field-label">New Password</label>
            <input class="field-input" name="newPassword" type="password" required minlength="8" placeholder="At least 8 characters">
          </div>
          <div class="field">
            <label class="field-label">Confirm New Password</label>
            <input class="field-input" name="confirmPassword" type="password" required placeholder="Confirm new password">
          </div>
          <div id="changePassError" class="small text-danger" style="margin-bottom:12px;display:none"></div>
          <div class="field-full" style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-champagne" type="submit">Update Password</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#changePassForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const currentPass = form.currentPassword.value;
    const newPass = form.newPassword.value;
    const confirmPass = form.confirmPassword.value;
    const errorEl = modal.querySelector('#changePassError');

    if (newPass !== confirmPass) {
      errorEl.textContent = 'Passwords do not match';
      errorEl.style.display = 'block';
      return;
    }
    if (newPass.length < 8) {
      errorEl.textContent = 'Password must be at least 8 characters';
      errorEl.style.display = 'block';
      return;
    }

    const result = window.RatnaOS.auth.changePassword(username, currentPass, newPass);
    if (result.success) {
      modal.remove();
      window.RatnaOS.showNotification('Password updated successfully', 'success');
      render();
    } else {
      errorEl.textContent = result.error || 'Failed to change password';
      errorEl.style.display = 'block';
    }
  });

  setTimeout(() => modal.querySelector('input[name="currentPassword"]')?.focus(), 100);
}


// ── Jewellery Knowledge Center ──────────────────────────────────────────────
const kcUI={tab:'catalogue',query:'',type:'mass',from:'tola',to:'gram',value:'1',ringSystem:'us',ringSize:'7'};
const kcLang=()=>{const l=getLanguage();return l==='ne'||l==='hi'?l:'en';};
const kcName=rec=>rec&&(rec[kcLang()]||rec.en)||'';
const kcDflt=type=>{
  if(type==='mass') return {from:'tola',to:'gram'};
  if(type==='stone-mass') return {from:'carat',to:'point'};
  if(type==='length') return {from:'inch',to:'millimeter'};
  if(type==='purity') return {from:'karat',to:'fineness'};
  if(type==='count') return {from:'piece',to:'piece'};
  return {from:'tola',to:'gram'};
};
function kcBadge(text,variant=''){return `<span class="badge ${variant}">${esc(text)}</span>`;}
function kcUnitOptions(type){
  return KC_UNITS.filter(u=>u.type===type).map(u=>`<option value="${esc(u.id)}" ${u.id===kcUI.from?'selected':''}>${esc(kcName(u))} (${esc(u.abbr)})</option>`).join('');
}
function kcUnitOptionsTo(type){
  return KC_UNITS.filter(u=>u.type===type).map(u=>`<option value="${esc(u.id)}" ${u.id===kcUI.to?'selected':''}>${esc(kcName(u))} (${esc(u.abbr)})</option>`).join('');
}
function kcConvertResult(){
  const res=convertRounded(kcUI.value,kcUI.from,kcUI.to);
  if(!res.ok){
    const msg=res.error==='type-mismatch'?t('Cannot convert between different measurement types'):res.error==='unknown-unit'?t('Unknown unit'):t('Enter a valid number');
    return `<span class="muted">${esc(msg)}</span>`;
  }
  const from=UNIT_BY_ID[kcUI.from], to=res.unit;
  const digits=new Intl.NumberFormat(kcLang()==='ne'?'ne-NP':kcLang()==='hi'?'hi-IN':'en-US',{maximumFractionDigits:Math.min(res.precision||2,6)}).format(res.value);
  return `<span class="mono" style="font-size:var(--fs-lg);font-weight:600">${esc(String(kcUI.value))} ${esc(kcName(from))}</span> <span class="muted">=</span> <strong class="mono" style="font-size:var(--fs-xl);color:var(--text-accent)">${esc(digits)} ${esc(kcName(to))}</strong>`;
}
function kcSearchResults(q){
  const results=searchKnowledge(q,kcLang());
  if(!results.length) return `<div class="empty" style="padding:24px"><p class="empty-title">${esc(t('No results'))}</p><p class="empty-message">${esc(t('Search categories, units, metals and terms'))}</p></div>`;
  const head=`<div class="small muted" style="margin-bottom:8px">${esc(t('Results'))}: ${results.length}</div>`;
  return head+results.map(r=>`
    <div class="card" style="margin-bottom:10px;padding:12px 14px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div><div style="font-weight:600">${esc(r.title)}</div><div class="small muted">${esc(r.subtitle)}</div>${r.note?`<div class="small" style="color:var(--text-warning,#b45309);margin-top:4px">${esc(r.note)}</div>`:''}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${kcBadge(t(r.meta)||r.meta)}${r.region?kcBadge(r.region,'badge-info') : ''}${r.needsVerification?kcBadge(t('Needs Verification'),'badge-warn') : ''}</div>
      </div>
    </div>`).join('');
}

const acctUI={tab:'overview',account:'1000',book:'day',voucherQuery:'',fyId:''};
function acctCanPost(){return !!(window.RatnaOS?.auth?.hasPermission?.('accounting:post'));}
function acctMoney(minor){return money(fromMinor(Number(minor)||0));}
function acctTabs(){
  const tabs=[['overview','Overview'],['vouchers','Vouchers'],['books','Books'],['coa','Chart of Accounts'],['trial','Trial Balance'],['journal','Journal'],['ledger','Ledger'],['opening','Opening Balances'],['years','Year Close'],['jewellery','Jewellery Accounting']];
  return tabs.map(([key,label])=>`<button class="tab ${acctUI.tab===key?'active':''}" data-acct-tab="${key}">${esc(t(label))}</button>`).join('');
}
function accountingOverview(){
  const summary=accountingSummary(state);
  const unposted={
    sales:(state.sales||[]).filter(s=>!state.accounting.journals.some(j=>j.sourceType==='sale'&&j.sourceId===s.id)).length,
    expenses:(state.expenses||[]).filter(e=>e.status!=='cancelled'&&!state.accounting.journals.some(j=>j.sourceType==='expense'&&j.sourceId===e.id)).length,
    metal:(state.metalManagement?.transactions||[]).filter(x=>x.posted!==false&&num(x.value)>0&&!state.accounting.journals.some(j=>j.sourceType==='metal'&&j.sourceId===x.id)).length
  };
  const recent=[...state.accounting.journals].sort((a,b)=>(b.postedAt||'').localeCompare(a.postedAt||'')).slice(0,8);
  return `<div class="metric-grid">
    ${card('Posted Journals', summary.journals, t('Double-entry'),'reports')}
    ${card('Total Debits', acctMoney(summary.debit), t('Minor units exact'),'scale')}
    ${card('Total Credits', acctMoney(summary.credit), t('Must match debits'),'scale')}
    ${card('Ledger Difference', acctMoney(summary.difference), summary.balanced?t('Balanced'):t('Unbalanced'),'check')}
  </div>
  <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Accounting Posting'))}</h2>${summary.balanced?kcBadge(t('Balanced'),'badge-completed'):kcBadge(t('Unbalanced'),'badge-warn')}</div><div class="card-body">
    <p class="small muted">${esc(t('Existing sales, paid expenses and valued metal transactions are posted once. Duplicate sources are skipped.'))}</p>
    <div class="detail-grid" style="margin-top:10px">
      <div><span class="muted">${esc(t('Unposted sales'))}</span><div class="mono">${unposted.sales}</div></div>
      <div><span class="muted">${esc(t('Unposted expenses'))}</span><div class="mono">${unposted.expenses}</div></div>
      <div><span class="muted">${esc(t('Unposted metal'))}</span><div class="mono">${unposted.metal}</div></div>
      <div><span class="muted">${esc(t('Reversed journals'))}</span><div class="mono">${summary.reversed}</div></div>
    </div>
    ${acctCanPost()?`<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-champagne" data-acct-backfill>${icon('refresh')}<span>${esc(t('Post existing transactions'))}</span></button></div>`:''}
  </div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Recent Journals'))}</h2></div><div class="card-body" style="padding:0">${rows(['Number','Date','Source','Memo','Debit','Credit','Status'],recent.map(j=>`<tr><td class="mono">${esc(j.no)}</td><td class="mono">${esc(j.date)}</td><td>${esc(t(j.sourceType))}</td><td class="small">${esc(j.memo||'')}</td><td class="mono align-right">${acctMoney(j.debit)}</td><td class="mono align-right">${acctMoney(j.credit)}</td><td>${j.status==='reversed'?kcBadge(t('Reversed'),'badge-warn'):kcBadge(t('Posted'),'badge-completed')}</td></tr>`).join(''))}</div></div>
  <p class="note">${esc(t('Every posted journal is balanced in integer paisa. Corrections must use reversal entries; posted journals are never silently edited.'))}</p>`;
}
function accountingTrial(){
  const tb=trialBalance(state);
  const body=tb.rows.map(r=>{const acct=state.accounting.accounts.find(a=>a.code===r.account); return `<tr><td class="mono">${esc(r.account)}</td><td>${esc(t(acct?.name||r.account))}</td><td class="mono align-right">${r.balance>0?acctMoney(r.balance):''}</td><td class="mono align-right">${r.balance<0?acctMoney(-r.balance):''}</td></tr>`;}).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Trial Balance'))}</h2>${tb.balanced?kcBadge(t('Balanced'),'badge-completed'):kcBadge(t('Unbalanced'),'badge-warn')}</div><div class="card-body" style="padding:0">${rows(['Code','Account','Debit','Credit'],body)}</div>
  <div class="card-body" style="border-top:1px solid var(--border-subtle);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><span class="small muted">${esc(t('Totals'))}</span><span class="mono">${acctMoney(tb.debit)} / ${acctMoney(tb.credit)}</span></div></div>
  <p class="note ${tb.balanced?'':'note-caution'}">${esc(t('Trial balance is calculated from posted lines only. Difference must be zero.'))}</p>`;
}
function accountingJournal(){
  const journals=[...state.accounting.journals].sort((a,b)=>b.date.localeCompare(a.date)||b.no.localeCompare(a.no)).slice(0,200);
  const body=journals.map(j=>`<tr><td class="mono">${esc(j.no)}</td><td class="mono">${esc(j.date)}</td><td>${esc(t(j.sourceType))}</td><td class="small">${esc(j.memo||'')}</td><td class="mono align-right">${acctMoney(j.debit)}</td><td>${j.status==='reversed'?kcBadge(t('Reversed'),'badge-warn'):kcBadge(t('Posted'),'badge-completed')}</td><td class="align-right">${acctCanPost()&&j.status!=='reversed'?`<button type="button" class="btn btn-ghost btn-sm" data-acct-reverse="${esc(j.id)}">${esc(t('Reverse'))}</button>`:''}</td></tr>`).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Journal Register'))}</h2><span class="badge">${journals.length}</span></div><div class="card-body" style="padding:0">${rows(['Number','Date','Source','Memo','Amount','Status',''],body)}</div></div>`;
}
function accountingLedgerView(){
  const options=state.accounting.accounts.map(a=>`<option value="${esc(a.code)}" ${a.code===acctUI.account?'selected':''}>${esc(a.code)} — ${esc(t(a.name))}</option>`).join('');
  const led=accountLedger(state,acctUI.account);
  const body=led.map(r=>`<tr><td class="mono">${esc(r.date)}</td><td class="mono">${esc(r.no)}</td><td class="small">${esc(r.memo||'')}</td><td class="mono align-right">${r.debit?acctMoney(r.debit):''}</td><td class="mono align-right">${r.credit?acctMoney(r.credit):''}</td><td class="mono align-right">${acctMoney(r.balance)}</td></tr>`).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('General Ledger'))}</h2></div><div class="card-body"><div class="field" style="max-width:420px"><label class="field-label" for="acctLedgerSelect">${esc(t('Account'))}</label><select class="field-select" id="acctLedgerSelect">${options}</select></div></div><div class="card-body" style="padding:0">${rows(['Date','Journal','Memo','Debit','Credit','Balance'],body)}</div></div>`;
}
function acctAccountOptions(selected){
  return accountsForEntry(state).sort((a,b)=>a.code.localeCompare(b.code)).map(a=>`<option value="${esc(a.code)}" ${a.code===selected?'selected':''}>${esc(a.code)} — ${esc(t(a.name))}</option>`).join('');
}
function openVoucherModal(){
  const modal=document.createElement('div'); modal.className='modal-overlay';
  const line=(d='',c='')=>`<div class="vch-line" style="display:grid;grid-template-columns:minmax(150px,2fr) minmax(80px,1fr) minmax(80px,1fr) minmax(110px,1.5fr) auto;gap:6px;margin-bottom:6px"><select class="field-select" name="vchAccount">${acctAccountOptions()}</select><input class="field-input" name="vchDebit" type="number" min="0" step="0.01" value="${d}" placeholder="Debit"><input class="field-input" name="vchCredit" type="number" min="0" step="0.01" value="${c}" placeholder="Credit"><input class="field-input" name="vchLineMemo" placeholder="Line memo"><button type="button" class="btn btn-ghost btn-sm" data-vch-del>×</button></div>`;
  modal.innerHTML=`<div class="modal" style="max-width:820px"><div class="modal-header"><h3 class="modal-title">${esc(t('New Voucher'))}</h3><button class="modal-close" data-close-modal>×</button></div><div class="modal-body">
    <div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
      <div class="field"><label class="field-label" for="vchType">${esc(t('Voucher type'))}</label><select class="field-select" id="vchType">${['Receipt','Payment','Journal','Contra'].map(x=>`<option value="${x}">${esc(t(x))}</option>`).join('')}</select></div>
      <div class="field"><label class="field-label" for="vchDate">${esc(t('Date'))}</label><input class="field-input" id="vchDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="field"><label class="field-label" for="vchRef">${esc(t('Reference'))}</label><input class="field-input" id="vchRef" placeholder="Voucher / cheque no."></div>
      <div class="field"><label class="field-label" for="vchMemo">${esc(t('Memo'))}</label><input class="field-input" id="vchMemo" placeholder="${esc(t('Description'))}"></div>
    </div>
    <div style="margin-top:12px" id="vchLines">${line()}${line()}</div>
    <button type="button" class="btn btn-secondary btn-sm" data-vch-add>${icon('plus')}<span>${esc(t('Add line'))}</span></button>
    <p class="small muted" style="margin-top:10px">${esc(t('Debit and credit totals must match. Unbalanced vouchers are rejected.'))}</p>
  </div><div class="modal-footer"><button type="button" class="btn btn-champagne" data-acct-save-voucher>${esc(t('Post voucher'))}</button><button type="button" class="btn btn-ghost" data-close-modal>${esc(t('Cancel'))}</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>modal.remove()));
  modal.addEventListener('click',ev=>{
    if(ev.target===modal){modal.remove();return;}
    if(ev.target.closest('[data-vch-add]')){document.getElementById('vchLines')?.insertAdjacentHTML('beforeend',line());}
    if(ev.target.closest('[data-vch-del]')){if(document.querySelectorAll('.vch-line').length>2) ev.target.closest('.vch-line').remove();}
  });
}
function accountingVouchers(){
  const q=(acctUI.voucherQuery||'').toLowerCase();
  const list=voucherRegister(state).filter(j=>!q||[j.no,j.reference,j.memo,j.voucherType].join(' ').toLowerCase().includes(q));
  const body=list.map(j=>`<tr><td class="mono">${esc(j.no)}</td><td>${esc(t(j.voucherType||'Journal'))}</td><td class="mono">${esc(j.date)}</td><td>${esc(j.reference||'')}</td><td class="small">${esc(j.memo||'')}</td><td class="mono align-right">${acctMoney(j.debit)}</td><td>${j.status==='reversed'?kcBadge(t('Reversed'),'badge-warn'):kcBadge(t('Posted'),'badge-completed')}</td><td class="align-right">${acctCanPost()&&j.status!=='reversed'?`<button type="button" class="btn btn-ghost btn-sm" data-acct-reverse="${esc(j.id)}">${esc(t('Reverse'))}</button>`:''}</td></tr>`).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Voucher Register'))}</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><input class="field-input" id="acctVoucherSearch" type="search" placeholder="${esc(t('Search vouchers'))}" value="${esc(acctUI.voucherQuery||'')}" style="max-width:220px">${acctCanPost()?`<button type="button" class="btn btn-champagne btn-sm" data-acct-new-voucher>${icon('plus')}<span>${esc(t('New Voucher'))}</span></button>`:''}</div></div><div class="card-body" style="padding:0">${rows(['Number','Type','Date','Reference','Memo','Amount','Status',''],body)}</div></div>
  <p class="note">${esc(t('Voucher corrections must use reversal entries; posted vouchers are never edited.'))}</p>`;
}
function accountingBooks(){
  const book=acctUI.book||'day';
  const range=state.accounting.currentRange||null;
  const tab=(key,label)=>`<button class="tab ${book===key?'active':''}" data-acct-book="${key}">${esc(t(label))}</button>`;
  let body='';
  if(book==='day'){
    const list=[...state.accounting.journals].sort((a,b)=>b.date.localeCompare(a.date)||b.no.localeCompare(a.no));
    body=`<div class="card-body" style="padding:0">${rows(['Date','Journal','Source','Memo','Debit','Credit'],list.map(j=>`<tr><td class="mono">${esc(j.date)}</td><td class="mono">${esc(j.no)}</td><td>${esc(t(j.sourceType))}${j.voucherType?' / '+esc(t(j.voucherType)):''}</td><td class="small">${esc(j.memo||'')}</td><td class="mono align-right">${acctMoney(j.debit)}</td><td class="mono align-right">${acctMoney(j.credit)}</td></tr>`).join(''))}</div>`;
  } else {
    const code=book==='cash'?'1000':'1010';
    const rowsBook=cashBook(state,code,range);
    const totalIn=rowsBook.reduce((s,r)=>s+r.debit,0);
    const totalOut=rowsBook.reduce((s,r)=>s+r.credit,0);
    body=`<div class="card-body" style="padding:0">${rows(['Date','Journal','Memo','Receipt','Payment','Balance'],rowsBook.map(r=>`<tr><td class="mono">${esc(r.date)}</td><td class="mono">${esc(r.no)}</td><td class="small">${esc(r.memo||'')}</td><td class="mono align-right">${r.debit?acctMoney(r.debit):''}</td><td class="mono align-right">${r.credit?acctMoney(r.credit):''}</td><td class="mono align-right">${acctMoney(r.balance)}</td></tr>`).join(''))}</div><div class="card-body" style="border-top:1px solid var(--border-subtle);display:flex;gap:18px;flex-wrap:wrap;justify-content:flex-end"><span class="small muted">${esc(t('Total in'))}: <strong class="mono">${acctMoney(totalIn)}</strong></span><span class="small muted">${esc(t('Total out'))}: <strong class="mono">${acctMoney(totalOut)}</strong></span><span class="small muted">${esc(t('Closing balance'))}: <strong class="mono">${acctMoney(totalIn-totalOut)}</strong></span></div>`;
  }
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Books'))}</h2></div><div class="card-body"><div class="tabs" style="margin:0 0 12px">${tab('day','Day Book')}${tab('cash','Cash Book')}${tab('bank','Bank Book')}</div></div>${body}</div>`;
}
function accountingOpening(){
  const accounts=accountsForEntry(state).filter(a=>['asset','liability','equity'].includes(a.type)&&!a.archived);
  const posted=state.accounting.journals.filter(j=>j.sourceType==='opening');
  const fy=acctUI.fyId?fiscalYearById(state,acctUI.fyId):state.accounting.fiscalYears[0];
  const date=fy?fy.start:new Date().toISOString().slice(0,10);
  const fyOpts=state.accounting.fiscalYears.map(f=>`<option value="${esc(f.id)}" ${fy&&fy.id===f.id?'selected':''}>${esc(f.label)} (${esc(f.start)} → ${esc(f.end)})</option>`).join('');
  const body=accounts.map(a=>`<tr><td class="mono">${esc(a.code)}</td><td>${esc(t(a.name))}</td><td>${kcBadge(t(a.type),'badge-info')}</td><td><input class="field-input ob-input" data-code="${esc(a.code)}" data-side="debit" type="number" step="0.01" min="0" placeholder="0.00" style="max-width:140px"></td><td><input class="field-input ob-input" data-code="${esc(a.code)}" data-side="credit" type="number" step="0.01" min="0" placeholder="0.00" style="max-width:140px"></td></tr>`).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Opening Balances'))}</h2>${posted.length?kcBadge(t('Posted'),'badge-completed'):kcBadge(t('Not posted'),'badge-warn')}</div><div class="card-body">
    <div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:12px">
      <div class="field"><label class="field-label" for="obDate">${esc(t('Opening date'))}</label><input class="field-input" id="obDate" type="date" value="${esc(date)}"></div>
      <div class="field"><label class="field-label" for="obFy">${esc(t('Fiscal year'))}</label><select class="field-select" id="obFy">${fyOpts||`<option value="">${esc(t('Create a fiscal year first'))}</option>`}</select></div>
    </div>
    <div class="table-wrap"><table class="table"><thead><tr><th>${esc(t('Code'))}</th><th>${esc(t('Account'))}</th><th>${esc(t('Type'))}</th><th>${esc(t('Debit'))}</th><th>${esc(t('Credit'))}</th></tr></thead><tbody>${body}</tbody></table></div>
    <p class="small muted" style="margin-top:10px">${esc(t('The difference is posted to Opening Balance Equity automatically.'))}</p>
    ${acctCanPost()?`<button type="button" class="btn btn-champagne" data-acct-opening-save style="margin-top:10px">${icon('check')}<span>${esc(t('Post opening balances'))}</span></button>`:''}
  </div></div>
  ${posted.length?`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Opening Journals'))}</h2></div><div class="card-body" style="padding:0">${rows(['Date','Journal','Memo','Amount'],posted.map(j=>`<tr><td class="mono">${esc(j.date)}</td><td class="mono">${esc(j.no)}</td><td>${esc(j.memo||'')}</td><td class="mono align-right">${acctMoney(j.debit)}</td></tr>`).join(''))}</div></div>`:''}`;
}
function accountingYears(){
  const years=[...state.accounting.fiscalYears].sort((a,b)=>b.start.localeCompare(a.start));
  const body=years.map(f=>`<tr><td><strong>${esc(f.label)}</strong></td><td class="mono">${esc(f.start)}</td><td class="mono">${esc(f.end)}</td><td>${f.status==='closed'?kcBadge(t('Closed'),'badge-warn'):kcBadge(t('Open'),'badge-completed')}</td><td class="mono align-right">${f.netResult!=null?acctMoney(f.netResult):''}</td><td class="align-right">${acctCanPost()?(f.status==='open'?`<button type="button" class="btn btn-ghost btn-sm" data-acct-close-fy="${esc(f.id)}">${esc(t('Close year'))}</button>`:`<button type="button" class="btn btn-ghost btn-sm" data-acct-reopen-fy="${esc(f.id)}">${esc(t('Reopen'))}</button>`):''}</td></tr>`).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Fiscal Years'))}</h2></div><div class="card-body">
    <div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
      <div class="field"><label class="field-label" for="fyLabel">${esc(t('Label'))}</label><input class="field-input" id="fyLabel" placeholder="FY 2083/84"></div>
      <div class="field"><label class="field-label" for="fyStart">${esc(t('Start date'))}</label><input class="field-input" id="fyStart" type="date"></div>
      <div class="field"><label class="field-label" for="fyEnd">${esc(t('End date'))}</label><input class="field-input" id="fyEnd" type="date"></div>
      <div class="field" style="align-self:end">${acctCanPost()?`<button type="button" class="btn btn-secondary" data-acct-add-fy>${icon('plus')}<span>${esc(t('Add fiscal year'))}</span></button>`:''}</div>
    </div>
  </div><div class="card-body" style="padding:0">${rows(['Fiscal Year','Start','End','Status','Net result',''],body)}</div></div>
  <p class="note note-caution">${esc(t('Closing transfers income and expense balances to Retained Earnings and locks the period. Reopen creates a reversal and is audited.'))}</p>`;
}
function accountingCoa(){
  const body=[...state.accounting.accounts].sort((a,b)=>a.code.localeCompare(b.code)).map(a=>`<tr><td class="mono">${esc(a.code)}</td><td>${esc(t(a.name))}${a.archived?' '+kcBadge(t('Archived'),'badge-warn'):''}</td><td>${kcBadge(t(a.type),'badge-info')}</td><td class="small muted">${esc(t(a.normal==='debit'?'Debit':'Credit'))}</td><td class="align-right">${acctCanPost()&&!a.system?`<button type="button" class="btn btn-ghost btn-sm" data-acct-rename="${esc(a.code)}">${esc(t('Edit'))}</button><button type="button" class="btn btn-ghost btn-sm" data-acct-archive="${esc(a.code)}">${a.archived?esc(t('Restore')):esc(t('Archive'))}</button>`:''}</td></tr>`).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Chart of Accounts'))}</h2><span class="badge">${state.accounting.accounts.length}</span></div><div class="card-body" style="padding:0">${rows(['Code','Account','Type','Normal balance',''],body)}</div></div>
  ${acctCanPost()?`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Add Account'))}</h2></div><div class="card-body"><div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
    <div class="field"><label class="field-label" for="coaCode">${esc(t('Code'))}</label><input class="field-input" id="coaCode" placeholder="1999"></div>
    <div class="field"><label class="field-label" for="coaName">${esc(t('Name'))}</label><input class="field-input" id="coaName" placeholder="${esc(t('Account name'))}"></div>
    <div class="field"><label class="field-label" for="coaType">${esc(t('Type'))}</label><select class="field-select" id="coaType">${['asset','liability','equity','income','expense'].map(x=>`<option value="${x}">${esc(t(x))}</option>`).join('')}</select></div>
    <div class="field" style="align-self:end"><button type="button" class="btn btn-secondary" data-acct-add-account>${icon('plus')}<span>${esc(t('Add Account'))}</span></button></div>
  </div></div></div>`:''}`;
}
function accountingJewellery(){
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Jewellery Accounting'))}</h2></div><div class="card-body">
    <p class="note">${esc(t('Metal ledger, inventory valuation and making charges are reflected via accounting hooks. Use Trial Balance and Ledger to verify.'))}</p>
    <ul class="small">
      <li>${esc(t('Gold/Silver/Diamond purchase accounting'))}</li>
      <li>${esc(t('Old gold purchase and exchange'))}</li>
      <li>${esc(t('Karigar labour and wastage'))}</li>
      <li>${esc(t('Making charge income'))}</li>
      <li>${esc(t('Stock reconciliation'))}</li>
    </ul>
  </div></div>`;
}
function accounting(){
  const panel=acctUI.tab==='trial'?accountingTrial():acctUI.tab==='journal'?accountingJournal():acctUI.tab==='coa'?accountingCoa():acctUI.tab==='ledger'?accountingLedgerView():acctUI.tab==='vouchers'?accountingVouchers():acctUI.tab==='books'?accountingBooks():acctUI.tab==='opening'?accountingOpening():acctUI.tab==='years'?accountingYears():acctUI.tab==='jewellery'?accountingJewellery():accountingOverview();
  const summary=accountingSummary(state);
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.accounting[0]}</h1><p class="page-subtitle">${PAGE_TITLES.accounting[1]}</p></div><div class="page-header-actions">${summary.balanced?kcBadge(t('Ledger balanced'),'badge-completed'):kcBadge(t('Ledger unbalanced'),'badge-warn')}</div></div></div>
<div class="tabs" style="margin:8px 0 16px;flex-wrap:wrap">${acctTabs()}</div>${panel}
<p class="small muted" style="margin-top:10px">${esc(t('Accounting engine'))} v${state.accounting.meta.version} · ${esc(t('Amounts stored as integer paisa'))}</p>`;
}

const taxUI={tab:'overview',regFrom:'',regTo:'',periodId:''};
function taxCanPost(){return !!(window.RatnaOS?.auth?.hasPermission?.('tax:post'));}
function taxCanConfigure(){return !!(window.RatnaOS?.auth?.hasPermission?.('tax:configure'));}
function taxToday(){return new Date().toISOString().slice(0,10);}
function taxMoney(minor){return acctMoney(minor);}
function taxRuleBadge(rule){
  if(rule.verified) return kcBadge(t('Verified'),'badge-completed');
  return kcBadge(t('Needs Verification'),'badge-warn');
}
function taxTabs(){
  const tabs=[['overview','Overview'],['purchases','VAT Purchases'],['registers','VAT Registers'],['periods','VAT Periods'],['tds','TDS'],['reports','IRD Reports'],['calendar','Tax Calendar'],['workspace','CA Workspace'],['auditor','Auditor'],['rules','Tax Rules']];
  return tabs.map(([key,label])=>`<button class="tab ${taxUI.tab===key?'active':''}" data-tax-tab="${key}">${esc(t(label))}</button>`).join('');
}
function taxAccountOptions(types,selected){
  return accountsForEntry(state).filter(a=>types.includes(a.type)).sort((a,b)=>a.code.localeCompare(b.code)).map(a=>`<option value="${esc(a.code)}" ${a.code===selected?'selected':''}>${esc(a.code)} — ${esc(t(a.name))}</option>`).join('');
}
function taxOverview(){
  const summary=taxSummary(state);
  const payable=(accountLedger(state,'2110').slice(-1)[0]?.balance)||0;
  const liability=vatLiability(state,'','');
  const unverified=state.tax.rules.filter(r=>!r.verified);
  const openPeriods=state.tax.vatPeriods.filter(p=>p.status!=='paid');
  return `<div class="metric-grid">
    ${card('VAT Payable',taxMoney(payable),t('Unpaid balance'),'reports')}
    ${card('TDS Outstanding',taxMoney(summary.tdsOutstanding),t('Not yet deposited'),'scale')}
    ${card('Unverified Rules',summary.unverified,t('Needs verification'),'alert')}
    ${card('Output VAT',taxMoney(liability.output),t('All posted output VAT'),'reports')}
  </div>
  <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Compliance Status'))}</h2><span class="badge">v${state.tax.meta.version}</span></div><div class="card-body">
    <div class="detail-grid">
      <div><span class="muted">${esc(t('Tax rules'))}</span><div class="mono">${summary.rules}</div></div>
      <div><span class="muted">${esc(t('VAT purchases'))}</span><div class="mono">${summary.purchases}</div></div>
      <div><span class="muted">${esc(t('VAT periods'))}</span><div class="mono">${summary.periods}</div></div>
      <div><span class="muted">${esc(t('Open periods'))}</span><div class="mono">${openPeriods.length}</div></div>
      <div><span class="muted">${esc(t('TDS entries'))}</span><div class="mono">${summary.tdsEntries}</div></div>
      <div><span class="muted">${esc(t('Input VAT'))}</span><div class="mono">${taxMoney(liability.input)}</div></div>
    </div>
    ${unverified.length?`<div style="margin-top:14px">${unverified.map(r=>`<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:8px 0;border-top:1px solid var(--border-subtle)"><span>${esc(r.taxType)} · ${esc(r.category)} · ${esc(String(r.rate))}%</span>${taxRuleBadge(r)}</div>`).join('')}</div>`:''}
  </div></div>
  <p class="note note-caution">${esc(t('Tax rates, deadlines and return formats must be confirmed against IRD notices. Unverified rules are never presented as official.'))}</p>`;
}
function taxPurchases(){
  const list=[...state.tax.vatPurchases].sort((a,b)=>b.date.localeCompare(a.date));
  const body=list.map(p=>`<tr><td class="mono">${esc(p.date)}</td><td>${esc(p.supplier)}</td><td class="mono">${esc(p.pan||'')}</td><td class="mono">${esc(p.invoice||'')}</td><td class="mono align-right">${taxMoney(p.taxable)}</td><td class="mono align-right">${taxMoney(p.vat)}</td><td class="mono align-right">${taxMoney(p.total)}</td><td class="mono">${esc(p.journalId||'')}</td></tr>`).join('');
  const form=taxCanPost()?`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Record VAT Purchase'))}</h2></div><div class="card-body"><div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
    <div class="field"><label class="field-label" for="taxPurDate">${esc(t('Date'))}</label><input class="field-input" id="taxPurDate" type="date" value="${taxToday()}"></div>
    <div class="field"><label class="field-label" for="taxPurSupplier">${esc(t('Supplier'))}</label><input class="field-input" id="taxPurSupplier"></div>
    <div class="field"><label class="field-label" for="taxPurPan">${esc(t('Supplier PAN'))}</label><input class="field-input" id="taxPurPan" placeholder="PAN / VAT no."></div>
    <div class="field"><label class="field-label" for="taxPurInvoice">${esc(t('Invoice'))}</label><input class="field-input" id="taxPurInvoice"></div>
    <div class="field"><label class="field-label" for="taxPurTaxable">${esc(t('Taxable amount'))}</label><input class="field-input" id="taxPurTaxable" type="number" min="0" step="0.01"></div>
    <div class="field"><label class="field-label" for="taxPurVat">${esc(t('VAT amount'))}</label><input class="field-input" id="taxPurVat" type="number" min="0" step="0.01"></div>
    <div class="field"><label class="field-label" for="taxPurAccount">${esc(t('Purchase account'))}</label><select class="field-select" id="taxPurAccount">${taxAccountOptions(['asset','expense'],'1200')}</select></div>
    <div class="field" style="align-self:end"><button type="button" class="btn btn-champagne" data-tax-purchase-save>${icon('plus')}<span>${esc(t('Post purchase'))}</span></button></div>
  </div><p class="small muted" style="margin-top:8px">${esc(t('Posts inventory or expense, input VAT and supplier payable in one balanced journal.'))}</p></div></div>`:'';
  return `${form}<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Purchase VAT Register'))}</h2><span class="badge">${list.length}</span></div><div class="card-body" style="padding:0">${rows(['Date','Supplier','PAN','Invoice','Taxable','VAT','Total','Journal'],body)}</div></div>`;
}
function taxRegisters(){
  const from=taxUI.regFrom||'', to=taxUI.regTo||'';
  const reg=vatRegisters(state,from,to);
  const salesBody=reg.sales.map(r=>`<tr><td class="mono">${esc(r.date)}</td><td class="mono">${esc(r.invoice)}</td><td>${esc(r.customer)}</td><td class="mono">${esc(r.pan||'')}</td><td class="mono align-right">${taxMoney(r.taxable)}</td><td class="mono align-right">${taxMoney(r.vat)}</td><td class="mono align-right">${taxMoney(r.total)}</td></tr>`).join('');
  const purBody=reg.purchases.map(r=>`<tr><td class="mono">${esc(r.date)}</td><td class="mono">${esc(r.invoice||'')}</td><td>${esc(r.supplier)}</td><td class="mono">${esc(r.pan||'')}</td><td class="mono align-right">${taxMoney(r.taxable)}</td><td class="mono align-right">${taxMoney(r.vat)}</td><td class="mono align-right">${taxMoney(r.total)}</td></tr>`).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('VAT Registers'))}</h2></div><div class="card-body"><div class="form" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
    <div class="field"><label class="field-label" for="taxRegFrom">${esc(t('From'))}</label><input class="field-input" id="taxRegFrom" type="date" value="${esc(from)}"></div>
    <div class="field"><label class="field-label" for="taxRegTo">${esc(t('To'))}</label><input class="field-input" id="taxRegTo" type="date" value="${esc(to)}"></div>
    <button type="button" class="btn btn-secondary" data-tax-reg-refresh>${icon('refresh')}<span>${esc(t('Apply'))}</span></button>
  </div></div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Sales Register'))}</h2><span class="badge">${reg.sales.length}</span></div><div class="card-body" style="padding:0">${rows(['Date','Invoice','Customer','PAN','Taxable','VAT','Total'],salesBody)}</div><div class="card-body" style="border-top:1px solid var(--border-subtle);display:flex;gap:18px;flex-wrap:wrap;justify-content:flex-end"><span class="small muted">${esc(t('Taxable'))}: <strong class="mono">${taxMoney(reg.salesTotals.taxable)}</strong></span><span class="small muted">${esc(t('VAT'))}: <strong class="mono">${taxMoney(reg.salesTotals.vat)}</strong></span><span class="small muted">${esc(t('Total'))}: <strong class="mono">${taxMoney(reg.salesTotals.total)}</strong></span></div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Purchase Register'))}</h2><span class="badge">${reg.purchases.length}</span></div><div class="card-body" style="padding:0">${rows(['Date','Invoice','Supplier','PAN','Taxable','VAT','Total'],purBody)}</div><div class="card-body" style="border-top:1px solid var(--border-subtle);display:flex;gap:18px;flex-wrap:wrap;justify-content:flex-end"><span class="small muted">${esc(t('Taxable'))}: <strong class="mono">${taxMoney(reg.purchaseTotals.taxable)}</strong></span><span class="small muted">${esc(t('VAT'))}: <strong class="mono">${taxMoney(reg.purchaseTotals.vat)}</strong></span><span class="small muted">${esc(t('Total'))}: <strong class="mono">${taxMoney(reg.purchaseTotals.total)}</strong></span></div></div>
  <p class="note">${esc(t('Sales rows come from recorded bills. Confirm buyer PAN and invoice details before filing.'))}</p>`;
}
function taxPeriods(){
  const list=[...state.tax.vatPeriods].sort((a,b)=>b.from.localeCompare(a.from));
  const body=list.map(p=>{const s=vatPeriodSummary(state,p.id); const net=s?s.liability.net:0; const status=p.status==='paid'?kcBadge(t('Paid'),'badge-completed'):p.status==='prepared'?kcBadge(t('Prepared'),'badge-info'):kcBadge(t('Draft'),'badge-warn'); const action=p.status==='draft'?`<button type="button" class="btn btn-ghost btn-sm" data-tax-period-prepare="${esc(p.id)}">${esc(t('Prepare return'))}</button>`:(p.status==='prepared'?`<button type="button" class="btn btn-ghost btn-sm" data-tax-period-pay="${esc(p.id)}">${esc(t('Record payment'))}</button>`:''); return `<tr><td><strong>${esc(p.label)}</strong></td><td class="mono">${esc(p.from)}</td><td class="mono">${esc(p.to)}</td><td>${status}</td><td class="mono align-right">${taxMoney(net)}</td><td class="mono align-right">${taxMoney(p.paidAmount||0)}</td><td class="align-right">${taxCanPost()?action:''}</td></tr>`;}).join('');
  const form=taxCanPost()?`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Add VAT Period'))}</h2></div><div class="card-body"><div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
    <div class="field"><label class="field-label" for="taxPeriodLabel">${esc(t('Label'))}</label><input class="field-input" id="taxPeriodLabel" placeholder="2083-01 (Poush)"></div>
    <div class="field"><label class="field-label" for="taxPeriodFrom">${esc(t('From'))}</label><input class="field-input" id="taxPeriodFrom" type="date"></div>
    <div class="field"><label class="field-label" for="taxPeriodTo">${esc(t('To'))}</label><input class="field-input" id="taxPeriodTo" type="date"></div>
    <div class="field" style="align-self:end"><button type="button" class="btn btn-secondary" data-tax-period-add>${icon('plus')}<span>${esc(t('Add period'))}</span></button></div>
  </div></div></div>`:'';
  return `${form}<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('VAT Periods'))}</h2><span class="badge">${list.length}</span></div><div class="card-body" style="padding:0">${rows(['Period','From','To','Status','Net liability','Paid',''],body)}</div></div>
  <p class="note note-caution">${esc(t('Preparing a return clears output and input VAT into VAT Payable. Payments must match the IRD challan reference you record.'))}</p>`;
}
function taxTds(){
  const cats=tdsCategories(state);
  const list=[...state.tax.tdsEntries].sort((a,b)=>b.date.localeCompare(a.date));
  const body=list.map(e=>`<tr><td class="mono">${esc(e.date)}</td><td>${esc(e.category)}</td><td>${esc(e.recipient)}</td><td class="mono">${esc(e.pan||'')}</td><td class="mono align-right">${taxMoney(e.taxable)}</td><td class="mono align-right">${esc(String(e.rate))}%</td><td class="mono align-right">${taxMoney(e.tds)}</td><td>${e.status==='deposited'?kcBadge(t('Deposited'),'badge-completed'):kcBadge(t('Deducted'),'badge-warn')}</td><td class="align-right">${taxCanPost()&&e.status!=='deposited'?`<button type="button" class="btn btn-ghost btn-sm" data-tax-tds-deposit="${esc(e.id)}">${esc(t('Deposit'))}</button>`:''}</td></tr>`).join('');
  const form=(taxCanPost()&&cats.length)?`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Record TDS Deduction'))}</h2></div><div class="card-body"><div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
    <div class="field"><label class="field-label" for="taxTdsDate">${esc(t('Date'))}</label><input class="field-input" id="taxTdsDate" type="date" value="${taxToday()}"></div>
    <div class="field"><label class="field-label" for="taxTdsCategory">${esc(t('Category'))}</label><select class="field-select" id="taxTdsCategory">${cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>
    <div class="field"><label class="field-label" for="taxTdsRecipient">${esc(t('Recipient'))}</label><input class="field-input" id="taxTdsRecipient"></div>
    <div class="field"><label class="field-label" for="taxTdsPan">${esc(t('Recipient PAN'))}</label><input class="field-input" id="taxTdsPan"></div>
    <div class="field"><label class="field-label" for="taxTdsTaxable">${esc(t('Taxable amount'))}</label><input class="field-input" id="taxTdsTaxable" type="number" min="0" step="0.01"></div>
    <div class="field"><label class="field-label" for="taxTdsAmount">${esc(t('TDS amount'))}</label><input class="field-input" id="taxTdsAmount" type="number" min="0" step="0.01" placeholder="${esc(t('Auto from rule'))}"></div>
    <div class="field"><label class="field-label" for="taxTdsMethod">${esc(t('Payment method'))}</label><select class="field-select" id="taxTdsMethod">${['Cash','Bank Transfer','Cheque'].map(m=>`<option value="${m}">${esc(t(m))}</option>`).join('')}</select></div>
    <div class="field"><label class="field-label" for="taxTdsExpense">${esc(t('Expense account'))}</label><select class="field-select" id="taxTdsExpense">${taxAccountOptions(['expense'],'6900')}</select></div>
    <div class="field" style="align-self:end"><button type="button" class="btn btn-champagne" data-tax-tds-save>${icon('plus')}<span>${esc(t('Post TDS entry'))}</span></button></div>
  </div><p class="small muted" style="margin-top:8px">${esc(t('The rule rate for the selected category and date is applied unless you enter an amount.'))}</p></div></div>`:`<p class="note note-caution">${esc(t('Add a verified TDS rule before recording deductions.'))}</p>`;
  return `<div class="metric-grid">${card('TDS Outstanding',taxMoney(tdsOutstanding(state)),t('Not yet deposited'),'scale')}${card('TDS Entries',list.length,t('Recorded deductions'),'reports')}</div>
  ${form}<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('TDS Register'))}</h2><span class="badge">${list.length}</span></div><div class="card-body" style="padding:0">${rows(['Date','Category','Recipient','PAN','Taxable','Rate','TDS','Status',''],body)}</div></div>
  <p class="note note-caution">${esc(t('Deposit deadlines and thresholds depend on current law. Confirm each category against IRD guidance.'))}</p>`;
}
function taxRules(){
  const rules=[...state.tax.rules].sort((a,b)=>a.taxType.localeCompare(b.taxType)||a.category.localeCompare(b.category)||b.effectiveFrom.localeCompare(a.effectiveFrom));
  const body=rules.map(r=>`<tr><td>${esc(r.taxType)}</td><td>${esc(r.category)}</td><td class="mono align-right">${esc(String(r.rate))}%</td><td class="mono">${esc(r.effectiveFrom)}</td><td class="mono">${esc(r.effectiveTo||'—')}</td><td>${taxRuleBadge(r)}</td><td class="small">${r.sourceUrl?`<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">${esc(t('Source'))}</a>`:''}</td><td class="align-right">${taxCanConfigure()?`${!r.verified?`<button type="button" class="btn btn-ghost btn-sm" data-tax-rule-verify="${esc(r.id)}">${esc(t('Verify'))}</button>`:''}${!r.effectiveTo?`<button type="button" class="btn btn-ghost btn-sm" data-tax-rule-end="${esc(r.id)}">${esc(t('End rule'))}</button>`:''}`:''}</td></tr>`).join('');
  const form=taxCanConfigure()?`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Add Tax Rule'))}</h2></div><div class="card-body"><div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
    <div class="field"><label class="field-label" for="taxRuleType">${esc(t('Tax type'))}</label><select class="field-select" id="taxRuleType"><option value="VAT">VAT</option><option value="TDS">TDS</option></select></div>
    <div class="field"><label class="field-label" for="taxRuleCategory">${esc(t('Category'))}</label><input class="field-input" id="taxRuleCategory" list="taxRuleCategories" placeholder="standard / rent / service"><datalist id="taxRuleCategories">${tdsCategories(state).map(c=>`<option value="${esc(c)}"></option>`).join('')}</datalist></div>
    <div class="field"><label class="field-label" for="taxRuleRate">${esc(t('Rate (%)'))}</label><input class="field-input" id="taxRuleRate" type="number" min="0" max="100" step="0.01"></div>
    <div class="field"><label class="field-label" for="taxRuleFrom">${esc(t('Effective from'))}</label><input class="field-input" id="taxRuleFrom" type="date"></div>
    <div class="field"><label class="field-label" for="taxRuleTo">${esc(t('Effective to'))}</label><input class="field-input" id="taxRuleTo" type="date"></div>
    <div class="field"><label class="field-label" for="taxRuleSource">${esc(t('Official source URL'))}</label><input class="field-input" id="taxRuleSource" placeholder="https://"></div>
    <div class="field" style="align-self:end"><button type="button" class="btn btn-secondary" data-tax-rule-add>${icon('plus')}<span>${esc(t('Add rule'))}</span></button></div>
  </div><p class="small muted" style="margin-top:8px">${esc(t('Rules are saved unverified. Add an official source and verify before filing.'))}</p></div></div>`:'';
  return `${form}<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Tax Rules'))}</h2><span class="badge">${rules.length}</span></div><div class="card-body" style="padding:0">${rows(['Type','Category','Rate','From','To','Status','Source',''],body)}</div></div>
  <p class="note note-caution">${esc(t('No rate is asserted by RatnaOS. Every rule must carry an official source before it is shown as verified.'))}</p>`;
}
function taxReports(){
  const from=taxUI.regFrom||'', to=taxUI.regTo||'';
  const reg=vatRegisters(state,from,to);
  const tds=[...state.tax.tdsEntries].sort((a,b)=>a.date.localeCompare(b.date));
  const exportCsv=(name,rows)=>{
    const csv=rows.map(r=>r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
  };
  const printReport=(title,html)=>{
    const w=window.open('','_blank'); if(!w) return;
    w.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #999;padding:6px;font-size:12px}th{background:#eee}.right{text-align:right}.meta{margin:6px 0;font-size:12px}</style></head><body>${html}<script>window.print()</script></body></html>`); w.document.close();
  };
  const vatSalesHtml=`<h1>VAT Sales Register</h1><div class="meta">Period: ${from||'all'} to ${to||'all'}</div><table><tr><th>Date</th><th>Invoice</th><th>Customer</th><th>PAN</th><th class="right">Taxable</th><th class="right">VAT</th><th class="right">Total</th></tr>${reg.sales.map(r=>`<tr><td>${r.date}</td><td>${r.invoice}</td><td>${r.customer}</td><td>${r.pan||''}</td><td class="right">${taxMoney(r.taxable)}</td><td class="right">${taxMoney(r.vat)}</td><td class="right">${taxMoney(r.total)}</td></tr>`).join('')}<tr><td colspan="4"><strong>Total</strong></td><td class="right"><strong>${taxMoney(reg.salesTotals.taxable)}</strong></td><td class="right"><strong>${taxMoney(reg.salesTotals.vat)}</strong></td><td class="right"><strong>${taxMoney(reg.salesTotals.total)}</strong></td></tr></table>`;
  const vatPurHtml=`<h1>VAT Purchase Register</h1><div class="meta">Period: ${from||'all'} to ${to||'all'}</div><table><tr><th>Date</th><th>Invoice</th><th>Supplier</th><th>PAN</th><th class="right">Taxable</th><th class="right">VAT</th><th class="right">Total</th></tr>${reg.purchases.map(r=>`<tr><td>${r.date}</td><td>${r.invoice||''}</td><td>${r.supplier}</td><td>${r.pan||''}</td><td class="right">${taxMoney(r.taxable)}</td><td class="right">${taxMoney(r.vat)}</td><td class="right">${taxMoney(r.total)}</td></tr>`).join('')}<tr><td colspan="4"><strong>Total</strong></td><td class="right"><strong>${taxMoney(reg.purchaseTotals.taxable)}</strong></td><td class="right"><strong>${taxMoney(reg.purchaseTotals.vat)}</strong></td><td class="right"><strong>${taxMoney(reg.purchaseTotals.total)}</strong></td></tr></table>`;
  const tdsHtml=`<h1>TDS Deduction Report</h1><table><tr><th>Date</th><th>Category</th><th>Recipient</th><th>PAN</th><th class="right">Taxable</th><th class="right">Rate</th><th class="right">TDS</th><th>Status</th></tr>${tds.map(e=>`<tr><td>${e.date}</td><td>${e.category}</td><td>${e.recipient}</td><td>${e.pan||''}</td><td class="right">${taxMoney(e.taxable)}</td><td class="right">${e.rate}%</td><td class="right">${taxMoney(e.tds)}</td><td>${e.status}</td></tr>`).join('')}</table>`;
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('IRD Report Center'))}</h2></div><div class="card-body">
    <p class="note">${esc(t('Reports are generated from recorded transactions. Verify against current IRD forms before filing.'))}</p>
    <div class="detail-grid" style="margin-top:12px">
      <div class="card" style="padding:12px"><h3 class="card-title">VAT Sales Register</h3><div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-secondary btn-sm" data-tax-print="vatSales">${esc(t('Print/PDF'))}</button><button class="btn btn-ghost btn-sm" data-tax-csv="vatSales">${esc(t('CSV'))}</button></div></div>
      <div class="card" style="padding:12px"><h3 class="card-title">VAT Purchase Register</h3><div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-secondary btn-sm" data-tax-print="vatPur">${esc(t('Print/PDF'))}</button><button class="btn btn-ghost btn-sm" data-tax-csv="vatPur">${esc(t('CSV'))}</button></div></div>
      <div class="card" style="padding:12px"><h3 class="card-title">TDS Report</h3><div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-secondary btn-sm" data-tax-print="tds">${esc(t('Print/PDF'))}</button><button class="btn btn-ghost btn-sm" data-tax-csv="tds">${esc(t('CSV'))}</button></div></div>
    </div>
  </div></div>
  <script>window.__taxReports={vatSalesHtml:${JSON.stringify(vatSalesHtml)},vatPurHtml:${JSON.stringify(vatPurHtml)},tdsHtml:${JSON.stringify(tdsHtml)},reg:${JSON.stringify({sales:reg.sales,purchases:reg.purchases,tds})}};</script>`;
}
function taxCalendar(){
  ensureTax(state);
  const list=[...state.tax.calendar].sort((a,b)=>(a.filingDeadline||'').localeCompare(b.filingDeadline||''));
  const body=list.map(e=>{
    const today=new Date().toISOString().slice(0,10);
    const status=e.status||'upcoming';
    const badge=status==='paid'?kcBadge(t('Paid'),'badge-completed'):status==='overdue'?kcBadge(t('Overdue'),'badge-danger'):kcBadge(t(status),'badge-warn');
    return `<tr><td>${esc(e.taxName)}</td><td class="mono">${esc(e.period)}</td><td class="mono">${esc(e.filingDeadline)}</td><td class="mono">${esc(e.paymentDeadline)}</td><td class="mono align-right">${taxMoney(e.payable||0)}</td><td class="mono align-right">${taxMoney(e.paid||0)}</td><td>${badge}</td></tr>`;
  }).join('');
  const form=taxCanPost()?`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Add Tax Calendar Event'))}</h2></div><div class="card-body"><div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
    <div class="field"><label class="field-label">${esc(t('Tax name'))}</label><input class="field-input" id="tcName"></div>
    <div class="field"><label class="field-label">${esc(t('Period'))}</label><input class="field-input" id="tcPeriod"></div>
    <div class="field"><label class="field-label">${esc(t('Filing deadline'))}</label><input class="field-input" id="tcFiling" type="date"></div>
    <div class="field"><label class="field-label">${esc(t('Payment deadline'))}</label><input class="field-input" id="tcPayment" type="date"></div>
    <div class="field"><label class="field-label">${esc(t('Payable'))}</label><input class="field-input" id="tcPayable" type="number" min="0" step="0.01"></div>
    <div class="field"><label class="field-label">${esc(t('Paid'))}</label><input class="field-input" id="tcPaid" type="number" min="0" step="0.01"></div>
    <div class="field"><label class="field-label">${esc(t('Status'))}</label><select class="field-select" id="tcStatus"><option>upcoming</option><option>due soon</option><option>overdue</option><option>prepared</option><option>submitted</option><option>paid</option><option>verified</option></select></div>
    <div class="field" style="align-self:end"><button type="button" class="btn btn-secondary" data-tax-cal-add>${icon('plus')}<span>${esc(t('Add'))}</span></button></div>
  </div></div></div>`:'';
  return `${form}<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Tax Calendar'))}</h2><span class="badge">${list.length}</span></div><div class="card-body" style="padding:0">${rows(['Tax','Period','Filing deadline','Payment deadline','Payable','Paid','Status'],body)}</div></div>
  <p class="note note-caution">${esc(t('Deadlines must be verified against official IRD notices before relying on them.'))}</p>`;
}
function taxWorkspace(){
  ensureTax(state);
  const openPeriods=state.tax.vatPeriods.filter(p=>p.status!=='paid');
  const unverified=state.tax.rules.filter(r=>!r.verified);
  const tdsOpen=state.tax.tdsEntries.filter(e=>e.status!=='deposited');
  const overdue=state.tax.calendar.filter(e=>e.status==='overdue');
  return `<div class="metric-grid">
    ${card('Open VAT Periods',openPeriods.length,t('Pending filing'),'reports')}
    ${card('Unverified Rules',unverified.length,t('Needs verification'),'alert')}
    ${card('Open TDS',tdsOpen.length,t('Not deposited'),'scale')}
    ${card('Overdue Filings',overdue.length,t('Calendar'),'calendar')}
  </div>
  <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('CA Review Checklist'))}</h2></div><div class="card-body">
    <ul class="small">
      <li>${esc(t('Review journal entries and trial balance'))}</li>
      <li>${esc(t('Reconcile VAT periods and deposits'))}</li>
      <li>${esc(t('Verify TDS categories and deposits'))}</li>
      <li>${esc(t('Prepare financial statements'))}</li>
      <li>${esc(t('Confirm tax calendar deadlines'))}</li>
    </ul>
  </div></div>
  <p class="note">${esc(t('Multi-client isolation requires backend; this workspace summarizes the active company.'))}</p>`;
}
function taxAuditor(){
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Auditor Workspace'))}</h2></div><div class="card-body">
    <p class="note">${esc(t('Auditors may add observations without modifying original transactions.'))}</p>
    <ul class="small">
      <li>${esc(t('Voucher verification'))}</li>
      <li>${esc(t('Bank reconciliation review'))}</li>
      <li>${esc(t('Inventory and metal reconciliation'))}</li>
      <li>${esc(t('Tax compliance review'))}</li>
      <li>${esc(t('Financial statement review'))}</li>
    </ul>
  </div></div>`;
}
function tax(){
  const panel=taxUI.tab==='purchases'?taxPurchases():taxUI.tab==='registers'?taxRegisters():taxUI.tab==='periods'?taxPeriods():taxUI.tab==='tds'?taxTds():taxUI.tab==='reports'?taxReports():taxUI.tab==='calendar'?taxCalendar():taxUI.tab==='workspace'?taxWorkspace():taxUI.tab==='auditor'?taxAuditor():taxUI.tab==='rules'?taxRules():taxOverview();
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.tax[0]}</h1><p class="page-subtitle">${PAGE_TITLES.tax[1]}</p></div><div class="page-header-actions">${taxSummary(state).unverified?kcBadge(t('Needs Verification'),'badge-warn'):kcBadge(t('Rules verified'),'badge-completed')}</div></div></div>
<div class="tabs" style="margin:8px 0 16px;flex-wrap:wrap">${taxTabs()}</div>${panel}
<p class="small muted" style="margin-top:10px">${esc(t('Tax engine'))} v${state.tax.meta.version} · ${esc(t('Amounts stored as integer paisa'))}</p>`;
}

const KC_DATASETS={
  gems:{base:GEMSTONES,label:'Gemstones'},
  processes:{base:PROCESSES,label:'Processes & Designs'},
  currencies:{base:CURRENCIES,label:'Currencies'},
  standards:{base:INTERNATIONAL_STANDARDS,label:'International Standards'},
  terms:{base:REGIONAL_TERMS,label:'Regional Terminology'},
  units:{base:KC_UNITS,label:'Units'},
  metals:{base:METALS,label:'Metals'},
  gold:{base:KC_GOLD_PURITIES,label:'Gold Purity'},
  silver:{base:KC_SILVER_PURITIES,label:'Silver Purity'},
  tools:{base:TOOLS,label:'Tools'}
};
function kcCanEdit(){return !!(window.RatnaOS?.auth?.hasPermission?.('knowledge:write'));}
function kcOverrides(name){return state.kcOverrides?.[name]||{};}
function kcData(name,base){
  const ov=kcOverrides(name);
  return base.filter(r=>!ov[r.id]?.__deleted).map(r=>ov[r.id]?{...r,...ov[r.id]}:r)
    .concat(Object.entries(ov).filter(([id,o])=>o.__new&&!o.__deleted).map(([id,o])=>({...o,id})));
}
function kcEditBtns(name,id){
  if(!kcCanEdit()) return '';
  return `<div style="display:flex;gap:4px;justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-kc-edit="${esc(name)}:${esc(id)}" title="${esc(t('Edit'))}">${icon('edit')}</button><button type="button" class="btn btn-ghost btn-sm" data-kc-del="${esc(name)}:${esc(id)}" title="${esc(t('Delete'))}">${icon('trash')}</button></div>`;
}
function kcAdminBar(name,label){
  if(!kcCanEdit()) return '';
  return `<div class="card section" style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="small muted">${esc(t('Admin editing'))}: ${esc(t(label))}</span><button type="button" class="btn btn-secondary btn-sm" data-kc-new="${esc(name)}">${icon('plus')}<span>${esc(t('Add record'))}</span></button></div>`;
}
function kcStatus(r){
  if(r.needsVerification) return kcBadge(t('Needs Verification'),'badge-warn');
  if(r.status) return kcBadge(t(r.status),r.status==='Verified'?'badge-completed':'badge-info');
  return kcBadge(t('Reference'),'badge-info');
}
function kcGems(){
  const list=kcData('gems',GEMSTONES);
  const body=list.map(r=>`<tr><td><strong>${esc(kcName(r))}</strong> ${kcLang()==='en'?`<span class="muted small">${esc(r.en)}</span>`:''}</td><td>${esc(t(r.kind))}</td><td class="mono">${esc(r.mohs)}</td><td class="small muted">${esc(t(r.note)||r.note||'')}</td><td>${kcStatus(r)}</td>${kcCanEdit()?`<td>${kcEditBtns('gems',r.id)}</td>`:''}</tr>`).join('');
  return kcAdminBar('gems','Gemstones')+`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Gemstones'))}</h2></div><div class="card-body" style="padding:0">${rows(kcCanEdit()?['Gemstone','Type','Mohs','Note','Status','']:['Gemstone','Type','Mohs','Note','Status'],body)}</div></div>
  <p class="note">${esc(t('Hardness and treatment notes are reference values. Always disclose synthetic, treated or lab-grown stones.'))}</p>`;
}
function kcProcesses(){
  const list=kcData('processes',PROCESSES);
  const body=list.map(r=>`<tr><td><strong>${esc(kcName(r))}</strong> ${kcLang()==='en'?`<span class="muted small">${esc(r.en)}</span>`:''}</td><td>${esc(t(r.group))}</td><td class="small muted">${esc(t(r.note)||r.note||'')}</td><td>${kcStatus(r)}</td>${kcCanEdit()?`<td>${kcEditBtns('processes',r.id)}</td>`:''}</tr>`).join('');
  return kcAdminBar('processes','Processes & Designs')+`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Processes & Designs'))}</h2></div><div class="card-body" style="padding:0">${rows(kcCanEdit()?['Process','Group','Note','Status','']:['Process','Group','Note','Status'],body)}</div></div>`;
}
function kcCurrencies(){
  const list=kcData('currencies',CURRENCIES);
  const body=list.map(r=>`<tr><td class="mono"><strong>${esc(r.id)}</strong></td><td>${esc(kcName(r))}</td><td class="mono">${esc(r.symbol)}</td><td>${esc(r.countries)}</td><td class="mono align-right">${r.decimals}</td>${kcCanEdit()?`<td>${kcEditBtns('currencies',r.id)}</td>`:''}</tr>`).join('');
  return kcAdminBar('currencies','Currencies')+`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Currencies'))}</h2></div><div class="card-body" style="padding:0">${rows(kcCanEdit()?['Code','Name','Symbol','Countries','Decimals','']:['Code','Name','Symbol','Countries','Decimals'],body)}</div></div>
  <p class="note note-caution">${esc(t('No exchange rates are stored. Invoice values always use your shop currency; convert using a rate you can document.'))}</p>`;
}
function kcStandards(){
  const list=kcData('standards',INTERNATIONAL_STANDARDS);
  const body=list.map(r=>`<tr><td><strong>${esc(kcName(r))}</strong> ${kcLang()==='en'?`<span class="muted small">${esc(r.en)}</span>`:''}</td><td class="mono">${esc(r.body)}</td><td>${esc(t(r.scope))}</td><td>${kcStatus(r)}</td>${kcCanEdit()?`<td>${kcEditBtns('standards',r.id)}</td>`:''}</tr>`).join('');
  return kcAdminBar('standards','International Standards')+`<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('International Standards'))}</h2></div><div class="card-body" style="padding:0">${rows(kcCanEdit()?['Standard','Body','Scope','Status','']:['Standard','Body','Scope','Status'],body)}</div></div>
  <p class="note">${esc(t('Standards are listed for reference. Verify the current edition and your local legal requirements before printing claims.'))}</p>`;
}
function kcMasters(){
  if(!kcCanEdit()) return `<p class="note note-caution">${esc(t('Only an administrator or manager can edit master data.'))}</p>`;
  return Object.entries(KC_DATASETS).map(([name,cfg])=>{
    const list=kcData(name,cfg.base);
    const body=list.map(r=>`<tr><td class="mono">${esc(r.id)}</td><td>${esc(kcName(r))}</td><td class="small muted">${esc((r.note||r.source||r.countries||r.scope||r.body||'').toString().slice(0,60))}</td><td>${kcStatus(r)}</td><td>${kcEditBtns(name,r.id)}</td></tr>`).join('');
    return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t(cfg.label))} <span class="badge">${list.length}</span></h2><button type="button" class="btn btn-secondary btn-sm" data-kc-new="${esc(name)}">${icon('plus')}<span>${esc(t('Add'))}</span></button></div><div class="card-body" style="padding:0">${rows(['ID','Name','Details','Status',''],body)}</div></div>`;
  }).join('');
}
function kcRingResultHTML(){
  const system=kcUI.ringSystem||'us';
  const size=kcUI.ringSize??'7';
  const mm=ringSizeToCircumference(size,system);
  const row=ringSizeNearest(mm);
  if(!row) return `<span class="muted">${esc(t('Enter a valid ring size'))}</span>`;
  return `<div class="small muted">${esc(t('Nearest circumference'))}</div><div class="mono" style="font-size:var(--fs-lg);font-weight:600">${row.circ.toFixed(1)} mm</div>
  <div class="small" style="margin-top:4px">${t('US')} ${esc(row.us)} · ${t('UK')} ${esc(row.uk)} · ${t('EU')} ${esc(row.eu)} · ${t('JP')} ${esc(row.jp)} · ${t('IN')} ${esc(row.india)}</div>
  <div class="small" style="color:var(--warning,#b45309);margin-top:6px">${esc(t('Reference only — confirm with a physical ring sizer.'))}</div>`;
}
function kcRingTools(){
  const sysOpts=[['us','US'],['uk','UK'],['india','IN'],['japan','JP'],['eu','EU']].map(([v,l])=>`<option value="${v}" ${((kcUI.ringSystem||'us')===v)?'selected':''}>${t(l)}</option>`).join('');
  const body=RING_SIZE_TABLE.map(r=>`<tr><td class="mono">${r.circ.toFixed(1)}</td><td class="mono">${esc(r.us)}</td><td class="mono">${esc(r.uk)}</td><td class="mono">${esc(r.eu)}</td><td class="mono">${esc(r.jp)}</td><td class="mono">${esc(r.india)}</td></tr>`).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Ring Size Finder'))}</h2><span class="badge badge-warn">${esc(t('Needs Verification'))}</span></div><div class="card-body">
    <div class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
      <div class="field"><label class="field-label" for="kcRingSystem">${esc(t('Ring system'))}</label><select class="field-select" id="kcRingSystem">${sysOpts}</select></div>
      <div class="field"><label class="field-label" for="kcRingSize">${esc(t('Ring size'))}</label><input class="field-input" id="kcRingSize" type="text" value="${esc(kcUI.ringSize??'7')}"></div>
    </div>
    <div id="kcRingResult" style="margin-top:14px;padding:14px 16px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-md)">${kcRingResultHTML()}</div>
  </div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Ring Size Table'))}</h2></div><div class="card-body" style="padding:0">${rows(['Circumference (mm)','US','UK','EU','JP','IN'],body)}</div></div>
  <p class="note note-caution">${esc(t('Ring sizes differ by standard and finger shape. Measure circumference and confirm with a physical sizer before manufacturing.'))}</p>`;
}
function confirmationCard(){
  const items=CONFIRMATION_ITEMS;
  const done=state.settings.confirmations||{};
  const canConfirm=window.RatnaOS?.auth?.hasPermission?.('settings:backup');
  const body=items.map(it=>`<tr><td>${esc(kcName(it))}</td><td class="small muted">${esc(t(it.use))}</td><td>${done[it.id]?kcBadge(t('Confirmed'),'badge-completed'):kcBadge(t('Unconfirmed'),'badge-warn')}</td><td class="align-right">${canConfirm?`<button type="button" class="btn btn-ghost btn-sm" data-confirm-toggle="${esc(it.id)}">${done[it.id]?esc(t('Revoke')):esc(t('Confirm'))}</button>`:''}</td></tr>`).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Local Confirmation'))}</h2>${pendingConfirmations().length?kcBadge(t('Action needed'),'badge-warn'):kcBadge(t('Confirmed'),'badge-completed')}</div><div class="card-body" style="padding:0">${rows(['Item','Used for','Status',''],body)}</div><div class="card-body"><p class="small muted" style="margin:0">${esc(t('Confirm weight factors, hallmarking and tax details with your local authority or accountant before using them on invoices.'))}</p></div></div>`;
}
function pendingConfirmations(){
  const done=state.settings.confirmations||{};
  return CONFIRMATION_ITEMS.filter(it=>!done[it.id]);
}
function kcCatalogue(){
  const catCards=JEWELLERY_CATALOGUE.map(cat=>`
    <div class="card" style="padding:16px 18px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
        <div><div style="font-weight:600;font-size:var(--fs-md)">${esc(kcName(cat))}</div>${kcLang()==='en'?`<div class="small muted">${esc(cat.en)}</div>`:''}</div>
        ${kcBadge(`${cat.types.length} ${t('Types')}`)}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${cat.types.map(ty=>`<span class="badge" title="${esc(ty.en)}">${esc(kcName(ty))}${ty.needsVerification?' *':''}</span>`).join('')}</div>
    </div>`).join('');
  const collCards=REGIONAL_COLLECTIONS.map(c=>`
    <div class="card" style="padding:14px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div style="font-weight:600">${esc(kcName(c))}</div>${c.needsVerification?kcBadge(t('Needs Verification'),'badge-warn'):kcBadge(t(c.id))}</div>
      <div class="small muted" style="margin-top:6px">${(kcLang()==='ne'&&c.itemsNe?c.itemsNe:c.items).map(esc).join(' · ')}</div>
    </div>`).join('');
  return `
    <div class="section"><div class="section-title">${esc(t('Categories'))}</div><div class="card-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">${catCards}</div></div>
    <div class="section"><div class="section-title">${esc(t('Regional Collections'))}</div><div class="card-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">${collCards}</div></div>
    <p class="note">* ${esc(t('Items marked with an asterisk need local verification before use in an invoice or catalogue.'))}</p>`;
}
function kcMetals(){
  const metalRows=METALS.map(m=>`<tr><td><strong>${esc(kcName(m))}</strong> ${kcLang()==='en'?`<span class="muted small">${esc(m.en)}</span>`:''}</td><td class="mono">${esc(m.symbol)}</td><td class="mono align-right">${m.density.toFixed(2)}</td></tr>`).join('');
  const goldRows=KC_GOLD_PURITIES.map(p=>`<tr><td class="mono">${esc(p.label)}</td><td class="mono align-right">${p.fineness}</td><td>${esc(kcLang()==='en'?p.label:p.karat+'K')}</td><td class="small muted">${esc(t(p.note||''))}</td></tr>`).join('');
  const silverRows=KC_SILVER_PURITIES.map(p=>`<tr><td class="mono">${esc(t(p.label))}</td><td class="mono align-right">${p.fineness}</td><td>${p.needsVerification?kcBadge(t('Needs Verification'),'badge-warn'):kcBadge(t('Verified'))}</td></tr>`).join('');
  return `
    <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Metals'))}</h2></div><div class="card-body" style="padding:0">${rows(['Metal','Symbol','Density (g/cm³)'],metalRows)}</div></div>
    <div class="layout-2col section" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px">
      <div class="card"><div class="card-header"><h2 class="card-title">${esc(t('Gold Purity'))}</h2></div><div class="card-body" style="padding:0">${rows(['Karat','Fineness (‰)','Label','Notes'],goldRows)}</div></div>
      <div class="card"><div class="card-header"><h2 class="card-title">${esc(t('Silver Purity'))}</h2></div><div class="card-body" style="padding:0">${rows(['Standard','Fineness (‰)','Status'],silverRows)}</div></div>
    </div>
    <p class="note note-caution">${esc(t('Karat measures gold purity; carat measures gemstone mass. They are never interchangeable.'))}</p>`;
}
function kcMeasurements(){
  return MEASUREMENT_TYPES.map(mt=>{
    const units=KC_UNITS.filter(u=>u.type===mt.id);
    if(!units.length) return '';
    const body=units.map(u=>`<tr><td><strong>${esc(kcName(u))}</strong> ${kcLang()==='en'?`<span class="muted small">${esc(u.en)}</span>`:''}</td><td class="mono">${esc(u.abbr)}</td><td class="mono align-right">${u.toBase}</td><td>${u.scope.length?esc(u.scope.join(', ')):esc(t('International'))}</td><td class="small muted">${esc(t(u.source||''))}</td><td>${u.needsVerification?kcBadge(t('Needs Verification'),'badge-warn'):u.regional?kcBadge(t('Regional unit'),'badge-info'):kcBadge(t('Verified'))}</td></tr>`).join('');
    return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(kcName(mt))}</h2></div><div class="card-body" style="padding:0">${rows(['Unit','Abbr','Factor to base','Scope','Source','Status'],body)}</div></div>`;
  }).join('')+`<p class="note">${esc(t('Factors convert to each type’s base unit. Traditional units differ by region — confirm local definitions.'))}</p>`;
}
function kcConverter(){
  const types=MEASUREMENT_TYPES.filter(mt=>KC_UNITS.some(u=>u.type===mt.id));
  const ringRows=RING_SIZE_SYSTEMS.map(s=>`<tr><td>${esc(kcName(s))}</td><td>${s.verified?kcBadge(t('Verified'),'badge-completed'):kcBadge(t('Needs Verification'),'badge-warn')}</td><td class="small muted">${esc(t(s.note||''))}</td></tr>`).join('');
  return `
    <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Unit Converter'))}</h2></div><div class="card-body">
      <form class="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px" onsubmit="return false">
        <div class="field"><label class="field-label" for="kcConvType">${esc(t('Measurement Type'))}</label><select class="field-select" id="kcConvType" name="kcConvType">${types.map(mt=>`<option value="${esc(mt.id)}" ${mt.id===kcUI.type?'selected':''}>${esc(kcName(mt))}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label" for="kcConvValue">${esc(t('Value'))}</label><input class="field-input" id="kcConvValue" name="kcConvValue" type="number" step="any" value="${esc(kcUI.value)}"></div>
        <div class="field"><label class="field-label" for="kcConvFrom">${esc(t('From'))}</label><select class="field-select" id="kcConvFrom" name="kcConvFrom">${kcUnitOptions(kcUI.type)}</select></div>
        <div class="field"><label class="field-label" for="kcConvTo">${esc(t('To'))}</label><select class="field-select" id="kcConvTo" name="kcConvTo">${kcUnitOptionsTo(kcUI.type)}</select></div>
      </form>
      <div id="kcConvResult" style="margin-top:16px;padding:14px 16px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-md);min-height:52px;display:flex;align-items:center">${kcConvertResult()}</div>
      <p class="small muted" style="margin-top:10px">${esc(t('Conversions stay within one measurement type. Karat (purity) and carat (mass) are separate types and cannot be converted into each other.'))}</p>
    </div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Ring Size Systems'))}</h2></div><div class="card-body" style="padding:0">${rows(['System','Status','Notes'],ringRows)}</div></div>
    ${kcRingTools()}`;
}
function kcTools(){
  const body=TOOLS.map(tool=>`<tr><td><strong>${esc(kcName(tool))}</strong> ${kcLang()==='en'?`<span class="muted small">${esc(tool.en)}</span>`:''}</td><td class="small muted">${esc(t(tool.use))}</td></tr>`).join('');
  return `<div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Workshop Tools'))}</h2></div><div class="card-body" style="padding:0">${rows(['Tool','Use'],body)}</div></div>
  <p class="note">${esc(t('Tool names are transliterated where no settled local trade term exists. Confirm with your workshop before printing labels.'))}</p>`;
}
function kcRegional(){
  const regionCards=Object.values(REGIONS).map(r=>`
    <div class="card" style="padding:16px 18px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div style="font-weight:600;font-size:var(--fs-md)">${esc(kcName({en:r.country,ne:r.countryNe,hi:r.countryHi}))}</div>${kcBadge(r.code,'badge-info')}</div>
      <div class="small muted" style="margin-top:8px;display:grid;gap:4px">
        <div><strong>${esc(t('Currency'))}:</strong> ${esc(r.currency)} (${esc(r.symbol)})</div>
        <div><strong>${esc(t('Tax'))}:</strong> ${esc(r.tax.label)} — ${esc(t(r.tax.status))}</div>
        <div><strong>${esc(t('Fiscal Year'))}:</strong> ${esc(t(r.fiscalYear))}</div>
        <div><strong>${esc(t('Trade Units'))}:</strong> ${esc(r.tradeUnits.map(u=>t(u)).join(', '))}</div>
        <div><strong>${esc(t('Hallmarking'))}:</strong> ${esc(r.hallmark.authority)} — ${esc(t(r.hallmark.status))}</div>
        <div><strong>${esc(t('Invoice Fields'))}:</strong> ${esc(r.invoice.fields.map(f=>t(f)).join(', '))}</div>
      </div>
      <div class="small muted" style="margin-top:8px">${r.notes.map(n=>`<div>• ${esc(t(n))}</div>`).join('')}</div>
    </div>`).join('');
  const termRows=REGIONAL_TERMS.map(term=>`<tr><td>${esc(kcName(term))}</td><td class="muted small">${esc(term.en)}</td><td>${kcBadge(term.region,'badge-info')}</td><td>${esc(t(term.kind)||term.kind)}</td><td class="small muted">${esc(term.note||'')}${term.needsVerification?' '+kcBadge(t('Needs Verification'),'badge-warn'):''}</td></tr>`).join('');
  return `
    <div class="section"><div class="section-title">${esc(t('Regional Config'))}</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px">${regionCards}</div></div>
    <div class="card section"><div class="card-header"><h2 class="card-title">${esc(t('Regional Terminology'))}</h2></div><div class="card-body" style="padding:0">${rows(['Term','English','Region','Kind','Notes'],termRows)}</div></div>
    <p class="note note-caution">${esc(t('Tax rates, hallmarks and certification details must be verified against current official sources before use on invoices.')).replace('Tax rates','Tax rates')}</p>`;
}
function openKcEditor(name,id){
  const cfg=KC_DATASETS[name]; if(!cfg) return;
  const rec=id?kcData(name,cfg.base).find(r=>r.id===id):{id:'',en:'',ne:'',hi:'',note:''};
  if(!rec) return;
  const modal=document.createElement('div'); modal.className='modal-overlay';
  modal.innerHTML=`<div class="modal" style="max-width:640px"><div class="modal-header"><h3 class="modal-title">${esc(t('Edit master record'))} — ${esc(t(cfg.label))}</h3><button class="modal-close" data-close-modal>×</button></div><div class="modal-body"><p class="small muted">${esc(t('Edit the JSON fields. Keep the structure valid.'))}</p><textarea class="field-textarea" id="kcEditJson" style="min-height:320px;font-family:var(--font-mono);font-size:var(--font-xs)">${esc(JSON.stringify(rec,null,2))}</textarea></div><div class="modal-footer"><button type="button" class="btn btn-champagne" data-kc-save="${esc(name)}:${esc(id)}">${esc(t('Save'))}</button><button type="button" class="btn btn-ghost" data-close-modal>${esc(t('Cancel'))}</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>modal.remove()));
  modal.addEventListener('click',ev=>{if(ev.target===modal)modal.remove();});
}
function knowledge(){
  const tabBtn=(key,label)=>`<button class="tab ${kcUI.tab===key?'active':''}" data-kc-tab="${key}">${esc(t(label))}</button>`;
  const panel=kcUI.tab==='metals'?kcMetals():kcUI.tab==='measurements'?kcMeasurements():kcUI.tab==='converter'?kcConverter():kcUI.tab==='tools'?kcTools():kcUI.tab==='regional'?kcRegional():kcUI.tab==='gems'?kcGems():kcUI.tab==='processes'?kcProcesses():kcUI.tab==='currencies'?kcCurrencies():kcUI.tab==='standards'?kcStandards():kcUI.tab==='masters'&&kcCanEdit()?kcMasters():kcCatalogue();
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.knowledge[0]}</h1><p class="page-subtitle">${PAGE_TITLES.knowledge[1]}</p></div></div></div>
<div class="card section"><div class="card-body">
  <div class="field" style="max-width:560px;margin:0 auto"><label class="field-label" for="kcSearch">${esc(t('Search knowledge base'))}</label><input class="field-input" id="kcSearch" name="kcSearch" type="search" placeholder="${esc(t('Search categories, units, metals and terms'))}" value="${esc(kcUI.query)}"></div>
  <div id="kcResults" style="margin-top:16px${kcUI.query?'':';display:none'}">${kcUI.query?kcSearchResults(kcUI.query):''}</div>
</div></div>
${kcUI.query?'':`<div class="tabs" style="margin:8px 0 16px;flex-wrap:wrap">${tabBtn('catalogue','Catalogue')}${tabBtn('metals','Metals & Purity')}${tabBtn('measurements','Measurements')}${tabBtn('converter','Converter')}${tabBtn('tools','Tools')}${tabBtn('gems','Gems')}${tabBtn('processes','Processes')}${tabBtn('currencies','Currencies')}${tabBtn('standards','Standards')}${tabBtn('regional','Regional Config')}${kcCanEdit()?tabBtn('masters','Master Data'):''}</div>${panel}`}
<p class="small muted" style="margin-top:8px">${esc(t('Master data for jewellery operations'))} · ${esc(t('Records flagged “Needs Verification” are reference values, not certified standards.'))}</p>`;
}

function render() {
  ensureAccounting(state);
  ensureTax(state);
ensureTax(state);
  // Check authentication
  if (!window.RatnaOS?.auth?.isAuthenticated()) {
    renderLoginPage();
    return;
  }
  const currentUser = window.RatnaOS.auth.getCurrentUser();
  const allowedTabs = getAllowedTabs();
  // Redirect to first allowed tab if current tab not allowed
  if (!allowedTabs.includes(tab)) {
    tab = allowedTabs[0] || 'dashboard';
  }
  const pageFn={dashboard,inventory,pos,metals,exchange,karigar,production,reports,accounting,tax,knowledge,settings}[tab]||dashboard;
  document.querySelector('#app').innerHTML=`
<div class="app">
  <aside class="sidebar ${sidebarOpen?'open':''}" id="sidebar" role="navigation" aria-label="Main navigation">
    <div class="sidebar-header"><div class="sidebar-logo">${icon('gem')}</div><span class="sidebar-title">RatnaOS</span></div>
    <nav class="sidebar-nav">${allowedTabs.map(k=>`<button class="nav-item ${tab===k?'active':''}" data-tab="${k}" title="${PAGE_TITLES[k][0]}">${NAV_ICONS[k]}<span class="nav-label">${PAGE_TITLES[k][0]}</span></button>`).join('')}</nav>
    <div class="sidebar-footer"><div class="sidebar-version">v0.1.0</div></div>
  </aside>
  <header class="header" role="banner"><div class="header-left"><button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar" aria-expanded="${sidebarOpen}">${icon('menu')}</button><div><h1 class="page-title">${PAGE_TITLES[tab]?PAGE_TITLES[tab][0]:tab}</h1><p class="page-subtitle">${PAGE_TITLES[tab]?PAGE_TITLES[tab][1]:''}</p></div></div><div class="header-right" style="display:flex;align-items:center;gap:12px"><div class="header-actions"><div class="lang-switch" role="group" aria-label="${esc(t('Language'))}">${[['en','EN'],['ne','ने'],['hi','हि']].map(([code,label])=>`<button type="button" class="lang-btn ${getLanguage()===code?'active':''}" data-lang-set="${code}" title="${esc(LOCALES[code]?.native||label)}" aria-pressed="${getLanguage()===code?'true':'false'}">${label}</button>`).join('')}</div><button class="icon-btn tooltip" data-tab="inventory" data-tooltip="Search inventory" aria-label="Search inventory">${icon('search')}</button><button class="icon-btn tooltip" data-tab="production" data-tooltip="Notifications" aria-label="Notifications">${icon('bell')}</button></div><div class="user-info" style="display:flex;align-items:center;gap:8px"><span class="small muted">${esc(currentUser?.name||'User')}</span><span class="badge" style="font-size:var(--fs-2xs)">${esc(t(currentUser?.role||''))}</span></div><button class="btn btn-ghost btn-sm" data-auth-logout>${icon('logout')}<span>${t('Logout')}</span></button><button class="btn btn-champagne" data-tab="inventory">${icon('plus')}<span>${t('Add')}</span></button></div></header>
  <main class="main" id="mainContent" role="main">

    ${pageFn()}
  </main>
</div>`;
  document.title=`${PAGE_TITLES[tab]?PAGE_TITLES[tab][0]:tab} · RatnaOS`;
  localizeDom(document.querySelector('#app'));
  bindDynamicUI();
}

function karigar(){
  const karigars=state.karigars||[];
  const jobs=(state.jobs||[]).map(j=>{ensureJobShape(j);recalcJobFinancials(j);return j;});
  const selectedKarigarId=state.karigarSelectedId||'';
  const selectedJobId=state.karigarSelectedJobId||'';
  const selK=selectedKarigarId?getKarigar(selectedKarigarId):null;
  const selJ=selectedJobId?getJob(selectedJobId):null;
  if(selJ){ensureJobShape(selJ);recalcJobFinancials(selJ);syncJobKarigar(selJ);}
  const filterStatus=state.karigarJobFilterStatus||'all';
  const filterK=state.karigarJobFilterKarigar||'all';
  const q=(state.karigarJobSearch||'').toLowerCase();
  let jobList=jobs.slice();
  if(filterStatus!=='all') jobList=jobList.filter(j=>j.status===filterStatus);
  if(filterK!=='all') jobList=jobList.filter(j=>j.assignedKarigarId===filterK);
  if(q) jobList=jobList.filter(j=>[j.code,j.description,j.name,j.assignedKarigarName,j.karigar].join(' ').toLowerCase().includes(q));
  jobList.sort((a,b)=>(b.updatedAt||b.createdAt||'').localeCompare(a.updatedAt||a.createdAt||''));

  const statusCounts=JOB_STATUSES.reduce((acc,s)=>{acc[s]=jobs.filter(j=>j.status===s).length;return acc;},{});
  const kProfileRows=karigars.map(k=>{
    updateKarigarStats(k.id);
    const active=jobs.filter(j=>j.assignedKarigarId===k.id && isJobActiveStatus(j.status)).length;
    const completed=jobs.filter(j=>j.assignedKarigarId===k.id && j.status==='Completed').length;
    return `<tr class="${selectedKarigarId===k.id?'row-selected':''}"><td><strong>${esc(k.name)}</strong><div class="small muted">${esc(k.phone||'')}</div></td><td>${esc((k.specialties||[]).join(', ')||'-')}</td><td class="align-right mono">${money(num(k.ratePerGram))}/g</td><td class="align-center"><span class="badge badge-inprogress">${active}</span></td><td class="align-center"><span class="badge badge-completed">${completed}</span></td><td class="align-right mono">${num(k.totalWastage||0).toFixed(3)} g</td><td class="align-right mono">${money(num(k.totalLabourEarned||0))}</td><td class="align-center"><button class="btn btn-ghost btn-sm" data-k-select="${esc(k.id)}">View</button></td></tr>`;
  }).join('');

  const jobRows=jobList.map(j=>{
    const due=j.deadline||j.due||'';
    const overdue=due && j.status!=='Completed' && new Date(due) < new Date(new Date().toISOString().slice(0,10));
    return `<tr class="${selectedJobId===j.id?'row-selected':''}"><td><code class="mono">${esc(j.code)}</code></td><td>${esc(j.description||j.name||'-')}</td><td>${esc(j.assignedKarigarName||j.karigar||'Unassigned')}</td><td>${jobStatusBadge(j.status)}</td><td class="mono ${overdue?'text-danger':''}">${esc(due||'-')}</td><td class="mono align-right">${getJobIssuedWeight(j).toFixed(3)}</td><td class="mono align-right">${getJobReturnedWeight(j).toFixed(3)}</td><td class="mono align-right">${money(num(j.labourCharges?.total||0))}</td><td class="align-center"><button class="btn btn-ghost btn-sm" data-job-select="${esc(j.id)}">Open</button></td></tr>`;
  }).join('');

  const kEditId=state.karigarEditId||'';
  const kEdit=kEditId?getKarigar(kEditId):null;

  const kDetail=selK?(()=>{
    updateKarigarStats(selK.id);
    const kJobs=getKarigarJobs(selK.id).map(j=>{ensureJobShape(j);recalcJobFinancials(j);return j;});
    return `<div class="card section"><div class="card-header"><h2 class="card-title">Karigar Profile: ${esc(selK.name)}</h2><div class="page-header-actions"><button class="btn btn-secondary btn-sm" data-k-edit="${esc(selK.id)}">Edit Profile</button></div></div><div class="card-body"><div class="detail-grid"><div><span class="muted">Phone</span><div>${esc(selK.phone||'-')}</div></div><div><span class="muted">Address</span><div>${esc(selK.address||'-')}</div></div><div><span class="muted">Specialties</span><div>${esc((selK.specialties||[]).join(', ')||'-')}</div></div><div><span class="muted">Status</span><div><span class="badge ${selK.status==='active'?'badge-completed':'badge-warn'}">${esc(selK.status||'active')}</span></div></div><div><span class="muted">Rate / Gram</span><div class="mono">${money(num(selK.ratePerGram))}</div></div><div><span class="muted">Rate / Tola</span><div class="mono">${money(num(selK.ratePerTola))}</div></div><div><span class="muted">Issued</span><div class="mono">${num(selK.totalWeightIssued||0).toFixed(3)} g</div></div><div><span class="muted">Returned</span><div class="mono">${num(selK.totalWeightReturned||0).toFixed(3)} g</div></div><div><span class="muted">Wastage</span><div class="mono">${num(selK.totalWastage||0).toFixed(3)} g</div></div><div><span class="muted">Labour Earned</span><div class="mono">${money(num(selK.totalLabourEarned||0))}</div></div></div><h4 style="margin-top:20px">Assigned Jobs</h4>${rows(['Job','Description','Status','Deadline','Issued','Returned','Labour'],kJobs.map(j=>`<tr><td><code class="mono">${esc(j.code)}</code></td><td>${esc(j.description||'')}</td><td>${jobStatusBadge(j.status)}</td><td class="mono">${esc(j.deadline||j.due||'-')}</td><td class="mono align-right">${getJobIssuedWeight(j).toFixed(3)}</td><td class="mono align-right">${getJobReturnedWeight(j).toFixed(3)}</td><td class="mono align-right">${money(num(j.labourCharges?.total||0))}</td></tr>`).join(''))}</div></div>`;
  })():'';

  const jobDetail=selJ?(()=>{
    const karigarOpts=['<option value="">Unassigned</option>'].concat(karigars.map(k=>`<option value="${esc(k.id)}" ${selJ.assignedKarigarId===k.id?'selected':''}>${esc(k.name)}</option>`)).join('');
    const stagesHtml=(selJ.stages||[]).slice().sort((a,b)=>(JOB_STAGES.findIndex(x=>x.id===a.id))-(JOB_STAGES.findIndex(x=>x.id===b.id))).map(s=>{
      const def=JOB_STAGES.find(x=>x.id===s.id)||{};
      const opts=['pending','in_progress','completed','skipped'].map(o=>`<option value="${o}" ${s.status===o?'selected':''}>${t({pending:'Pending',in_progress:'In Progress',completed:'Completed',skipped:'Skipped'}[o])}</option>`).join('');
      return `<div class="stage-row"><div class="stage-meta"><strong>${esc(t(s.label||s.id))}</strong><div class="small muted">${t('Start')}: ${esc((s.startedAt||'').slice(0,16).replace('T',' ')||'-')} · ${t('Done')}: ${esc((s.completedAt||'').slice(0,16).replace('T',' ')||'-')}</div></div><div class="stage-controls"><select class="field-select" data-job-stage-status="${esc(selJ.id)}" data-stage-id="${esc(s.id)}">${opts}</select><input class="field-input" placeholder="${t('Notes')}" value="${esc(s.notes||'')}" data-job-stage-note="${esc(selJ.id)}" data-stage-id="${esc(s.id)}"></div></div>`;
    }).join('');
    const photosHtml=(selJ.photos||[]).map(p=>`<div class="photo-card"><img src="${p.data}" alt="${esc(p.name||'photo')}"><div class="small mono">${esc((p.date||'').slice(0,10))}</div><div class="small muted">${esc(p.note||'')}</div></div>`).join('')||`<p class="muted">${t('No photographs yet.')}</p>`;
    const qcHtml=(selJ.qualityChecks||[]).map(q=>`<tr><td class="mono">${esc(q.date||'')}</td><td>${esc(q.stage||'')}</td><td><span class="badge ${q.result==='Pass'?'badge-completed':q.result==='Fail'?'badge-rework':'badge-qc'}">${esc(t(q.result||'Pending'))}</span></td><td>${esc(q.checker||'-')}</td><td>${esc(q.notes||'')}</td></tr>`).join('');
    const issuesHtml=(selJ.metalIssues||[]).map(m=>`<tr><td class="mono">${esc(m.date||'')}</td><td><code class="mono">${esc(m.voucher||'-')}</code></td><td>${esc(m.metal)} ${esc(m.purity)}</td><td class="mono align-right">${num(m.weight).toFixed(3)}</td><td>${esc(m.notes||'')}</td></tr>`).join('');
    const returnsHtml=(selJ.materialReturns||[]).map(r=>`<tr><td class="mono">${esc(r.date||'')}</td><td><code class="mono">${esc(r.voucher||'-')}</code></td><td><span class="badge ${r.type==='WASTAGE'?'badge-warn':'badge-completed'}">${esc(r.type||'RETURN')}</span></td><td>${esc(r.metal)} ${esc(r.purity)}</td><td class="mono align-right">${num(r.weight).toFixed(3)}</td><td>${esc(r.notes||'')}</td></tr>`).join('');
    const issued=getJobIssuedWeight(selJ), returned=getJobReturnedWeight(selJ), net=getJobNetIssued(selJ), labour=num(selJ.labourCharges?.total||0);
    return `<div class="card section" id="jobDetail"><div class="card-header"><h2 class="card-title">Job: ${esc(selJ.code)}</h2><div class="page-header-actions"><button class="btn btn-secondary btn-sm" data-job-print="${esc(selJ.id)}">Job Card</button></div></div><div class="card-body">
      <div class="detail-grid"><div><span class="muted">Description</span><div>${esc(selJ.description||selJ.name||'-')}</div></div><div><span class="muted">Karigar</span><div>${esc(selJ.assignedKarigarName||selJ.karigar||'Unassigned')}</div></div><div><span class="muted">Status</span><div>${jobStatusBadge(selJ.status)}</div></div><div><span class="muted">Priority</span><div><span class="badge">${esc(selJ.priority||'normal')}</span></div></div><div><span class="muted">Deadline</span><div class="mono">${esc(selJ.deadline||selJ.due||'-')}</div></div><div><span class="muted">Metal</span><div>${esc(selJ.metalType||'-')} ${esc(selJ.purity||'')}</div></div><div><span class="muted">Issued</span><div class="mono">${issued.toFixed(3)} g</div></div><div><span class="muted">Returned</span><div class="mono">${returned.toFixed(3)} g</div></div><div><span class="muted">Net on Job</span><div class="mono">${net.toFixed(3)} g</div></div><div><span class="muted">Wastage (allowed/actual)</span><div class="mono">${num(selJ.wastageAllowed).toFixed(3)} / ${num(selJ.wastageActual).toFixed(3)} g</div></div><div><span class="muted">Labour</span><div class="mono">${money(labour)}</div></div><div><span class="muted">QC</span><div><span class="badge">${esc(selJ.qcStatus||'pending')}</span></div></div></div>

      <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="card-sub"><h4>Assignment & Charges</h4><form id="jobUpdateForm" class="form" data-job-id="${esc(selJ.id)}"><div class="field"><label class="field-label">Karigar</label><select class="field-select" name="assignedKarigarId">${karigarOpts}</select></div>${select('status','Status',JOB_STATUSES,selJ.status)}${input('deadline','Deadline','date',selJ.deadline||selJ.due||'','')}${select('priority','Priority',PRIORITY_OPTIONS,selJ.priority||'normal')}${select('metalType','Metal',METAL_TYPES,selJ.metalType||'Gold')}${input('purity','Purity','text',selJ.purity||'22K','')}${input('wastageAllowed','Wastage Allowed (g)','number',num(selJ.wastageAllowed).toFixed(3),'min="0" step="0.001"')}${select('labourMethod','Labour Method',LABOUR_METHODS,selJ.labourCharges?.method||'perGram')}${input('labourRate','Labour Rate','number',num(selJ.labourCharges?.rate||0),'min="0" step="0.01"')}<div class="field-full"><button class="btn btn-champagne" type="submit">Save Job</button></div></form></div>
        <div class="card-sub"><h4>Metal Issue Voucher</h4><form id="jobIssueForm" class="form" data-job-id="${esc(selJ.id)}">${input('date','Date','date',new Date().toISOString().slice(0,10),'')}${input('voucher','Voucher No','text',generateMetalTxnNumber('ISSUE'),'')}${select('metal','Metal',METAL_TYPES,selJ.metalType||'Gold')}${input('purity','Purity','text',selJ.purity||'22K','')}${input('weight','Weight (g)','number','','min="0.001" step="0.001"')}${input('notes','Notes','text','','')}<div class="field-full"><button class="btn btn-champagne" type="submit">Record Issue (updates metal balance)</button></div></form></div>
      </div>

      <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="card-sub"><h4>Material Return / Wastage</h4><form id="jobReturnForm" class="form" data-job-id="${esc(selJ.id)}">${input('date','Date','date',new Date().toISOString().slice(0,10),'')}${input('voucher','Voucher No','text',generateMetalTxnNumber('RETURN'),'')}${select('type','Type',['RETURN','WASTAGE'],'RETURN')}${select('metal','Metal',METAL_TYPES,selJ.metalType||'Gold')}${input('purity','Purity','text',selJ.purity||'22K','')}${input('weight','Weight (g)','number','','min="0.001" step="0.001"')}${input('notes','Notes','text','','')}<div class="field-full"><button class="btn btn-secondary" type="submit">Record Return (updates metal balance)</button></div></form></div>
        <div class="card-sub"><h4>Quality Check</h4><form id="jobQCForm" class="form" data-job-id="${esc(selJ.id)}">${input('date','Date','date',new Date().toISOString().slice(0,10),'')}${select('result','Result',QC_RESULTS,'Pass')}${input('stage','Stage','text','QC','')}${input('checker','Checker','text','','')}${input('notes','Notes','text','','')}<div class="field-full"><button class="btn btn-secondary" type="submit">Save Quality Check</button></div></form><p class="small muted" style="margin-top:8px">Pass in QC can complete job; Fail moves job to Rework.</p></div>
      </div>

      <div class="section"><h3 class="card-title" style="font-size:1rem;margin-bottom:12px">Production Stages</h3><div class="stage-list">${stagesHtml}</div></div>

      <div class="layout-2col section"><div><h3 class="card-title" style="font-size:1rem;margin-bottom:12px">Metal Issues</h3>${rows(['Date','Voucher','Metal','Weight (g)','Notes'],issuesHtml)}</div><div><h3 class="card-title" style="font-size:1rem;margin-bottom:12px">Material Returns</h3>${rows(['Date','Voucher','Type','Metal','Weight (g)','Notes'],returnsHtml)}</div></div>
      <div class="layout-2col section"><div><h3 class="card-title" style="font-size:1rem;margin-bottom:12px">Quality Checks</h3>${rows(['Date','Stage','Result','Checker','Notes'],qcHtml)}</div><div><h3 class="card-title" style="font-size:1rem;margin-bottom:12px">Job Photographs</h3><div style="margin-bottom:12px"><input type="file" id="jobPhotoInput" accept="image/*" data-job-photo="${esc(selJ.id)}" multiple></div><div class="photo-grid">${photosHtml}</div></div></div>
    </div></div>`;
  })():'';

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.karigar[0]}</h1><p class="page-subtitle">${PAGE_TITLES.karigar[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-k-new>New Karigar</button></div></div></div>
<div class="metric-grid">${JOB_STATUSES.map(s=>card(t(s),statusCounts[s]||0,t('Jobs'))).join('')}${card('Karigars',karigars.length,t('Profiles'))}</div>
<div class="layout"><div>
  <div class="card"><div class="card-header"><h2 class="card-title">${kEdit?'Edit Karigar Profile':'Add Karigar Profile'}</h2></div><div class="card-body"><form id="karigarForm" class="form" data-edit-id="${esc(kEditId)}">${input('name','Karigar / Workshop Name','text',kEdit?.name||'','')}${input('phone','Phone','text',kEdit?.phone||'','')}${input('address','Address','text',kEdit?.address||'','')}${select('status','Status',['active','inactive'],kEdit?.status||'active')}${input('ratePerGram','Rate per Gram (NPR)','number',num(kEdit?.ratePerGram||0),'min="0" step="0.01"')}${input('ratePerTola','Rate per Tola (NPR)','number',num(kEdit?.ratePerTola||0),'min="0" step="0.01"')}<div class="field field-full"><label class="field-label">Specialties</label><input class="field-input" name="specialties" value="${esc((kEdit?.specialties||[]).join(', '))}" placeholder="Casting, Filing, Polishing, Stone Setting"></div><div class="field-full" style="display:flex;gap:8px"><button class="btn btn-champagne" type="submit">${kEdit?'Update Profile':'Save Profile'}</button>${kEdit?'<button class="btn btn-ghost" type="button" data-k-cancel-edit>Cancel</button>':''}</div></form></div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">Create Job Assignment</h2></div><div class="card-body"><form id="jobCreateForm" class="form">${input('code','Job Code','text',generateJobNumber(),'')}${input('description','Work Description','text','','')}<div class="field"><label class="field-label">Karigar</label><select class="field-select" name="assignedKarigarId"><option value="">Unassigned</option>${karigars.map(k=>`<option value="${esc(k.id)}">${esc(k.name)}</option>`).join('')}</select></div>${select('priority','Priority',PRIORITY_OPTIONS,'normal')}${input('deadline','Deadline','date','','')}${select('metalType','Metal',['Gold','Silver','Platinum'],'Gold')}${input('purity','Purity','text','22K','')}${input('wastageAllowed','Wastage Allowed (g)','number','0','min="0" step="0.001"')}${select('labourMethod','Labour Method',LABOUR_METHODS,'perGram')}${input('labourRate','Labour Rate','number','0','min="0" step="0.01"')}<div class="field-full">${input('notes','Notes','text','','')}</div><div class="field-full"><button class="btn btn-champagne" type="submit">Create Job</button></div></form><p class="note note-caution" style="margin-top:12px">Metal issues/returns record ledger transactions and automatically update metal balances.</p></div></div>
</div><div>
  <div class="card"><div class="card-header"><h2 class="card-title">Karigar Profiles</h2></div><div class="card-body" style="padding:0">${rows(['Karigar','Specialties','Rate','Active','Done','Wastage','Labour','Action'],kProfileRows)}</div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">Job Assignments</h2></div><div class="card-body"><div class="toolbar" style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap"><input type="search" id="karigarJobSearch" class="field-input" placeholder="Search jobs..." value="${esc(state.karigarJobSearch||'')}" style="max-width:260px"><select class="field-select" id="karigarJobFilterStatus" style="width:auto;min-width:150px">${['all',...JOB_STATUSES].map(s=>`<option value="${s}" ${filterStatus===s?'selected':''}>${s==='all'?'All Status':s}</option>`).join('')}</select><select class="field-select" id="karigarJobFilterKarigar" style="width:auto;min-width:170px"><option value="all">All Karigars</option>${karigars.map(k=>`<option value="${esc(k.id)}" ${filterK===k.id?'selected':''}>${esc(k.name)}</option>`).join('')}</select></div>${rows(['Code','Description','Karigar','Status','Deadline','Issued','Returned','Labour',''],jobRows)}</div></div>
</div></div>
${kDetail}
${jobDetail}`;
}

function production(){
  const mat=state.materials||{metals:[],gemstones:[],consumables:[]};
  const mMetals=mat.metals||[];
  const mStones=mat.gemstones||[];
  const mCons=mat.consumables||[];
  const boms=state.boms||[];
  const jobs=(state.jobs||[]).map(j=>{ensureJobShape(j);recalcJobFinancials(j);return j;});
  const metalPurities=['24K','22K','18K','14K','Rose Gold','White Gold','999 Silver','925 Silver','Platinum'];
  const stoneTypes=['Diamond','Ruby','Sapphire','Emerald','Cubic Zirconia','Coral','Pearl','Navaratna'];
  const processTypes=['Casting','Stone Setting','Engraving/Meenakari','Polishing','Rhodium Plating'];
  const jartiPresets={'Handcrafted/Filigree':10,'Bridal Set':12,'Machine Cast':4,'Chain/Plain':3,'Stone Setting':5};

  function metalRate(p){if((p||'').includes('Silver'))return num(state.rates.silver);if((p||'').includes('Platinum'))return 3500;return num(state.rates.gold);}
  function calcBom(b){
    const m=b.metal||{};
    const gross=toGram(m.grossWeight,m.grossUnit||'gram');
    const stoneW=toGram(m.stoneWeight,m.stoneUnit||'gram');
    const net=rnd(Math.max(0,gross-stoneW));
    const rate=metalRate(m.purity);
    const metalCost=rnd(net*rate);
    const wastagePct=num(b.wastagePct);
    const wastageWt=rnd(net*wastagePct/100);
    const making=b.making||{};
    let makingCost=0;
    if(making.type==='perGram')makingCost=rnd(net*num(making.rate));
    else if(making.type==='perTola')makingCost=rnd((net/11.664)*num(making.rate));
    else if(making.type==='flat')makingCost=num(making.rate);
    else if(making.type==='pctMetal')makingCost=rnd(metalCost*num(making.rate)/100);
    else if(making.type==='tiered'){makingCost=Object.entries(making.tiers||{}).reduce((s,[,v])=>s+num(v),0);} 
    let stoneCost=0;
    (b.stones||[]).forEach(st=>{const w=toGram(st.weight,st.unit||'carat');stoneCost+=rnd(w*num(st.rate)+num(st.setting));});
    const hallmark=num(b.hallmark||0);
    const overhead=num(b.overhead||0);
    const wastageCost=rnd(wastageWt*rate);
    const total=rnd(metalCost+wastageCost+makingCost+stoneCost+hallmark+overhead);
    const breakdown={metal:metalCost,wastage:wastageCost,making:makingCost,stones:stoneCost,hallmark,overhead};
    return {netWeight:net,metalCost,wastageWt,wastage:wastageCost,makingCost,stoneCost,total,breakdown};
  }

  const stageColumns=JOB_STAGES.map(st=>{
    const mapped=jobs.filter(j=>{
      if(j.status==='Completed') return st.id==='delivered';
      if(j.status==='QC' || j.status==='Rework') return st.id==='qc';
      const inprog=(j.stages||[]).find(s=>s.status==='in_progress');
      if(inprog) return inprog.id===st.id;
      const next=(j.stages||[]).find(s=>s.status!=='completed' && s.status!=='skipped');
      if(next) return next.id===st.id;
      return st.id==='received';
    });
    const cards=mapped.map(j=>`<div class="kanban-card"><div style="display:flex;justify-content:space-between;gap:8px"><code class="mono">${esc(j.code)}</code>${jobStatusBadge(j.status)}</div><div style="margin-top:6px;font-weight:600">${esc(j.description||j.name||'')}</div><div class="small muted">${esc(j.assignedKarigarName||j.karigar||'Unassigned')} · Due ${esc(j.deadline||j.due||'-')}</div><div class="small mono" style="margin-top:6px">Issued ${getJobIssuedWeight(j).toFixed(3)}g · Net ${getJobNetIssued(j).toFixed(3)}g</div><div style="margin-top:8px"><button class="btn btn-ghost btn-sm" data-job-select="${esc(j.id)}" data-tab="karigar">Open</button></div></div>`).join('') || '<div class="small muted">No jobs</div>';
    return `<div class="kanban-col"><div class="kanban-head"><strong>${esc(t(st.label))}</strong><span class="badge">${mapped.length}</span></div><div class="kanban-body">${cards}</div></div>`;
  }).join('');

  const jobsRows=jobs.map(j=>`<tr><td><code class="mono">${esc(j.code)}</code></td><td>${esc(j.description||'')}</td><td>${esc(j.assignedKarigarName||j.karigar||'-')}</td><td>${jobStatusBadge(j.status)}</td><td class="mono">${esc(j.deadline||j.due||'-')}</td><td class="mono align-right">${getJobIssuedWeight(j).toFixed(3)}</td><td class="mono align-right">${getJobReturnedWeight(j).toFixed(3)}</td><td class="mono align-right">${num(j.wastageActual).toFixed(3)}</td><td class="mono align-right">${money(num(j.labourCharges?.total||0))}</td><td class="align-center"><button class="btn btn-ghost btn-sm" data-job-select="${esc(j.id)}" data-tab="karigar">Manage</button></td></tr>`).join('');

  const allIssues=[]; jobs.forEach(j=>{(j.metalIssues||[]).forEach(m=>allIssues.push({...m,jobCode:j.code,karigar:m.karigar||j.assignedKarigarName||j.karigar||''}));});
  const allReturns=[]; jobs.forEach(j=>{(j.materialReturns||[]).forEach(r=>allReturns.push({...r,jobCode:j.code,karigar:r.karigar||j.assignedKarigarName||j.karigar||''}));});

  const bomTable=boms.map((b)=>{const c=calcBom(b);return `<tr><td><code class="mono">${esc(b.code)}</code></td><td>${esc(b.name)}</td><td class="mono">${c.netWeight.toFixed(3)}g</td><td class="align-right mono">${money(c.metalCost)}</td><td class="align-right mono">${money(c.wastage)}</td><td class="align-right mono">${money(c.makingCost)}</td><td class="align-right mono">${money(c.stoneCost)}</td><td class="align-right mono"><strong>${money(c.total)}</strong></td><td class="align-center"><button class="btn btn-ghost btn-sm" data-bomview="${esc(b.id)}" title="View details"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></td></tr>`;}).join('');

  function renderCostCard(b){
    const c=calcBom(b);
    const pct=(k)=>c.total?((c.breakdown[k]/c.total)*100).toFixed(1):0;
    return `<div class="card section"><div class="card-header"><h2 class="card-title">Cost Summary: ${esc(b.code)} - ${esc(b.name)}</h2></div><div class="card-body"><div class="metric-grid" style="grid-template-columns:repeat(2,1fr);margin-bottom:24px">${card('Total Production Cost',money(c.total))}${card('Cost per Gram',money(c.netWeight?c.total/c.netWeight:0))}${card('Net Metal Weight',c.netWeight.toFixed(3)+' g')}${card('Wastage (Jarti)',c.wastageWt.toFixed(3)+' g')}</div><div class="breakdown"><div class="breakdown-title">Cost Breakdown</div><div class="breakdown-bars">${Object.entries(c.breakdown).map(([k,v])=>`<div class="breakdown-row"><span class="breakdown-label">${k.charAt(0).toUpperCase()+k.slice(1)}</span><div class="breakdown-bar"><div class="breakdown-fill" style="width:${pct(k)}%"></div></div><span class="breakdown-value">${money(v)} (${pct(k)}%)</span></div>`).join('')}</div></div><div class="section"><div class="breakdown-title">Pricing & Margin Simulator</div><form id="pricing" class="form" data-bom="${esc(b.id)}" style="margin-top:12px">${input('markup','Target Markup %','number','25','min="0" step="0.1"')}<div class="field-full"><button class="btn btn-gold" type="submit" style="width:100%">Calculate Selling Price</button></div></form><p class="muted" id="priceResult" style="margin-top:12px;min-height:60px"></p></div><div class="section"><div class="breakdown-title">Export</div><div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-outline-gold" data-bomcsv="${esc(b.id)}">Job Card (CSV)</button><button class="btn btn-outline-gold" data-bompdf="${esc(b.id)}">Cost Sheet (CSV)</button></div></div></div></div>`;
  }

  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.production[0]}</h1><p class="page-subtitle">${PAGE_TITLES.production[1]}</p></div><div class="page-header-actions"><button class="btn btn-champagne" data-tab="karigar">Manage Jobs & Karigars</button></div></div></div>
<div class="metric-grid">${JOB_STATUSES.map(s=>card(t(s), jobs.filter(j=>j.status===s).length, t('Production jobs'))).join('')}${card('Total Issued (g)', rnd(jobs.reduce((s,j)=>s+getJobIssuedWeight(j),0)).toFixed(3), t('Across jobs'))}${card('Total Wastage (g)', rnd(jobs.reduce((s,j)=>s+num(j.wastageActual),0)).toFixed(3), t('Actual'))}</div>
<div class="card"><div class="card-header"><h2 class="card-title">Production Stages Pipeline</h2></div><div class="card-body"><div class="kanban">${stageColumns}</div><p class="note note-caution" style="margin-top:12px">${t('Open a job in Karigar & Jobs to update stages, photographs, quality checks, vouchers and charges. Metal issues/returns automatically update metal balances.')}</p></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Production Jobs & Material Flow</h2></div><div class="card-body" style="padding:0">${rows(['Job','Description','Karigar','Status','Deadline','Issued (g)','Returned (g)','Wastage (g)','Labour','Action'],jobsRows)}</div></div>
<div class="layout-2col section"><div class="card"><div class="card-header"><h2 class="card-title">Metal Issue Vouchers</h2></div><div class="card-body" style="padding:0">${rows(['Date','Job','Karigar','Voucher','Metal','Weight (g)','Notes'], allIssues.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(m=>`<tr><td class="mono">${esc(m.date||'')}</td><td><code class="mono">${esc(m.jobCode||'-')}</code></td><td>${esc(m.karigar||'-')}</td><td><code class="mono">${esc(m.voucher||'-')}</code></td><td>${esc(m.metal||'')} ${esc(m.purity||'')}</td><td class="mono align-right">${num(m.weight).toFixed(3)}</td><td>${esc(m.notes||'')}</td></tr>`).join(''))}</div></div><div class="card"><div class="card-header"><h2 class="card-title">Material Returns & Wastage</h2></div><div class="card-body" style="padding:0">${rows(['Date','Job','Karigar','Voucher','Type','Metal','Weight (g)','Notes'], allReturns.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(r=>`<tr><td class="mono">${esc(r.date||'')}</td><td><code class="mono">${esc(r.jobCode||'-')}</code></td><td>${esc(r.karigar||'-')}</td><td><code class="mono">${esc(r.voucher||'-')}</code></td><td><span class="badge ${r.type==='WASTAGE'?'badge-warn':'badge-completed'}">${esc(r.type||'RETURN')}</span></td><td>${esc(r.metal||'')} ${esc(r.purity||'')}</td><td class="mono align-right">${num(r.weight).toFixed(3)}</td><td>${esc(r.notes||'')}</td></tr>`).join(''))}</div></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Raw Materials Master</h2></div><div class="card-body"><div class="tabs" style="margin-bottom:20px"><button class="tab active" data-mat-tab="metals">Precious Metals</button><button class="tab" data-mat-tab="gemstones">Gemstones & Diamonds</button><button class="tab" data-mat-tab="consumables">Consumables</button></div>
<div id="mat-metals" class="mat-tab-panel"><form id="matMetal" class="form">${select('purity','Purity',metalPurities)}${input('rate','Rate per gram (NPR)','number','','min="0" step="0.01"')}${input('stock','Stock (g)','number','','min="0" step="0.001"')}<div class="field-full"><button class="btn btn-champagne" type="submit" style="width:100%">Add/Update Metal</button></div></form><div style="margin-top:24px">${rows(['Purity','Rate/g','Stock (g)'],mMetals.map(m=>`<tr><td>${esc(m.purity)}</td><td class="align-right mono">${money(num(m.rate))}</td><td class="align-right mono">${num(m.stock).toFixed(3)}</td></tr>`).join(''))}</div></div>
<div id="mat-gemstones" class="mat-tab-panel" style="display:none"><form id="matStone" class="form">${select('type','Stone Type',stoneTypes)}${input('rate','Rate per carat (NPR)','number','','min="0" step="0.01"')}${input('stock','Stock (carat)','number','','min="0" step="0.01"')}${input('cert','Certification')}<div class="field-full"><button class="btn btn-champagne" type="submit" style="width:100%">Add/Update Stone</button></div></form><div style="margin-top:24px">${rows(['Type','Rate/ct','Stock (ct)','Cert'],mStones.map(s=>`<tr><td>${esc(s.type)}</td><td class="align-right mono">${money(num(s.rate))}</td><td class="align-right mono">${num(s.stock).toFixed(2)}</td><td>${esc(s.cert||'-')}</td></tr>`).join(''))}</div></div>
<div id="mat-consumables" class="mat-tab-panel" style="display:none"><form id="matCons" class="form">${input('name','Item Name')}${input('unit','Unit')}${input('rate','Rate per unit','number','','min="0" step="0.01"')}${input('stock','Stock','number','','min="0" step="0.01"')}<div class="field-full"><button class="btn btn-champagne" type="submit" style="width:100%">Add/Update Consumable</button></div></form><div style="margin-top:24px">${rows(['Name','Unit','Rate','Stock'],mCons.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.unit)}</td><td class="align-right mono">${money(num(c.rate))}</td><td class="align-right mono">${num(c.stock).toFixed(2)}</td></tr>`).join(''))}</div></div></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Unit Converter</h2></div><div class="card-body"><form id="unitConv" class="form form-grid-3">${input('cvVal','Value','number','','step="any"')}${select('cvFrom','From',Object.keys(UNITS))}${select('cvTo','To',Object.keys(UNITS))}</form><p class="muted" id="cvResult" style="margin-top:12px;padding:12px;background:var(--bg-surface);border-radius:var(--radius-md);border:1px solid var(--border-subtle);min-height:48px;display:flex;align-items:center">Enter value to convert</p></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Bill of Materials (BOM) / Job Card</h2></div><div class="card-body"><form id="bom" class="form"><div class="field-row" style="margin-bottom:16px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px">${input('bomCode','BOM Code')}${input('bomName','Design Name')}</div><div class="field-row" style="margin-bottom:16px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px">${select('bomMetal','Metal Type',['Gold','Silver','Platinum'])}${select('bomPurity','Purity',metalPurities)}</div><div class="field-row" style="margin-bottom:16px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px">${input('bomGross','Gross Weight','number','','min="0" step="0.001"')}${select('bomGrossUnit','Gross Unit',Object.keys(UNITS))}</div><div class="field-row" style="margin-bottom:16px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px">${input('bomStoneW','Stone/Wax Weight','number','0','min="0" step="0.001"')}${select('bomStoneUnit','Stone Unit',Object.keys(UNITS))}</div>
<div class="section"><h4 style="font-size:0.875rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px">Wastage (Jarti)</h4><div class="field-row" style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">${select('bomJartiPreset','Preset',Object.keys(jartiPresets))}${input('bomWastage','Wastage %','number',jartiPresets['Machine Cast'],'min="0" max="20" step="0.1"')}</div></div>
<div class="section"><h4 style="font-size:0.875rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px">Making Charges (Jyala)</h4>${select('bomMakingType','Method',['Per Gram','Per Tola','Flat Rate','% of Metal Value','Tiered by Process'])}${input('bomMakingRate','Rate','number','0','min="0" step="0.01"')}<div id="bomTiered" class="hidden" style="margin-top:16px;padding:16px;background:var(--bg-surface);border-radius:var(--radius-md);border:1px solid var(--border-subtle)"><h5 style="font-size:0.875rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px">Tiered Process Rates</h5><div class="form" style="margin:0">${processTypes.map(p=>input(`bomTier_${p}`,p,'number','0','min="0" step="0.01"')).join('')}</div></div></div>
<div class="section"><h4 style="font-size:0.875rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px">Stones & Gems</h4><div id="bomStones"></div><div style="margin-top:12px"><button type="button" class="btn btn-secondary" data-addstone"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Stone Row</button></div></div>
<div class="section"><h4 style="font-size:0.875rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px">Additional Costs</h4><div class="field-row" style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">${input('bomHallmark','Hallmark/HUID Fee','number','0','min="0" step="0.01"')}${input('bomOverhead','Overhead % or Fixed','number','0','min="0" step="0.01"')}</div></div>
<div style="display:flex;gap:12px;margin-top:24px;padding-top:16px;border-top:1px solid var(--border-subtle)"><button class="btn btn-gold" type="submit" style="flex:1">Save BOM / Calculate Cost</button></div></form></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Saved BOMs</h2></div><div class="card-body" style="padding:0">${rows(['Code','Design','Net Wt','Metal','Wastage','Making','Stones','Total','Action'],bomTable)}</div></div>
${boms.length?boms.map(renderCostCard).join(''):'<div class="card section"><div class="card-body empty"><svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg><p class="empty-title">No BOMs created yet</p><p class="empty-message">Create your first Bill of Materials above</p></div></div>'}`;
}



function bindDynamicUI(){
  // populate select labels if needed; nothing heavy
  // Update last backup time on settings page
  const lastBackupEl = document.getElementById('lastBackupTime');
  if (lastBackupEl && window.RatnaOS?.backup) {
    const backups = window.RatnaOS.backup.list();
    if (backups.length > 0) {
      const last = backups[0];
      lastBackupEl.textContent = fmtDateTime(last.timestamp);
    } else {
      lastBackupEl.textContent = t('No backups yet');
    }
  }
}

function resetItemForm(){
  const form=document.getElementById('itemForm'); if(!form) return;
  form.reset(); form.dataset.editId=''; const btn=document.getElementById('submitBtnText'); if(btn) btn.textContent='Add to Inventory';
  const cancel=document.querySelector('[data-inv-cancel]'); if(cancel) cancel.style.display='none';
  const stone=document.getElementById('stoneDetailsRows'); if(stone) stone.innerHTML='';
  const prev=document.getElementById('imagePreview'); if(prev) prev.innerHTML='';
  ['sku','barcode','qrCode','netWeight','wastageWeight','costPrice','marginPercent'].forEach(id=>{const el=document.getElementById(id); if(el) el.setAttribute('readonly','true');});
}
function toggleStoneSection(category){const sec=document.getElementById('stoneDetailsSection'); if(sec) sec.style.display=(category==='diamond'||category==='gemstone')?'block':'none';}
function addStoneRow(stone={},index=null){
  const idx=index!==null?index:Date.now(); const wrap=document.getElementById('stoneDetailsRows'); if(!wrap) return;
  const stoneTypeOpts=STONE_TYPES.map(s=>`<option value="${esc(s)}" ${stone.type===s?'selected':''}>${esc(s)}</option>`).join('');
  const unitOpts=Object.keys(UNITS).map(u=>`<option value="${esc(u)}" ${(stone.unit||'carat')===u?'selected':''}>${esc(u)}</option>`).join('');
  wrap.insertAdjacentHTML('beforeend',`<div class="stone-detail-row" data-idx="${idx}" style="display:grid;grid-template-columns:1.4fr .7fr 1fr 1fr 1fr 1fr auto;gap:8px;margin-bottom:8px"><select class="field-select" name="stoneType_${idx}">${stoneTypeOpts}</select><input class="field-input" name="stoneQty_${idx}" type="number" value="${stone.qty||1}" min="1"><input class="field-input" name="stoneWt_${idx}" type="number" value="${stone.weight||''}" min="0" step="0.001"><select class="field-select" name="stoneUnit_${idx}">${unitOpts}</select><input class="field-input" name="stoneRate_${idx}" type="number" value="${stone.rate||''}" min="0" step="0.01"><input class="field-input" name="stoneSetting_${idx}" type="number" value="${stone.setting||0}" min="0" step="0.01"><button type="button" class="btn btn-ghost btn-sm" data-del-stone-row="${idx}">×</button></div>`);
}
function updateCalculatedFields(){
  const g=id=>document.getElementById(id);
  if(!g('grossWeight')) return;
  const gross=num(g('grossWeight').value), stone=num(g('stoneWeight').value), net=rnd(gross-stone);
  if(g('netWeight')) g('netWeight').value=net.toFixed(3);
  const purity=num(String(g('purity')?.value||'22').replace('K','').replace('PT',''));
  const makingCharge=num(g('makingCharge')?.value), wastagePercent=num(g('wastagePercent')?.value), sellingPrice=num(g('sellingPrice')?.value);
  const wastageWeight=rnd(net*wastagePercent/100); if(g('wastageWeight')) g('wastageWeight').value=wastageWeight.toFixed(3);
  const metalType=g('metalType')?.value||'Gold';
  const metalRate=metalType==='Silver'?num(state.rates.silver):num(state.rates.gold);
  const fineWeight=rnd(net*purity/24); const metalCost=rnd(fineWeight*metalRate); const wastageCost=rnd(metalCost*wastagePercent/100);
  let stoneCost=0; document.querySelectorAll('#stoneDetailsRows .stone-detail-row').forEach(row=>{const wt=num(row.querySelector('[name^="stoneWt_"]')?.value); const rate=num(row.querySelector('[name^="stoneRate_"]')?.value); const setting=num(row.querySelector('[name^="stoneSetting_"]')?.value); stoneCost+=rnd(wt*rate+setting);});
  const costPrice=rnd(metalCost+wastageCost+makingCharge+stoneCost); if(g('costPrice')) g('costPrice').value=costPrice.toFixed(2);
  if(sellingPrice>0 && g('marginPercent')) g('marginPercent').value=rnd((sellingPrice-costPrice)/sellingPrice*100).toFixed(1);
}
function populateItemForm(item){
  const form=document.getElementById('itemForm'); if(!form) return;
  form.dataset.editId=item.id; const btn=document.getElementById('submitBtnText'); if(btn) btn.textContent='Update Item';
  const cancel=document.querySelector('[data-inv-cancel]'); if(cancel) cancel.style.display='inline-flex';
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.value=val;};
  set('itemId',item.id); set('itemCategory',item.category||'gold'); set('code',item.code); set('sku',item.sku||''); set('name',item.name||'');
  set('metalType',item.metalType||item.metal||'Gold'); set('purity',String(item.purity).includes('K')?item.purity:(item.purity+'K'));
  set('grossWeight',num(item.grossWeight||item.weight).toFixed(3)); set('stoneWeight',num(item.stoneWeight).toFixed(3)); set('netWeight',num(item.netWeight||item.weight).toFixed(3));
  set('makingCharge',num(item.makingCharge||item.making).toFixed(2)); set('wastagePercent',num(item.wastagePercent).toFixed(1)); set('wastageWeight',num(item.wastageWeight).toFixed(3));
  set('costPrice',num(item.costPrice).toFixed(2)); set('sellingPrice',num(item.sellingPrice).toFixed(2)); set('marginPercent',num(item.marginPercent).toFixed(1));
  set('barcode',item.barcode||''); set('qrCode',item.qrCode||''); set('status',item.status||'stock'); set('location',item.location||'Showcase'); set('tags',(item.tags||[]).join(', '));
  document.querySelectorAll('#itemTypeTabs .tab').forEach(t=>t.classList.toggle('active',t.dataset.cat===(item.category||'gold')));
  toggleStoneSection(item.category||'gold');
  const sw=document.getElementById('stoneDetailsRows'); if(sw){sw.innerHTML=''; (item.stoneDetails||[]).forEach((st,i)=>addStoneRow(st,i));}
  const ip=document.getElementById('imagePreview'); if(ip){ip.innerHTML=''; (item.images||[]).forEach((img,i)=>{const d=document.createElement('div'); d.style.position='relative'; d.innerHTML=`<img src="${img.data}" alt="${esc(img.alt||'')}" style="width:70px;height:70px;object-fit:cover;border-radius:6px"><button type="button" class="btn btn-ghost btn-sm" data-remove-image="${i}" style="position:absolute;top:-6px;right:-6px">×</button>`; ip.appendChild(d);});}
  updateCalculatedFields();
}
function exportInventoryCSV(){
  const headers=['ID','Code','SKU','Name','Category','Metal','Purity','Gross(g)','Net(g)','Stone(g)','Making','Wastage%','Cost','Selling','Status','Location','Tags'];
  const rowsCsv=state.items.map(i=>[i.id,i.code,i.sku,i.name,i.category,i.metalType||i.metal,i.purity,num(i.grossWeight).toFixed(3),num(i.netWeight||i.weight).toFixed(3),num(i.stoneWeight).toFixed(3),num(i.makingCharge||i.making).toFixed(2),num(i.wastagePercent).toFixed(1),money(calcItem.totalCost(i)),money(i.sellingPrice),i.status,i.location,(i.tags||[]).join(';')].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(','));
  download('inventory-'+new Date().toISOString().slice(0,10)+'.csv',[headers.join(','),...rowsCsv].join('\n'),'text/csv');
}
function handleImageUpload(files){const form=document.getElementById('itemForm'); const itemId=form?.dataset.editId; if(!itemId) return alert(t('Save item first, then upload images.')); const item=state.items.find(i=>i.id===itemId); if(!item) return; Array.from(files||[]).slice(0,5).forEach(file=>{const r=new FileReader(); r.onload=e=>{item.images=item.images||[]; item.images.push({data:e.target.result,alt:file.name}); item.updatedAt=new Date().toISOString(); save('Image uploaded',item.code); populateItemForm(item);}; r.readAsDataURL(file);});}

// POS helpers
function updatePaymentSummary(){
  const wrap=document.getElementById('posPaymentRows'); const summary=document.getElementById('posPaymentSummary'); if(!wrap||!summary) return;
  const total=calcCartTotals(state.posCart||[]).total; let paid=0; const byMethod={};
  wrap.querySelectorAll('.payment-row').forEach(row=>{const m=row.querySelector('[name="payMethod"]')?.value; const a=num(row.querySelector('[name="payAmount"]')?.value); paid+=a; if(a>0) byMethod[m]=(byMethod[m]||0)+a;});
  const remaining=rnd(total-paid);
  summary.style.display=wrap.querySelectorAll('.payment-row').length?'block':'none';
  summary.innerHTML=`<div style="display:flex;justify-content:space-between"><span>${t('Total')}</span><strong>${money(total)}</strong></div><div style="display:flex;justify-content:space-between;color:${remaining>0?'var(--error)':'var(--success)'}"><span>${t('Paid')}</span><strong>${money(paid)}</strong></div><div style="display:flex;justify-content:space-between"><span>${t('Balance')}</span><strong>${money(remaining)}</strong></div>`;
}
function showCustomerModal(customer=null){
  const isEdit=!!customer; const modal=document.createElement('div'); modal.className='modal-overlay';
  modal.innerHTML=`<div class="modal" style="max-width:520px"><div class="modal-header"><h3 class="modal-title">${t(isEdit?'Edit Customer':'Add Customer')}</h3><button class="modal-close" data-close-modal>×</button></div><div class="modal-body"><form id="customerForm"><input type="hidden" name="customerId" value="${customer?.id||''}">${input('custName','Full Name','text',customer?.name||'')}${input('custPhone','Phone','text',customer?.phone||'')}${input('custEmail','Email','email',customer?.email||'')}${textarea('custAddress','Address',customer?.address||'')}${input('custGstin','GSTIN','text',customer?.gstin||'')}${input('custCreditLimit','Credit Limit','number',customer?.creditLimit||0,'min="0" step="0.01"')}</form></div><div class="modal-footer"><button class="btn btn-champagne" data-save-customer>Save</button><button class="btn btn-ghost" data-close-modal>Cancel</button></div></div>`;
  document.body.appendChild(modal); modal.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>modal.remove())); modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
}
function saveCustomerFromModal(){
  const form=document.getElementById('customerForm'); if(!form) return; const d=data(form); const cid=d.customerId||id(); const isEdit=!!d.customerId;
  const customer={id:cid,name:(d.custName||'').trim(),phone:(d.custPhone||'').trim(),email:(d.custEmail||'').trim(),address:(d.custAddress||'').trim(),gstin:(d.custGstin||'').trim().toUpperCase(),creditLimit:num(d.custCreditLimit),totalPurchases:isEdit?num(getCustomer(cid)?.totalPurchases):0,totalSpent:isEdit?num(getCustomer(cid)?.totalSpent):0,balance:isEdit?num(getCustomer(cid)?.balance):0,createdAt:isEdit?getCustomer(cid)?.createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),schemaVersion:1};
  if(!customer.name) return alert(t('Customer name required'));
  if(isEdit){const idx=state.customers.findIndex(c=>c.id===cid); if(idx>=0) state.customers[idx]=customer;} else state.customers.unshift(customer);
  save(isEdit?'Customer updated':'Customer added',customer.name); form.closest('.modal-overlay')?.remove(); render();
}
function renderInvoiceHTML(sale){
  const itemsHtml=(sale.items||[]).map(it=>`<tr><td>${esc(it.itemName)}</td><td class="mono">${esc(it.itemSku||'')}</td><td class="mono align-right">${it.qty}</td><td class="mono align-right">${money(it.total)}</td></tr>`).join('');
  const payHtml=(sale.payments||[]).map(p=>`<div style="display:flex;justify-content:space-between"><span>${esc(p.method)}</span><span class="mono">${money(p.amount)}</span></div>`).join('');
  return `<div style="font-family:sans-serif;padding:20px"><h2 style="margin:0">${esc(state.settings.shop)}</h2><div class="muted">${t('Invoice')} ${esc(sale.invoice)}${state.settings.vatNumber?` · ${esc(state.settings.taxLabel||'VAT')} No: ${esc(state.settings.vatNumber)}`:''}</div><div style="margin:12px 0">${t('Date')}: ${fmtDateTime(sale.date)}<br>${t('Customer')}: ${esc(sale.customerName||sale.customer||t('Walk-in Customer'))}</div><table class="table"><thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th class="align-right">Total</th></tr></thead><tbody>${itemsHtml||`<tr><td colspan="4">${t('No items')}</td></tr>`}</tbody></table><div style="margin-top:12px;text-align:right">${t('Subtotal:')} ${money(sale.subtotal)}<br>${t('Discount:')} ${money(sale.discount)}<br>${esc(state.settings.taxLabel||'VAT')}${state.settings.taxInclusive?' (incl.)':''}: ${money(sale.tax)}<br><strong>${t('Grand Total:')} ${money(sale.total)}</strong></div><div style="margin-top:12px"><strong>${t('Payments')}</strong>${payHtml||'<div>-</div>'}</div>${pendingConfirmations().length?`<div class="small" style="margin-top:12px;color:#b45309">${esc(t('Reference — local confirmation pending. Tax and hallmark fields must be verified.'))}</div>`:''}</div>`;
}
function showInvoiceModal(sale){const modal=document.createElement('div'); modal.className='modal-overlay'; modal.innerHTML=`<div class="modal" style="max-width:700px"><div class="modal-header"><h3 class="modal-title">Invoice ${esc(sale.invoice)}</h3><button class="modal-close" data-close-modal>×</button></div><div class="modal-body">${renderInvoiceHTML(sale)}</div><div class="modal-footer"><button class="btn btn-champagne" data-print-invoice="${esc(sale.id)}">Print</button><button class="btn btn-ghost" data-close-modal>Close</button></div></div>`; document.body.appendChild(modal); modal.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>modal.remove())); modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});}
function printInvoice(saleId){const sale=state.sales.find(s=>s.id===saleId); if(!sale) return; const w=window.open('','_blank'); if(!w) return; w.document.write(`<html><head><title>${esc(sale.invoice)}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}</style></head><body>${renderInvoiceHTML(sale)}<script>window.onload=()=>window.print()<\/script></body></html>`); w.document.close();}
function completePOSale(){
  const cart=state.posCart||[]; if(!cart.length) return alert(t('Cart is empty'));
  const customerId=document.getElementById('posCustomerSelect')?.value; const customer=customerId?getCustomer(customerId):null;
  const wrap=document.getElementById('posPaymentRows'); const payments=[]; let totalPaid=0;
  wrap?.querySelectorAll('.payment-row').forEach(row=>{const method=row.querySelector('[name="payMethod"]')?.value; const amount=num(row.querySelector('[name="payAmount"]')?.value); if(amount>0){payments.push({method,amount}); totalPaid+=amount;}});
  const totals=calcCartTotals(cart); if(totalPaid+0.01<totals.total) return alert(t('Payment is less than total.'));
  const invoice=generateInvoiceNumber();
  const saleItems=cart.map(c=>({itemId:c.itemId,itemCode:c.item.code,itemName:c.item.name,itemSku:c.item.sku,metalType:c.item.metalType||c.item.metal,purity:c.item.purity,netWeight:c.item.netWeight||c.item.weight,basePrice:c.basePrice,qty:c.qty,subtotal:c.subtotal,discount:c.discount,taxable:c.taxable,tax:c.tax,total:c.total}));
  const sale={id:id(),invoice,date:new Date().toISOString(),customerId:customer?.id||null,customerName:customer?.name||'Walk-in Customer',customerPhone:customer?.phone||'',items:saleItems,payments,subtotal:totals.subtotal,discount:totals.discount,taxable:totals.taxable,tax:totals.tax,taxRate:state.settings.taxRate,taxLabel:state.settings.taxLabel,total:totals.total,status:'completed'};
  state.sales.unshift(sale);
  cart.forEach(c=>{const item=state.items.find(i=>i.id===c.itemId); if(item){item.status='sold'; item.updatedAt=new Date().toISOString(); recordMovement(item.id,'OUT','Sale',c.qty,num(item.netWeight||item.weight)*c.qty,invoice,'POS Sale - '+sale.customerName);} });
  if(customer) updateCustomerStats(customer.id, totals.total);
  state.posCart=[]; postSale(state, sale, state.items); save('POS Sale completed', invoice+' - '+money(totals.total)); render(); showInvoiceModal(sale);
}
function savePOSQuote(){const cart=state.posCart||[]; if(!cart.length) return alert(t('Cart is empty')); const customerId=document.getElementById('posCustomerSelect')?.value; const customer=customerId?getCustomer(customerId):null; const totals=calcCartTotals(cart); const quote={id:id(),quoteNo:'QUO-'+Date.now().toString(36).toUpperCase(),date:new Date().toISOString(),customerId:customer?.id||null,customerName:customer?.name||'Walk-in Customer',items:cart.map(c=>({itemId:c.itemId,qty:c.qty,basePrice:c.basePrice,subtotal:c.subtotal,total:c.total})),subtotal:totals.subtotal,discount:totals.discount,tax:totals.tax,total:totals.total,status:'quote'}; state.quotes.unshift(quote); save('Quote saved',quote.quoteNo); alert(t('Quote saved')+': '+quote.quoteNo); render();}

function showMetalTxnModal(txn=null){const modal=document.createElement('div'); modal.className='modal-overlay'; const typeOptions=METAL_TXN_TYPES.map(x=>`<option value="${x.value}" ${txn&&txn.type===x.value?'selected':''}>${t(x.label)}</option>`).join(''); const metal=txn?.metal||'Gold'; const purityOpts=(metal==='Gold'?GOLD_PURITIES:SILVER_PURITIES).map(p=>`<option value="${p}" ${txn&&txn.purity===p?'selected':''}>${p}</option>`).join(''); modal.innerHTML=`<div class="modal" style="max-width:560px"><div class="modal-header"><h3 class="modal-title">${t(txn?'Edit Metal Transaction':'New Metal Transaction')}</h3><button class="modal-close" data-close-modal>×</button></div><div class="modal-body"><form id="metalTxnForm"><input type="hidden" name="txnId" value="${txn?.id||''}"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${select('type','Type',METAL_TXN_TYPES.map(x=>({value:x.value,label:t(x.label)})), txn?.type||'PURCHASE')}${input('date','Date','date',txn?.date||new Date().toISOString().slice(0,10))}${select('metal','Metal',['Gold','Silver'], metal)}<div class="field"><label class="field-label">${t('Purity')}</label><select class="field-select" name="purity" id="metalPurity">${purityOpts}</select></div>${input('weight','Weight','number',txn?.weight||'','min="0" step="0.001"')}${select('unit','Unit',METAL_UNITS, txn?.unit||'gram')}${input('rate','Rate/g','number',txn?.rate||'','min="0" step="0.01"')}${input('value','Value','number',txn?.value||'','min="0" step="0.01"')}${input('reference','Reference','text',txn?.reference||'')}${input('karigar','Karigar','text',txn?.karigar||'')}${input('jobCode','Job Code','text',txn?.jobCode||'')}${input('customer','Customer','text',txn?.customer||'')}</div>${textarea('notes','Notes',txn?.notes||'')}</form></div><div class="modal-footer"><button class="btn btn-primary" data-metal-save-txn>Save</button><button class="btn btn-ghost" data-close-modal>Cancel</button></div></div>`; document.body.appendChild(modal); modal.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>modal.remove())); modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();}); modal.querySelector('#metalMetal, select[name="metal"]')?.addEventListener('change',e=>{const m=e.target.value; const ps=document.getElementById('metalPurity'); if(ps) ps.innerHTML=(m==='Gold'?GOLD_PURITIES:SILVER_PURITIES).map(p=>`<option value="${p}">${p}</option>`).join('');});}
function saveMetalTxnFromModal(){const form=document.getElementById('metalTxnForm'); if(!form) return; const d=data(form); const txnId=d.txnId; const weight=num(d.weight); if(!(weight>0)) return alert(t('Weight required')); const payload={type:d.type,metal:d.metal,purity:d.purity,unit:d.unit||'gram',weight:toGram(weight,d.unit||'gram'),rate:num(d.rate),value:num(d.value)||rnd(toGram(weight,d.unit||'gram')*num(d.rate)),adjustment:0,reference:d.reference||generateMetalTxnNumber(d.type),notes:d.notes,karigar:d.karigar,jobCode:d.jobCode,customer:d.customer,date:d.date,posted:true}; if(txnId){const idx=state.metalManagement.transactions.findIndex(t=>t.id===txnId); if(idx>=0){if(!canEditTransaction(state.metalManagement.transactions[idx])) return alert(t('Cannot edit posted transaction in closed period')); state.metalManagement.transactions[idx]={...state.metalManagement.transactions[idx],...payload,updatedAt:new Date().toISOString()}; save('Metal transaction updated',payload.reference);} } else {recordMetalTxn(payload);} form.closest('.modal-overlay')?.remove(); render();}
function exportMetalCSV(){const headers=['Date','Type','Metal','Purity','Weight','Unit','Rate','Value','Reference','Karigar','Job','Customer','Notes','Posted']; const rowsCsv=state.metalManagement.transactions.map(t=>[t.date,t.type,t.metal,t.purity,num(t.weight).toFixed(3),t.unit||'gram',num(t.rate).toFixed(2),num(t.value).toFixed(2),t.reference||'',t.karigar||'',t.jobCode||'',t.customer||'',(t.notes||'').replace(/\n/g,' '),t.posted?'Yes':'No'].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')); download('metal-transactions-'+new Date().toISOString().slice(0,10)+'.csv',[headers.join(','),...rowsCsv].join('\n'),'text/csv');}


// Event handlers
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-tab]');
  if(b){tab=b.dataset.tab; sidebarOpen=false; render(); return;}
  if(e.target.closest('[data-acct-tab]')){acctUI.tab=e.target.closest('[data-acct-tab]').dataset.acctTab; render(); return;}
  if(e.target.closest('[data-acct-backfill]')){if(!acctCanPost()) return; if(!confirm(t('Post existing sales, expenses and valued metal transactions? Duplicate sources are skipped.'))) return; const res=backfill(state); save('Accounting backfill',`posted ${res.posted}, skipped ${res.skipped}`); alert(t('Posted')+': '+res.posted+' · '+t('Skipped')+': '+res.skipped+(res.errors.length?'\n'+res.errors.slice(0,5).join('\n'):'')); render(); return;}
  if(e.target.closest('[data-acct-reverse]')){if(!acctCanPost()) return; const id=e.target.closest('[data-acct-reverse]').dataset.acctReverse; if(confirm(t('Create a balanced reversal for this journal?'))){const r=reverseJournal(state,id); if(!r.ok) alert(t('Reversal failed')+': '+r.error); else save('Journal reversed',r.journal.no); render();} return;}
  if(e.target.closest('[data-acct-new-voucher]')){if(acctCanPost()) openVoucherModal(); return;}
  if(e.target.closest('[data-acct-save-voucher]')){if(!acctCanPost()) return; const type=document.getElementById('vchType')?.value||'Journal'; const date=document.getElementById('vchDate')?.value; const reference=document.getElementById('vchRef')?.value||''; const memo=document.getElementById('vchMemo')?.value||''; const lines=[]; try{ document.querySelectorAll('.vch-line').forEach(row=>{const account=row.querySelector('[name="vchAccount"]')?.value; const d=toMinor(row.querySelector('[name="vchDebit"]')?.value||0); const c=toMinor(row.querySelector('[name="vchCredit"]')?.value||0); if(d===0&&c===0) return; lines.push(makeLine(account,d,c,row.querySelector('[name="vchLineMemo"]')?.value||'')); }); }catch(err){return alert(t('Invalid voucher line')+': '+err.message);} if(lines.length<2) return alert(t('At least two lines are required')); const r=postVoucher(state,{type,date,reference,memo,lines}); if(!r.ok) return alert(t('Voucher rejected')+': '+r.error); document.querySelector('.modal-overlay')?.remove(); save('Voucher posted',r.journal.no); render(); return;}
  if(e.target.closest('[data-acct-book]')){acctUI.book=e.target.closest('[data-acct-book]').dataset.acctBook; render(); return;}
  if(e.target.closest('[data-acct-opening-save]')){if(!acctCanPost()) return; const date=document.getElementById('obDate')?.value; const fyId=document.getElementById('obFy')?.value||''; const lines=[]; document.querySelectorAll('.ob-input').forEach(inp=>{const v=toMinor(inp.value||0); if(!v) return; lines.push({account:inp.dataset.code,debit:inp.dataset.side==='debit'?v:0,credit:inp.dataset.side==='credit'?v:0});}); if(!lines.length) return alert(t('Enter at least one opening balance')); if(!confirm(t('Post opening balances? This can only be done once per fiscal year.'))) return; const r=postOpeningBalances(state,{date,fiscalYearId:fyId,lines}); if(!r.ok) return alert(t('Opening balances rejected')+': '+r.error); save('Opening balances posted',r.journal.no); render(); return;}
  if(e.target.closest('[data-acct-add-fy]')){if(!acctCanPost()) return; const label=document.getElementById('fyLabel')?.value||''; const start=document.getElementById('fyStart')?.value||''; const end=document.getElementById('fyEnd')?.value||''; const r=addFiscalYear(state,{label,start,end}); if(!r.ok) return alert(t('Could not add fiscal year')+': '+r.error); save('Fiscal year added',label); render(); return;}
  if(e.target.closest('[data-acct-close-fy]')){if(!acctCanPost()) return; const id=e.target.closest('[data-acct-close-fy]').dataset.acctCloseFy; if(!confirm(t('Close this fiscal year? Income and expense balances move to Retained Earnings.'))) return; const r=closeFiscalYear(state,id); if(!r.ok) return alert(t('Year close rejected')+': '+r.error); save('Fiscal year closed',r.journal.no); alert(t('Closed')+'. '+t('Net result')+': '+acctMoney(r.net)); render(); return;}
  if(e.target.closest('[data-acct-reopen-fy]')){if(!acctCanPost()) return; const id=e.target.closest('[data-acct-reopen-fy]').dataset.acctReopenFy; if(!confirm(t('Reopen this fiscal year with a reversal entry?'))) return; const r=reopenFiscalYear(state,id); if(!r.ok) return alert(t('Reopen rejected')+': '+r.error); save('Fiscal year reopened',r.journal.no); render(); return;}
  if(e.target.closest('[data-acct-add-account]')){if(!acctCanPost()) return; const code=document.getElementById('coaCode')?.value||''; const name=document.getElementById('coaName')?.value||''; const type=document.getElementById('coaType')?.value||'asset'; const r=addAccount(state,{code,name,type}); if(!r.ok) return alert(t('Account rejected')+': '+r.error); save('Account added',code); render(); return;}
  if(e.target.closest('[data-acct-rename]')){if(!acctCanPost()) return; const code=e.target.closest('[data-acct-rename]').dataset.acctRename; const current=state.accounting.accounts.find(a=>a.code===code); const name=prompt(t('Account name'),current?.name||''); if(name==null) return; const r=updateAccount(state,code,{name}); if(!r.ok) return alert(t('Account rejected')+': '+r.error); save('Account updated',code); render(); return;}
  if(e.target.closest('[data-acct-archive]')){if(!acctCanPost()) return; const code=e.target.closest('[data-acct-archive]').dataset.acctArchive; const account=state.accounting.accounts.find(a=>a.code===code); if(!account) return; const r=archiveAccount(state,code,!account.archived); if(!r.ok) return alert(t('Account rejected')+': '+r.error); save('Account archived',code); render(); return;}
  if(e.target.closest('[data-tax-tab]')){taxUI.tab=e.target.closest('[data-tax-tab]').dataset.taxTab; render(); return;}
  if(e.target.closest('[data-tax-reg-refresh]')){taxUI.regFrom=document.getElementById('taxRegFrom')?.value||''; taxUI.regTo=document.getElementById('taxRegTo')?.value||''; render(); return;}
  if(e.target.closest('[data-tax-cal-add]')){ensureTax(state); state.tax.calendar.push({id:'TC-'+Date.now(),taxName:document.getElementById('tcName')?.value||'',period:document.getElementById('tcPeriod')?.value||'',filingDeadline:document.getElementById('tcFiling')?.value||'',paymentDeadline:document.getElementById('tcPayment')?.value||'',payable:Math.round((Number(document.getElementById('tcPayable')?.value)||0)*100),paid:Math.round((Number(document.getElementById('tcPaid')?.value)||0)*100),status:document.getElementById('tcStatus')?.value||'upcoming',createdAt:new Date().toISOString()}); saveState(); render(); return;}
  const pr=e.target.closest('[data-tax-print]');
  if(pr){const k=pr.dataset.taxPrint; const R=window.__taxReports||{}; const map={vatSales:R.vatSalesHtml,vatPur:R.vatPurHtml,tds:R.tdsHtml}; const title=k==='vatSales'?'VAT Sales Register':k==='vatPur'?'VAT Purchase Register':'TDS Report'; const w=window.open('','_blank'); if(w){w.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #999;padding:6px;font-size:12px}th{background:#eee}.right{text-align:right}.meta{margin:6px 0;font-size:12px}</style></head><body>${map[k]||''}<script>window.print()</script></body></html>`); w.document.close();} return;}
  const cv=e.target.closest('[data-tax-csv]');
  if(cv){const k=cv.dataset.taxCsv; const R=window.__taxReports||{}; let rows=[]; if(k==='vatSales'){rows=[['Date','Invoice','Customer','PAN','Taxable','VAT','Total'],...R.reg.sales.map(r=>[r.date,r.invoice,r.customer,r.pan,r.taxable/100,r.vat/100,r.total/100])];} else if(k==='vatPur'){rows=[['Date','Invoice','Supplier','PAN','Taxable','VAT','Total'],...R.reg.purchases.map(r=>[r.date,r.invoice||'',r.supplier,r.pan,r.taxable/100,r.vat/100,r.total/100])];} else {rows=[['Date','Category','Recipient','PAN','Taxable','Rate','TDS','Status'],...R.reg.tds.map(e=>[e.date,e.category,e.recipient,e.pan,e.taxable/100,e.rate,e.tds/100,e.status])];} const csv=rows.map(r=>r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\\n'); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=k+'.csv'; a.click(); URL.revokeObjectURL(url); return;}
  if(e.target.closest('[data-tax-purchase-save]')){if(!taxCanPost()) return; const r=postVatPurchase(state,{date:document.getElementById('taxPurDate')?.value||'',supplier:document.getElementById('taxPurSupplier')?.value||'',pan:document.getElementById('taxPurPan')?.value||'',invoice:document.getElementById('taxPurInvoice')?.value||'',taxable:document.getElementById('taxPurTaxable')?.value||0,vat:document.getElementById('taxPurVat')?.value||0,account:document.getElementById('taxPurAccount')?.value||'1200'}); if(!r.ok) return alert(t('Purchase rejected')+': '+r.error); save('VAT purchase posted',r.journal.no); render(); return;}
  if(e.target.closest('[data-tax-period-add]')){if(!taxCanPost()) return; const r=addVatPeriod(state,{label:document.getElementById('taxPeriodLabel')?.value||'',from:document.getElementById('taxPeriodFrom')?.value||'',to:document.getElementById('taxPeriodTo')?.value||''}); if(!r.ok) return alert(t('Period rejected')+': '+r.error); save('VAT period added',r.period.label); render(); return;}
  if(e.target.closest('[data-tax-period-prepare]')){if(!taxCanPost()) return; const id=e.target.closest('[data-tax-period-prepare]').dataset.taxPeriodPrepare; if(!confirm(t('Prepare the VAT return for this period? Input and output VAT are cleared into VAT Payable.'))) return; const r=prepareVatReturn(state,id); if(!r.ok) return alert(t('Return rejected')+': '+r.error); save('VAT return prepared',r.journal.no); render(); return;}
  if(e.target.closest('[data-tax-period-pay]')){if(!taxCanPost()) return; const id=e.target.closest('[data-tax-period-pay]').dataset.taxPeriodPay; const date=prompt(t('Payment date')+' (YYYY-MM-DD)',taxToday()); if(!date) return; const reference=prompt(t('IRD challan / payment reference'),''); if(!reference) return; const amount=prompt(t('Payment amount')+' ('+t('NPR')+')',''); if(amount==null) return; const r=payVatPeriod(state,id,{date,reference,amount}); if(!r.ok) return alert(t('Payment rejected')+': '+r.error); save('VAT paid',reference); render(); return;}
  if(e.target.closest('[data-tax-tds-save]')){if(!taxCanPost()) return; const r=postTdsEntry(state,{date:document.getElementById('taxTdsDate')?.value||'',category:document.getElementById('taxTdsCategory')?.value||'',recipient:document.getElementById('taxTdsRecipient')?.value||'',pan:document.getElementById('taxTdsPan')?.value||'',taxable:document.getElementById('taxTdsTaxable')?.value||0,tds:document.getElementById('taxTdsAmount')?.value||'',method:document.getElementById('taxTdsMethod')?.value||'Cash',expenseAccount:document.getElementById('taxTdsExpense')?.value||'6900'}); if(!r.ok) return alert(t('TDS entry rejected')+': '+r.error); save('TDS deducted',r.journal.no); render(); return;}
  if(e.target.closest('[data-tax-tds-deposit]')){if(!taxCanPost()) return; const id=e.target.closest('[data-tax-tds-deposit]').dataset.taxTdsDeposit; const date=prompt(t('Deposit date')+' (YYYY-MM-DD)',taxToday()); if(!date) return; const reference=prompt(t('IRD challan / deposit reference'),''); if(!reference) return; const r=depositTds(state,id,{date,reference}); if(!r.ok) return alert(t('Deposit rejected')+': '+r.error); save('TDS deposited',reference); render(); return;}
  if(e.target.closest('[data-tax-rule-add]')){if(!taxCanConfigure()) return; const r=addTaxRule(state,{taxType:document.getElementById('taxRuleType')?.value||'VAT',category:document.getElementById('taxRuleCategory')?.value||'',rate:document.getElementById('taxRuleRate')?.value||'',effectiveFrom:document.getElementById('taxRuleFrom')?.value||'',effectiveTo:document.getElementById('taxRuleTo')?.value||'',sourceUrl:document.getElementById('taxRuleSource')?.value||''}); if(!r.ok) return alert(t('Rule rejected')+': '+r.error); save('Tax rule added',r.rule.id); render(); return;}
  if(e.target.closest('[data-tax-rule-verify]')){if(!taxCanConfigure()) return; const id=e.target.closest('[data-tax-rule-verify]').dataset.taxRuleVerify; const url=prompt(t('Official source URL'),''); if(!url) return; const r=verifyTaxRule(state,id,url); if(!r.ok) return alert(t('Verification rejected')+': '+r.error); save('Tax rule verified',id); render(); return;}
  if(e.target.closest('[data-tax-rule-end]')){if(!taxCanConfigure()) return; const id=e.target.closest('[data-tax-rule-end]').dataset.taxRuleEnd; const date=prompt(t('End date')+' (YYYY-MM-DD)',taxToday()); if(!date) return; const r=endTaxRule(state,id,date); if(!r.ok) return alert(t('Rule rejected')+': '+r.error); save('Tax rule ended',id); render(); return;}
  if(e.target.closest('[data-kc-tab]')){kcUI.tab=e.target.closest('[data-kc-tab]').dataset.kcTab; kcUI.query=''; render(); return;}
  if(e.target.closest('[data-kc-new]')){openKcEditor(e.target.closest('[data-kc-new]').dataset.kcNew,''); return;}
  if(e.target.closest('[data-kc-edit]')){const [name,id]=e.target.closest('[data-kc-edit]').dataset.kcEdit.split(':'); openKcEditor(name,id); return;}
  if(e.target.closest('[data-kc-del]')){const [name,id]=e.target.closest('[data-kc-del]').dataset.kcDel.split(':'); if(confirm(t('Delete this master record?'))){const ov={...(state.kcOverrides[name]||{})}; const base=KC_DATASETS[name].base.some(r=>r.id===id); if(base) ov[id]={...(ov[id]||{}),__deleted:true}; else delete ov[id]; state.kcOverrides[name]=ov; save('Master data deleted',''); render();} return;}
  if(e.target.closest('[data-kc-save]')){const [name,id]=e.target.closest('[data-kc-save]').dataset.kcSave.split(':'); const raw=document.getElementById('kcEditJson')?.value||''; let rec; try{rec=JSON.parse(raw);}catch{return alert(t('Invalid JSON.'));} if(!rec || typeof rec!=='object' || !String(rec.id||'').trim()) return alert(t('Record ID is required.')); const ov={...(state.kcOverrides[name]||{})}; const key=String(rec.id).trim(); const isBase=KC_DATASETS[name].base.some(r=>r.id===key); ov[key]={...rec,id:key,__new:!isBase}; state.kcOverrides[name]=ov; document.querySelector('.modal-overlay')?.remove(); save('Master data updated',key); render(); return;}
  if(e.target.closest('[data-confirm-toggle]')){const id=e.target.closest('[data-confirm-toggle]').dataset.confirmToggle; const done={...(state.settings.confirmations||{})}; if(done[id]) delete done[id]; else done[id]=true; state.settings.confirmations=done; save('Local confirmation updated',id); render(); return;}
  if(e.target.id==='sidebarToggle' || e.target.closest('#sidebarToggle')){sidebarOpen=!sidebarOpen; render(); return;}
  if(e.target.id==='export' || e.target.closest('#export')){download('ratnaos-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(state,null,2),'application/json'); return;}
  // Auth logout
  if(e.target.closest('[data-rate-sync]')){ syncDailyRates({auto:false}); return; }
  if(e.target.closest('[data-lang-set]')){ const next=e.target.closest('[data-lang-set]').dataset.langSet; state.settings.language=next; setLanguage(next); save('Language changed',LOCALES[next].native); return; }
  if(e.target.closest('[data-lang-toggle]')){ const cur=getLanguage(); const next=cur==='en'?'ne':cur==='ne'?'hi':'en'; state.settings.language=next; setLanguage(next); save('Language changed',LOCALES[next].native); return; }
  if(e.target.closest('[data-auth-logout]')){window.RatnaOS.auth.logout(); render(); return;}

  // Backup management
  if(e.target.closest('[data-backup-create]')){window.RatnaOS.backup.create(); window.RatnaOS.showNotification('Backup created successfully', 'success'); render(); return;}
  if(e.target.closest('[data-backup-list]')){showBackupList(); return;}
  if(e.target.closest('[data-backup-restore]')){const backupId = e.target.closest('[data-backup-restore]').dataset.backupRestore; if(confirm(t('Restore this backup? This will overwrite current data.'))){window.RatnaOS.backup.restore(backupId); window.RatnaOS.showNotification('Backup restored, reloading...', 'success'); setTimeout(()=>location.reload(),1000);} return;}
  if(e.target.closest('[data-backup-delete]')){const backupId = e.target.closest('[data-backup-delete]').dataset.backupDelete; if(confirm(t('Delete this backup?'))){window.RatnaOS.backup.delete(backupId); window.RatnaOS.showNotification('Backup deleted', 'success'); showBackupList();} return;}
  if(e.target.closest('[data-backup-export]')){exportAllBackups(); return;}

  // Report type selection
  if(e.target.closest('[data-report-type]')){state.reportType=e.target.closest('[data-report-type]').dataset.reportType; render(); return;}
  // Report CSV export
  if(e.target.closest('[data-report-export-csv]')){const type=e.target.closest('[data-report-export-csv]').dataset.reportExportCsv; exportReportCSV(type); return;}
  // Report PDF export
  if(e.target.closest('[data-report-export-pdf]')){const type=e.target.closest('[data-report-export-pdf]').dataset.reportExportPdf; exportReportPDF(type); return;}
  // Clear report filters
  if(e.target.closest('[data-report-clear-filters]')){clearReportFilters(); render(); return;}

  // Inventory
  if(e.target.closest('[data-cat]')){const btn=e.target.closest('[data-cat]'); document.getElementById('itemCategory').value=btn.dataset.cat; document.querySelectorAll('#itemTypeTabs .tab').forEach(t=>t.classList.toggle('active',t===btn)); toggleStoneSection(btn.dataset.cat); return;}
  if(e.target.dataset.invAdd){resetItemForm(); const c=document.getElementById('itemCategory'); if(c)c.value='gold'; document.querySelectorAll('#itemTypeTabs .tab').forEach(t=>t.classList.toggle('active',t.dataset.cat==='gold')); toggleStoneSection('gold'); return;}
  if(e.target.dataset.invCancel!==undefined || e.target.closest('[data-inv-cancel]')){resetItemForm(); return;}
  if(e.target.dataset.invEdit){const item=state.items.find(i=>i.id===e.target.dataset.invEdit); if(item) populateItemForm(item); return;}
  if(e.target.dataset.invDelete){if(confirm(t('Delete this item?'))){const idx=state.items.findIndex(i=>i.id===e.target.dataset.invDelete); if(idx>=0){state.items.splice(idx,1); save('Item deleted','');}} return;}
  if(e.target.dataset.invExport || e.target.closest('[data-inv-export]')){exportInventoryCSV(); return;}
  if(e.target.dataset.invSortDir!==undefined || e.target.closest('[data-inv-sort-dir]')){state.invSortDir=state.invSortDir==='asc'?'desc':'asc'; render(); return;}
  if(e.target.dataset.addStone!==undefined || e.target.closest('[data-add-stone]')){addStoneRow(); return;}
  if(e.target.dataset.delStoneRow){e.target.closest('.stone-detail-row')?.remove(); updateCalculatedFields(); return;}
  if(e.target.dataset.addImages!==undefined || e.target.closest('[data-add-images]')){document.getElementById('itemImages')?.click(); return;}
  if(e.target.dataset.removeImage!==undefined){const idx=parseInt(e.target.dataset.removeImage); const form=document.getElementById('itemForm'); const itemId=form?.dataset.editId; if(itemId){const item=state.items.find(i=>i.id===itemId); if(item&&item.images){item.images.splice(idx,1); item.updatedAt=new Date().toISOString(); save('Image removed',item.code); populateItemForm(item);}} return;}

  // POS
  if(e.target.dataset.posAddItem){const item=state.items.find(i=>i.id===e.target.dataset.posAddItem); if(item&&item.status==='stock'){if(!state.posCart) state.posCart=[]; const ex=state.posCart.findIndex(c=>c.itemId===item.id); if(ex>=0) state.posCart[ex].qty+=1; else state.posCart.push(calcCartItem(item,1)); render();} else alert(t('Item not available')); return;}
  if(e.target.dataset.posRemoveItem!==undefined){const idx=parseInt(e.target.dataset.posRemoveItem); if(state.posCart) state.posCart.splice(idx,1); render(); return;}
  if(e.target.dataset.posClearCart!==undefined || e.target.closest('[data-pos-clear-cart]')){state.posCart=[]; render(); return;}
  if(e.target.dataset.posAddPay!==undefined || e.target.closest('[data-pos-add-pay]')){const wrap=document.getElementById('posPaymentRows'); if(wrap){const total=calcCartTotals(state.posCart||[]).total; const paid=[...wrap.querySelectorAll('[name="payAmount"]')].reduce((s,el)=>s+num(el.value),0); const remaining=rnd(total-paid); wrap.insertAdjacentHTML('beforeend',`<div class="payment-row" style="display:flex;gap:8px;margin-bottom:8px"><select class="field-select" name="payMethod" style="flex:1">${PAYMENT_METHODS.map(m=>`<option value="${m}">${m}</option>`).join('')}</select><input class="field-input" name="payAmount" type="number" style="width:120px" min="0" step="0.01" value="${remaining.toFixed(2)}"><button type="button" class="btn btn-ghost btn-sm" data-pos-remove-pay>×</button></div>`); updatePaymentSummary();} return;}
  if(e.target.dataset.posRemovePay!==undefined || e.target.closest('[data-pos-remove-pay]')){e.target.closest('.payment-row')?.remove(); updatePaymentSummary(); return;}
  if(e.target.dataset.posCheckout!==undefined || e.target.closest('[data-pos-checkout]')){completePOSale(); return;}
  if(e.target.dataset.posSaveQuote!==undefined || e.target.closest('[data-pos-save-quote]')){savePOSQuote(); return;}
  if(e.target.dataset.posViewInvoice){const sale=state.sales.find(s=>s.id===e.target.dataset.posViewInvoice); if(sale) showInvoiceModal(sale); return;}
  if(e.target.dataset.printInvoice){printInvoice(e.target.dataset.printInvoice); return;}
  if(e.target.dataset.posNewCustomer!==undefined || e.target.closest('[data-pos-new-customer]')){showCustomerModal(); return;}
  if(e.target.dataset.saveCustomer!==undefined || e.target.closest('[data-save-customer]')){saveCustomerFromModal(); return;}

  // Metals
  if(e.target.dataset.metalAdd!==undefined || e.target.closest('[data-metal-add]')){showMetalTxnModal(); return;}
  if(e.target.dataset.metalEdit){const t=state.metalManagement.transactions.find(x=>x.id===e.target.dataset.metalEdit); if(t){if(!canEditTransaction(t)) return alert(t('Cannot edit posted transaction in closed period')); showMetalTxnModal(t);} return;}
  if(e.target.dataset.metalDelete){const t=state.metalManagement.transactions.find(x=>x.id===e.target.dataset.metalDelete); if(t){if(!canEditTransaction(t)) return alert(t('Cannot delete posted transaction in closed period')); if(confirm(t('Delete this transaction?'))){state.metalManagement.transactions=state.metalManagement.transactions.filter(x=>x.id!==t.id); save('Metal transaction deleted', t.type+' '+t.metal+' '+t.purity);}} return;}
  if(e.target.dataset.metalExport!==undefined || e.target.closest('[data-metal-export]')){exportMetalCSV(); return;}
  if(e.target.dataset.metalSaveTxn!==undefined || e.target.closest('[data-metal-save-txn]')){saveMetalTxnFromModal(); return;}
  if(e.target.dataset.metalPostPeriod!==undefined || e.target.closest('[data-metal-post-period]')){const period=new Date().toISOString().slice(0,7); if(confirm(t('Post period')+' '+period+'? '+t('Transactions in this month will be locked.'))){postPeriod(period); save('Period posted',period);} return;}

  // Karigar / Jobs
  if(e.target.dataset.kNew!==undefined || e.target.closest('[data-k-new]')){state.karigarEditId=''; state.karigarSelectedId=''; render(); return;}
  if(e.target.dataset.kSelect){state.karigarSelectedId=e.target.dataset.kSelect; render(); return;}
  if(e.target.dataset.kEdit){state.karigarEditId=e.target.dataset.kEdit; state.karigarSelectedId=e.target.dataset.kEdit; render(); return;}
  if(e.target.dataset.kCancelEdit!==undefined || e.target.closest('[data-k-cancel-edit]')){state.karigarEditId=''; render(); return;}
  if(e.target.dataset.jobSelect){state.karigarSelectedJobId=e.target.dataset.jobSelect; if(tab!=='karigar' && e.target.closest('[data-tab="karigar"]')){tab='karigar';} render(); setTimeout(()=>document.getElementById('jobDetail')?.scrollIntoView({behavior:'smooth',block:'start'}),50); return;}
  if(e.target.dataset.jobPrint){const j=getJob(e.target.dataset.jobPrint); if(j) downloadJobCardPDF(j); return;}

  // Production materials tabs
  if(e.target.closest('.tab[data-mat-tab]')){const btn=e.target.closest('.tab[data-mat-tab]'); document.querySelectorAll('.tabs .tab[data-mat-tab]').forEach(t=>t.classList.remove('active')); btn.classList.add('active'); document.querySelectorAll('.mat-tab-panel').forEach(p=>p.style.display='none'); const panel=document.getElementById('mat-'+btn.dataset.matTab); if(panel) panel.style.display='block'; return;}

  // BOM helpers
  if(e.target.dataset.addstone!==undefined || e.target.closest('[data-addstone]')){const wrap=document.querySelector('#bomStones'); if(wrap){const idx=Date.now(); const stoneTypes=['Diamond','Ruby','Sapphire','Emerald','Cubic Zirconia','Coral','Pearl','Navaratna']; const unitOpts=Object.keys(UNITS).map(u=>`<option>${esc(u)}</option>`).join(''); const stoneSelect=`<select class="field-select" name="stoneType_${idx}">${stoneTypes.map(s=>`<option>${esc(s)}</option>`).join('')}</select>`; const stoneUnitSelect=`<select class="field-select" name="stoneUnit_${idx}">${unitOpts}</select>`; wrap.insertAdjacentHTML('beforeend',`<div class="stone-row" data-idx="${idx}" style="display:grid;grid-template-columns:1.2fr .7fr 1fr 1fr 1fr 1fr auto;gap:8px;margin-bottom:8px"><div>${stoneSelect}</div><div><input class="field-input" name="stoneQty_${idx}" type="number" value="1" min="1"></div><div><input class="field-input" name="stoneWt_${idx}" type="number" value="" min="0" step="0.001"></div><div>${stoneUnitSelect}</div><div><input class="field-input" name="stoneRate_${idx}" type="number" value="" min="0" step="0.01"></div><div><input class="field-input" name="stoneSetting_${idx}" type="number" value="0" min="0" step="0.01"></div><button type="button" class="btn btn-ghost btn-sm" data-delstone="${idx}">×</button></div>`);} return;}
  if(e.target.dataset.delstone){document.querySelector('.stone-row[data-idx="'+e.target.dataset.delstone+'"]')?.remove(); return;}
  if(e.target.dataset.bomview){const b=state.boms.find(x=>x.id===e.target.dataset.bomview); if(b){alert(t('Bill of Materials (BOM) / Job Card')+': '+b.code+' - '+b.name);} return;}
  if(e.target.dataset.bomcsv || e.target.dataset.bompdf){/* lightweight placeholder - cost shown on card */ alert(t('Use the cost summary card on page for details.')); return;}
});

document.addEventListener('change',async e=>{
  if(e.target.id==='language'){ state.settings.language=e.target.value; setLanguage(e.target.value); save('Language changed',LOCALES[e.target.value]?.native||e.target.value); return; }
  if(e.target.id==='numeralStyle'){ state.settings.numeralStyle=e.target.value; setNumeralStyle(e.target.value); save('Settings updated',''); return; }
  if(e.target.id==='kcRingSystem'){kcUI.ringSystem=e.target.value; const out=document.getElementById('kcRingResult'); if(out) out.innerHTML=kcRingResultHTML(); return;}
  if(e.target.id==='acctLedgerSelect'){acctUI.account=e.target.value; render(); return;}
  if(e.target.id==='country'){
    const code=e.target.value;
    state.settings=applyCountryPreset({...state.settings,country:code},code);
    setCountry(code);
    try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(err){}
    // Keep unsaved shop edits: refresh only the dependent fields and the profile card.
    const sync=(id,val)=>{ const el=document.getElementById(id); if(el) el.value=val; };
    sync('currency',state.settings.currency);
    sync('taxRate',state.settings.taxRate);
    sync('taxLabel',state.settings.taxLabel);
    sync('weightUnit',state.settings.weightUnit);
    sync('dial',state.settings.dial);
    sync('calendar',state.settings.calendar||'ad');
    const rp=document.getElementById('regionalProfile');
    if(rp) rp.outerHTML=regionalProfileCard();
    return;
  }
  if(e.target.id==='itemImages') handleImageUpload(e.target.files);
  if(e.target.dataset.posQty!==undefined){const idx=parseInt(e.target.dataset.posQty); const qty=parseInt(e.target.value)||1; if(state.posCart&&state.posCart[idx]){const c=state.posCart[idx]; c.qty=qty; c.subtotal=rnd(c.basePrice*qty); c.taxable=rnd(c.subtotal-c.discount); c.tax=calcTax(c.taxable); c.total=calcGross(c.taxable,c.tax); render();}}
  if(e.target.matches('select[data-job-stage-status]')){const job=getJob(e.target.dataset.jobStageStatus); if(job){const stId=e.target.dataset.stageId; updateJobStage(job,stId,{status:e.target.value}); render(); state.karigarSelectedJobId=job.id;}}
  if(e.target.id==='posCustomerSelect'){const details=document.getElementById('posCustomerDetails'); const c=getCustomer(e.target.value); if(c&&details){details.style.display='block'; details.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><strong>Phone:</strong> ${esc(c.phone||'-')}</div><div><strong>Email:</strong> ${esc(c.email||'-')}</div><div><strong>GSTIN:</strong> ${esc(c.gstin||'-')}</div><div><strong>Balance:</strong> ${money(c.balance||0)}</div></div>`;} else if(details){details.style.display='none'; details.innerHTML='';}}
  if(e.target.id==='invFilterCategory'){state.invFilterCategory=e.target.value; render();}
  if(e.target.id==='invFilterStatus'){state.invFilterStatus=e.target.value; render();}
  if(e.target.id==='invFilterMetal'){state.invFilterMetal=e.target.value; render();}
  if(e.target.id==='invFilterPurity'){state.invFilterPurity=e.target.value; render();}
  if(e.target.id==='invSortBy'){state.invSortBy=e.target.value; render();}
  if(e.target.id==='metalFilterMetal'){state.metalFilterMetal=e.target.value; render();}
  if(e.target.id==='metalFilterType'){state.metalFilterType=e.target.value; render();}
  if(e.target.id==='metalFilterPurity'){state.metalFilterPurity=e.target.value; render();}
  if(e.target.id==='metalFilterPosted'){state.metalFilterPosted=e.target.value; render();}
  if(e.target.id==='karigarJobFilterStatus'){state.karigarJobFilterStatus=e.target.value; render();}
  if(e.target.id==='karigarJobFilterKarigar'){state.karigarJobFilterKarigar=e.target.value; render();}
  if(e.target.id==='jobPhotoInput'){
    const job=getJob(e.target.dataset.jobPhoto); if(job && e.target.files?.length){
      for(const file of Array.from(e.target.files).slice(0,8)){
        const dataUrl=await fileToDataUrl(file);
        addJobPhoto(job,dataUrl,file.name,'');
      }
      render();
    }
  }
});

document.addEventListener('input',e=>{
  if(e.target.id==='kcSearch'){const value=e.target.value; const pos=e.target.selectionStart; kcUI.query=value; render(); const el=document.getElementById('kcSearch'); if(el){el.focus(); try{el.setSelectionRange(pos,pos)}catch{}} return;}
  if(e.target.id==='kcConvType'){kcUI.type=e.target.value; const d=kcDflt(kcUI.type); kcUI.from=d.from; kcUI.to=d.to; render(); return;}
  if(e.target.id==='kcConvFrom'){kcUI.from=e.target.value; const out=document.getElementById('kcConvResult'); if(out) out.innerHTML=kcConvertResult(); return;}
  if(e.target.id==='kcConvTo'){kcUI.to=e.target.value; const out=document.getElementById('kcConvResult'); if(out) out.innerHTML=kcConvertResult(); return;}
  if(e.target.id==='kcConvValue'){kcUI.value=e.target.value; const out=document.getElementById('kcConvResult'); if(out) out.innerHTML=kcConvertResult(); return;}
  if(e.target.id==='kcRingSize'){kcUI.ringSize=e.target.value; const out=document.getElementById('kcRingResult'); if(out) out.innerHTML=kcRingResultHTML(); return;}
  if(e.target.id==='acctVoucherSearch'){acctUI.voucherQuery=e.target.value; const card=e.target.closest('.card'); if(card){const list=voucherRegister(state).filter(j=>{const q=e.target.value.toLowerCase();return !q||[j.no,j.reference,j.memo,j.voucherType].join(' ').toLowerCase().includes(q);}); const body=card.querySelector('.table-wrap'); if(body) body.outerHTML=rows(['Number','Type','Date','Reference','Memo','Amount','Status',''],list.map(j=>`<tr><td class="mono">${esc(j.no)}</td><td>${esc(t(j.voucherType||'Journal'))}</td><td class="mono">${esc(j.date)}</td><td>${esc(j.reference||'')}</td><td class="small">${esc(j.memo||'')}</td><td class="mono align-right">${acctMoney(j.debit)}</td><td>${j.status==='reversed'?kcBadge(t('Reversed'),'badge-warn'):kcBadge(t('Posted'),'badge-completed')}</td><td></td></tr>`).join(''));} return;}
  if(e.target.id==='invSearch'){state.invSearch=e.target.value; render();}
  if(e.target.id==='metalSearch'){state.metalSearch=e.target.value; render();}
  if(e.target.id==='posItemSearch'){state.posItemSearch=e.target.value; render();}
  if(e.target.id==='karigarJobSearch'){state.karigarJobSearch=e.target.value; render();}
  if(e.target.id==='posExtraDiscount'){
    const pct=num(e.target.value); (state.posCart||[]).forEach(c=>{c.discount=calcDiscount(c.subtotal,pct); c.taxable=rnd(c.subtotal-c.discount); c.tax=calcTax(c.taxable); c.total=calcGross(c.taxable,c.tax);}); render();
  }
  if(e.target.name==='payAmount') updatePaymentSummary();
  if(['grossWeight','stoneWeight','netWeight','purity','makingCharge','wastagePercent','sellingPrice','metalType'].includes(e.target.name||e.target.id)) updateCalculatedFields();
  if(e.target.name==='wastagePercent'){const net=num(document.getElementById('netWeight')?.value); const wp=num(e.target.value); const ww=document.getElementById('wastageWeight'); if(ww) ww.value=rnd(net*wp/100).toFixed(3); updateCalculatedFields();}
  if(e.target.id==='cvVal'||e.target.id==='cvFrom'||e.target.id==='cvTo'){const val=num(document.getElementById('cvVal')?.value); const from=document.getElementById('cvFrom')?.value; const to=document.getElementById('cvTo')?.value; const res=convert(val,from,to); const out=document.getElementById('cvResult'); if(out) out.innerHTML=`${val} ${from} = <strong>${res.toFixed(4)} ${to}</strong>`;}
});

document.addEventListener('blur',e=>{
  if(e.target.matches('input[data-job-stage-note]')){
    const job=getJob(e.target.dataset.jobStageNote); if(job){const st=job.stages.find(s=>s.id===e.target.dataset.stageId); if(st && st.notes!==e.target.value){st.notes=e.target.value; job.updatedAt=new Date().toISOString(); localStorage.setItem(KEY,JSON.stringify(state));}} 
  }
},true);

document.addEventListener('submit',e=>{
  e.preventDefault();
  const f=e.target, d=data(f);

  if(f.id==='rates'){if(num(d.gold)<=0||num(d.silver)<=0) return alert(t('Rates must be positive')); state.rates={gold:num(d.gold),silver:num(d.silver)}; save('Rates updated','Gold and silver rates'); return;}
  if(f.id==='posRates'){if(num(d.gold)<=0||num(d.silver)<=0) return alert(t('Rates must be positive')); state.rates={gold:num(d.gold),silver:num(d.silver)}; (state.posCart||[]).forEach(c=>{const item=state.items.find(i=>i.id===c.itemId); if(item){const nc=calcCartItem(item,c.qty); Object.assign(c,nc,{discount:c.discount||0}); c.taxable=rnd(c.subtotal-c.discount); c.tax=calcTax(c.taxable); c.total=calcGross(c.taxable,c.tax);}}); save('POS Rates updated','Gold and silver rates'); return;}

  if(f.id==='itemForm'){
    const editId=f.dataset.editId; const category=d.category||'gold'; const metalType=d.metalType||'Gold'; const purityRaw=String(d.purity||'22K'); const purity=num(purityRaw.replace('K','').replace('PT',''))||22;
    const grossWeight=num(d.grossWeight), stoneWeight=num(d.stoneWeight), netWeight=rnd(grossWeight-stoneWeight); const makingCharge=num(d.makingCharge), wastagePercent=num(d.wastagePercent), sellingPrice=num(d.sellingPrice);
    const stoneDetails=[]; document.querySelectorAll('#stoneDetailsRows .stone-detail-row').forEach(row=>{const idx=row.dataset.idx; const type=row.querySelector(`[name="stoneType_${idx}"]`)?.value; const qty=num(row.querySelector(`[name="stoneQty_${idx}"]`)?.value); const weight=num(row.querySelector(`[name="stoneWt_${idx}"]`)?.value); const unit=row.querySelector(`[name="stoneUnit_${idx}"]`)?.value; const rate=num(row.querySelector(`[name="stoneRate_${idx}"]`)?.value); const setting=num(row.querySelector(`[name="stoneSetting_${idx}"]`)?.value); if(type&&weight>0) stoneDetails.push({type,qty,weight,unit,rate,setting});});
    const images=[]; document.querySelectorAll('#imagePreview img').forEach(img=>images.push({data:img.src,alt:img.alt||''}));
    const sku=d.sku||generateSKU(category,metalType,purityRaw); const barcode=d.barcode||generateBarcode(sku);
    const tempItem={netWeight,purity,makingCharge,wastagePercent,stoneWeight,stoneDetails,metalType}; const costPrice=calcItem.totalCost(tempItem); const sell=sellingPrice||rnd(costPrice*1.25);
    const qrCode=generateQRData({sku,name:d.name,metalType,purity:purityRaw,grossWeight,netWeight,stoneWeight,sellingPrice:sell,currency:state.settings.currency});
    const itemData={id:editId||id(),code:(d.code||'').trim()||sku,sku,name:(d.name||'').trim(),category,metalType,purity,grossWeight,netWeight,stoneWeight,makingCharge,wastagePercent,wastageWeight:rnd(netWeight*wastagePercent/100),costPrice,sellingPrice:sell,marginPercent:rnd(sell?((sell-costPrice)/sell*100):0),status:d.status||'stock',location:d.location||'Showcase',tags:String(d.tags||'').split(',').map(s=>s.trim()).filter(Boolean),images,stoneDetails,barcode,qrCode,createdAt:editId?(state.items.find(i=>i.id===editId)?.createdAt||new Date().toISOString()):new Date().toISOString(),updatedAt:new Date().toISOString(),schemaVersion:2};
    if(!itemData.code||!itemData.name) return alert(t('Code and name required'));
    if(editId){const idx=state.items.findIndex(i=>i.id===editId); if(idx>=0){const old=state.items[idx].status; state.items[idx]=itemData; if(old!==itemData.status) recordMovement(itemData.id,'ADJUSTMENT','Status Change',1,0,'',`${old} -> ${itemData.status}`); save('Item updated',itemData.code);} }
    else {if(state.items.some(i=>i.code.toLowerCase()===itemData.code.toLowerCase())) return alert(t('Item code exists')); state.items.unshift(itemData); recordMovement(itemData.id,'IN','Initial Stock',1,itemData.netWeight,'','Initial inventory entry'); save('Inventory item added',itemData.code);} 
    resetItemForm(); return;
  }

  if(f.id==='exchange'){
    const weight=num(d.weight), purity=num(d.purity), rate=num(d.rate), deduction=num(d.deduction);
    if(!(weight>0)||rate<=0||deduction<0) return alert(t('Check assessment values'));
    state.exchanges.unshift({id:id(),customer:d.customer,weight,purity,rate,deduction,value:rnd(weight*purity/24*rate-deduction),notes:d.notes,date:new Date().toISOString()});
    save('Old gold received',d.customer); return;
  }

  if(f.id==='rateSyncForm'){
    const cfg=rateSyncSettings();
    state.settings.rateSync={...cfg,enabled:d.rateSyncEnabled==='yes',url:(d.rateSyncUrl||'').trim(),goldPath:(d.rateSyncGoldPath||'gold').trim(),silverPath:(d.rateSyncSilverPath||'silver').trim(),unit:d.rateSyncUnit||'tola'};
    save('Rate sync settings saved',state.settings.rateSync.url||'disabled');
    return;
  }
  if(f.id==='settings'){
    const nextLang=d.language||state.settings.language||'en';
    const nextCountry=d.country||state.settings.country||'NP';
    if(nextCountry!==state.settings.country) state.settings=applyCountryPreset({...state.settings,country:nextCountry},nextCountry);
    state.settings={...state.settings,shop:(d.shop||'').trim(),language:nextLang,country:nextCountry,currency:(d.currency||'NPR').trim().toUpperCase(),taxRate:num(d.taxRate),taxLabel:(d.taxLabel||'VAT').trim(),weightUnit:d.weightUnit||state.settings.weightUnit||'gram',taxInclusive:d.taxInclusive!=='no',invoicePrefix:(d.invoicePrefix||'INV').trim(),dial:(d.dial||'').trim(),vatNumber:(d.vatNumber||'').trim(),calendar:d.calendar||state.settings.calendar||'ad'};
    setLanguage(nextLang); setCountry(nextCountry);
    save('Settings updated',d.shop||''); return;}

  if(f.id==='matMetal'){const existing=state.materials.metals.findIndex(m=>m.purity===d.purity); const rec={purity:d.purity,rate:num(d.rate),stock:num(d.stock)}; if(existing>=0) state.materials.metals[existing]=rec; else state.materials.metals.unshift(rec); save('Metal rate updated',d.purity); render(); return;}
  if(f.id==='matStone'){const existing=state.materials.gemstones.findIndex(m=>m.type===d.type); const rec={type:d.type,rate:num(d.rate),stock:num(d.stock),cert:d.cert}; if(existing>=0) state.materials.gemstones[existing]=rec; else state.materials.gemstones.unshift(rec); save('Stone rate updated',d.type); render(); return;}
  if(f.id==='matCons'){const existing=state.materials.consumables.findIndex(m=>m.name===d.name); const rec={name:d.name,unit:d.unit,rate:num(d.rate),stock:num(d.stock)}; if(existing>=0) state.materials.consumables[existing]=rec; else state.materials.consumables.unshift(rec); save('Consumable updated',d.name); render(); return;}

  if(f.id==='bom'){
    const stones=[]; document.querySelectorAll('#bomStones .stone-row').forEach(row=>{const idx=row.dataset.idx; const type=row.querySelector(`[name="stoneType_${idx}"]`)?.value; const qty=num(row.querySelector(`[name="stoneQty_${idx}"]`)?.value); const wt=num(row.querySelector(`[name="stoneWt_${idx}"]`)?.value); const unit=row.querySelector(`[name="stoneUnit_${idx}"]`)?.value; const rate=num(row.querySelector(`[name="stoneRate_${idx}"]`)?.value); const setting=num(row.querySelector(`[name="stoneSetting_${idx}"]`)?.value); if(type&&wt>0) stones.push({type,qty,weight:wt,unit,rate,setting});});
    let mtype=d.bomMakingType||'Per Gram'; const making={type:mtype.replace(/\s+/g,''),rate:num(d.bomMakingRate)}; if(making.type==='PerGram') making.type='perGram'; else if(making.type==='PerTola') making.type='perTola'; else if(making.type==='FlatRate') making.type='flat'; else if(making.type==='%ofMetalValue') making.type='pctMetal'; else if(making.type==='TieredbyProcess'){making.type='tiered'; making.tiers={}; ['Casting','Stone Setting','Engraving/Meenakari','Polishing','Rhodium Plating'].forEach(p=>{const v=num(d['bomTier_'+p]); if(v>0) making.tiers[p]=v;});}
    const bom={id:id(),code:d.bomCode,name:d.bomName,metal:{type:d.bomMetal,purity:d.bomPurity,grossWeight:num(d.bomGross),grossUnit:d.bomGrossUnit,stoneWeight:num(d.bomStoneW),stoneUnit:d.bomStoneUnit},wastagePct:num(d.bomWastage),making,stones,hallmark:num(d.bomHallmark),overhead:num(d.bomOverhead)};
    const ex=state.boms.findIndex(b=>b.code===d.bomCode); if(ex>=0) state.boms[ex]=bom; else state.boms.unshift(bom); save('BOM saved',d.bomCode); render(); return;
  }
  if(f.id==='pricing'){const bomId=f.dataset.bom; const b=state.boms.find(x=>x.id===bomId); if(b){const gross=toGram(b.metal?.grossWeight,b.metal?.grossUnit||'gram'); const stoneW=toGram(b.metal?.stoneWeight,b.metal?.stoneUnit||'gram'); const net=rnd(Math.max(0,gross-stoneW)); const rate=(String(b.metal?.purity||'').includes('Silver'))?num(state.rates.silver):num(state.rates.gold); const metalCost=rnd(net*rate); const wastage=rnd(net*num(b.wastagePct)/100*rate); const making=b.making?.type==='perGram'?rnd(net*num(b.making.rate)):b.making?.type==='flat'?num(b.making.rate):0; const stones=(b.stones||[]).reduce((s,st)=>s+rnd(toGram(st.weight,st.unit||'carat')*num(st.rate)+num(st.setting)),0); const total=rnd(metalCost+wastage+making+stones+num(b.hallmark)+num(b.overhead)); const markup=num(d.markup); const selling=rnd(total*(1+markup/100)); const margin=rnd(selling?((selling-total)/selling*100):0); const out=document.getElementById('priceResult'); if(out) out.innerHTML=`<b>Suggested Selling: ${money(selling)}</b><br>Cost: ${money(total)} · Markup ${markup}% · Margin ${margin}%`; } return;}

  // Karigar & Jobs
  if(f.id==='karigarForm'){
    const editId=f.dataset.editId; const specialties=String(d.specialties||'').split(',').map(s=>s.trim()).filter(Boolean);
    if(editId){const k=getKarigar(editId); if(!k) return; Object.assign(k,{name:d.name||'',phone:d.phone||'',address:d.address||'',status:d.status||'active',ratePerGram:num(d.ratePerGram),ratePerTola:num(d.ratePerTola),specialties,updatedAt:new Date().toISOString()}); updateKarigarStats(k.id); save('Karigar updated',k.name);} 
    else {const k={id:id(),name:d.name||'',phone:d.phone||'',address:d.address||'',status:d.status||'active',ratePerGram:num(d.ratePerGram),ratePerTola:num(d.ratePerTola),specialties,totalJobs:0,totalWeightIssued:0,totalWeightReturned:0,totalWastage:0,totalLabourEarned:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),schemaVersion:1}; state.karigars.unshift(k); save('Karigar added',k.name);} 
    state.karigarEditId=''; return;
  }
  if(f.id==='jobCreateForm'){
    if(!(d.description||'').trim()) return alert(t('Work description required'));
    const job=createJob({code:d.code,description:d.description,assignedKarigarId:d.assignedKarigarId,priority:d.priority,deadline:d.deadline,metalType:d.metalType,purity:d.purity,wastageAllowed:d.wastageAllowed,labourMethod:d.labourMethod,labourRate:d.labourRate,notes:d.notes});
    state.karigarSelectedJobId=job.id; tab='karigar'; render(); return;
  }
  if(f.id==='jobUpdateForm'){
    const job=getJob(f.dataset.jobId); if(!job) return; ensureJobShape(job);
    job.assignedKarigarId=d.assignedKarigarId||null; syncJobKarigar(job);
    const prevStatus=job.status; job.status=d.status||job.status; if(job.status==='In Progress'&&!job.startedAt) job.startedAt=new Date().toISOString(); if(job.status==='Completed') job.completedAt=new Date().toISOString();
    job.deadline=d.deadline||''; job.due=job.deadline; job.priority=d.priority||job.priority; job.metalType=d.metalType||job.metalType; job.purity=d.purity||job.purity; job.wastageAllowed=num(d.wastageAllowed);
    job.labourCharges={...(job.labourCharges||{}),method:d.labourMethod||'perGram',rate:num(d.labourRate)};
    recalcJobFinancials(job); if(job.assignedKarigarId) updateKarigarStats(job.assignedKarigarId);
    job.updatedAt=new Date().toISOString(); save('Job updated', `${job.code}: ${prevStatus} → ${job.status}`); return;
  }
  if(f.id==='jobIssueForm'){
    const job=getJob(f.dataset.jobId); if(!job) return; if(!(num(d.weight)>0)) return alert(t('Weight required'));
    addJobIssue(job,{date:d.date,voucher:d.voucher,metal:d.metal,purity:d.purity,weight:d.weight,notes:d.notes}); render(); return;
  }
  if(f.id==='jobReturnForm'){
    const job=getJob(f.dataset.jobId); if(!job) return; if(!(num(d.weight)>0)) return alert(t('Weight required'));
    addJobReturn(job,{date:d.date,voucher:d.voucher,type:d.type,metal:d.metal,purity:d.purity,weight:d.weight,notes:d.notes}); render(); return;
  }
  if(f.id==='jobQCForm'){
    const job=getJob(f.dataset.jobId); if(!job) return; addJobQC(job,{date:d.date,result:d.result,stage:d.stage,checker:d.checker,notes:d.notes}); render(); return;
  }

  // Report filter forms
  if(f.id==='salesFilter'){state.reportStartDate=d.reportStartDate||''; state.reportEndDate=d.reportEndDate||''; state.reportFilterCustomer=d.reportFilterCustomer||'all'; state.reportFilterCategory=d.reportFilterCategory||'all'; render(); return;}
  if(f.id==='purchaseFilter'){state.reportStartDate=d.reportStartDate||''; state.reportEndDate=d.reportEndDate||''; state.reportFilterSupplier=d.reportFilterSupplier||'all'; render(); return;}
  if(f.id==='stockFilter'){state.reportFilterCategory=d.reportFilterCategory||'all'; state.reportFilterMetal=d.reportFilterMetal||'all'; render(); return;}
  if(f.id==='metalBalanceFilter'){state.reportStartDate=d.reportStartDate||''; state.reportEndDate=d.reportEndDate||''; state.reportFilterCategory=d.reportFilterCategory||'all'; render(); return;}
  if(f.id==='karigarFilter'){state.reportStartDate=d.reportStartDate||''; state.reportEndDate=d.reportEndDate||''; state.reportFilterKarigar=d.reportFilterKarigar||'all'; render(); return;}
  if(f.id==='customerFilter'){state.reportStartDate=d.reportStartDate||''; state.reportEndDate=d.reportEndDate||''; state.reportFilterCustomer=d.reportFilterCustomer||'all'; render(); return;}
  if(f.id==='supplierFilter'){state.reportStartDate=d.reportStartDate||''; state.reportEndDate=d.reportEndDate||''; state.reportFilterSupplier=d.reportFilterSupplier||'all'; render(); return;}
  if(f.id==='expenseFilter'){state.reportStartDate=d.reportStartDate||''; state.reportEndDate=d.reportEndDate||''; state.reportFilterCategory=d.reportFilterCategory||'all'; render(); return;}
  if(f.id==='pnlFilter'){state.reportStartDate=d.reportStartDate||''; state.reportEndDate=d.reportEndDate||''; render(); return;}
  if(f.id==='cashFilter'){state.reportStartDate=d.reportStartDate||''; state.reportEndDate=d.reportEndDate||''; render(); return;}
});

// Optional boot overrides: ?lang=ne&country=NP (handy for testing and shared links)
try{
  const qp=new URLSearchParams(location.search);
  if(qp.get('country')){ const c=qp.get('country').toUpperCase(); state.settings=applyCountryPreset({...state.settings,country:c},c); }
  if(qp.get('lang')) state.settings.language=qp.get('lang');
}catch(e){}
setLanguage(state.settings.language||'en');
setNumeralStyle(state.settings.numeralStyle||'devanagari');
setCountry(state.settings.country||'NP');

let booted=false;
function bootApp(){
  if(booted) return; booted=true;
  render();
  maybeAutoSyncRates();
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
// reliability.js initializes auth on DOMContentLoaded; wait for it so a valid
// session is not lost to a race with the first render.
if(window.RatnaOS&&window.RatnaOS.auth) bootApp();
else{
  document.addEventListener('DOMContentLoaded',bootApp,{once:true});
  setTimeout(bootApp,60);
}
