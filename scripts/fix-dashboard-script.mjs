import fs from 'node:fs';
const file='scripts/patch-dashboard.mjs';
let s=fs.readFileSync(file,'utf8');
// The generated JS is embedded in the outer `extra` template literal.
// Escape every backtick on the GPS badge line so the patch script itself parses.
s=s.split('\n').map(line=>line.includes("gps-location-badge") ? line.replaceAll('`','\\`') : line).join('\n');
fs.writeFileSync(file,s);
console.log('dashboard patch script syntax fixed');
