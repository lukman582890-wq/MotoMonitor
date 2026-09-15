import fs from 'node:fs';
const file='scripts/patch-dashboard.mjs';
let s=fs.readFileSync(file,'utf8');
// Keep the generated dashboard patch parse-safe. GPS state and the
// geolocation callback must never share the same identifier.
s=s.replace(/if\(\$\('#gps-location-badge'\)\).*?;\}\nrender=/, "if($('#gps-location-badge'))$('#gps-location-badge').textContent=__gps.lat==null?(__lastGpsError||'GPS: waiting…'):'GPS '+__gps.lat.toFixed(5)+', '+__gps.lon.toFixed(5);}\nrender=");
s=s.split('function __gps(p)').join('function __onGps(p)');
s=s.split('watchPosition(__gps,').join('watchPosition(__onGps,');
// Defensive cleanup if an older generated callback form is present.
s=s.split('navigator.geolocation.watchPosition(__gps,__gpsError').join('navigator.geolocation.watchPosition(__onGps,__gpsError');
fs.writeFileSync(file,s);
console.log('dashboard patch script GPS callback fix applied');
