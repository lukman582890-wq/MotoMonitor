/* MotoMonitor Navigation V2.2 - direct, capture-phase mobile navigation. */
(function(){
  'use strict';

  function init(){
    const app=document.querySelector('.app');
    const nav=document.querySelector('.bottom');
    const dashboard=document.getElementById('dashboard');
    if(!app||!nav||!dashboard)return;

    // Remove only maps created by this navigation layer on a re-init.
    app.querySelectorAll('.nav-screen').forEach(x=>x.remove());

    const map=document.createElement('main');
    map.className='screen nav-screen';
    map.id='map-v2';
    map.innerHTML=`
      <div class="map-shell">
        <header class="map-top"><button class="map-menu" type="button" aria-label="Menu">☰</button><b>Map</b><button class="map-settings" type="button" aria-label="Map settings">⚙</button></header>
        <section class="map-view">
          <div class="map-water"></div><div class="map-road r1"></div><div class="map-road r2"></div><div class="map-road r3"></div><div class="map-road r4"></div>
          <div class="map-city">Jakarta</div><div class="map-label ml-tangerang">Tangerang</div><div class="map-label ml-bekasi">Bekasi</div><div class="map-label ml-depok">Depok</div>
          <div class="map-layer">▱</div><div class="map-layers">≋</div><div class="map-compass">◈</div>
          <div class="route-glow"></div><div class="route-line"></div><div class="route-dot start"></div><div class="route-dot current"></div>
        </section>
        <section class="map-stats-v2"><div><span>KECEPATAN</span><b id="map-speed-v2">65 km/h</b></div><div><span>JARAK</span><b>12.4 km</b></div><div><span>DURASI</span><b>00:18:32</b></div></section>
        <button class="record-v2" id="record-v2" type="button">⏺ <span>Stop Recording</span></button>
      </div>`;
    app.insertBefore(map,nav);

    const mapKey='map';
    function showDashboard(){
      dashboard.classList.add('active');
      map.classList.remove('active');
      nav.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===0));
      history.replaceState(null,'','#dashboard');
      window.scrollTo(0,0);
    }
    function showMap(){
      dashboard.classList.remove('active');
      map.classList.add('active');
      nav.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===1));
      history.replaceState(null,'','#map');
      window.scrollTo(0,0);
    }
    function handleNav(event){
      const button=event.target.closest('.bottom button');
      if(!button || !nav.contains(button)) return;
      const buttons=[...nav.querySelectorAll('button')];
      const index=buttons.indexOf(button);
      if(index===1){
        event.preventDefault();
        event.stopPropagation();
        if(event.stopImmediatePropagation)event.stopImmediatePropagation();
        showMap();
      }else if(index===0){
        event.preventDefault();
        event.stopPropagation();
        if(event.stopImmediatePropagation)event.stopImmediatePropagation();
        showDashboard();
      }
    }

    // Capture pointer/click events so no other navigation handler can swallow mobile taps.
    nav.addEventListener('pointerup',handleNav,true);
    nav.addEventListener('touchend',handleNav,true);
    nav.addEventListener('click',handleNav,true);

    // Also expose a direct API for debugging and other UI layers.
    window.MotoMonitorShowMap=showMap;
    window.MotoMonitorShowDashboard=showDashboard;

    map.querySelector('.map-menu').addEventListener('click',showDashboard);
    map.querySelector('#record-v2').addEventListener('click',()=>{
      const b=map.querySelector('#record-v2 span');
      b.textContent=b.textContent.includes('Stop')?'Start Recording':'Stop Recording';
    });

    const hash=(location.hash||'').slice(1);
    if(hash===mapKey)showMap();else showDashboard();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();