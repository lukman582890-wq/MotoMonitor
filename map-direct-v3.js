/* Map Direct V3: final navigation fallback. */
(function(){
  'use strict';
  function init(){
    const app=document.querySelector('.app');
    const nav=document.querySelector('.bottom');
    const dashboard=document.getElementById('dashboard');
    if(!app||!nav||!dashboard)return false;

    let map=document.getElementById('map-v2');
    if(!map){
      map=document.createElement('main');
      map.id='map-v2';
      map.className='screen';
      map.innerHTML='<div class="map-shell"><header class="map-top"><button class="map-menu">☰</button><b>Map</b><button>⚙</button></header><section class="map-view"><div class="map-water"></div><div class="map-road r1"></div><div class="map-road r2"></div><div class="map-road r3"></div><div class="map-road r4"></div><div class="map-city">Jakarta</div><div class="map-label ml-tangerang">Tangerang</div><div class="map-label ml-bekasi">Bekasi</div><div class="map-label ml-depok">Depok</div><div class="map-layer">▱</div><div class="map-layers">≋</div><div class="map-compass">◈</div><div class="route-glow"></div><div class="route-line"></div><div class="route-dot start"></div><div class="route-dot current"></div></section><section class="map-stats-v2"><div><span>KECEPATAN</span><b>65 km/h</b></div><div><span>JARAK</span><b>12.4 km</b></div><div><span>DURASI</span><b>00:18:32</b></div></section><button class="record-v2">⏺ <span>Stop Recording</span></button></div>';
      app.insertBefore(map,nav);
    }

    function isMapButton(el){
      if(!el)return false;
      const text=(el.textContent||'').trim().toLowerCase();
      return text==='map' || text.includes('map');
    }
    function showMap(e){
      if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}
      document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
      map.classList.add('active');
      nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      const btn=[...nav.querySelectorAll('button')].find(isMapButton);
      if(btn)btn.classList.add('active');
      document.documentElement.scrollTop=0;document.body.scrollTop=0;
      try{history.replaceState(null,'','#map')}catch(_){location.hash='map'}
      return false;
    }
    function showDashboard(e){
      if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}
      document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
      dashboard.classList.add('active');
      nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      const btn=[...nav.querySelectorAll('button')].find(b=>(b.textContent||'').trim().toLowerCase().includes('dashboard'));
      if(btn)btn.classList.add('active');
      try{history.replaceState(null,'','#dashboard')}catch(_){location.hash='dashboard'}
      return false;
    }
    if(nav.dataset.mapDirectV3!=='1'){
      nav.dataset.mapDirectV3='1';
      const handler=function(e){
        const button=e.target.closest && e.target.closest('.bottom button');
        if(!button)return;
        if(isMapButton(button)){showMap(e);return;}
        const text=(button.textContent||'').trim().toLowerCase();
        if(text.includes('dashboard'))showDashboard(e);
      };
      document.addEventListener('click',handler,true);
      document.addEventListener('pointerup',handler,true);
      document.addEventListener('touchend',handler,true);
    }
    if(location.hash==='#map')showMap();
    return true;
  }
  function boot(){if(!init())setTimeout(boot,100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();