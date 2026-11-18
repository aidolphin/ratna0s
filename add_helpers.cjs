const fs = require('fs');
let content = fs.readFileSync('src.js', 'utf8');

// Add supplier and expense helper functions after recordMetalTxn
const supplierExpenseHelpers = `
// Supplier helpers
function getSupplier(id){return state.suppliers.find(s=>s.id===id);}
function generateSupplierCode(){const date=new Date();const seq=(state.suppliers.filter(s=>(s.createdAt||'').startsWith(date.toISOString().slice(0,10))).length+1).toString().padStart(3,'0');return \`SUP-\${date.toISOString().slice(0,10).replace(/-/g,'')}-\${seq}\`;}
function updateSupplierStats(supplierId,amount){const s=getSupplier(supplierId); if(s){s.totalPurchases=(s.totalPurchases||0)+1; s.totalAmount=rnd((s.totalAmount||0)+amount); s.balance=rnd((s.balance||0)+amount); s.updatedAt=new Date().toISOString();}}
function recordSupplierPayment(supplierId,amount,method,reference,notes){const s=getSupplier(supplierId); if(s){s.balance=rnd((s.balance||0)-amount); s.updatedAt=new Date().toISOString(); save('Supplier payment',\`\${s.name} - \${money(amount)}\`);}}

// Expense helpers
function getExpense(id){return state.expenses.find(e=>e.id===id);}
const EXPENSE_CATEGORIES=['Rent','Utilities','Salaries','Marketing','Transport','Insurance','Maintenance','Professional Fees','Office Supplies','Taxes','Licenses','Bank Charges','Other'];
const EXPENSE_STATUSES=['paid','pending','overdue','cancelled'];
function generateExpenseNumber(){const date=new Date();const seq=(state.expenses.filter(e=>(e.date||e.createdAt||'').startsWith(date.toISOString().slice(0,10))).length+1).toString().padStart(4,'0');return \`EXP-\${date.toISOString().slice(0,10).replace(/-/g,'')}-\${seq}\`;}
function getExpenseTotals(startDate,endDate){let list=state.expenses; if(startDate) list=list.filter(e=>new Date(e.date)>=new Date(startDate)); if(endDate) list=list.filter(e=>new Date(e.date)<=new Date(endDate)); const byCat={}; let total=0; list.forEach(e=>{if(e.status!=='cancelled'){total+=num(e.amount); byCat[e.category]=(byCat[e.category]||0)+num(e.amount);}}); return {total,byCat,count:list.length};}

`;

// Insert after recordMetalTxn function
content = content.replace(
  '  state.metalManagement.transactions.unshift(txn);\n  save(\'Metal transaction recorded\',`${txn.type} ${txn.metal} ${txn.purity} ${num(txn.weight).toFixed(3)}g`);\n  return txn;\n}\n\n// Karigar/Job helpers',
  '  state.metalManagement.transactions.unshift(txn);\n  save(\'Metal transaction recorded\',`${txn.type} ${txn.metal} ${txn.purity} ${num(txn.weight).toFixed(3)}g`);\n  return txn;\n}' + supplierExpenseHelpers + '\n// Karigar/Job helpers'
);

fs.writeFileSync('src.js', content);
console.log('Done');