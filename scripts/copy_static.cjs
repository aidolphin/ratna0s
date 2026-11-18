/*
 * Copies classic/service files that Vite cannot bundle into dist/.
 * reliability.js is a classic script loaded by index.html, so it must exist
 * next to the built index.html for preview and static hosting.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const files = ['reliability.js', 'icon.svg', 'manifest.webmanifest'];
if (!fs.existsSync(dist)) {
  console.error('dist/ not found — run vite build first');
  process.exit(1);
}
for (const file of files) {
  const from = path.join(root, file);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(dist, file));
}
console.log(`copied static files: ${files.join(', ')}`);
