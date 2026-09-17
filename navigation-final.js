/* MotoMonitor Navigation FINAL - Leaflet map ported from VotolJKUnified. */
(function(){
  'use strict';

  const LEAFLET_CSS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  const LEAFLET_JS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

  function loadLeaflet(done){
    if(window.L){done();return;}
    if(!document.querySelector('link[data-leaflet]')){
      const link=document.createElement('link'); link.rel='stylesheet'; link.href=LEAFLET_CSS; link.dataset.leaflet='1'; document.head.appendChild(link);
    }
    const existing=document.querySelector('script[data-leaflet]');
    if(existing){existing.addEventListener('load',done,{once:true});return;}
    const script=document.createElement('script'); script.src=LEAFLET_JS; script.async=true; script.dataset.leaflet='1'; script.onload=done; document.head.appendChild(script);
  }

  function boot(){
    const app=document.querySelector('.app');
    const oldNav=document.querySelector('.bottom');
    const dashboard=document.getElementById('dashboard');
    if(!app||!oldNav||!dashboard){setTimeout(boot,100);return;}

    const nav=oldNav.cloneNode(true);
    oldNav.replaceWith(nav);

    let map=document.getElementById('map-final');
    if(!map){
      map=document.createElement('main');
      map.id='map-final';
      map.className='screen';
      map.innerHTML=`
        <div class="map-shell">
          <header class="map-top">
            <button class="map-menu" type="button" aria-label="Dashboard">‹</button>
            <div><b>MAP</b><small>LIVE GPS</small></div>
            <button class="map-locate-top" type="button" aria-label="Lokasi saya">⌖</button>
          </header>
          <div class="map-search-row">
            <input id="map-search-final" type="search" placeholder="Cari alamat atau tempat" autocomplete="off">
            <button id="map-search-btn" type="button">CARI</button>
          </div>
          <button class="map-current-btn" id="map-current-final" type="button">📍 Gunakan lokasi saya</button>
          <section class="map-view" id="leaflet-map-final"></section>
          <section class="map-stats-v2">
            <div><span>KECEPATAN</span><b id="map-speed-final">0 km/h</b></div>
            <div><span>JARAK</span><b id="map-distance-final">0.00 km</b></div>
            <div><span>STATUS GPS</span><b id="map-gps-final">READY</b></div>
          </section>
          <button class="record-v2" id="record-final" type="button">⏺ <span>Start Recording</span></button>
        </div>`;
      app.insertBefore(map,nav);
    }

    const buttons=[...nav.querySelectorAll('button')];
    // Do not depend on button position. Find the actual MAP/DASHBOARD labels.
    const buttonLabel=(button)=>button.textContent.replace(/\s+/g,' ').trim().toUpperCase();
    const mapButton=buttons.find(b=>buttonLabel(b).includes('MAP')) || buttons[1];
    const dashboardButton=buttons.find(b=>buttonLabel(b).includes('DASHBOARD')) || buttons[0];
    let leafletMap=null, marker=null, accuracyCircle=null, watchId=null, lastLocation=null, distanceKm=0;

    function dashboardView(e){
      if(e){e.preventDefault();e.stopPropagation();}
      dashboard.classList.add('active'); map.classList.remove('active');
      buttons.forEach(b=>b.classList.toggle('active',b===dashboardButton));
      history.replaceState(null,'','#dashboard'); window.scrollTo(0,0);
    }

    function initMap(){
      if(leafletMap || !window.L)return;
      const el=document.getElementById('leaflet-map-final');
      if(!el)return;
      el.style.pointerEvents='auto';
      el.style.touchAction='none';
      leafletMap=L.map(el,{zoomControl:true,attributionControl:true,tap:true,dragging:true,touchZoom:true}).setView([-6.2,106.82],12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(leafletMap);

      let down=null;
      el.addEventListener('pointerdown',function(e){
        if(e.target.closest('.leaflet-control')){down=null;return;}
        down={x:e.clientX,y:e.clientY};
      },{passive:true});
      el.addEventListener('pointerup',function(e){
        if(!down || e.target.closest('.leaflet-control')){down=null;return;}
        const dx=e.clientX-down.x,dy=e.clientY-down.y;
        down=null;
        if(Math.hypot(dx,dy)>10)return;
        const rect=el.getBoundingClientRect();
        if(!rect.width||!rect.height)return;
        const point=leafletMap.containerPointToLatLng([e.clientX-rect.left,e.clientY-rect.top]);
        selectPoint(point.lat,point.lng,'Titik peta');
      },{passive:true});

      leafletMap.on('click',function(e){
        if(e.originalEvent && e.originalEvent.pointerType==='touch')return;
        selectPoint(e.latlng.lat,e.latlng.lng,'Titik peta');
      });
      setTimeout(()=>leafletMap.invalidateSize(),150);
    }

    function setStatus(text){const el=document.getElementById('map-gps-final');if(el)el.textContent=text;}
    function setPoint(lat,lon,label,zoom){
      if(!leafletMap)return;
      if(marker)marker.remove();
      marker=L.marker([lat,lon]).addTo(leafletMap).bindPopup(label||'Lokasi dipilih').openPopup();
      leafletMap.setView([lat,lon],zoom||16);
    }

    async function reverseGeocode(lat,lon){
      try{
        const url='https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=id&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon);
        const r=await fetch(url); if(!r.ok)throw new Error('reverse');
        const data=await r.json();
        const label=data.display_name||('Lokasi '+lat.toFixed(5)+', '+lon.toFixed(5));
        if(marker)marker.bindPopup(label).openPopup();
      }catch(_){ }
    }

    function selectPoint(lat,lon,label){
      setPoint(lat,lon,label,16); setStatus('SELECTED'); reverseGeocode(lat,lon);
    }

    function startGps(){
      if(!navigator.geolocation){setStatus('NO GPS');return;}
      if(watchId!==null)navigator.geolocation.clearWatch(watchId);
      setStatus('LOCATING…');
      watchId=navigator.geolocation.watchPosition(function(pos){
        const lat=pos.coords.latitude, lon=pos.coords.longitude;
        const speed=Number.isFinite(pos.coords.speed)&&pos.coords.speed>=0?pos.coords.speed*3.6:0;
        if(lastLocation){const a=L.latLng(lastLocation.lat,lastLocation.lon),b=L.latLng(lat,lon);const d=a.distanceTo(b);if(d>2&&d<1000)distanceKm+=d/1000;}
        lastLocation={lat,lon};
        setPoint(lat,lon,'Lokasi saya',16);
        if(!accuracyCircle)accuracyCircle=L.circle([lat,lon],{radius:pos.coords.accuracy||20,weight:1,fillOpacity:.08}).addTo(leafletMap); else accuracyCircle.setLatLng([lat,lon]).setRadius(pos.coords.accuracy||20);
        const speedEl=document.getElementById('map-speed-final');
        const distanceEl=document.getElementById('map-distance-final');
        if(speedEl)speedEl.textContent=Math.round(speed)+' km/h';
        if(distanceEl)distanceEl.textContent=distanceKm.toFixed(2)+' km';
        setStatus('GPS LIVE');
      },function(){setStatus('GPS ERROR');},{enableHighAccuracy:true,maximumAge:2000,timeout:10000});
    }

    async function searchPlace(){
      const q=document.getElementById('map-search-final')?.value.trim(); if(!q)return;
      const btn=document.getElementById('map-search-btn'); if(btn)btn.disabled=true; setStatus('SEARCH…');
      try{
        const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=id&q='+encodeURIComponent(q);
        const r=await fetch(url); if(!r.ok)throw new Error('search'); const places=await r.json();
        if(!places.length){setStatus('NOT FOUND');return;}
        const choice=places.length===1?places[0]:await chooseSearchResult(places);
        if(choice){setPoint(Number(choice.lat),Number(choice.lon),choice.display_name,16);document.getElementById('map-search-final').value=choice.display_name;setStatus('SELECTED');}
      }catch(_){setStatus('SEARCH ERROR');}
      finally{if(btn)btn.disabled=false;}
    }

    function chooseSearchResult(places){
      return new Promise(resolve=>{
        const backdrop=document.createElement('div'); backdrop.className='map-results-backdrop';
        const box=document.createElement('div'); box.className='map-results';
        box.innerHTML='<b>Pilih lokasi</b>';
        places.forEach(p=>{const row=document.createElement('button');row.type='button';row.textContent=p.display_name;row.onclick=()=>{backdrop.remove();resolve(p);};box.appendChild(row);});
        const cancel=document.createElement('button');cancel.type='button';cancel.textContent='BATAL';cancel.className='cancel';cancel.onclick=()=>{backdrop.remove();resolve(null);};box.appendChild(cancel);
        backdrop.appendChild(box); document.body.appendChild(backdrop);
      });
    }

    function mapView(e){
      if(e){e.preventDefault();e.stopPropagation();}
      dashboard.classList.remove('active'); map.classList.add('active');
      buttons.forEach(b=>b.classList.toggle('active',b===mapButton));
      history.replaceState(null,'','#map'); window.scrollTo(0,0);
      loadLeaflet(()=>{initMap();setTimeout(()=>leafletMap&&leafletMap.invalidateSize(),100);});
    }

    // Attach exactly one activation handler to each navigation target.
    // This avoids pointerup + touchend + click firing the action multiple times.
    if(dashboardButton)dashboardButton.addEventListener('click',dashboardView);
    if(mapButton)mapButton.addEventListener('click',mapView);

    map.querySelector('.map-menu').addEventListener('click',dashboardView);
    map.querySelector('.map-locate-top').addEventListener('click',()=>{mapView();setTimeout(startGps,250);});
    map.querySelector('#map-current-final').addEventListener('click',startGps);
    map.querySelector('#map-search-btn').addEventListener('click',searchPlace);
    map.querySelector('#map-search-final').addEventListener('keydown',e=>{if(e.key==='Enter')searchPlace();});
    map.querySelector('#record-final').addEventListener('click',function(){const s=this.querySelector('span');s.textContent=s.textContent.includes('Start')?'Stop Recording':'Start Recording';});

    window.MotoMonitorShowMap=mapView; window.MotoMonitorShowDashboard=dashboardView;
    if((location.hash||'').slice(1)==='map')mapView();else dashboardView();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
