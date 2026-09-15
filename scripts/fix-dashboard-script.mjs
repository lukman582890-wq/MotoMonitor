import fs from 'node:fs';
const file='scripts/patch-dashboard.mjs';
let s=fs.readFileSync(file,'utf8');
// The dashboard patch is itself generated with an outer template literal.
// Keep the GPS badge expression as plain string concatenation so the patch
// script never evaluates __gps while Node is loading this build-time script.
s=s.replace(/if\(\$\('#gps-location-badge'\)\).*?;\}\nrender=/, "if($('#gps-location-badge'))$('#gps-location-badge').textContent=__gps.lat==null?(__lastGpsError||'GPS: waiting…'):'GPS '+__gps.lat.toFixed(5)+', '+__gps.lon.toFixed(5);}\nrender=");
fs.writeFileSync(file,s);
console.log('dashboard patch script syntax fixed');
