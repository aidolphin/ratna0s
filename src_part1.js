import './style.css';

const KEY='ratnaos-pilot-v1';
const initial=()=>({rates:{gold:15000,silver:180},items:[],sales:[],exchanges:[],jobs:[],audit:[],materials:{metals:[],gemstones:[],consumables:[]},boms:[],metalIssues:[],stockMovements:[],customers:[],karigars:[],suppliers:[],expenses:[],metalManagement:{openingBalances:{},transactions:[],postedPeriods:[]},quotes:[],settings:{shop:'RatnaOS Jewellery',currency:'NPR',taxRate:3,taxLabel:'GST',invoicePrefix:'INV'}});
let state;
try{state=JSON.parse(localStorage.getItem(KEY))||initial()}catch{state=initial()}
state={...initial(),...state};
state.rates={...initial().rates,...(state.rates||{})};
state.settings={...initial().settings,...(state.settings||{})};
state.materials={metals:[],gemstones:[],consumables:[],...(state.materials||{})};
state.metalManagement={openingBalances:{},transactions:[],postedPeriods:[],...(state.metalManagement||{})};
['items','sales','exchanges','jobs','audit','boms','metalIssues','stockMovements','customers','karigars','suppliers','expenses','quotes'].forEach(k=>{if(!Array.isArray(state[k])) state[k]=[];});

