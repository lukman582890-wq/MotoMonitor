import fs from 'node:fs';
const file='src/main.js';
let s=fs.readFileSync(file,'utf8');
if(!s.includes("from '@capacitor/geolocation'")) s="import { Geolocation } from '@capacitor/geolocation';\n"+s;
const start=s.indexOf("(async()=>{try{await __loadLeaflet();");
const end=s.indexOf("setInterval(render,1000);render();",start);
if(start<0||end<0) throw new Error('GPS startup block not found');
const replacement=`async function __startGpsNative(){
  try{
    if(document.querySelector('#gps-location-badge'))document.querySelector('#gps-location-badge').textContent='GPS: requesting…';
    let __perm=await Geolocation.checkPermissions();
    if(__perm.location!=='granted') __perm=await Geolocation.requestPermissions({permissions:['location']});
    if(__perm.location!=='granted'){__gpsError({message:'Location permission denied'});return}
    let __watchId=null;
    try{
      __watchId=await Geolocation.watchPosition({enableHighAccuracy:true,timeout:30000,maximumAge:1000,minimumUpdateInterval:1000},(p,e)=>{if(e){__gpsError(e);return}if(p)__onGps(p)});
      log('GPS: native watch registered ('+__watchId+').');
    }catch(e){__gpsError(e)}
    try{
      const __p=await Geolocation.getCurrentPosition({enableHighAccuracy:true,timeout:30000,maximumAge:0});
      __onGps(__p);
      log('GPS: native current position acquired.');
    }catch(e){__gpsError(e)}
    if(__watchId)log('GPS: native tracking active.');
  }catch(e){__gpsError(e)}
}
(async()=>{
  await __startGpsNative();
  try{await __loadLeaflet();__map=__makeMap('gps-map');__mapBig=__makeMap('gps-map-big');setTimeout(()=>{__map?.invalidateSize();__mapBig?.invalidateSize()},300)}catch(e){log('Map: '+(e?.message||e))}
  render();
})();
`;
s=s.slice(0,start)+replacement+s.slice(end+"setInterval(render,1000);render();".length);
fs.writeFileSync(file,s);
console.log('Native Capacitor GPS runtime hardened: direct plugin import, permission check, watch-first, map-independent startup.');
