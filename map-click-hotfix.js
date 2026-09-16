/* MotoMonitor Map click hotfix: direct capture listener, independent of navigation controllers. */
(function(){
  'use strict';
  function init(){
    const app=document.querySelector('.app');
    const nav=document.querySelector('.bottom');
    const dashboard=document.getElementById('dashboard');
    if(!app||!nav||!dashboard)return;

    let map=document.getElementById('map-v2');
    if(!map){
      map=document.createElement('main');
      map.id='map-v2';
      map.className='screen map-hotfix-screen';
      map.innerHTML=`<div class="map-hotfix-shell">
        <header class="map-hotfix-head"><button class="map-hotfix-menu">☰</button><b>Map</b><button>⚙</button></header>
        <section class="map-hotfix-view"><div class="mh-water"></div><div class="mh-road a"></div><div class="mh-road b"></div><div class="mh-road c"></div><div class="mh-city">Jakarta</div><div class="mh-label t">Tangerang</div><div class="mh-label bks">Bekasi</div><div class="mh-label dpk">Depok</div><div class="mh-layer">≋</div><div class="mh-layer two">≋</div><div class="mh-compass">◈</div><div class="mh-route"></div><div class="mh-dot current"></div><div class="mh-dot start"></div></section>
        <section class="map-hotfix-stats"><div><span>KECEPATAN</span><b>65 km/h</b></div><div><span>JARAK</span><b>12.4 km</b></div><div><span>DURASI</span><b>00:18:32</b></div></section>
        <button class="map-hotfix-record">⏺ <span>Stop Recording</span></button>
      </div>`;
      app.insertBefore(map,nav);
    }

    const screens=[...app.querySelectorAll('.screen')];
    function showMap(){
      screens.forEach(s=>s.classList.remove('active'));
      dashboard.classList.remove('active');
      map.classList.add('active');
      nav.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===1));
      window.scrollTo(0,0);
      history.replaceState(null,'','#map');
    }
    function showDashboard(){
      screens.forEach(s=>s.classList.remove('active'));
      dashboard.classList.add('active');
      nav.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===0));
      window.scrollTo(0,0);
      history.replaceState(null,'','#dashboard');
    }

    nav.addEventListener('click',function(e){
      const buttons=[...nav.querySelectorAll('button')];
      const button=e.target.closest('button');
      if(!button)return;
      const index=buttons.indexOf(button);
      if(index===1){e.preventDefault();e.stopImmediatePropagation();showMap();}
      else if(index===0){e.preventDefault();e.stopImmediatePropagation();showDashboard();}
    },true);

    map.querySelector('.map-hotfix-menu')?.addEventListener('click',showDashboard);
    const hash=location.hash.slice(1);
    if(hash==='map')showMap();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
