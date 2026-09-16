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
"let jkPendingTelemetry=false;",
"function add(a,b){const x=new Uint8Array(a.length+b.length);x.set(a);x.set(b,a.length);return x}",
"const u16le=(b,i)=>(b[i]|(b[i+1]<<8))>>>0;",
"const u32le=(b,i)=>(b[i]|(b[i+1]<<8)|(b[i+2]<<16)|(b[i+3]<<24))>>>0;",
"const i32le=(b,i)=>{const v=u32le(b,i);return v>0x7fffffff?v-0x100000000:v};",
"const i16le=(b,i)=>{const v=u16le(b,i);return v>0x7fff?v-0x10000:v};",
"function parseJKCells(frame){",
"  if(frame.length!==150||frame[0]!==0x55||frame[1]!==0xAA||frame[2]!==0xEB||frame[3]!==0x90||frame[4]!==2)return false;",
"  const cells=[];",
"  for(let i=0;i<32&&6+2*i+1<frame.length;i++){const v=u16le(frame,6+2*i)/1000;if(v>=1.5&&v<=5.0)cells.push(v);else break}",
"  if(!cells.length)return false;",
"  st.bms.cells=cells;",
"  st.bms.delta=Math.max(...cells)-Math.min(...cells);",
"  log('JK cell frame OK: '+cells.length+'S | Δ '+st.bms.delta.toFixed(3)+'V');",
"  return true;",
"}",
"function telemetryLooksValid(b){",
"  if(b.length<24)return false;",
"  const voltage=u32le(b,0)/1000,current=i32le(b,8)/1000,t1=i16le(b,12)/10,t2=i16le(b,14)/10,soc=b[23];",
"  return voltage>=10&&voltage<=150&&Math.abs(current)<500&&t1>-40&&t1<100&&t2>-40&&t2<100&&soc<=100;",
"}",
"function parseJKTelemetry(frame){",
"  if(frame.length!==150||!telemetryLooksValid(frame))return false;",
"  const voltage=u32le(frame,0)/1000,current=i32le(frame,8)/1000,t1=i16le(frame,12)/10,t2=i16le(frame,14)/10,soc=frame[23];",
"  st.bms.voltage=voltage;",
"  st.bms.current=Math.abs(current)<0.001?0:current;",
"  st.bms.soc=soc;",
"  st.bms.temp=Math.max(t1,t2);",
"  log('JK telemetry OK: '+voltage.toFixed(3)+'V | '+current.toFixed(3)+'A | SOC '+soc+'% | T '+Math.max(t1,t2).toFixed(1)+'C');",
"  return true;",
"}",
"function parseJKInfo(frame){",
"  if(frame.length!==150||frame[0]!==0x55||frame[1]!==0xAA||frame[2]!==0xEB||frame[3]!==0x90||frame[4]!==3)return false;",
"  const txt=Array.from(frame.slice(5)).filter(x=>x>=32&&x<127).map(x=>String.fromCharCode(x)).join('').trim();",
"  if(txt)log('JK BMS info: '+txt.slice(0,120));",
"  return true;",
"}",
"function handleJK150(frame){",
"  if(frame.length!==150)return false;",
"  if(frame[0]===0x55&&frame[1]===0xAA&&frame[2]===0xEB&&frame[3]===0x90){",
"    const type=frame[4];",
"    if(type===1){jkPendingTelemetry=true;log('JK realtime frame part 1 received');return true}",
"    if(type===2)return parseJKCells(frame);",
"    if(type===3)return parseJKInfo(frame);",
"    return false;",
"  }",
"  if(jkPendingTelemetry&&telemetryLooksValid(frame)){jkPendingTelemetry=false;return parseJKTelemetry(frame)}",
"  if(telemetryLooksValid(frame))return parseJKTelemetry(frame);",
"  return false;",
"}",
"function jkData(data){",
"  jb=add(jb,Uint8Array.from(data));",
"  while(jb.length>=150){",
"    let start=-1;",
"    for(let i=0;i<=jb.length-4;i++){if(jb[i]===0x55&&jb[i+1]===0xAA&&jb[i+2]===0xEB&&jb[i+3]===0x90){start=i;break}}",
"    if(start>0){",
"      const candidate=jb.slice(0,150);",
"      if(jkPendingTelemetry&&telemetryLooksValid(candidate)){jb=jb.slice(150);jkPendingTelemetry=false;parseJKTelemetry(candidate);render();continue}",
"      jb=jb.slice(start);",
"    }",
"    if(jb.length<150)return;",
"    const frame=jb.slice(0,150);",
"    if(handleJK150(frame)){jb=jb.slice(150);render();continue}",
"    jb=jb.slice(150);",
"  }",
"}",
];
const replacement=lines.join('\n')+'\n';
s=s.slice(0,start)+replacement+s.slice(end);
fs.writeFileSync(file,s);
console.log('Installed JK parser from recorded protocol: type 02 cell frames, type 01 two-part realtime frames, and type 03 info frames.');
