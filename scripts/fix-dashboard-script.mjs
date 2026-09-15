import fs from 'node:fs';
const file='scripts/patch-dashboard.mjs';
let s=fs.readFileSync(file,'utf8');
// patch-dashboard stores generated JS inside a template literal. Escape the one
// nested template literal used by the GPS badge so the patch script parses.
s=s.replace("?(__lastGpsError||'GPS: waiting…'):`GPS ${__gps.lat.toFixed(5)}, ${__gps.lon.toFixed(5)}`;", "?(__lastGpsError||'GPS: waiting…'):\`GPS \${__gps.lat.toFixed(5)}, \${__gps.lon.toFixed(5)}\`;" );
fs.writeFileSync(file,s);
console.log('dashboard patch script syntax fixed');
