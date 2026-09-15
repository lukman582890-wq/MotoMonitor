import fs from 'node:fs';
const file='scripts/patch-dashboard.mjs';
let s=fs.readFileSync(file,'utf8');
// Keep the generated dashboard patch parse-safe: GPS state is an object,
// while the callback must use a different function name.
s=s.replace(/if\(\$\('#gps-location-badge'\)\).*?;\}\nrender=/, "if($('#gps-location-badge'))$('#gps-location-badge').textContent=__gps.lat==null?(__lastGpsError||'GPS: waiting…'):'GPS '+__gps.lat.toFixed(5)+', '+__gps.lon.toFixed(5);}\nrender=");
s=s.replace(/function __gps\(p\)/g,'function __onGps(p)');
s=s.replace(/watchPosition\(__gps,/g,'watchPosition(__onGps,');
fs.writeFileSync(file,s);
console.log('dashboard patch script syntax fixed');