const money=n=>`${state.settings.currency} ${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const num=x=>Number(x||0);
const rnd=n=>Math.round((n+Number.EPSILON)*100)/100;
const id=()=>crypto.randomUUID();
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=(event,detail)=>{state.audit.unshift({id:id(),date:new Date().toISOString(),event,detail});localStorage.setItem(KEY,JSON.stringify(state));render()};
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

const ITEM_CATEGORIES=['gold','silver','diamond','gemstone'];
const PURITY_OPTIONS=['24K','22K','21K','20K','18K','14K','12K','9K','999','925','950','PT950'];
const METAL_TYPES=['Gold','Silver','Platinum'];
const STONE_TYPES=['Diamond','Ruby','Sapphire','Emerald','Cubic Zirconia','Coral','Pearl','Navaratna','Spinel','Tourmaline','Topaz','Garnet','Opal'];
const STATUS_OPTIONS=['stock','reserved','in_production','sold','returned','damaged'];
const LOCATIONS=['Showcase','Vault','Karigar','Workshop','Safe','Transit','Customer'];
const MOVEMENT_TYPES=['IN','OUT','ADJUSTMENT'];
const MOVEMENT_REASONS={IN:['Purchase','Production','Return from Karigar','Exchange In','Repair Return','Stock Found'],OUT:['Sale','Issue to Karigar','Exchange Out','Repair Send','Stock Transfer','Gift/Sample'],ADJUSTMENT:['Physical Count','Damage','Loss','Wastage','Revaluation']};
const PAYMENT_METHODS=['Cash','Bank Transfer','Card','Wallet','UPI','Credit','Cheque'];

const METAL_TXN_TYPES=[
  {value:'OPENING_BALANCE',label:'Opening Balance',icon:'📊',color:'var(--info)'},
  {value:'PURCHASE',label:'Purchase',icon:'📥',color:'var(--success)'},
  {value:'ISSUE',label:'Issue to Production',icon:'📤',color:'var(--warning)'},
  {value:'RETURN',label:'Return from Production',icon:'🔄',color:'var(--info)'},
  {value:'RECEIPT',label:'Old Gold Receipt',icon:'♻️',color:'var(--gold-primary)'},
  {value:'WASTAGE',label:'Wastage/Loss',icon:'🗑️',color:'var(--error)'},
  {value:'ADJUSTMENT',label:'Adjustment',icon:'⚖️',color:'var(--text-muted)'}
];
const GOLD_PURITIES=['24K','22K','21K','20K','18K','14K','12K','9K'];
const SILVER_PURITIES=['999','950','925','900','800'];
const METAL_UNITS=['gram','tola','kg'];

const JOB_STATUSES=['Pending','In Progress','QC','Rework','Completed'];
const JOB_STAGES=[
  {id:'received',label:'Material Received',order:1,icon:'📥'},
  {id:'casting',label:'Casting',order:2,icon:'🔥'},
  {id:'filing',label:'Filing/Finishing',order:3,icon:'🔧'},
  {id:'stone_setting',label:'Stone Setting',order:4,icon:'💎'},
  {id:'polishing',label:'Polishing',order:5,icon:'✨'},
  {id:'qc',label:'Quality Check',order:6,icon:'🔍'},
  {id:'packing',label:'Packing',order:7,icon:'📦'},
  {id:'delivered',label:'Delivered',order:8,icon:'🚚'}
];
const LABOUR_METHODS=['perGram','perTola','flat','pctMetal'];
const KARIGAR_SPECIALTIES=['Casting','Filing','Stone Setting','Polishing','Engraving','Enameling','Chain Making','Wire Drawing','Other'];
const QC_RESULTS=['Pass','Fail','Conditional Pass'];
const PRIORITY_OPTIONS=['low','normal','high','urgent'];

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
function calcTax(amount){return rnd(amount*num(state.settings.taxRate)/100);}
function calcDiscount(amount,pct){return rnd(amount*pct/100);}
function calcCartItem(item,qty=1){
  const basePrice=num(item.sellingPrice)||calcItem.totalCost(item);
  const subtotal=rnd(basePrice*qty); const discount=0; const taxable=rnd(subtotal-discount);
  const tax=calcTax(taxable); const total=rnd(taxable+tax);
  return {item,itemId:item.id,qty,basePrice,subtotal,discount,taxable,tax,total};
}
function calcCartTotals(cart){
  const subtotal=rnd(cart.reduce((s,x)=>s+x.subtotal,0));
  const discount=rnd(cart.reduce((s,x)=>s+x.discount,0));
  const taxable=rnd(subtotal-discount);
  const tax=rnd(cart.reduce((s,x)=>s+x.tax,0));
  const total=rnd(taxable+tax);
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
  save('Metal transaction recorded',`${txn.type} ${txn.metal} ${txn.purity} ${num(txn.weight).toFixed(3)}g`);
  return txn;
}
// Supplier helpers
function getSupplier(id){return state.suppliers.find(s=>s.id===id);}
function generateSupplierCode(){const date=new Date();const seq=(state.suppliers.filter(s=>(s.createdAt||'').startsWith(date.toISOString().slice(0,10))).length+1).toString().padStart(3,'0');return `SUP-${date.toISOString().slice(0,10).replace(/-/g,'')}-${seq}`;}
function updateSupplierStats(supplierId,amount){const s=getSupplier(supplierId); if(s){s.totalPurchases=(s.totalPurchases||0)+1; s.totalAmount=rnd((s.totalAmount||0)+amount); s.balance=rnd((s.balance||0)+amount); s.updatedAt=new Date().toISOString();}}
function recordSupplierPayment(supplierId,amount,method,reference,notes){const s=getSupplier(supplierId); if(s){s.balance=rnd((s.balance||0)-amount); s.updatedAt=new Date().toISOString(); save('Supplier payment',`${s.name} - ${money(amount)}`);}}

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
function jobStatusBadge(status){const map={'Pending':'badge-pending','In Progress':'badge-inprogress',QC:'badge-qc',Rework:'badge-rework',Completed:'badge-completed'};return `<span class="badge ${map[status]||'badge-open'}">${esc(status||'Pending')}</span>`;}
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

const NAV_ICONS={
  dashboard:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  inventory:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  pos:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  metals:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
  exchange:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/><path d="M3 12h18"/></svg>`,
  karigar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  production:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  reports:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  suppliers:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-4-4H17a4 4 0 0 0-4 4v2"/><circle cx="21" cy="7" r="4"/></svg>`,
  expenses:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>`,
  settings:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09c-.658.003-1.25.396-1.51 1z"/></svg>`
};
const PAGE_TITLES={
  dashboard:['Dashboard','Command centre for your jewellery business'],
  inventory:['Inventory','Every piece tracked with precision'],
  pos:['Point of Sale','Streamlined sales workflow'],
  metals:['Metal Management','Balances, opening stock, issues, returns and wastage'],
  exchange:['Old Gold Exchange','Transparent assessment register'],
  karigar:['Karigar & Jobs','Profiles, assignments, vouchers, QC and production workflow'],
  production:['Production Stages','Job pipeline, materials, BOM and cost tracking'],
  reports:['Reports & Analytics','Comprehensive financial and operational reports'],
  suppliers:['Suppliers','Vendor management, purchase tracking and payables'],
  expenses:['Expenses','Business expense tracking and categorization'],
  settings:['Settings','Configure your workspace']
};


