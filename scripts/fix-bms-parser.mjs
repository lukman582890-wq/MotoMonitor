import fs from 'node:fs';

const file='src/main.js';
let s=fs.readFileSync(file,'utf8');

const replacement=`let jkCellCount=0;
let jkNominalCapacity=0;
function parse55AA(e){
  if(e.length<10||e[0]!=85||e[1]!=170||e[2]!=235||e[3]!=144)return;
  const type=e[4];
  const u16le=i=>(e[i]|e[i+1]<<8);
  if(type===2){
    const count=jkCellCount>0&&jkCellCount<=32?jkCellCount:32;
    const cells=[];
    for(let n=0;n<count;n++){
      const i=6+2*n;
      if(i+1>=e.length)break;
      const v=u16le(i)/1000;
      if(v>1&&v<5)cells.push(v);
      else if(cells.length)break;
    }
    if(cells.length){
      st.bms.cells=cells;
      st.bms.delta=Math.max(...cells)-Math.min(...cells);
      if(jkCellCount===0)jkCellCount=cells.length;
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
  if(e.length<20||e[0]!=78||e[1]!=87)return;
  const t=e.slice(10,e.length-4);
  let p=0;
  const out={soc:null,voltage:0,current:0,maxCellTemp:0,cellDelta:0,power:0,cells:[]};
  while(p<t.length){
    const tag=t[p++];
    if(tag===121){
      const len=t[p++];
      if(len==null||p+len>t.length)break;
      for(let i=0;i<len/2;i++){
        const v=(t[p+1]<<8|t[p])/1000;
        if(v>1&&v<5)out.cells.push(v);
        p+=2;
      }
    }else if(tag===131&&p+3<t.length){
      out.voltage=(t[p]<<24|t[p+1]<<16|t[p+2]<<8|t[p+3])/1000;p+=4;
    }else if(tag===132&&p+3<t.length){
      let v=t[p]<<24|t[p+1]<<16|t[p+2]<<8|t[p+3];
      if(v>2147483647)v-=4294967296;
      out.current=v/1000;p+=4;
    }else if(tag===133&&p<t.length){
      out.soc=t[p++];
    }else if(tag===170&&p+3<t.length){
      out.capacity=(t[p]<<24|t[p+1]<<16|t[p+2]<<8|t[p+3])/1000;p+=4;
    }else if(tag>=128&&tag<=130&&p+1<t.length){
      let v=t[p]<<8|t[p+1];if(v>32767)v-=65536;
      out.maxCellTemp=Math.max(out.maxCellTemp||-100,v/10);p+=2;
    }else if([134,138,139,140,142].includes(tag)){p+=1;
    }else if([135,144,145,146,147,148,149,150].includes(tag)){p+=2;
    }else if(tag===137){p+=4;
    }else{break;}
  }
  if(out.cells.length){
    st.bms.cells=out.cells;
    st.bms.delta=Math.max(...out.cells)-Math.min(...out.cells);
    if(jkCellCount===0)jkCellCount=out.cells.length;
  }
  if(out.voltage>10&&out.voltage<150)st.bms.voltage=out.voltage;
  if(Math.abs(out.current)<500)st.bms.current=Math.abs(out.current)<0.05?0:out.current;
  if(out.soc!=null&&out.soc<=100)st.bms.soc=out.soc;
  if(out.maxCellTemp>-100&&out.maxCellTemp<100)st.bms.temp=out.maxCellTemp;
  render();
}
function is55ChecksumValid(len){
  if(len<20||len>jb.length)return false;
  let sum=0;for(let i=0;i<len-1;i++)sum=(sum+jb[i])&255;
  return sum===jb[len-1];
}
function find55LengthByChecksum(){
  for(let len=260;len<=350&&len<=jb.length;len++)if(is55ChecksumValid(len))return len;
  return -1;
}
function find55LengthByNextHeader(){
  for(let i=20;i+1<jb.length;i++)if(jb[i]===85&&jb[i+1]===170&&is55ChecksumValid(i))return i;
  return -1;
}
function jkData(data){
  jb=add(jb,Uint8Array.from(data));
  while(jb.length>=20){
    let start=-1,kind='';
    for(let i=0;i<jb.length-1;i++){
      if(jb[i]===78&&jb[i+1]===87){start=i;kind='4E57';break;}
      if(jb[i]===85&&jb[i+1]===170){start=i;kind='55AA';break;}
    }
    if(start<0){if(jb.length>1000)jb=jb.slice(-10);return;}
    if(start>0)jb=jb.slice(start);
    if(kind==='4E57'){
      if(jb.length<4)return;
      const len=(jb[2]<<8)|jb[3];
      if(len<20||len>2048){jb=jb.slice(2);continue;}
      if(jb.length<len)return;
      const frame=jb.slice(0,len);
      let sum=0;for(let i=0;i<len-4;i++)sum=(sum+frame[i])>>>0;
      const expected=((frame[len-4]<<24)|(frame[len-3]<<16)|(frame[len-2]<<8)|frame[len-1])>>>0;
      jb=jb.slice(len);
      if(sum===expected)parse4E57(frame);
    }else{
      let len=find55LengthByChecksum();
      if(len<0)len=find55LengthByNextHeader();
      if(len<0){if(jb.length>500)jb=jb.slice(1);return;}
      const frame=jb.slice(0,len);
      jb=jb.slice(len);
      parse55AA(frame);
      render();
    }
  }
}`;

const re=/function parse55\(b\)\{[\s\S]*?\nfunction parse57/;
if(!re.test(s))throw new Error('Could not locate parse55/parse57 block');
s=s.replace(re,replacement+'\n');

const reJk=/function jkData\(data\)\{[\s\S]*?\nasync function connectBmsDevice/;
if(!reJk.test(s))throw new Error('Could not locate jkData block');
s=s.replace(reJk,'async function connectBmsDevice');

fs.writeFileSync(file,s);
console.log('Restored verified JK BMS transport parser: 4E57 telemetry + 55AA cell/config frames.');
