import fs from 'node:fs';

const file='src/main.js';
let s=fs.readFileSync(file,'utf8');
const marker='let jb=new Uint8Array(0);';
const start=s.indexOf(marker);
if(start<0) throw new Error('JK parser start marker not found');
const end=s.indexOf('async function connectBmsDevice',start);
if(end<0) throw new Error('connectBmsDevice marker not found after JK parser');

const lines=[
"let jb=new Uint8Array(0);",
"let jkNeedTelemetry=false;",
"function add(a,b){const x=new Uint8Array(a.length+b.length);x.set(a);x.set(b,a.length);return x}",
"const u16le=(b,i)=>(b[i]|(b[i+1]<<8))>>>0;",
"const u32le=(b,i)=>(b[i]|(b[i+1]<<8)|(b[i+2]<<16)|(b[i+3]<<24))>>>0;",
"const i32le=(b,i)=>{const v=u32le(b,i);return v>0x7fffffff?v-0x100000000:v};",
"const i16le=(b,i)=>{const v=u16le(b,i);return v>0x7fff?v-0x10000:v};",
"function parseJK55(frame){",
"  if(frame.length!==150||frame[0]!==0x55||frame[1]!==0xAA||frame[2]!==0xEB||frame[3]!==0x90)return false;",
"  const cells=[];",
"  for(let i=0;i<32&&6+2*i+1<frame.length;i++){",
"    const v=u16le(frame,6+2*i)/1000;",
"    if(v>=1.5&&v<=5.0)cells.push(v);else break;",
"  }",
"  if(!cells.length)return false;",
"  st.bms.cells=cells;",
"  st.bms.voltage=cells.reduce((a,v)=>a+v,0);",
"  st.bms.delta=Math.max(...cells)-Math.min(...cells);",
"  jkNeedTelemetry=true;",
"  log('JK cell frame OK: '+cells.length+'S | '+st.bms.voltage.toFixed(3)+'V | Δ '+st.bms.delta.toFixed(3)+'V');",
"  return true;",
"}",
"function telemetryLooksValid(b,i){",
"  if(i+154>=b.length)return false;",
"  const current=i32le(b,i+8)/1000,t1=i16le(b,i+12)/10,t2=i16le(b,i+14)/10,soc=b[i+23],pack100=u32le(b,i+80);",
"  return Number.isFinite(current)&&Math.abs(current)<500&&t1>-40&&t1<100&&t2>-40&&t2<100&&soc<=100&&pack100>=1000&&pack100<=10000;",
"}",
"function parseJKTelemetry(frame){",
"  if(frame.length!==155)return false;",
"  let i=0;",
"  if(!telemetryLooksValid(frame,0))return false;",
"  const current=i32le(frame,i+8)/1000,t1=i16le(frame,i+12)/10,t2=i16le(frame,i+14)/10,soc=frame[i+23];",
"  st.bms.current=Math.abs(current)<0.001?0:current;",
"  st.bms.soc=soc;",
"  st.bms.temp=Math.max(t1,t2);",
"  log('JK telemetry OK: '+st.bms.voltage.toFixed(3)+'V | '+current.toFixed(3)+'A | SOC '+soc+'% | T '+Math.max(t1,t2).toFixed(1)+'C');",
"  return true;",
"}",
"function findJKTelemetry(b){",
"  for(let i=0;i+155<=b.length;i++){if(telemetryLooksValid(b,i))return i}",
"  return -1;",
"}",
"function parse4E57(frame){",
"  if(frame.length<20||frame[0]!==0x4E||frame[1]!==0x57)return false;",
"  return false;",
"}",
"function jkData(data){",
"  jb=add(jb,Uint8Array.from(data));",
"  while(jb.length>=4){",
"    if(jkNeedTelemetry){",
"      if(jb.length<155)return;",
"      const ti=findJKTelemetry(jb);",
"      if(ti>=0){if(ti>0)jb=jb.slice(ti);const tele=jb.slice(0,155);jb=jb.slice(155);jkNeedTelemetry=false;parseJKTelemetry(tele);render();continue}",
"      if(jb.length>160){jb=jb.slice(1);continue}return",
"    }",
"    let start=-1;",
"    for(let i=0;i<=jb.length-4;i++){if(jb[i]===0x55&&jb[i+1]===0xAA&&jb[i+2]===0xEB&&jb[i+3]===0x90){start=i;break}if(jb[i]===0x4E&&jb[i+1]===0x57){start=i;break}}",
"    if(start<0){jb=jb.slice(-3);return}",
"    if(start>0)jb=jb.slice(start);",
"    if(jb[0]===0x55){if(jb.length<150)return;const frame=jb.slice(0,150);jb=jb.slice(150);parseJK55(frame);render();continue}",
"    if(jb.length<4)return;const len=(jb[2]<<8)|jb[3];if(len<20||len>2048){jb=jb.slice(2);continue}if(jb.length<len)return;const frame=jb.slice(0,len);jb=jb.slice(len);parse4E57(frame);render();",
"  }",
"}",
];
const replacement=lines.join('\n')+'\n';
s=s.slice(0,start)+replacement+s.slice(end);
fs.writeFileSync(file,s);
console.log('Installed verified JK parser: 150-byte 55AA cell frame + 155-byte telemetry frame.');
