import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const pkg = path.join(root,'android/app/src/main/java/com/lukman/motomonitor');
fs.mkdirSync(pkg,{recursive:true});
fs.copyFileSync(path.join(root,'native/BluetoothSerialPlugin.java'),path.join(pkg,'BluetoothSerialPlugin.java'));
fs.writeFileSync(path.join(pkg,'MainActivity.java'),`package com.lukman.motomonitor;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle savedInstanceState){
  registerPlugin(BluetoothSerialPlugin.class);
  super.onCreate(savedInstanceState);
 }
}
`);
const mp=path.join(root,'android/app/src/main/AndroidManifest.xml');
let m=fs.readFileSync(mp,'utf8');
if(!m.includes('android.permission.BLUETOOTH_CONNECT')) m=m.replace(/(<manifest[^>]*>)/,`$1\n <uses-permission android:name="android.permission.BLUETOOTH" />\n <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />\n <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />\n <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />`);
if(!m.includes('android.permission.ACCESS_FINE_LOCATION')) m=m.replace(/(<manifest[^>]*>)/,`$1\n <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />`);
if(!m.includes('android.hardware.location.gps')) m=m.replace(/(<manifest[^>]*>)/,`$1\n <uses-feature android:name="android.hardware.location.gps" />`);
fs.writeFileSync(mp,m);
console.log('Native Bluetooth Classic SPP + GPS manifest patch applied; Capacitor Geolocation owns runtime location permission flow.');
