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
const u32le=(b,i)=>(b[i]|(b[i+1]<<8)|(b[i+2]<<16)|(b[i+3]<<24))>>>0;
const i32le=(b,i)=>{const v=u32le(b,i);return v>0x7fffffff?v-0x100000000:v};
const i16le=(b,i)=>{const v=u16le(b,i);return v>0x7fff?v-0x10000:v};
function jkChecksumOk(frame){if(frame.length!==300)return false;let sum=0;for(let i=0;i<299;i++)sum=(sum+frame[i])&255;return sum===frame[299]}
function findTelemetryOffset(e,cells){
  const target=Math.round(cells.reduce((a,v)=>a+v,0)*1000),candidates=[];
  for(let i=70;i<=210;i++){
    if(i+27>=e.length)break;
    if(u32le(e,i)!==target)continue;
    const voltage=u32le(e,i)/1000,current=i32le(e,i+8)/1000,t1=i16le(e,i+12)/10,t2=i16le(e,i+14)/10,soc=e[i+23];
    if(voltage>=10&&voltage<=150&&Math.abs(current)<=500&&t1>-50&&t1<120&&t2>-50&&t2<120&&soc<=100)candidates.push({i,voltage,current,t1,t2,soc});
  }
  if(!candidates.length)return null;
  candidates.sort((a,b)=>Math.abs(a.i-148)-Math.abs(b.i-148));
  return candidates[0];
}
function parse55AA(e){
  if(e.length!==300||e[0]!==0x55||e[1]!==0xAA||e[2]!==0xEB||e[3]!==0x90)return false;
  if(!jkChecksumOk(e))return false;
  const type=e[4];
  if(type===3){
    const vendor=Array.from(e.slice(6,22)).filter(x=>x>=32&&x<127).map(x=>String.fromCharCode(x)).join('').trim();
    if(vendor)log(\`JK BMS info: \${vendor}\`);
    return true;
  }
  if(type!==2)return true;
  const cells=[];
  for(let i=0;i<32&&6+2*i+1<e.length;i++){
    const v=u16le(e,6+2*i)/1000;
    if(v>=1.5&&v<=5.0)cells.push(v);else if(cells.length>0)break;
  }
  if(!cells.length)return false;
  const tele=findTelemetryOffset(e,cells);
  if(!tele)return false;
  st.bms.cells=cells;
  st.bms.voltage=tele.voltage;
  st.bms.current=Math.abs(tele.current)<0.02?0:tele.current;
  st.bms.soc=tele.soc;
  st.bms.temp=Math.max(tele.t1,tele.t2);
  st.bms.delta=Math.max(...cells)-Math.min(...cells);
  log(\`JK OK: \${cells.length}S | \${tele.voltage.toFixed(3)}V | \${tele.current.toFixed(3)}A | SOC \${tele.soc}% | T \${Math.max(tele.t1,tele.t2).toFixed(1)}C | tele@\${tele.i}\`);
  return true;
}
function parse4E57(e){
  if(e.length<20||e[0]!==0x4E||e[1]!==0x57)return false;
  let p=10,end=e.length-4;const cells=[];let voltage=null,current=null,soc=null,temp=null;
  while(p<end){
    const tag=e[p++];
    if(tag===121){const len=e[p++];for(let i=0;i<len/2&&p+1<end;i++,p+=2){const v=u16le(e,p)/1000;if(v>1&&v<5)cells.push(v)}}
    else if(tag===131&&p+3<end){voltage=((e[p]<<24)|(e[p+1]<<16)|(e[p+2]<<8)|e[p+3])/1000;p+=4}
    else if(tag===132&&p+3<end){let v=(e[p]<<24)|(e[p+1]<<16)|(e[p+2]<<8)|e[p+3];if(v>2147483647)v-=4294967296;current=v/1000;p+=4}
    else if(tag===133&&p<end){soc=e[p++]}
    else if(tag>=128&&tag<=130&&p+1<end){const v=i16le(e,p)/10;temp=Math.max(temp??-100,v);p+=2}
    else if([134,138,139,140,142].includes(tag))p++;
    else if(tag===135)p+=2;
    else if(tag===137||tag===170)p+=4;
    else if([144,145,146,147,148,149,150].includes(tag))p+=2;
    else break;
  }
  if(cells.length){st.bms.cells=cells;st.bms.delta=Math.max(...cells)-Math.min(...cells)}
  if(Number.isFinite(voltage)&&voltage>10&&voltage<150)st.bms.voltage=voltage;
  if(Number.isFinite(current)&&Math.abs(current)<500)st.bms.current=Math.abs(current)<.02?0:current;
  if(Number.isFinite(soc)&&soc<=100)st.bms.soc=soc;
  if(Number.isFinite(temp)&&temp>-50&&temp<120)st.bms.temp=temp;
  return true;
}
function jkData(data){
  jb=add(jb,Uint8Array.from(data));
  while(jb.length>=4){
    let start=-1;
    for(let i=0;i<jb.length-3;i++){
      if(jb[i]===0x55&&jb[i+1]===0xAA&&jb[i+2]===0xEB&&jb[i+3]===0x90){start=i;break}
      if(jb[i]===0x4E&&jb[i+1]===0x57){start=i;break}
    }
    if(start<0){jb=jb.slice(-3);return}
    if(start>0)jb=jb.slice(start);
    if(jb[0]===0x55){
      if(jb.length<300)return;
      const frame=jb.slice(0,300);
      if(!jkChecksumOk(frame)){log('JK: invalid 300-byte checksum, resync');jb=jb.slice(1);continue}
      jb=jb.slice(300);parse55AA(frame);render();continue;
    }
    if(jb.length<4)return;
    const len=(jb[2]<<8)|jb[3];
    if(len<20||len>2048){jb=jb.slice(2);continue}
    if(jb.length<len)return;
    const frame=jb.slice(0,len);jb=jb.slice(len);parse4E57(frame);render();
  }
}
`;

s=s.slice(0,start)+replacement+s.slice(end);
fs.writeFileSync(file,s);
console.log('Installed JK 55AA parser: exact 300-byte frames, checksum validation, dynamic telemetry offset, 20S support.');
