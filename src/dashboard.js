import './style.css';
import './dashboard.css';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { VotolBleProtocol } from './votol-ble.js';

const SPP = Capacitor.registerPlugin('BluetoothSerial');
const BMS_SERVICE='0000ffe0-0000-1000-8000-00805f9b34fb';
const BMS_CHAR='0000ffe1-0000-1000-8000-00805f9b34fb';
const SHOW=[201,20,13,83,72,79,87,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,211,13];
const st={bms:{connected:false,voltage:null,current:null,soc:null,temp:null,cells:[],name:'',id:''},ctrl:{connected:false,voltage:null,current:null,rpm:null,temp:null,extTemp:null,status:null,name:'',id:''},gps:{connected:false,speed:null,altitude:null},mode:'ECO',gear:'D',layout:4};
const app=document.querySelector('#app');
app.innerHTML=`<main class="tilano-grid" data-layout="4"><header class="tilano-top"><div class="top-left"><div class="brand-mark">M</div><div><div class="brand">MotoMonitor</div><div class="tagline">RIDE · MONITOR · EXPLORE</div></div><div class="connection-icons"><span id="gps-icon" class="conn"><b>⌖</b><small>GPS</small></span><span id="bms-icon" class="conn"><b>♢</b><small>BMS</small></span><span id="votol-icon" class="conn"><b>⌁</b><small>VOTOL</small></span></div></div><div class="clock"><strong id="clock">--:--</strong><span id="date">---</span></div><div class="top-right"><span>☼</span><span>◖</span><select id="layout-select" class="layout-select" aria-label="Dashboard layout"><option value="1">L1 Tesla</option><option value="2">L2 Sloped</option><option value="3">L3 Gecit</option><option value="4" selected>L4 Tilano</option><option value="5">L5 Tech Lab</option><option value="6">L6 Navigation</option><option value="7">L7 Motovlog</option><option value="8">L8 Dragger</option><option value="9">L9 Road Dyno</option><option value="10">L10 Canvas</option></select><button id="settings" class="icon-btn">⚙</button></div></header><section class="dashboard-main"><article class="speed-panel"><div class="eyebrow">SPEED</div><div class="speed-value" id="speed">--</div><div class="speed-unit">km/h</div><div class="mode-box"><button data-mode="prev">‹</button><div><small>MODE</small><strong id="mode">ECO</strong></div><button data-mode="next">›</button></div></article><article class="gauge-panel"><div class="rpm-arc"><div class="arc-label">RPM ×1000</div><div class="rpm-scale"><span>0</span><span>2</span><span>4</span><span>6</span><span>8</span><span>10</span><span>12</span></div></div><div class="attitude"><div class="cross">＋</div><div class="horizon"></div><div class="bike">⌁</div><div class="attitude-values"><span><b>--°</b><small>ROLL</small></span><span><b>--°</b><small>PITCH</small></span></div></div><div class="gauge-readout"><div><b id="rpm">--</b><small>RPM</small></div><div><b id="power">--</b><small>POWER</small></div><div><b id="current">--</b><small>CURRENT</small></div></div></article><article class="battery-panel"><div class="panel-title">BATTERY <span id="bms-name">JK BMS</span></div><div class="soc-value" id="soc">--%</div><div class="battery-visual"><div id="battery-fill"></div></div><div class="battery-pack"><span id="voltage">-- V</span><span id="cells">--S</span></div><div class="battery-metrics"><div><small>CURRENT</small><b id="bms-current">-- A</b></div><div><small>TEMP</small><b id="bms-temp">-- °C</b></div></div><button id="connect-bms" class="connect-device">Connect JK BMS</button></article><article class="lower-telemetry"><div class="gear-card"><small>GEAR</small><strong id="gear">D</strong></div><div class="trip-strip"><div><small>ODO</small><b>-- km</b></div><div><small>TRIP A</small><b>0.0 km</b></div><div><small>RANGE</small><b>-- km</b></div></div><div class="temp-strip"><div><small>MOTOR TEMP</small><b id="motor-temp">-- °C</b></div><div><small>CTRL TEMP</small><b id="ctrl-temp">-- °C</b></div></div><button id="connect-votol-spp" class="connect-device">Connect VOTOL SPP</button><button id="connect-votol-ble" class="connect-device secondary">Connect VOTOL BLE</button></article></section><section class="media-card"><div class="album-art">♪</div><div class="track"><b>No Title</b><small>No Artist</small><div class="progress"><i></i></div><div class="time"><span>0:00</span><span>--:--</span></div></div><div class="media-controls"><button>l◀</button><button id="play" class="play">▶</button><button>▶l</button></div><div class="volume">◖ <i></i></div></section><section class="quick-stats"><div><small>AVG SPEED</small><b id="avg">-- km/h</b></div><div><small>TRIP TIME</small><b id="trip-time">00:00</b></div><div><small>EFFICIENCY</small><b>-- Wh/km</b></div><div><small>ELEVATION</small><b id="elevation">-- m</b></div><div><small>SOC USED</small><b>-- %</b></div></section><nav class="bottom-nav"><button class="active" data-page="dashboard">⌂<small>Dashboard</small></button><button data-page="bms">▣<small>BMS</small></button><button data-page="votol">▦<small>VOTOL</small></button><button data-page="map">⌖<small>Map</small></button><button data-page="trip">▥<small>Trip</small></button><button data-page="media">♫<small>Media</small></button><button data-page="settings">⚙<small>Settings</small></button></nav><div id="device-picker" class="device-picker hidden"><div class="picker-panel"><div class="picker-head"><div><h2>Select Bluetooth device</h2><p>Choose a paired VOTOL controller.</p></div><button class="secondary" id="picker-close">Cancel</button></div><div id="picker-list" class="picker-list"></div><button class="secondary picker-refresh" id="picker-refresh">Refresh devices</button></div></div><div id="toast" class="toast hidden"></div></main>`;
const $=s=>document.querySelector(s);const fmt=(x,d=1,u='')=>Number.isFinite(x)?`${x.toFixed(d)}${u}`:`--${u}`;
function render(){const b=st.bms,c=st.ctrl,g=st.gps,p=Number.isFinite(b.voltage)&&Number.isFinite(b.current)?Math.abs(b.voltage*b.current):null;const controllerSpeed=Number.isFinite(c.rpm)?Math.max(0,c.rpm*0.144):null;const s=Number.isFinite(g.speed)&&g.speed>0?g.speed:controllerSpeed;$('#speed').textContent=Number.isFinite(s)?Math.round(s):'--';$('#avg').textContent=Number.isFinite(s)?`${Math.round(s)} km/h`:'-- km/h';$('#soc').textContent=Number.isFinite(b.soc)?`${Math.round(b.soc)}%`:'--%';$('#battery-fill').style.width=`${Math.max(0,Math.min(100,b.soc??0))}%`;$('#voltage').textContent=fmt(b.voltage,1,' V');$('#cells').textContent=b.cells.length?`${b.cells.length}S`:'--S';$('#bms-current').textContent=fmt(b.current,1,' A');$('#bms-temp').textContent=fmt(b.temp,1,' °C');$('#rpm').textContent=Number.isFinite(c.rpm)?c.rpm:'--';$('#power').textContent=p==null?'--':`${(p/1000).toFixed(1)} kW`;$('#current').textContent=fmt(c.current,1,' A');$('#motor-temp').textContent=fmt(c.extTemp,1,' °C');$('#ctrl-temp').textContent=fmt(c.temp,1,' °C');$('#gear').textContent=st.gear;$('#mode').textContent=st.mode;$('#bms-name').textContent=b.name?b.name.slice(0,16):'JK BMS';[['#gps-icon',g.connected],['#bms-icon',b.connected],['#votol-icon',c.connected]].forEach(([id,on])=>$(id).classList.toggle('on',on));}
function clock(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});$('#date').textContent=d.toLocaleDateString([],{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}setInterval(clock,1000);clock();
let __gpsWatch=null;
(async()=>{try{
  const perm=await Geolocation.requestPermissions();
  if(perm.location==='granted'){
    __gpsWatch=await Geolocation.watchPosition({enableHighAccuracy:true,maximumAge:1000,timeout:10000},(pos)=>{
      if(pos?.coords){st.gps.connected=true;st.gps.speed=Number.isFinite(pos.coords.speed)?Math.max(0,pos.coords.speed*3.6):null;st.gps.altitude=pos.coords.altitude;render();}
    });
  }else toast('GPS permission not granted');
}catch(e){console.debug('GPS:',e?.message||e)}})();
const u16=(b,i)=>(b[i]|b[i+1]<<8)>>>0;
const i16=(b,i)=>{const v=u16(b,i);return v>32767?v-65536:v};
const u32=(b,i)=>(b[i]>>>0)|((b[i+1]>>>0)<<8)|((b[i+2]>>>0)<<16)|((b[i+3]>>>0)*16777216);
const i32=(b,i)=>{const v=u32(b,i);return v>2147483647?v-4294967296:v};
const join=(a,b)=>{const x=new Uint8Array(a.length+b.length);x.set(a);x.set(b,a.length);return x};
let jb=new Uint8Array(0),jkCellCount=0;

function parse55AA(frame){
  if(frame.length<10||frame[0]!==0x55||frame[1]!==0xAA||frame[2]!==0xEB||frame[3]!==0x90)return;
  const type=frame[4];
  if(type===2){
    const count=jkCellCount>0&&jkCellCount<=32?jkCellCount:32;
    const cells=[];
    for(let n=0;n<count;n++){
      const i=6+n*2;if(i+1>=frame.length)break;
      const v=u16(frame,i)/1000;
      if(v>1&&v<5)cells.push(v);else break;
    }
    if(cells.length){
      st.bms.cells=cells;
      st.bms.delta=Math.max(...cells)-Math.min(...cells);
      if(!jkCellCount)jkCellCount=cells.length;
    }
  }else if(type===1){
    const count=frame[114];
    if(count>0&&count<=32)jkCellCount=count;
  }
  // JK 24S/32S register map. Prefer the direct pack values when valid.
  const o=st.bms.cells.length>=32?32:0;
  const total=u32(frame,118+o), current=i32(frame,126+o);
  const temps=[i16(frame,130+o),i16(frame,132+o),i16(frame,st.bms.cells.length>=32?128:134)];
  const soc=frame[141+o];
  if(total>10000&&total<200000)st.bms.voltage=total/1000;
  else if(st.bms.cells.length)st.bms.voltage=st.bms.cells.reduce((a,v)=>a+v,0);
  if(Math.abs(current)<500000)st.bms.current=current/1000;
  const temp=temps.find(v=>v>-1000&&v<1500);
  if(temp!=null)st.bms.temp=temp/10;
  if(soc<=100)st.bms.soc=soc;
}

function parse4E57(frame){
  if(frame.length<20||frame[0]!==0x4E||frame[1]!==0x57)return;
  const t=frame.slice(10,frame.length-4);let p=0;
  while(p<t.length){
    const tag=t[p++];
    if(tag===121){
      const len=t[p++];if(len==null||p+len>t.length)break;
      const cells=[];
      for(let i=0;i<len/2;i++){const v=u16(t,p)/1000;p+=2;if(v>1&&v<5)cells.push(v)}
      if(cells.length){st.bms.cells=cells;st.bms.delta=Math.max(...cells)-Math.min(...cells)}
      continue;
    }
    if(tag===131&&p+3<t.length){const v=(t[p]*16777216+t[p+1]*65536+t[p+2]*256+t[p+3])/1000;if(v>10&&v<150)st.bms.voltage=v;p+=4;continue}
    if(tag===132&&p+3<t.length){let v=(t[p]*16777216+t[p+1]*65536+t[p+2]*256+t[p+3]);if(v>2147483647)v-=4294967296;st.bms.current=v/1000;p+=4;continue}
    if(tag===133&&p<t.length){if(t[p]<=100)st.bms.soc=t[p];p++;continue}
    if(tag>=128&&tag<=130&&p+1<t.length){const v=i16(t,p);if(v>-1000&&v<1500)st.bms.temp=v/10;p+=2;continue}
    if([134,138,139,140,142].includes(tag)){p+=1;continue}
    if([135,144,145,146,147,148,149,150].includes(tag)){p+=2;continue}
    if(tag===137||tag===170){p+=4;continue}
    break;
  }
}

function valid55Length(len){
  if(len<20||len>jb.length)return false;
  let sum=0;for(let i=0;i<len-1;i++)sum=(sum+jb[i])&255;
  return sum===jb[len-1];
}
function jkData(data){
  jb=join(jb,Uint8Array.from(data||[]));
  while(jb.length>=20){
    let s=-1,kind='';
    for(let i=0;i<jb.length-1;i++){
      if(jb[i]===0x4E&&jb[i+1]===0x57){s=i;kind='4E57';break}
      if(jb[i]===0x55&&jb[i+1]===0xAA){s=i;kind='55AA';break}
    }
    if(s<0){jb=jb.slice(-10);return}
    if(s)jb=jb.slice(s);
    if(kind==='4E57'){
      if(jb.length<4)return;
      const len=(jb[2]<<8)|jb[3];
      if(len<20||len>2048){jb=jb.slice(2);continue}
      if(jb.length<len)return;
      const frame=jb.slice(0,len);
      let sum=0;for(let i=0;i<len-4;i++)sum=(sum+frame[i])>>>0;
      const expected=((frame[len-4]*16777216)+(frame[len-3]*65536)+(frame[len-2]*256)+frame[len-1])>>>0;
      jb=jb.slice(len);
      if(sum===expected)parse4E57(frame);
    }else{
      let len=-1;
      for(let n=260;n<=350&&n<=jb.length;n++){if(valid55Length(n)){len=n;break}}
      if(len<0)return;
      const frame=jb.slice(0,len);jb=jb.slice(len);parse55AA(frame);
    }
    render();
  }
}

async function connectBms(){
  try{
    if(st.bms.connected){await BleClient.disconnect(st.bms.id).catch(()=>{});st.bms.connected=false;render();return}
    await BleClient.initialize({androidNeverForLocation:true});
    const d=await BleClient.requestDevice({acceptAllDevices:true,optionalServices:[BMS_SERVICE]});
    await BleClient.disconnect(d.deviceId).catch(()=>{});
    st.bms.id=d.deviceId;st.bms.name=d.name||d.deviceId;
    await BleClient.connect(d.deviceId,()=>{st.bms.connected=false;render();toast('JK BMS disconnected')});
    const services=await BleClient.getServices(d.deviceId);
    const svc=services.find(x=>x.uuid.toLowerCase()===BMS_SERVICE);
    const chars=svc?.characteristics||[];
    const notify=chars.find(x=>x.uuid.toLowerCase()===BMS_CHAR)||chars.find(x=>x.properties?.notify||x.properties?.indicate);
    const write=chars.find(x=>x.uuid.toLowerCase()===BMS_CHAR)||chars.find(x=>x.properties?.writeWithoutResponse||x.properties?.write);
    if(!notify)throw Error('JK BMS FFE1 notify characteristic not found');
    if(!write)throw Error('JK BMS write characteristic not found');
    await BleClient.startNotifications(d.deviceId,BMS_SERVICE,notify.uuid,v=>jkData(new Uint8Array(v.buffer,v.byteOffset,v.byteLength)));
    st.bms.connected=true;jb=new Uint8Array(0);jkCellCount=0;render();
    toast('JK BMS connected');
    const send=async cmd=>{
      const q=new Uint8Array(20);q.set([170,85,144,235,cmd]);
      let sum=0;for(let i=0;i<19;i++)sum=(sum+q[i])&255;q[19]=sum;
      try{await BleClient.writeWithoutResponse(d.deviceId,BMS_SERVICE,write.uuid,new DataView(q.buffer))}
      catch(_){await BleClient.write(d.deviceId,BMS_SERVICE,write.uuid,new DataView(q.buffer))}
    };
    for(const cmd of [0x96,0x97]){await send(cmd);await new Promise(r=>setTimeout(r,500))}
    const pollBms=async()=>{if(!st.bms.connected)return;for(const cmd of [0x96]){try{await send(cmd)}catch(e){toast('JK poll error: '+(e?.message||e))}}};
    clearInterval(window.__mmBmsPoll);window.__mmBmsPoll=setInterval(pollBms,1000);
  }catch(e){st.bms.connected=false;render();toast('JK BMS: '+(e?.message||e))}
}
let vb=new Uint8Array(0),poll,rawListener,statusListener;function votolData(data){vb=join(vb,Uint8Array.from(data));while(vb.length>=24){let s=-1;for(let i=0;i<=vb.length-24;i++)if(vb[i]==192&&vb[i+1]==20){s=i;break}if(s<0){vb=vb.slice(-23);return}if(s)vb=vb.slice(s);const b=vb.slice(0,24),v=(b[5]<<8|b[6])/10;let ir=b[7]<<8|b[8];if(ir&32768)ir-=65536;const states=['IDLE','INIT','START','RUN','STOP','BRAKE','WAIT','FAULT'];st.ctrl.voltage=v;st.ctrl.current=ir/10;st.ctrl.rpm=b[14]<<8|b[15];st.ctrl.temp=b[16]-50;st.ctrl.extTemp=b[17]-50;st.ctrl.status=states[b[21]]||`ST:${b[21]}`;vb=vb.slice(24);render()}}
let votolBle=null;
function initVotolBle(){
  if(votolBle)return votolBle;
  votolBle=new VotolBleProtocol({
    onLog:msg=>toast(msg),
    onRaw:(label,data)=>{
      if(window.MotoMonitor?.logRaw) window.MotoMonitor.logRaw(label,data);
    },
    onState:s=>{
      st.ctrl.connected=!!s.connected;
      if(s.connected){st.ctrl.id=s.deviceId;st.ctrl.name=s.name||s.deviceId;st.ctrl.transport='BLE'}
      else if(st.ctrl.transport==='BLE'){st.ctrl.name='';st.ctrl.id='';st.ctrl.transport=''}
      render();
    },
    onData:d=>{
      if(d.kind==='live'){
        Object.assign(st.ctrl,{voltage:d.voltage,current:d.current,rpm:d.rpm,temp:d.controllerTemp,extTemp:d.externalTemp,status:d.status});
        render();
      }else if(d.kind==='parameter'){
        if(!st.ctrl.params)st.ctrl.params={};
        st.ctrl.params[d.page]=d.payload;
      }
    }
  });
  return votolBle;
}
async function connectVotolBle(){
  try{
    const v=initVotolBle();
    if(v.connected){await v.disconnect();return}
    await v.connect();
    toast('VOTOL BLE protocol active');
  }catch(e){st.ctrl.connected=false;render();toast(`VOTOL BLE: ${e?.message||e}`)}
}

function picker(devices){const list=$('#picker-list');list.innerHTML=devices.length?'':'<div class="empty-device">No paired Bluetooth devices found.</div>';devices.forEach(d=>{const b=document.createElement('button');b.className='device-option';b.innerHTML=`<strong>${d.name||'Unnamed device'}</strong><span>${d.id||d.address||''}</span>`;b.onclick=()=>{$('#device-picker').classList.add('hidden');connectVotol(d)};list.appendChild(b)});$('#device-picker').classList.remove('hidden')}
async function connectVotol(d){try{st.ctrl.id=d.id||d.address;st.ctrl.name=d.name||st.ctrl.id;if(rawListener)await rawListener.remove().catch(()=>{});if(statusListener)await statusListener.remove().catch(()=>{});rawListener=await SPP.addListener('rawData',e=>votolData(e.data||[]));statusListener=await SPP.addListener('status',e=>{st.ctrl.connected=!!e.connected;if(e.name)st.ctrl.name=e.name;render()});await SPP.connectInsecure({id:st.ctrl.id});st.ctrl.connected=true;vb=new Uint8Array(0);render();await SPP.write({data:SHOW});clearInterval(poll);poll=setInterval(()=>SPP.write({data:SHOW}).catch(()=>{}),200)}catch(e){st.ctrl.connected=false;render();toast(`VOTOL SPP: ${e?.message||e}`)}}
const isVotolName=(d)=>{const n=String(d?.name||d?.localName||'').trim().toUpperCase();return n.includes('VOTOL')||n.includes('EM-50')||n.includes('EM50')};
async function controller(){try{if(Capacitor.getPlatform()!=='android')return toast('VOTOL Classic SPP tersedia di Android APK');if(st.ctrl.connected){clearInterval(poll);await SPP.disconnect().catch(()=>{});st.ctrl.connected=false;render();return}const r=await SPP.list();const devices=(r?.devices||[]).filter(x=>x&&(x.id||x.address)&&isVotolName(x));if(!devices.length)return toast('VOTOL tidak ditemukan — pastikan Bluetooth VOTOL ON dan sudah paired');picker(devices)}catch(e){toast(`VOTOL SPP: ${e?.message||e}`)}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.add('hidden'),1800)}
document.querySelector('#layout-select')?.addEventListener('change',e=>{
  const n=Math.max(1,Math.min(10,Number(e.target.value)||4));
  st.layout=n;
  document.querySelector('.tilano-grid')?.setAttribute('data-layout',String(n));
  const names={1:'Tesla cockpit',2:'Sloped cockpit',3:'Gecit cockpit',4:'Tilano cockpit',5:'Tech Lab',6:'Route / Navigation',7:'Motovlog',8:'Dragger',9:'Road Dyno',10:'Custom Canvas'};
  toast(`Layout ${n}: ${names[n]}`);
});
document.addEventListener('click',e=>{const m=e.target.closest('[data-mode]');if(m){const a=['ECO','NORMAL','SPORT'];let i=a.indexOf(st.mode)+(m.dataset.mode==='next'?1:-1);st.mode=a[(i+a.length)%a.length];render()}const p=e.target.closest('[data-page]');if(p){document.querySelectorAll('.bottom-nav button').forEach(x=>x.classList.remove('active'));p.classList.add('active');if(p.dataset.page==='bms')toast('BMS panel active — use Connect JK BMS');else if(p.dataset.page==='votol')toast('VOTOL panel active — use the connection button');else if(p.dataset.page!=='dashboard')toast(`${p.dataset.page.toUpperCase()} module — shell ready`)}});
$('#connect-votol-ble')?.addEventListener('click',connectVotolBle); $('#connect-votol-spp')?.addEventListener('click',controller); $('#connect-bms')?.addEventListener('click',connectBms); $('#settings').onclick=()=>toast('Settings module — shell ready');$('#play').onclick=()=>toast('Media player bridge ready');$('#picker-close').onclick=()=>$('#device-picker').classList.add('hidden');$('#picker-refresh').onclick=()=>controller();
window.MotoMonitor={state:st,setGps(data){Object.assign(st.gps,data,{connected:true});render()},connectBms,connectVotol:controller,connectVotolBle,logRaw:(label,data)=>{const h=Array.from(data||[]).map(v=>v.toString(16).padStart(2,'0').toUpperCase()).join(' ');if(st.log){} console.debug(label,h)}};render();
