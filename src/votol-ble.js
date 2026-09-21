import { BleClient } from '@capacitor-community/bluetooth-le';

export const VOTOL_SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const VOTOL_READ_CHAR = '0000ffe3-0000-1000-8000-00805f9b34fb';

const delay = ms => new Promise(r => setTimeout(r, ms));
const u16be = (b,i) => (b[i]<<8)|b[i+1];
const i16be = (b,i) => { const v=u16be(b,i); return v&0x8000?v-0x10000:v; };
const checksum = b => { let x=b[0]; for(let i=1;i<22;i++) x^=b[i]; return x&255; };

function valid(b){
  return b?.length===24 && b[0]===0xc0 && b[1]===0x14 && b[2]===0x0d &&
    b[23]===0x0d && checksum(b)===b[22];
}
function blank(type,page=0,payload=[]){
  const b=new Uint8Array(24);
  b.set([0xc9,0x14,0x02,type.charCodeAt(0),page&255],0);
  b.set(payload.slice(0,16),5);
  b[22]=checksum(b); b[23]=0x0d;
  return b;
}
function ldget(){
  const b=new Uint8Array(24);
  b.set([0xc9,0x14,0x02,0x4c,0x44,0x47,0x45,0x54]);
  const r=1+Math.floor(Math.random()*255); b[10]=r;
  let v=r+234; v^=219; v+=191; v^=90; v+=219; v^=189; b[11]=v&127;
  b[22]=checksum(b); b[23]=0x0d; return b;
}

