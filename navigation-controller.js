/* MotoMonitor navigation: Dashboard / Map / Trip / Tools / Settings screens. */
(function(){
  'use strict';
  const app=document.querySelector('.app');
  const nav=document.querySelector('.bottom');
  const dashboard=document.getElementById('dashboard');
  if(!app||!nav||!dashboard)return;

  const screens={
    map:{title:'Map',html:`
      <section class="nav-panel"><div class="nav-head"><b>MAP</b><span>GPS TRACKING</span></div>
        <div class="map-card"><div class="map-grid"></div><div class="map-city">JAKARTA</div><div class="route-line"></div><div class="map-pin">●</div><div class="map-label tangerang">Tangerang</div><div class="map-label bekasi">Bekasi</div><div class="map-label depok">Depok</div></div>
        <div class="map-stats"><div><span>KECEPATAN</span><b id="map-speed">65 km/h</b></div><div><span>JARAK</span><b>12.4 km</b></div><div><span>DURASI</span><b>00:18:32</b></div></div>
        <button class="primary-action" id="recordBtn">⏺ Start Recording</button>
      </section>`},
    trip:{title:'Trip',html:`
      <section class="nav-panel"><div class="nav-head"><b>TRIP</b><span>STATISTIK PERJALANAN</span></div>
        <div class="trip-tabs"><button class="tab active">Trip Aktif</button><button class="tab">Riwayat</button></div>
        <div class="trip-big"><div><span>JARAK</span><b>12.4 km</b></div><div><span>WAKTU</span><b>00:18:32</b></div></div>
        <div class="trip-big"><div><span>KECEPATAN RATA-RATA</span><b>40 km/h</b></div><div><span>KECEPATAN MAKS</span><b>78 km/h</b></div></div>
        <div class="trip-big"><div><span>ENERGI TERPAKAI</span><b>0.42 kWh</b></div><div><span>EFISIENSI</span><b>52 Wh/km</b></div></div>
        <button class="primary-action">Reset Trip</button>
        <div class="history-card"><b>TRIP HARI INI</b><p>☀️ 06:42 &nbsp; 12.6 km &nbsp; 00:22 &nbsp; 48 km/h</p><p>☾ 18:15 &nbsp; 8.3 km &nbsp; 00:14 &nbsp; 42 km/h</p><hr><p><b>Total</b> &nbsp; 20.9 km &nbsp; 00:36 &nbsp; 45 km/h</p></div>
      </section>`},
    tools:{title:'Tools',html:`
      <section class="nav-panel"><div class="nav-head"><b>TOOLS</b><span>DIAGNOSTIK & KONTROL</span></div><div class="tool-grid">
        <button class="tool-card" data-tool="votol"><strong>◫</strong><b>VOTOL</b><small>Baca & Setting</small></button>
        <button class="tool-card" data-tool="bms"><strong>▣</strong><b>JK BMS</b><small>Monitor Baterai</small></button>
        <button class="tool-card" data-tool="diag"><strong>∿</strong><b>Diagnostik</b><small>Cek Error</small></button>
        <button class="tool-card" data-tool="cal"><strong>◉</strong><b>Kalibrasi</b><small>TPS / Speed</small></button>
        <button class="tool-card" data-tool="firmware"><strong>☁</strong><b>Firmware</b><small>Update</small></button>
        <button class="tool-card" data-tool="logs"><strong>▤</strong><b>Log Data</b><small>Simpan / Export</small></button>
      </div></section>`},
    settings:{title:'Settings',html:`
      <section class="nav-panel"><div class="nav-head"><b>SETTINGS</b><span>KONFIGURASI APLIKASI</span></div><div class="settings-list">
        <button class="setting-row" data-setting="theme"><strong>☼</strong><span><b>Theme</b><small>Light / Dark / Auto</small></span><em>›</em></button>
        <button class="setting-row" data-setting="unit"><strong>◌</strong><span><b>Unit</b><small>Metric (km, km/h, °C)</small></span><em>›</em></button>
        <button class="setting-row" data-setting="bluetooth"><strong>♢</strong><span><b>Koneksi Bluetooth</b><small>VOTOL / JK BMS</small></span><em>›</em></button>
        <button class="setting-row" data-setting="alerts"><strong>♧</strong><span><b>Notifikasi</b><small>Alert & Peringatan</small></span><em>›</em></button>
        <button class="setting-row" data-setting="about"><strong>ⓘ</strong><span><b>Tentang Aplikasi</b><small>Versi, Lisensi, dll</small></span><em>›</em></button>
      </div></section>`}
  };

  Object.entries(screens).forEach(([key,s])=>{
    const el=document.createElement('main'); el.className='screen nav-screen'; el.id=key; el.innerHTML=`<div class="screen-title">${s.title}</div>${s.html}`; app.insertBefore(el,nav);
  });

  const all=[dashboard,...Object.keys(screens).map(k=>document.getElementById(k))];
  const buttons=[...nav.querySelectorAll('button')];
  function show(key){
    all.forEach(el=>el.classList.toggle('active',el.id===key));
    buttons.forEach((b,i)=>b.classList.toggle('active',i===(['dashboard','map','trip','tools','settings'].indexOf(key))));
    window.scrollTo({top:0,behavior:'smooth'});
    history.replaceState(null,'','#'+key);
  }
  buttons.forEach((b,i)=>b.addEventListener('click',()=>show(['dashboard','map','trip','tools','settings'][i])));

  document.addEventListener('click',e=>{
    const tab=e.target.closest('.tab');
    if(tab){const parent=tab.parentElement;parent.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));tab.classList.add('active');}
    const record=e.target.closest('#recordBtn');
    if(record){record.textContent=record.textContent.includes('Start')?'⏹ Stop Recording':'⏺ Start Recording';}
  });
  const initial=(location.hash||'#dashboard').slice(1); show(screens[initial]?initial:'dashboard');
})();