const input=(name,label,type='text',value='',extra='')=>`<div class="field"><label class="field-label" for="${name}">${label}</label><input class="field-input" id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
const select=(name,label,opts,val='',extra='')=>`<div class="field" ${extra.includes('data-field-wrap')?'': ''}><label class="field-label" for="${name}">${label}</label><select class="field-select" id="${name}" name="${name}" ${extra}>${opts.map(x=>{const v=(typeof x==='object')?x.value:x; const l=(typeof x==='object')?x.label:x; return `<option value="${esc(v)}" ${String(v)===String(val)?'selected':''}>${esc(l)}</option>`}).join('')}</select></div>`;
const textarea=(name,label,val='',extra='')=>`<div class="field"><label class="field-label" for="${name}">${label}</label><textarea class="field-textarea" id="${name}" name="${name}" ${extra}>${esc(val)}</textarea></div>`;
const card=(label,value,sub='')=>`<div class="metric-card"><div class="metric-label">${label}</div><div class="metric-value">${value}</div>${sub?`<div class="metric-sub">${sub}</div>`:''}</div>`;
const rows=(headers,body)=>`<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${body||`<tr><td colspan="${headers.length}" class="align-center"><div class="empty"><p class="empty-title">No records yet</p></div></td></tr>`}</tbody></table></div>`;


function dashboard(){
  const t=totals();
  const openJobs=state.jobs.filter(j=>isJobActiveStatus(j.status)).length;
  const balances=getAllMetalBalances();
  const goldBal=Object.values(balances).filter(b=>b.metal==='Gold').reduce((s,b)=>s+b.balance,0);
  const silverBal=Object.values(balances).filter(b=>b.metal==='Silver').reduce((s,b)=>s+b.balance,0);
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.dashboard[0]}</h1><p class="page-subtitle">${PAGE_TITLES.dashboard[1]}</p></div><div class="page-header-actions"><button class="btn btn-primary" data-tab="inventory">+ Add Jewellery</button><button class="btn btn-secondary" data-tab="pos">New Sale</button></div></div></div>
<div class="metric-grid">${card('Stock Value',money(t.value),'Indicative')} ${card('Total Sales',money(t.sales),'Recorded')} ${card('Open Jobs',openJobs,'Pending / In Progress / QC / Rework')} ${card('Metal Ledger (Au/Ag)',`${rnd(goldBal).toFixed(3)}g / ${rnd(silverBal).toFixed(3)}g`,'Current balances')}</div>
<div class="layout"><div>
  <div class="card"><div class="card-header"><h2 class="card-title">Recent Transactions</h2><button class="btn btn-ghost btn-sm" data-tab="reports">View all</button></div><div class="card-body" style="padding:0">${rows(['Date','Invoice','Customer','Amount'],state.sales.slice(0,7).map(s=>`<tr><td>${new Date(s.date).toLocaleDateString()}</td><td><code class="mono">${esc(s.invoice)}</code></td><td>${esc(s.customerName||s.customer||'-')}</td><td class="align-right mono">${money(s.total)}</td></tr>`).join(''))}</div></div>
  <div class="card"><div class="card-header"><h2 class="card-title">Daily Metal Rates</h2></div><div class="card-body"><form id="rates" class="form" style="margin-top:0">${input('gold','Gold (NPR / fine g)','number',state.rates.gold,'min="0" step="0.01"')}${input('silver','Silver (NPR / g)','number',state.rates.silver,'min="0" step="0.01"')}<div class="field-full"><button class="btn btn-primary" type="submit" style="width:100%">Update Rates</button></div></form></div></div>
</div><div>
  <div class="card"><div class="card-header"><h2 class="card-title">Job Status</h2></div><div class="card-body"><div style="display:flex;flex-direction:column;gap:10px">${JOB_STATUSES.map(s=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--bg-surface);border-radius:var(--radius-md);border:1px solid var(--border-subtle)"><span>${esc(s)}</span>${jobStatusBadge(s).replace(s, String(state.jobs.filter(j=>j.status===s).length)+'')}</div>`).join('')}</div></div></div>
  <div class="card"><div class="card-header"><h2 class="card-title">Quick Actions</h2></div><div class="card-body" style="display:flex;flex-direction:column;gap:10px"><button class="btn btn-secondary" data-tab="karigar">Karigar & Jobs</button><button class="btn btn-secondary" data-tab="production">Production Stages</button><button class="btn btn-secondary" data-tab="metals">Metal Management</button><button class="btn btn-secondary" data-tab="exchange">Old Gold Exchange</button></div></div>
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
  if(searchQuery){const q=searchQuery.toLower(); list=list.filter(i=>[i.code,i.sku,i.name,i.metalType,i.category].join(' ').toLowerCase().includes(q));}
  if(filterCategory!=='all') list=list.filter(i=>i.category===filterCategory);
  if(filterStatus!=='all') list=list.filter(i=>i.status===filterStatus);
  if(filterMetal!=='all') list=list.filter(i=>(i.metalType||i.metal)===filterMetal);
  if(filterPurity!=='all') list=list.filter(i=>String(i.purity)===filterPurity);
  list.sort((a,b)=>{let av=a[sortBy],bv=b[sortBy]; if(typeof av==='string'){av=av.toLowerCase();bv=(bv||'').toLowerCase();} if(sortDir==='asc') return av>bv?1:-1; return av<bv?1:-1;});
  const metals=[...new Set(state.items.map(i=>i.metalType||i.metal).filter(Boolean))];
  const purities=[...new Set(state.items.map(i=>String(i.purity)).filter(Boolean))].sort();
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.inventory[0]}</h1><p class="page-subtitle">${PAGE_TITLES.inventory[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-inv-export>Export CSV</button><button class="btn btn-primary" data-inv-add>+ Add Item</button></div></div></div>
<div class="card"><div class="card-header"><h2 class="card-title">Add / Edit Jewellery Item</h2></div><div class="card-body"><form id="itemForm" class="form" data-edit-id="">
  <input type="hidden" name="id" id="itemId"><input type="hidden" name="category" id="itemCategory" value="gold">
  <div class="tabs" id="itemTypeTabs" style="margin-bottom:12px"><button type="button" class="tab active" data-cat="gold">Gold</button><button type="button" class="tab" data-cat="silver">Silver</button><button type="button" class="tab" data-cat="diamond">Diamond</button><button type="button" class="tab" data-cat="gemstone">Gemstone</button></div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">${input('code','Item Code','text','','')}${input('sku','SKU','text','','readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">${input('name','Item Name','text','','')}${select('metalType','Metal Type',METAL_TYPES,'Gold')}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${select('purity','Purity',PURITY_OPTIONS,'22K')}${input('grossWeight','Gross (g)','number','','min="0" step="0.001"')}${input('stoneWeight','Stone (g)','number','0','min="0" step="0.001"')}${input('netWeight','Net (g)','number','','min="0" step="0.001" readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${input('makingCharge','Making (NPR)','number','0','min="0" step="0.01"')}${input('wastagePercent','Wastage %','number','0','min="0" step="0.1"')}${input('wastageWeight','Wastage (g)','number','0','min="0" step="0.001" readonly')}${input('costPrice','Cost (NPR)','number','','min="0" step="0.01" readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${input('sellingPrice','Selling (NPR)','number','','min="0" step="0.01"')}${input('marginPercent','Margin %','number','','readonly')}${input('barcode','Barcode','text','','readonly')}${input('qrCode','QR Data','text','','readonly')}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${select('status','Status',STATUS_OPTIONS,'stock')}${select('location','Location',LOCATIONS,'Showcase')}${input('tags','Tags (comma)','text','','')}</div>
  <div id="stoneDetailsSection" style="display:none"><h4>Stone Details</h4><div id="stoneDetailsRows"></div><button type="button" class="btn btn-secondary btn-sm" data-add-stone>+ Add Stone</button></div>
  <div><h4>Images</h4><input type="file" id="itemImages" accept="image/*" multiple style="display:none"><button type="button" class="btn btn-secondary btn-sm" data-add-images>Upload Images</button><div id="imagePreview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div></div>
  <div class="field-full" style="display:flex;gap:8px"><button class="btn btn-gold" type="submit"><span id="submitBtnText">Add to Inventory</span></button><button type="button" class="btn btn-secondary" data-inv-cancel style="display:none">Cancel Edit</button></div>
</form></div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Inventory</h2></div><div class="card-body"><div class="toolbar" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><input type="search" id="invSearch" class="field-input" placeholder="Search..." value="${esc(searchQuery)}" style="max-width:260px">${select('invFilterCategory','', ['all',...ITEM_CATEGORIES], filterCategory)}${select('invFilterStatus','', ['all',...STATUS_OPTIONS], filterStatus)}${select('invFilterMetal','', ['all',...metals], filterMetal)}${select('invFilterPurity','', ['all',...purities], filterPurity)}${select('invSortBy','', ['createdAt','code','sku','name','category','metalType','purity','netWeight','sellingPrice','status'], sortBy)}<button class="btn btn-ghost btn-sm" data-inv-sort-dir="${sortDir}">${sortDir}</button></div>${rows(['SKU','Code','Name','Cat','Metal','Purity','Net','Cost','Sell','Status','Location','Actions'], list.map(i=>`<tr><td><code class="mono">${esc(i.sku)}</code></td><td><code class="mono">${esc(i.code)}</code></td><td>${esc(i.name)}</td><td>${esc(i.category)}</td><td>${esc(i.metalType||i.metal||'')}</td><td class="mono">${esc(i.purity)}</td><td class="mono align-right">${num(i.netWeight||i.weight).toFixed(3)}</td><td class="mono align-right">${money(calcItem.totalCost(i))}</td><td class="mono align-right">${money(i.sellingPrice)}</td><td>${esc(i.status)}</td><td>${esc(i.location||'')}</td><td><button class="btn btn-ghost btn-sm" data-inv-edit="${esc(i.id)}">Edit</button> <button class="btn btn-ghost btn-sm" data-inv-delete="${esc(i.id)}">Del</button></td></tr>`).join(''))}</div></div>`;
}

function pos(){
  const availableStock=stock();
  const customers=state.customers||[];
  const cart=state.posCart||[];
  const cartTotals=calcCartTotals(cart);
  const currentRates=state.rates;
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.pos[0]}</h1><p class="page-subtitle">${PAGE_TITLES.pos[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-pos-clear-cart ${cart.length?'':'style="display:none"'}>Clear Cart</button><button class="btn btn-primary" data-pos-new-customer>New Customer</button></div></div></div>
<div class="layout"><div>
  <div class="card"><div class="card-header"><h2 class="card-title">Rates</h2></div><div class="card-body"><form id="posRates" class="form">${input('gold','Gold Rate','number',currentRates.gold,'min="0" step="0.01"')}${input('silver','Silver Rate','number',currentRates.silver,'min="0" step="0.01"')}<div class="field-full"><button class="btn btn-primary" type="submit">Update Rates & Recalculate</button></div></form></div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">Items</h2></div><div class="card-body"><input type="search" id="posItemSearch" class="field-input" placeholder="Search items..." style="margin-bottom:12px"><div style="max-height:300px;overflow:auto">${rows(['SKU','Name','Metal','Purity','Net','Sell','Action'], availableStock.filter(i=>{const q=(state.posItemSearch||'').toLowerCase(); return !q || [i.sku,i.name,i.code].join(' ').toLowerCase().includes(q);}).map(i=>`<tr><td><code class="mono">${esc(i.sku)}</code></td><td>${esc(i.name)}</td><td>${esc(i.metalType||i.metal)}</td><td class="mono">${esc(i.purity)}</td><td class="mono align-right">${num(i.netWeight||i.weight).toFixed(3)}</td><td class="mono align-right">${money(i.sellingPrice||price(i))}</td><td><button class="btn btn-primary btn-sm" data-pos-add-item="${esc(i.id)}">Add</button></td></tr>`).join(''))}</div></div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">Customer</h2></div><div class="card-body"><select class="field-select" id="posCustomerSelect"><option value="">Walk-in Customer</option>${customers.map(c=>`<option value="${esc(c.id)}">${esc(c.name)} ${c.phone?'('+esc(c.phone)+')':''}</option>`).join('')}</select><div id="posCustomerDetails" style="display:none;margin-top:12px"></div></div></div>
</div><div style="width:420px;flex-shrink:0">
  <div class="card"><div class="card-header"><h2 class="card-title">Cart (${cart.length})</h2></div><div class="card-body">${cart.length?`<table class="table"><thead><tr><th>Item</th><th>Qty</th><th>Total</th><th></th></tr></thead><tbody>${cart.map((c,idx)=>`<tr><td>${esc(c.item.name)}<div class="small muted mono">${esc(c.item.sku)}</div></td><td><input type="number" class="field-input" style="width:70px" value="${c.qty}" min="1" data-pos-qty="${idx}"></td><td class="mono align-right">${money(c.total)}</td><td><button class="btn btn-ghost btn-sm" data-pos-remove-item="${idx}">×</button></td></tr>`).join('')}</tbody></table>`:'<p class="muted">Cart is empty</p>'}
  <div style="margin-top:12px">Subtotal: <strong class="mono">${money(cartTotals.subtotal)}</strong><br>Discount: <strong class="mono">${money(cartTotals.discount)}</strong><br>Tax: <strong class="mono">${money(cartTotals.tax)}</strong><br>Grand Total: <strong class="mono" style="color:var(--gold-primary)">${money(cartTotals.total)}</strong></div>
  <div class="field" style="margin-top:12px"><label class="field-label">Extra Discount %</label><input class="field-input" id="posExtraDiscount" type="number" value="0" min="0" max="100" step="0.1"></div>
  <div style="margin-top:12px"><label class="field-label">Payments</label><div id="posPaymentRows">${cart.length?`<div class="payment-row" style="display:flex;gap:8px;margin-bottom:8px"><select class="field-select" name="payMethod" style="flex:1">${PAYMENT_METHODS.map(m=>`<option value="${m}">${m}</option>`).join('')}</select><input class="field-input" name="payAmount" type="number" style="width:120px" min="0" step="0.01" value="${cartTotals.total.toFixed(2)}"><button type="button" class="btn btn-ghost btn-sm" data-pos-remove-pay>×</button></div>`:''}</div><button type="button" class="btn btn-secondary btn-sm" data-pos-add-pay style="width:100%">+ Add Payment</button><div id="posPaymentSummary" style="margin-top:8px"></div></div>
  <div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-gold" style="flex:1" data-pos-checkout>Complete Sale</button><button class="btn btn-secondary" data-pos-save-quote>Save Quote</button></div></div></div>
  <div class="card section"><div class="card-header"><h2 class="card-title">Recent Sales</h2></div><div class="card-body" style="padding:0;max-height:280px;overflow:auto">${rows(['Invoice','Date','Customer','Total','Actions'], state.sales.slice(0,10).map(s=>`<tr><td><code class="mono">${esc(s.invoice)}</code></td><td class="mono">${new Date(s.date).toLocaleDateString()}</td><td>${esc(s.customerName||s.customer||'-')}</td><td class="mono align-right">${money(s.total)}</td><td><button class="btn btn-ghost btn-sm" data-pos-view-invoice="${esc(s.id)}">View</button></td></tr>`).join(''))}</div></div>
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
  const typeOptions=METAL_TXN_TYPES.map(t=>t.value);
  const allPurities=[...GOLD_PURITIES,...SILVER_PURITIES];
  const totalGold=Object.values(balances).filter(b=>b.metal==='Gold').reduce((s,b)=>s+b.balance,0);
  const totalSilver=Object.values(balances).filter(b=>b.metal==='Silver').reduce((s,b)=>s+b.balance,0);
  const goldValue=rnd(totalGold*num(state.rates.gold)); const silverValue=rnd(totalSilver*num(state.rates.silver));
  const balanceRows=Object.values(balances).map(b=>`<tr><td>${esc(b.metal)}</td><td class="mono">${esc(b.purity)}</td><td class="mono align-right">${b.opening.toFixed(3)} g</td><td class="mono align-right"><strong>${b.balance.toFixed(3)} g</strong></td><td class="mono align-right">${money(b.metal==='Gold'?num(state.rates.gold):num(state.rates.silver))}</td><td class="mono align-right">${money(b.balance*(b.metal==='Gold'?num(state.rates.gold):num(state.rates.silver)))}</td></tr>`).join('');
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.metals[0]}</h1><p class="page-subtitle">${PAGE_TITLES.metals[1]}</p></div><div class="page-header-actions"><button class="btn btn-secondary" data-metal-export>Export CSV</button><button class="btn btn-secondary" data-metal-post-period>Post Period</button><button class="btn btn-primary" data-metal-add>New Transaction</button></div></div></div>
<div class="metric-grid">${card('Total Gold', totalGold.toFixed(3)+' g', 'Value '+money(goldValue))}${card('Total Silver', totalSilver.toFixed(3)+' g', 'Value '+money(silverValue))}${card('Transactions', txns.length, `Posted ${txns.filter(t=>t.posted).length}`)}${card('Combined Value', money(goldValue+silverValue), 'At current rates')}</div>
<div class="card"><div class="card-header"><h2 class="card-title">Current Balances by Purity</h2></div><div class="card-body" style="padding:0">${rows(['Metal','Purity','Opening','Current','Rate/g','Value'], balanceRows)}</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Transaction History</h2></div><div class="card-body"><div class="toolbar" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><input type="search" id="metalSearch" class="field-input" placeholder="Search..." value="${esc(state.metalSearch||'')}" style="max-width:240px">${select('metalFilterMetal','',['all','Gold','Silver'],filterMetal)}${select('metalFilterType','',['all',...typeOptions],filterType)}${select('metalFilterPurity','',['all',...allPurities],filterPurity)}${select('metalFilterPosted','',['all','posted','unposted'],filterPosted)}</div><div style="max-height:480px;overflow:auto">${rows(['Date','Type','Metal','Purity','Weight','Rate','Value','Reference','Karigar/Job','Status','Actions'], filtered.map(t=>{const typeInfo=METAL_TXN_TYPES.find(x=>x.value===t.type)||{}; const editable=canEditTransaction(t); return `<tr><td class="mono">${esc(t.date||'')}</td><td><span class="badge" style="background:${typeInfo.color||'var(--bg-elevated)'}22">${esc(t.type)}</span></td><td>${esc(t.metal)}</td><td class="mono">${esc(t.purity)}</td><td class="mono align-right">${num(t.weight).toFixed(3)} ${esc(t.unit||'g')}</td><td class="mono align-right">${t.rate?money(t.rate):'-'}</td><td class="mono align-right">${t.value?money(t.value):'-'}</td><td><code class="mono">${esc(t.reference||'-')}</code></td><td>${esc(t.karigar||t.jobCode||'-')}</td><td>${t.posted?'<span class="badge badge-completed">Posted</span>':'<span class="badge badge-warn">Draft</span>'}</td><td>${editable?`<button class="btn btn-ghost btn-sm" data-metal-edit="${esc(t.id)}">Edit</button> <button class="btn btn-ghost btn-sm" data-metal-delete="${esc(t.id)}">Del</button>`:''}</td></tr>`;}).join(''))}</div><p class="note note-caution" style="margin-top:12px">Job metal issues/returns/wastage are recorded as ledger transactions automatically and affect balances.</p></div></div>`;
}

function exchange(){
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.exchange[0]}</h1><p class="page-subtitle">${PAGE_TITLES.exchange[1]}</p></div></div></div>
<div class="layout"><div>
  <div class="card"><div class="card-header"><h2 class="card-title">Record Old-Gold Receipt</h2></div><div class="card-body"><form id="exchange" class="form">${input('customer','Customer Name')}${input('weight','Net Metal Weight (g)','number','','min="0.001" step="0.001"')}${select('purity','Assessed Purity',['24','22','21','20','18','14','12','9'])}${input('rate','Agreed Rate per Fine Gram (NPR)','number',state.rates.gold,'min="0" step="0.01"')}${input('deduction','Agreed Deduction (NPR)','number','0','min="0" step="0.01"')}${textarea('notes','Assessment / Test Notes')}<div class="field-full"><button class="btn btn-primary" type="submit" style="width:100%">Record Receipt</button></div></form><p class="note note-caution" style="margin-top:12px">Receipt register for pilot. Link to metal ledger manually if needed via Metal Management.</p></div></div>
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
    ? `(${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} → ${endDate ? new Date(endDate).toLocaleDateString() : 'End'})`
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

    return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]} - Sales Report</h1><p class="page-subtitle">${PAGE_TITLES.reports[1]} ${dateRangeLabel}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" data-report-export-csv="sales">Export CSV</button>
  <button class="btn btn-secondary" data-report-export-pdf="sales">Export PDF</button>
</div></div></div>
<div class="metric-grid">
  ${card('Total Sales', money(totalSales), `${sales.length} invoices`)}
  ${card('Total Tax', money(totalTax), `${state.settings.taxLabel} @ ${state.settings.taxRate}%`)}
  ${card('Total Discount', money(totalDiscount))}
  ${card('Avg Sale Value', money(avgSale), `${totalItems} items sold`)}
</div>
<div class="layout">
  <div>
    <div class="card"><div class="card-header"><h2 class="card-title">Sales by Payment Method</h2></div><div class="card-body" style="padding:0">
      ${rows(['Method','Amount','%'], Object.entries(byPayment).map(([m,v])=>`<tr><td>${esc(m)}</td><td class="mono align-right">${money(v)}</td><td class="mono align-right">${totalSales?rnd(v/totalSales*100):0}%</td></tr>`).join('') || '<tr><td colspan="3" class="align-center">No data</td></tr>')}
    </div></div>
    <div class="card"><div class="card-header"><h2 class="card-title">Sales by Metal Type</h2></div><div class="card-body" style="padding:0">
      ${rows(['Metal Type','Amount','%'], Object.entries(byMetal).filter(([,v])=>v>0).map(([m,v])=>`<tr><td>${esc(m)}</td><td class="mono align-right">${money(v)}</td><td class="mono align-right">${totalSales?rnd(v/totalSales*100):0}%</td></tr>`).join('') || '<tr><td colspan="3" class="align-center">No data</td></tr>')}
    </div></div>
  </div>
  <div>
    <div class="card section"><div class="card-header"><h2 class="card-title">Sales Detail</h2></div><div class="card-body" style="padding:0;max-height:500px;overflow:auto">
      ${rows(['Date','Invoice','Customer','Items','Subtotal','Discount','Tax','Total','Payments'], sales.map(s=>`<tr>
        <td class="mono">${new Date(s.date).toLocaleDateString()}</td>
        <td><code class="mono">${esc(s.invoice)}</code></td>
        <td>${esc(s.customerName||s.customer||'Walk-in')}</td>
        <td class="mono align-right">${(s.items||[]).reduce((sum,it)=>sum+num(it.qty),0)}</td>
        <td class="mono align-right">${money(s.subtotal)}</td>
        <td class="mono align-right">${money(s.discount)}</td>
        <td class="mono align-right">${money(s.tax)}</td>
        <td class="mono align-right"><strong>${money(s.total)}</strong></td>
        <td>${(s.payments||[]).map(p=>`${esc(p.method)} ${money(p.amount)}`).join('<br>')}</td>
      </tr>`).join('') || '<tr><td colspan="9" class="align-center">No sales in period</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Filters</h2></div><div class="card-body">
  <form id="salesFilter" class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
    ${input('reportStartDate','From','date',startDate,'')}
    ${input('reportEndDate','To','date',endDate,'')}
    ${select('reportFilterCustomer','Customer',['all',...state.customers.map(c=>({value:c.id,label:c.name}))], filterCustomer)}
    ${select('reportFilterCategory','Category',['all',...ITEM_CATEGORIES], filterCategory)}
    <button class="btn btn-primary" type="submit">Apply</button>
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
  <button class="btn btn-primary" data-report-export-csv="purchases">Export CSV</button>
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
        <td>${esc(t.type)}</td>
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
    <button class="btn btn-primary" type="submit">Apply</button>
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
  <button class="btn btn-primary" data-report-export-csv="stock">Export CSV</button>
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
        <td>${esc(i.metalType||i.metal)}</td>
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
    ${select('reportFilterCategory','Category',['all',...ITEM_CATEGORIES], filterCategory)}
    ${select('reportFilterMetal','Metal',['all','Gold','Silver','Platinum'], state.reportFilterMetal||'all')}
    <button class="btn btn-primary" type="submit">Apply</button>
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
  <button class="btn btn-primary" data-report-export-csv="metalbalances">Export CSV</button>
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
    <button class="btn btn-primary" type="submit">Apply</button>
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
  <button class="btn btn-primary" data-report-export-csv="karigar">Export CSV</button>
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
    <button class="btn btn-primary" type="submit">Apply</button>
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
  <button class="btn btn-primary" data-report-export-csv="customers">Export CSV</button>
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
    <button class="btn btn-primary" type="submit">Apply</button>
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
  <button class="btn btn-primary" data-report-export-csv="suppliers">Export CSV</button>
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
    <button class="btn btn-primary" type="submit">Apply</button>
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
  <button class="btn btn-primary" data-report-export-csv="expenses">Export CSV</button>
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
      }).join('') || '<tr><td colspan="3" class="align-center">No data</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Expense Detail</h2></div><div class="card-body" style="padding:0;max-height:400px;overflow:auto">
  ${rows(['Date','Category','Amount','Status','Payment Method','Reference','Notes'], expenses.map(e=>`<tr>
    <td class="mono">${new Date(e.date).toLocaleDateString()}</td>
    <td>${esc(e.category)}</td>
    <td class="mono align-right">${money(e.amount)}</td>
    <td>${e.status==='paid?'<span class="badge badge-completed">Paid</span>':e.status==='pending?'<span class="badge badge-inprogress">Pending</span>':'<span class="badge badge-warn">Overdue</span>'}</td>
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
    <button class="btn btn-primary" type="submit">Apply</button>
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
  <button class="btn btn-primary" data-report-export-csv="pnl">Export CSV</button>
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
    <button class="btn btn-primary" type="submit">Apply</button>
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
  <button class="btn btn-primary" data-report-export-csv="cash">Export CSV</button>
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
        <td class="mono">${new Date(d).toLocaleDateString()}</td>
        <td class="mono align-right text-success">${money(v.in)}</td>
        <td class="mono align-right text-danger">${money(v.out)}</td>
        <td class="mono align-right ${rnd(v.in-v.out)>=0?'text-success':'text-danger'}"><strong>${money(rnd(v.in-v.out))}</strong></td>
      </tr>`).join('') || '<tr><td colspan="4" class="align-center">No cash movements</td></tr>')}
    </div></div>
  </div>
</div>
<div class="card section"><div class="card-header"><h2 class="card-title">Cash Inflow Detail</h2></div><div class="card-body" style="padding:0;max-height:300px;overflow:auto">
  ${rows(['Date','Type','Ref','Party','Method','Amount'], allInflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<tr>
    <td class="mono">${new Date(x.date).toLocaleDateString()}</td>
    <td>${esc(x.type)}</td>
    <td><code class="mono">${esc(x.ref)}</code></td>
    <td>${esc(x.party)}</td>
    <td>${esc(x.method)}</td>
    <td class="mono align-right text-success">${money(x.amount)}</td>
  </tr>`).join('') || '<tr><td colspan="6" class="align-center">No inflows</td></tr>')}
</div></div>
<div class="card section"><div class="card-header"><h2 class="card-title">Cash Outflow Detail</h2></div><div class="card-body" style="padding:0;max-height:300px;overflow:auto">
  ${rows(['Date','Type','Ref','Party','Method','Amount'], allOutflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<tr>
    <td class="mono">${new Date(x.date).toLocaleDateString()}</td>
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
    <button class="btn btn-primary" type="submit">Apply</button>
    <button class="btn btn-secondary" type="button" data-report-clear-filters>Clear</button>
  </form>
</div></div>`;
  }

  // Default - show report selector
  return `
<div class="page-header"><div class="page-header-top"><div><h1 class="page-title">${PAGE_TITLES.reports[0]}</h1><p class="page-subtitle">${PAGE_TITLES.reports[1]}</p></div><div class="page-header-actions">
  <button class="btn btn-primary" id="export">Export JSON Backup</button>
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
  const netMargin = netRevenue ? rnd(netProfit / netRevenue * 100) : 0.
  
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
  const netCash = rnd(totalIn - totalOut).
  
  const inRows = allInflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<tr><td class="mono">${new Date(x.date).toLocaleDateString()}</td><td>${esc(x.type)}</td><td><code class="mono">${esc(x.ref)}</code></td><td>${esc(x.party)}</td><td>${esc(x.method)}</td><td class="mono align-right">${money(x.amount)}</td></tr>`).join('');
  const outRows = allOutflows.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<tr><td class="mono">${new Date(x.date).toLocaleDateString()}</td><td>${esc(x.type)}</td><td><code class="mono">${esc(x.ref)}</code></td><td>${esc(x.party)}</td><td>${esc(x.method)}</td><td class="mono align-right">${money(x.amount)}</td></tr>`).join('');
  
  const html = generatePDFContent('Daily Cash Report', `Period: ${state.reportStartDate||'Start'} to ${state.reportEndDate||'End'}`, [
    {title: 'Summary', html: `<table><tr><th>Metric</th><th class="align-right mono">Value</th></tr><tr><td>Total Inflows</td><td class="align-right mono">${money(totalIn)}</td></tr><tr><td>Total Outflows</td><td class="align-right mono">${money(totalOut)}</td></tr><tr><td><strong>Net Cash Flow</strong></td><td class="align-right mono ${netCash>=0?'':'text-danger'}"><strong>${money(netCash)}</strong></td></tr></table>`},
    {title: 'Cash Inflows', html: `<table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Party</th><th>Method</th><th class="align-right mono">Amount</th></tr></thead><tbody>${inRows||'<tr><td colspan="6" class="align-center">No inflows</td></tr>'}</tbody></table>`},
    {title: 'Cash Outflows', html: `<table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Party</th><th>Method</th><th class="align-right mono">Amount</th></tr></thead><tbody>${outRows||'<tr><td colspan="6" class="align-center">No outflows</td></tr>'}</tbody></table>`}
  ]);
  download('cash-report-'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}

