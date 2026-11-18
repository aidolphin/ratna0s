const fs = require('fs');
let content = fs.readFileSync('src.js', 'utf8');

// Add suppliers and expenses to NAV_ICONS
const newNavIcons = `  suppliers:\`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-4-4H17a4 4 0 0 0-4 4v2"/><circle cx="21" cy="7" r="4"/></svg>\`,
  expenses:\`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>\`,
  settings:\``;

content = content.replace('  settings:`<svg viewBox="0 0 24 24"', newNavIcons + '  settings:`<svg viewBox="0 0 24 24"');

// Add suppliers and expenses to PAGE_TITLES
const newPageTitles = `  reports:['Reports & Analytics','Comprehensive financial and operational reports'],
  suppliers:['Suppliers','Vendor management, purchase tracking and payables'],
  expenses:['Expenses','Business expense tracking and categorization'],
  settings:['Settings','Configure your workspace']
};\n`;

content = content.replace("  settings:['Settings','Configure your workspace']\n};", newPageTitles);

fs.writeFileSync('src.js', content);
console.log('Done');