export class VotolBleProtocol{
  constructor({onState=()=>{},onData=()=>{},onRaw=()=>{},onLog=()=>{}}={}){
    Object.assign(this,{onState,onData,onRaw,onLog});
    this.deviceId=''; this.deviceName=''; this.writeChar=''; this.notifyChar='';
    this.readChar=VOTOL_READ_CHAR; this.rx=new Uint8Array(0);
    this.connected=false; this.pollTimer=null; this.readTimer=null; this.notificationActive=false;
    this.params=new Map();
  }
  snapshot(){return {connected:this.connected,deviceId:this.deviceId,name:this.deviceName,service:VOTOL_SERVICE,writeChar:this.writeChar,notifyChar:this.notifyChar,params:Object.fromEntries(this.params)}}
  async connect(){
    await BleClient.initialize();
    const d=await BleClient.requestDevice({acceptAllDevices:true,optionalServices:[VOTOL_SERVICE]});
    this.deviceId=d.deviceId; this.deviceName=d.name||d.deviceId;
    await BleClient.connect(this.deviceId,()=>this.handleDisconnect());
    const services=await BleClient.getServices(this.deviceId);
    const service=services.find(s=>s.uuid.toLowerCase()===VOTOL_SERVICE);
    if(!service) throw Error('VOTOL BLE service FFE0 not found');
    const cs=service.characteristics||[];
    const w=cs.find(c=>c.properties?.writeWithoutResponse)||cs.find(c=>c.properties?.write);
    const n=cs.find(c=>c.uuid.toLowerCase()===VOTOL_READ_CHAR)||cs.find(c=>c.properties?.notify||c.properties?.indicate);
    const r=cs.find(c=>c.uuid.toLowerCase()===VOTOL_READ_CHAR&&c.properties?.read);
    if(!w) throw Error('VOTOL BLE write characteristic not found');
    this.writeChar=w.uuid; this.notifyChar=n?.uuid||''; this.readChar=r?.uuid||this.readChar;
    if(this.notifyChar){
      await BleClient.startNotifications(this.deviceId,VOTOL_SERVICE,this.notifyChar,v=>this.ingest(v));
      this.notificationActive=true;
    }
    this.connected=true; this.onState(this.snapshot());
    this.onLog(`VOTOL BLE connected: ${this.deviceName}`);
    await this.write(ldget(),'VOTOL BLE LDGET');
    await delay(250);
    await this.readAllParameters();
    this.startLivePolling();
    return this.snapshot();
  }
  handleDisconnect(){this.stopPolling();this.connected=false;this.onState(this.snapshot());this.onLog('VOTOL BLE disconnected')}
  async disconnect(){
    this.stopPolling();
    if(this.deviceId&&this.notifyChar&&this.notificationActive) await BleClient.stopNotifications(this.deviceId,VOTOL_SERVICE,this.notifyChar).catch(()=>{});
    if(this.deviceId) await BleClient.disconnect(this.deviceId).catch(()=>{});
    this.notificationActive=false; this.connected=false; this.onState(this.snapshot());
  }
  async write(frame,label='VOTOL BLE TX'){
    if(!this.deviceId||!this.writeChar) throw Error('VOTOL BLE is not ready');
    const b=frame instanceof Uint8Array?frame:new Uint8Array(frame);
    this.onRaw(label,b);
    const view=new DataView(b.buffer,b.byteOffset,b.byteLength);
    try{await BleClient.writeWithoutResponse(this.deviceId,VOTOL_SERVICE,this.writeChar,view)}
    catch(e){await BleClient.write(this.deviceId,VOTOL_SERVICE,this.writeChar,view)}
  }
  ingest(value){
    const d=value instanceof DataView?new Uint8Array(value.buffer,value.byteOffset,value.byteLength):Uint8Array.from(value||[]);
    this.onRaw('VOTOL BLE RX',d);
    const x=new Uint8Array(this.rx.length+d.length); x.set(this.rx); x.set(d,this.rx.length); this.rx=x;
    while(this.rx.length>=24){
      let s=-1; for(let i=0;i<=this.rx.length-24;i++) if(this.rx[i]===0xc0&&this.rx[i+1]===0x14){s=i;break}
      if(s<0){this.rx=this.rx.slice(-23);return} if(s)this.rx=this.rx.slice(s);
      const f=this.rx.slice(0,24);
      if(!valid(f)){this.rx=this.rx.slice(1);continue}
      this.rx=this.rx.slice(24); this.parse(f);
    }
  }
  parse(b){
    const page=b[4];
    if(page>=1&&page<=7){this.params.set(page,Array.from(b.slice(5,22)));this.onData({kind:'parameter',page,payload:Array.from(b.slice(5,22))});return}
    if(b[3]===0x59&&b[4]===0x42){
      const states=['IDLE','INIT','START','RUN','STOP','BRAKE','WAIT','FAULT'];
      this.onData({kind:'live',voltage:u16be(b,5)/10,current:i16be(b,7)/10,rpm:u16be(b,14),
        controllerTemp:b[16]-50,externalTemp:b[17]-50,
        errorCode:((b[10]<<24)|(b[11]<<16)|(b[12]<<8)|b[13])>>>0,status:states[b[21]]||`ST:${b[21]}`,raw:Array.from(b)});
    }
  }
  async readAllParameters(){
    for(let page=1;page<=7&&this.connected;page++){await this.write(blank('P',page),`VOTOL BLE READ PAGE ${page}`);await delay(120)}
  }
  startLivePolling(){
    this.stopPolling(); let phase=0;
    const show=async()=>{
      if(!this.connected)return;
      const b=new Uint8Array(24); b.set([0xc9,0x14,0x02,0x53,0x48,0x4f,0x57]);
      b[12]=0; b[15]=phase===0?16:phase===1?8:0; b[16]=0; b[17]=85; b[22]=checksum(b); b[23]=0x0d;
      phase=(phase+1)%3; try{await this.write(b,'VOTOL BLE SHOW')}catch(e){this.onLog(`VOTOL BLE SHOW error: ${e?.message||e}`)}
    };
    show(); this.pollTimer=setInterval(show,200);
    if(this.readChar&&!this.notificationActive)this.readTimer=setInterval(async()=>{try{this.ingest(await BleClient.read(this.deviceId,VOTOL_SERVICE,this.readChar))}catch(_){}} ,200);
  }
  stopPolling(){if(this.pollTimer)clearInterval(this.pollTimer);if(this.readTimer)clearInterval(this.readTimer);this.pollTimer=null;this.readTimer=null}
  async writeParameterPage(page,payload){
    if(page<1||page>7||!payload||payload.length!==17) throw Error('VOTOL page payload must contain 17 bytes');
    const b=blank('P',page,Array.from(payload).slice(0,16)); b[21]=payload[16]; b[22]=checksum(b); await this.write(b,`VOTOL BLE WRITE PAGE ${page}`); return b;
  }
}
