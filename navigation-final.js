/* MotoMonitor Navigation FINAL - single navigation controller. */
(function(){
  'use strict';

  function boot(){
    const app=document.querySelector('.app');
    const oldNav=document.querySelector('.bottom');
    const dashboard=document.getElementById('dashboard');
    if(!app||!oldNav||!dashboard){setTimeout(boot,100);return;}

    // Replace the navigation DOM so listeners from older navigation scripts cannot survive.
    const nav=oldNav.cloneNode(true);
    oldNav.replaceWith(nav);

    let map=document.getElementById('map-final');
    if(!map){
      map=document.createElement('main');
      map.id='map-final';
      map.className='screen';
      map.innerHTML=`<div class="map-shell">
        <header class="map-top"><button class="map-menu" type="button">☰</button><b>Map</b><button type="button">⚙</button></header>
        <section class="map-view">
          <div class="map-water"></div><div class="map-road r1"></div><div class="map-road r2"></div><div class="map-road r3"></div><div class="map-road r4"></div>
          <div class="map-city">Jakarta</div><div class="map-label ml-tangerang">Tangerang</div><div class="map-label ml-bekasi">Bekasi</div><div class="map-label ml-depok">Depok</div>
          <div class="map-layer">▱</div><div class="map-layers">≋</div><div class="map-compass">◈</div>
          <div class="route-glow"></div><div class="route-line"></div><div class="route-dot start"></div><div class="route-dot current"></div>
        </section>
        <section class="map-stats-v2"><div><span>KECEPATAN</span><b>65 km/h</b></div><div><span>JARAK</span><b>12.4 km</b></div><div><span>DURASI</span><b>00:18:32</b></div></section>
        <button class="record-v2" id="record-final" type="button">⏺ <span>Stop Recording</span></button>
      </div>`;
      app.insertBefore(map,nav);
    }

    const buttons=[...nav.querySelectorAll('button')];
    function dashboardView(e){
      if(e){e.preventDefault();e.stopPropagation();}
      dashboard.classList.add('active');
      map.classList.remove('active');
      buttons.forEach((b,i)=>b.classList.toggle('active',i===0));
      history.replaceState(null,'','#dashboard');
      window.scrollTo(0,0);
    }
    function mapView(e){
      if(e){e.preventDefault();e.stopPropagation();}
      dashboard.classList.remove('active');
      map.classList.add('active');
      buttons.forEach((b,i)=>b.classList.toggle('active',i===1));
      history.replaceState(null,'','#map');
      window.scrollTo(0,0);
    }

    buttons.forEach((button,index)=>{
      const action=index===1?mapView:index===0?dashboardView:null;
      if(action){
        button.addEventListener('pointerup',action);
        button.addEventListener('touchend',action,{passive:false});
        button.addEventListener('click',action);
      }
    });
    map.querySelector('.map-menu').addEventListener('click',dashboardView);
    map.querySelector('#record-final').addEventListener('click',function(){
      const s=this.querySelector('span');
      s.textContent=s.textContent.includes('Stop')?'Start Recording':'Stop Recording';
    });

    window.MotoMonitorShowMap=mapView;
    window.MotoMonitorShowDashboard=dashboardView;

    if((location.hash||'').slice(1)==='map')mapView();
    else dashboardView();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
