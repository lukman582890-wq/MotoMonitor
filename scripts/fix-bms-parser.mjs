import fs from 'node:fs';

const file='src/main.js';
let s=fs.readFileSync(file,'utf8');

const replacement=`function parse55(b){
  if(b.length<300||b[0]!=85||b[1]!=170||b[2]!=235||b[3]!=144||b[4]!==2)return;
  const checksum=b.slice(0,299).reduce((a,v)=>(a+v)&255,0);
  if(checksum!==b[299])return;
  const cells=[];
  for(let i=0;i<32;i++){
    const v=u16(b,6+2*i)/1000;
    if(v>=1&&v<=5)cells.push(v); else break;
  }
  if(!cells.length)return;
  st.bms.cells=cells;
  const sum=cells.reduce((a,v)=>a+v,0);
  st.bms.delta=Math.max(...cells)-Math.min(...cells);
  const o=cells.length>=32?32:0;
  const total=u32le(b,118+o);
  const current=i32le(b,126+o);
  const t1=i16le(b,130+o);
  const t2=i16le(b,132+o);
  const mos=i16le(b,cells.length>=32?128:134);
  const soc=b[141+o];
  st.bms.voltage=(total>10000&&total<200000)?total/1000:sum;
  if(Number.isFinite(current)&&Math.abs(current)<500000)st.bms.current=current/1000;
  const temp=[t1,t2,mos].find(v=>Number.isFinite(v)&&v>-1000&&v<1500);
  if(temp!=null)st.bms.temp=temp/10;
  if(soc<=100)st.bms.soc=soc;
}
function u32le(b,i){return (b[i]>>>0)|((b[i+1]>>>0)<<8)|((b[i+2]>>>0)<<16)|((b[i+3]>>>0)*16777216)}
function i32le(b,i){const v=u32le(b,i);return v>2147483647?v-4294967296:v}
function i16le(b,i){const v=u16(b,i);return v>32767?v-65536:v}`;

const re=/function parse55\(b\)\{[\s\S]*?\nfunction parse57/;
if(!re.test(s))throw new Error('Could not locate parse55 block');
s=s.replace(re,replacement+'\nfunction parse57');

const reJk=/function jkData\(data\)\{[\s\S]*?\nasync function connectBmsDevice/;
const jkReplacement=`function jkData(data){
  jb=add(jb,Uint8Array.from(data));
  while(jb.length>=4){
    let s=-1;
    for(let i=0;i<jb.length-1;i++)if((jb[i]==85&&jb[i+1]==170)||(jb[i]==78&&jb[i+1]==87)){s=i;break}
    if(s<0){jb=jb.slice(-3);return}
    if(s)jb=jb.slice(s);
    if(jb[0]==85){
      if(jb.length<300)return;
      parse55(jb.slice(0,300));
      jb=jb.slice(300);
    }else{
      const len=jb[2]<<8|jb[3];
      if(len<20||len>1024)return;
      if(jb.length<len)return;
      parse57(jb.slice(0,len));
      jb=jb.slice(len);
    }
    render();
  }
}`;
if(!reJk.test(s))throw new Error('Could not locate jkData block');
s=s.replace(reJk,jkReplacement+'\nasync function connectBmsDevice');

fs.writeFileSync(file,s);
console.log('JK BMS 55AA runtime parser fixed with protocol-correct offsets.');
