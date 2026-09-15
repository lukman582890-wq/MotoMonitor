import fs from 'node:fs';
const file='src/main.js';
let s=fs.readFileSync(file,'utf8');
if(!s.includes("from '@capacitor/core'")) s="import { registerPlugin } from '@capacitor/core';\n"+s;
const start=s.indexOf("(async()=>{try{await __loadLeaflet();");
const end=s.indexOf("setInterval(render,1000);render();",start);
if(start<0||end<0) throw new Error('GPS startup block not found');
const replacement=`const __GPSNative=registerPlugin('GPSNative');
async function __startGpsNative(){
  try{
    if(document.querySelector('#gps-location-badge'))document.querySelector('#gps-location-badge').textContent='GPS: starting…';
    await __GPSNative.addListener('location',(p)=>{__onGps({coords:{latitude:Number(p.latitude),longitude:Number(p.longitude),altitude:p.altitude==null?null:Number(p.altitude),accuracy:p.accuracy==null?null:Number(p.accuracy),speed:p.speed==null?null:Number(p.speed),heading:p.bearing==null?null:Number(p.bearing)}})});
    await __GPSNative.addListener('status',(e)=>{if(e?.status==='location_disabled')__gpsError({message:'Location services disabled'});else if(String(e?.status||'').startsWith('provider_disabled'))log('GPS: '+e.status);else if(e?.status==='tracking_started')log('GPS: direct Android LocationManager tracking active.')});
    const __status=await __GPSNative.status();
    log('GPS native status: permission='+__status.permission+', location='+__status.locationEnabled+', gps='+__status.gpsEnabled+', network='+__status.networkEnabled);
    await __GPSNative.start();
    if(!__status.locationEnabled)__gpsError({message:'Location services disabled'});
    render();
  }catch(e){__gpsError({message:e?.message||'Native GPS unavailable'})}
}
(async()=>{
  await __startGpsNative();
  try{await __loadLeaflet();__map=__makeMap('gps-map');__mapBig=__makeMap('gps-map-big');setTimeout(()=>{__map?.invalidateSize();__mapBig?.invalidateSize()},300)}catch(e){log('Map: '+(e?.message||e))}
  render();
})();
`;
s=s.slice(0,start)+replacement+s.slice(end+"setInterval(render,1000);render();".length);
fs.writeFileSync(file,s);
console.log('Direct Android GPS runtime patch applied: GPSNative LocationManager, explicit status, map-independent startup.');
