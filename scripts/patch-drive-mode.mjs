import fs from 'node:fs';

const file='src/main.js';
let s=fs.readFileSync(file,'utf8');

if(!s.includes('id="drive-mode"')){
  const needle='<section class="speed-panel"><div class="gauge">';
  if(!s.includes(needle)) throw new Error('Speed panel not found');
  s=s.replace(needle,'<section class="speed-panel"><div id="drive-mode" class="drive-mode">--</div><div class="gauge">');
}

const marker="function __dashboardRender(){__baseRender();const b=st.bms,c=st.ctrl,$=x=>document.querySelector(x);const speed=Math.max(0,Math.round((c.rpm||0)*__factor));$('#speed').textContent=speed;";
if(!s.includes(marker)) throw new Error('Dashboard render marker not found');
const replacement="function __dashboardRender(){__baseRender();const b=st.bms,c=st.ctrl,$=x=>document.querySelector(x);const speed=Math.max(0,Math.round((c.rpm||0)*__factor));$('#speed').textContent=speed;$('#drive-mode').textContent=c.mode||'--';";
s=s.replace(marker,replacement);

fs.writeFileSync(file,s);

const css='\n.drive-mode{display:inline-flex;align-items:center;justify-content:center;margin:8px auto 0;padding:5px 14px;border:1px solid rgba(255,255,255,.14);border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.14em;background:rgba(255,255,255,.06);color:#fff;min-width:82px}\n';
const styleFile='src/style.css';
let cssText=fs.readFileSync(styleFile,'utf8');
if(!cssText.includes('.drive-mode{')) fs.writeFileSync(styleFile,cssText+css);
console.log('VOTOL ECO/NORMAL/SPORT dashboard mode patch applied.');
