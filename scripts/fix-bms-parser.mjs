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
const i32le=(b,i)=>{const v=(b[i]|(b[i+1]<<8)|(b[i+2]<<16)|(b[i+3]<<24))|0;return v};
function crcJK(frame){let sum=0;for(let i=0;i<299;i++)sum=(sum+frame[i])&255;return sum===frame[299]}
function parseJK02(frame){
  if(frame.length<300||frame[0]!==0x55||frame[1]!==0xAA||frame[2]!==0xEB||frame[3]!==0x90||frame[4]!==0x02)return false;
  if(!crcJK(frame)){log('JK RX: CRC mismatch');return false}
  const cells=[];
  for(let i=0;i<32&&6+2*i+1<299;i++){
    const v=u16le(frame,6+2*i)/1000;
    if(v>=1.5&&v<=5.0)cells.push(v); else break;
  }
  if(!cells.length)return false;
  st.bms.cells=cells;
  const ofs2=cells.length>24?32:0;
  const v=i32le(frame,118+ofs2)/1000;
  const current=i32le(frame,126+ofs2)/1000;
  const temp=i32le(frame,134+ofs2)/10;
  const soc=frame[141+ofs2];
  st.bms.voltage=Number.isFinite(v)&&v>0&&v<200?v:cells.reduce((a,x)=>a+x,0);
  st.bms.current=Number.isFinite(current)?current:null;
  st.bms.temp=Number.isFinite(temp)&&temp>-100&&temp<150?temp:null;
  st.bms.soc=soc<=100?soc:null;
  st.bms.delta=Math.max(...cells)-Math.min(...cells);
  log('JK DATA: '+cells.length+'S | '+st.bms.voltage.toFixed(3)+'V | '+(st.bms.current==null?'--':st.bms.current.toFixed(3)+'A')+' | SOC '+(st.bms.soc==null?'--':st.bms.soc+'%')+' | Δ '+st.bms.delta.toFixed(3)+'V);
  return true;
}
function parseJK04(frame){
  if(frame.length<300||frame[0]!==0x55||frame[1]!==0xAA||frame[2]!==0xEB||frame[3]!==0x90||frame[4]!==0x02)return false;
  if(!crcJK(frame))return false;
  const dv=new DataView(frame.buffer,frame.byteOffset,frame.byteLength),cells=[];
  for(let i=0;i<24;i++){const v=dv.getFloat32(6+i*4,true);if(Number.isFinite(v)&&v>=1.5&&v<=5)cells.push(v);else break}
  if(!cells.length)return false;
  st.bms.cells=cells;st.bms.voltage=cells.reduce((a,x)=>a+x,0);st.bms.delta=Math.max(...cells)-Math.min(...cells);
  log('JK DATA JK04: '+cells.length+'S | '+st.bms.voltage.toFixed(3)+'V | Δ '+st.bms.delta.toFixed(3)+'V);
  return true;
}
function parseJKInfo(frame){
  if(frame.length<300||frame[0]!==0x55||frame[1]!==0xAA||frame[2]!==0xEB||frame[3]!==0x90||frame[4]!==0x03)return false;
  if(!crcJK(frame))return false;
  const txt=Array.from(frame.slice(5,120)).filter(x=>x>=32&&x<127).map(x=>String.fromCharCode(x)).join('').trim();
  if(txt)log('JK BMS info: '+txt.slice(0,120));
  return true;
}
function jkData(data){
  traceRaw('JK RX',data);
  jb=add(jb,Uint8Array.from(data));
  while(jb.length>=4){
    let s=-1;
    for(let i=0;i<jb.length-3;i++)if(jb[i]===0x55&&jb[i+1]===0xAA&&jb[i+2]===0xEB&&jb[i+3]===0x90){s=i;break}
    if(s<0){jb=jb.slice(-3);return}
    if(s)jb=jb.slice(s);
    if(jb.length<300)return;
    const frame=jb.slice(0,300);
    if(frame[4]===0x02){
      const ok=parseJK02(frame)||parseJK04(frame);
      if(ok)render();
    }else if(frame[4]===0x03){
      if(parseJKInfo(frame))render();
    }
    jb=jb.slice(300);
  }
}`;
s=s.slice(0,start)+replacement+'\n'+s.slice(end);
fs.writeFileSync(file,s);
console.log('JK BLE parser fixed for 300-byte type-02 frames, CRC, cell voltage, pack voltage, current, temperature and SOC.');
