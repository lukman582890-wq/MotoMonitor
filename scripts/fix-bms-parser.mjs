import fs from 'node:fs';

const file='src/main.js';
let s=fs.readFileSync(file,'utf8');

const replacement=`let jkCellCount=0;
let jkNominalCapacity=0;
function parse55AA(e){
  const type=e[4];
  const u16le=i=>e[i+1]<<8|e[i];
  if(type===2){
    const count=Number.isInteger(jkCellCount)&&jkCellCount>0&&jkCellCount<=32?jkCellCount:32;
    const cells=[];
    for(let n=0;n<count;n++){
      const i=6+2*n;
      if(i+1>=e.length)break;
      const v=u16le(i)/1000;
      if(v>1&&v<5)cells.push(v);
    }
    if(!cells.length)return;
    const cellSum=Math.round(cells.reduce((a,v)=>a+v,0)*1000);
    let pos=-1;
    for(let i=40;i<e.length-40;i++){
      const v=(e[i+3]<<24|e[i+2]<<16|e[i+1]<<8|e[i])>>>0;
      if(Math.abs(v-cellSum)<100){pos=i;break}
    }
    if(pos<0)return;
    const voltage=(e[pos+3]<<24|e[pos+2]<<16|e[pos+1]<<8|e[pos])/1000;
    let currentRaw=(e[pos+11]<<24|e[pos+10]<<16|e[pos+9]<<8|e[pos+8])>>>0;
    if(currentRaw>2147483647)currentRaw-=4294967296;
    let current=currentRaw/1000;
    if(Math.abs(current)<0.05)current=0;
    const soc=e[pos+23];
    const tempAraw=(e[pos+13]<<8|e[pos+12]);
    const tempBraw=(e[pos+15]<<8|e[pos+14]);
    const tempA=0.1*(tempAraw>32767?tempAraw-65536:tempAraw);
    const tempB=0.1*(tempBraw>32767?tempBraw-65536:tempBraw);
    const tempMosRaw=(e[pos+21]<<8|e[pos+20]);
    const tempMos=0.001*(tempMosRaw>32767?tempMosRaw-65536:tempMosRaw);
    const capAt43=pos+43<e.length?((e[pos+43]<<24|e[pos+42]<<16|e[pos+41]<<8|e[pos+40])>>>0)/1000:0;
    const capAt31=((e[pos+31]<<24|e[pos+30]<<16|e[pos+29]<<8|e[pos+28])>>>0)/1000;
    const capacity=capAt43>5&&capAt43<500?capAt43:(jkNominalCapacity||capAt31);
    const remainCap=soc*capacity/100;
    const cycles=(e[pos+35]<<24|e[pos+34]<<16|e[pos+33]<<8|e[pos+32])>>>0;
    const cycleCap=((e[pos+39]<<24|e[pos+38]<<16|e[pos+37]<<8|e[pos+36])>>>0)/1000;
    const runtime=pos+47<e.length?((e[pos+47]<<24|e[pos+46]<<16|e[pos+45]<<8|e[pos+44])>>>0):null;
    let tempMos2=0;
    if(pos===118){const v=e[135]<<8|e[134];tempMos2=.1*(v>32767?v-65536:v)}
    else if(pos===150){const v=e[145]<<8|e[144];tempMos2=.1*(v>32767?v-65536:v)}
    else{const q=pos>=150?pos-6:pos+16;if(q>=0&&q+1<e.length){const v=e[q+1]<<8|e[q];tempMos2=.1*(v>32767?v-65536:v)}}
    const tempMosFinal=tempMos2;
    const delta=Math.max(...cells)-Math.min(...cells);
    if(voltage>10&&voltage<150&&Math.abs(current)<500&&soc<=100){
      st.bms.cells=cells;
      st.bms.voltage=voltage;
      st.bms.current=current;
      st.bms.soc=soc;
      st.bms.temp=Math.max(tempA,tempB);
      st.bms.delta=delta;
    }
  }else if(type===1){
    const count=e[114];
    if(count>0&&count<=32)jkCellCount=count;
    if(e.length>133){
      const cap=(u16le(130)|e[132]<<16|e[133]<<24)>>>0;
      const nominal=cap/1000;
      if(nominal>5&&nominal<1000)jkNominalCapacity=nominal;
    }
  }
}
function parse4E57(e){
  const t=e.slice(10,e.length-4);let p=0;
  const out={soc:null,voltage:0,current:0,maxCellTemp:0,cells:[]};
  for(;p<t.length;){
    const tag=t[p++];
    if(tag===121){const len=t[p++];for(let i=0;i<len/2&&p+1<t.length;i++,p+=2){const v=(t[p+1]<<8|t[p])/1000;if(v>1&&v<5)out.cells.push(v)}}
    else if(tag===131){out.voltage=(t[p]<<24|t[p+1]<<16|t[p+2]<<8|t[p+3])/1000;p+=4}
    else if(tag===132){let v=t[p]<<24|t[p+1]<<16|t[p+2]<<8|t[p+3];if(v>2147483647)v-=4294967296;out.current=v/1000;p+=4}
    else if(tag===133){out.soc=t[p++]}
    else if(tag===170){p+=4}
    else if(tag>=128&&tag<=130){let v=t[p]<<8|t[p+1];if(v>32767)v-=65536;out.maxCellTemp=Math.max(out.maxCellTemp||-100,v/10);p+=2}
    else if([134,138,139,140,142].includes(tag))p++;
    else if(tag===135)p+=2;
    else if(tag===137)p+=4;
    else if([144,145,146,147,148,149,150].includes(tag))p+=2;
    else break;
  }
  if(out.cells.length){st.bms.cells=out.cells;st.bms.delta=Math.max(...out.cells)-Math.min(...out.cells)}
  if(out.voltage>10&&out.voltage<150)st.bms.voltage=out.voltage;
  if(Math.abs(out.current)<500)st.bms.current=Math.abs(out.current)<.05?0:out.current;
  if(out.soc!=null&&out.soc<=100)st.bms.soc=out.soc;
  if(out.maxCellTemp>-100&&out.maxCellTemp<100)st.bms.temp=out.maxCellTemp;
}
function is55ChecksumValid(len){if(len<20||len>jb.length)return false;let sum=0;for(let i=0;i<len-1;i++)sum=sum+jb[i]&255;return sum===jb[len-1]}
function find55LengthByChecksum(){for(let len=260;len<=350&&len<=jb.length;len++)if(is55ChecksumValid(len))return len;return -1}
function find55LengthByNextHeader(){for(let i=20;i+1<jb.length;i++)if(jb[i]===85&&jb[i+1]===170&&is55ChecksumValid(i))return i;return -1}
function jkData(data){
  jb=add(jb,Uint8Array.from(data));
  while(jb.length>=20){
    let start=-1,kind='';
    for(let i=0;i<jb.length-1;i++){if(jb[i]===78&&jb[i+1]===87){start=i;kind='4E57';break}if(jb[i]===85&&jb[i+1]===170){start=i;kind='55AA';break}}
    if(start<0){if(jb.length>1000)jb=jb.slice(-10);return}
    if(start)jb=jb.slice(start);
    if(kind==='4E57'){
      if(jb.length<4)return;
      const len=jb[2]<<8|jb[3];
      if(len<20||len>2048){jb=jb.slice(2);continue}
      if(jb.length<len)return;
      const frame=jb.slice(0,len);jb=jb.slice(len);
      let sum=0;for(let i=0;i<len-4;i++)sum=sum+frame[i]&4294967295;
      const expected=(frame[len-4]<<24|frame[len-3]<<16|frame[len-2]<<8|frame[len-1])>>>0;
      if(sum===expected)parse4E57(frame);
    }else{
      let len=find55LengthByChecksum();
      if(len<0)len=find55LengthByNextHeader();
      if(len<0){if(jb.length>500)jb=jb.slice(1);return}
      const frame=jb.slice(0,len);jb=jb.slice(len);parse55AA(frame);
    }
    render();
  }
}`;

const re=/function parse55\(b\)\{[\s\S]*?\nfunction parse57/;
if(re.test(s))s=s.replace(re,replacement+'\n');
else if(!s.includes('function parse55AA(e)'))throw new Error('Could not locate JK parser block');

const reJk=/function jkData\(data\)\{[\s\S]*?\nasync function connectBmsDevice/;
if(reJk.test(s))s=s.replace(reJk,'async function connectBmsDevice');

fs.writeFileSync(file,s);
console.log('Applied exact proven JK 55AA telemetry decoder.');
