import fs from 'node:fs';

const main=fs.readFileSync('src/main.js','utf8');
const android=fs.readFileSync('android/app/src/main/AndroidManifest.xml','utf8');
const native=fs.readFileSync('android/app/src/main/java/com/lukman/motomonitor/GPSNativePlugin.java','utf8');
const activity=fs.readFileSync('android/app/src/main/java/com/lukman/motomonitor/MainActivity.java','utf8');

const checks=[
  ['JS registers GPSNative',main.includes("registerPlugin('GPSNative')")],
  ['JS subscribes to native location events',main.includes("addListener('location'")],
  ['JS starts native GPS',main.includes('await __GPSNative.start()')],
  ['JS no longer uses browser geolocation',!main.includes('navigator.geolocation')],
  ['Android GPS plugin exists',native.includes('@CapacitorPlugin')&&native.includes('GPSNative')],
  ['Android requests fine/coarse location',native.includes('ACCESS_FINE_LOCATION')&&native.includes('ACCESS_COARSE_LOCATION')],
  ['Android LocationManager uses GPS provider',native.includes('LocationManager.GPS_PROVIDER')],
  ['Android LocationManager uses network provider',native.includes('LocationManager.NETWORK_PROVIDER')],
  ['Manifest has fine location',android.includes('android.permission.ACCESS_FINE_LOCATION')],
  ['Manifest has coarse location',android.includes('android.permission.ACCESS_COARSE_LOCATION')],
  ['Manifest declares GPS hardware',android.includes('android.hardware.location.gps')],
  ['MainActivity registers GPSNative',activity.includes('registerPlugin(GPSNativePlugin.class)')],
  ['MainActivity does not race location permission requests',!activity.includes('requestPermissions(')]
];
const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks) console.log((ok?'PASS ':'FAIL ')+name);
if(failed.length) throw new Error('GPS verification failed: '+failed.map(x=>x[0]).join(', '));
console.log('GPS verification passed.');
