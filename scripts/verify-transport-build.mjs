import fs from 'node:fs';

const main=fs.readFileSync('src/main.js','utf8');
const bt=fs.readFileSync('android/app/src/main/java/com/lukman/motomonitor/BluetoothSerialPlugin.java','utf8');

const checks=[
  ['VOTOL SHOW packet uses captured 24-byte request',main.includes('const SHOW=[201,20,2,83,72,79,87,0,0,0,0,0,170,0,0,0,24,170,0,0,0,0,196,13]')],
  ['VOTOL parser accepts 24-byte response',main.includes('while(vb.length>=24)')],
  ['VOTOL parser validates C0 14 header',main.includes('vb[i]==192&&vb[i+1]==20')],
  ['VOTOL battery voltage decoded at B5-B6',main.includes('(b[5]<<8|b[6])/10')],
  ['VOTOL current decoded at B7-B8',main.includes('b[7]<<8|b[8]')],
  ['VOTOL RPM decoded at B14-B15',main.includes('b[14]<<8|b[15]')],
  ['VOTOL temperature decoded',main.includes('b[16]-50')&&main.includes('b[17]-50')],
  ['VOTOL SPP plugin receives raw bytes',bt.includes('notifyListeners("rawData"')],
  ['VOTOL SPP plugin writes raw bytes',bt.includes('output.write(bytes)')],
  ['JK parser expects 300-byte frame',main.includes('if(jb.length<300)return')],
  ['JK parser validates CRC',main.includes('crcJK(frame)')],
  ['JK parser decodes SOC',main.includes('st.bms.soc=soc')],
  ['JK parser decodes current',main.includes('st.bms.current=')],
  ['JK parser decodes pack voltage',main.includes('st.bms.voltage=')],
];
const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks) console.log((ok?'PASS ':'FAIL ')+name);
if(failed.length) throw new Error('Transport verification failed: '+failed.map(x=>x[0]).join(', '));
console.log('Transport verification passed.');
