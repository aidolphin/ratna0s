const fs = require('fs');
let content = fs.readFileSync('src.js', 'utf8');

// Fix NAV_ICONS - remove duplicate settings entry
content = content.replace(
  '  settings:`  settings:`<svg viewBox="0 0 24 24"',
  '  settings:`<svg viewBox="0 0 24 24"'
);

// Fix PAGE_TITLES - remove duplicate reports entry
content = content.replace(
  "  reports:['Reports & Audit','Operational insights at a glance'],\n  reports:['Reports & Analytics','Comprehensive financial and operational reports'],",
  "  reports:['Reports & Analytics','Comprehensive financial and operational reports'],"
);

fs.writeFileSync('src.js', content);
console.log('Done');