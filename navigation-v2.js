/* MotoMonitor Navigation V2 - robust mobile navigation and Map screen. */
(function(){
  'use strict';
  function init(){
    const app=document.querySelector('.app');
    const nav=document.querySelector('.bottom');
    const dashboard=document.getElementById('dashboard');
    if(!app||!nav||!dashboard)return;

    const oldScreens=[...app.querySelectorAll('.nav-screen')];
    oldScreens.forEach(x=>x.remove());

    const map=document.createElement('main');
    map.className='screen nav-screen';
    map.id='map-v2';
    map.innerHTML=`
      <div class="map-shell">
        <header class="map-top"><button class="map-menu" aria-label="Menu">☰</button><b>Map</b><button class="map-settings" aria-label="Map settings">⚙</button></header>
        <section class="map-view">
          <div class="map-water"></div><div class="map-road r1"></div><div class="map-road r2"></div><div class="map-road r3"></div><div class="map-road r4"></div>
          <div class="map-city">Jakarta</div><div class="map-label ml-tangerang">Tangerang</div><div class="map-label ml-bekasi">Bekasi</div><div class="map-label ml-depok">Depok</div>
          <div class="map-layer">▱</div><div class="map-layers">≋</div><div class="map-compass">◈</div>
          <div class="route-glow"></div><div class="route-line"></div><div class="route-dot start"></div><div class="route-dot current"></div>
        </section>
        <section class="map-stats-v2"><div><span>KECEPATAN</span><b id="map-speed-v2">65 km/h</b></div><div><span>JARAK</span><b>12.4 km</b></div><div><span>DURASI</span><b>00:18:32</b></div></section>
        <button class="record-v2" id="record-v2">⏺ <span>Stop Recording</span></button>
      </div>`;
    app.insertBefore(map,nav);

    let trip=null;
    const screens={dashboard, map};
    function show(key){
      Object.values(screens).forEach(el=>el.classList.toggle('active',el===screens[key]));
      [...nav.querySelectorAll('button')].forEach((b,i)=>b.classList.toggle('active',i===(['dashboard','map','trip','tools','settings'].indexOf(key))));
      window.scrollTo(0,0);
      history.replaceState(null,'','#'+key);
    }

    // Only Map and Dashboard are active in this focused iteration. Other buttons retain their existing labels.
    nav.querySelectorAll('button').forEach((button,index)=>{
      button.addEventListener('click',function(){
        const key=['dashboard','map','trip','tools','settings'][index];
        if(key==='map') show('map');
        else if(key==='dashboard') show('dashboard');
      },{passive:true});
    });

    map.querySelector('.map-menu').addEventListener('click',()=>show('dashboard'));
    map.querySelector('#record-v2').addEventListener('click',()=>{
      const b=map.querySelector('#record-v2 span');
      b.textContent=b.textContent.includes('Stop')?'Start Recording':'Stop Recording';
    });

    const hash=(location.hash||'').slice(1);
    show(hash==='map'?'map':'dashboard');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
