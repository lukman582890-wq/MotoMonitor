import fs from 'node:fs';

const file='src/main.js';
let s=fs.readFileSync(file,'utf8');
const marker='let jb=new Uint8Array(0);';
const start=s.indexOf(marker);
if(start<0) throw new Error('JK parser start marker not found');
const end=s.indexOf('async function connectBmsDevice',start);
if(end<0) throw new Error('connectBmsDevice marker not found after JK parser');

const replacement=`let jb=new Uint8Array(0);
function add(a,b){const x=new Uint8Array(a.length+b.length);x.set(a);x.set(b,a.length);return x}
const u16le=(b,i)=>(b[i]|(b[i+1]<<8))>>>0;
function parseJK55(frame){
  if(frame.length!==150||frame[0]!==0x55||frame[1]!==0xAA||frame[2]!==0xEB||frame[3]!==0x90||frame[4]!==0x02)return false;
  const cells=[];
  for(let i=0;i<32&&6+2*i+1<frame.length;i++){
    const v=u16le(frame,6+2*i)/1000;
    if(v>=1.5&&v<=5.0)cells.push(v);else break;
  }
  if(!cells.length)return false;
  st.bms.cells=cells;
  st.bms.voltage=cells.reduce((a,v)=>a+v,0);
  st.bms.delta=Math.max(...cells)-Math.min(...cells);
  log('JK DATA: '+cells.length+'S | '+st.bms.voltage.toFixed(3)+'V | Δ '+st.bms.delta.toFixed(3)+'V');
  return true;
}
function parseJKInfo(frame){
  if(frame.length!==150||frame[0]!==0x55||frame[1]!==0xAA||frame[2]!==0xEB||frame[3]!==0x90||frame[4]!==0x03)return false;
  const txt=Array.from(frame.slice(5)).filter(x=>x>=32&&x<127).map(x=>String.fromCharCode(x)).join('').trim();
  if(txt)log('JK BMS info: '+txt.slice(0,120));
  return true;
}
function jkData(data){
  traceRaw('JK RX',data);
  jb=add(jb,Uint8Array.from(data));
  while(jb.length>=4){
    let s=-1;
    for(let i=0;i<jb.length-3;i++){
      if(jb[i]===0x55&&jb[i+1]===0xAA&&jb[i+2]===0xEB&&jb[i+3]===0x90){s=i;break}
    }
    if(s<0){jb=jb.slice(-3);return}
    if(s)jb=jb.slice(s);
    if(jb.length<150)return;
    const frame=jb.slice(0,150);
    let ok=false;
    if(frame[4]===0x02)ok=parseJK55(frame);
    else if(frame[4]===0x03)ok=parseJKInfo(frame);
    jb=jb.slice(150);
    if(ok)render();
  }
}`;
s=s.slice(0,start)+replacement+'\n'+s.slice(end);
fs.writeFileSync(file,s);
console.log('JK parser copied to the proven VotolJKUnified 55 AA EB 90 type-02 frame structure; cell voltage, pack voltage and delta are derived directly from the recorded frame.');
