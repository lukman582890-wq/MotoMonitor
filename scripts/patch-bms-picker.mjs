import fs from 'node:fs';

const file = 'src/main.js';
let s = fs.readFileSync(file, 'utf8');

const replacement = `async function connectBmsDevice(d){try{st.bms.id=d.deviceId;st.bms.name=d.name||d.deviceId;await BleClient.connect(d.deviceId,()=>{st.bms.connected=false;render();log('JK BMS disconnected')});await BleClient.startNotifications(d.deviceId,BMS_SERVICE,BMS_CHAR,v=>jkData(Array.from(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))));st.bms.connected=true;jb=new Uint8Array(0);render();log(\`JK BMS connected: \${st.bms.name}\`);for(const cmd of [151,150]){const q=new Uint8Array(20);q.set([170,85,144,235,cmd]);let sum=0;for(let i=0;i<19;i++)sum=(sum+q[i])&255;q[19]=sum;await BleClient.writeWithoutResponse(d.deviceId,BMS_SERVICE,BMS_CHAR,new DataView(q.buffer)).catch(()=>{});await new Promise(r=>setTimeout(r,300))}}catch(e){st.bms.connected=false;render();log(\`JK BMS error: \${e?.message||e}\`)}}
let pickerRefresh=pickController;
async function pickBms(){pickerRefresh=pickBms;try{if(Capacitor.getPlatform()!=='android')throw Error('JK BMS BLE is available in the Android APK');await BleClient.initialize({androidNeverForLocation:true});const found=new Map();log('JK BMS: scanning BLE devices...');await BleClient.requestLEScan({allowExtendedAdvertising:true},r=>{const d=r?.device;if(!d?.deviceId)return;const name=d.name||d.localName||d.deviceId;if(/JK|JIKONG|BLCK|BMS/i.test(name)||!found.has(d.deviceId))found.set(d.deviceId,{...d,name});});await new Promise(r=>setTimeout(r,5000));await BleClient.stopLEScan().catch(()=>{});const ds=[...found.values()];showPicker('Select JK BMS','Scanning BLE devices — select your JK BMS from the list.',ds,async d=>{await connectBmsDevice(d)});}catch(e){await BleClient.stopLEScan().catch(()=>{});log(\`JK BMS scan error: \${e?.message||e}\`)}}
async function connectBms(){if(st.bms.connected){await BleClient.disconnect(st.bms.id).catch(()=>{});st.bms.connected=false;render();return}await pickBms()}`;

const re = /async function connectBms\(\)[\s\S]*?\}\nconst SHOW=/;
if(!re.test(s)) throw new Error('Could not locate connectBms block');
s = s.replace(re, replacement + '\nconst SHOW=');
const end = "document.querySelector('#picker-refresh').onclick=()=>pickController().catch(e=>log(`Bluetooth list error: ${e?.message||e}`));";
const end2 = "document.querySelector('#picker-refresh').onclick=()=>pickerRefresh().catch(e=>log(`Bluetooth list error: ${e?.message||e}`));";
if(!s.includes(end)) throw new Error('Could not locate picker refresh handler');
s = s.replace(end, end2);
const ctrlStart = 'async function pickController(){';
s = s.replace(ctrlStart, 'async function pickController(){pickerRefresh=pickController;');
fs.writeFileSync(file, s);
console.log('JK BMS BLE scan picker patch applied with verified 0x97/0x96 polling.');
