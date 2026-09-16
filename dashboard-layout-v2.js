/* MotoMonitor dashboard layout v2 - direct DOM layout, cache-busted by filename. */
(function () {
  'use strict';

  function apply() {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) return;

    const panels = dashboard.querySelectorAll('.telemetry');
    const battery = panels[0];
    const tempPanel = panels[1];
    if (!battery) return;

    const miniGrid = dashboard.querySelector('.mini-grid');
    const miniCards = dashboard.querySelectorAll('.mini-grid .mini');
    const miniSoc = miniCards[2]?.querySelector('b');
    const soc = document.getElementById('soc');

    // Third mini card is SOC.
    if (miniCards[2]) {
      const label = miniCards[2].querySelector('span');
      if (label) label.textContent = 'SOC';
      if (miniSoc) {
        miniSoc.id = 'mini-soc-v2';
        miniSoc.textContent = soc?.textContent || '78%';
      }
    }

    // Add the charge 0-100% estimate directly beside the SOC card.
    if (miniGrid && !miniGrid.querySelector('#charge-estimate-v2')) {
      const charge = document.createElement('div');
      charge.className = 'mini charge-estimate';
      charge.id = 'charge-estimate-v2';
      charge.innerHTML = '<span>Estimasi Charge 0-100%</span><b>--</b>';
      miniGrid.appendChild(charge);
    }

    // Remove the large SOC presentation from the Battery/BMS panel.
    battery.querySelector('.soc')?.remove();
    battery.querySelector('.battery-icon')?.remove();
    battery.querySelector('.bar')?.remove();

    const heading = battery.querySelector('h3');
    if (heading) heading.textContent = 'BATTERY / BMS';

    const grid = battery.querySelector('.data-grid');
    if (!grid) return;

    const currentLabel = grid.querySelector('.data:nth-child(2) .label');
    if (currentLabel) currentLabel.textContent = 'BMS Current';

    // Move all temperature data into the same Battery/BMS grid.
    if (tempPanel) {
      const tempGrid = tempPanel.querySelector('.data-grid');
      if (tempGrid) {
        Array.from(tempGrid.children).forEach(card => grid.appendChild(card));
      }
      tempPanel.remove();
    }

    Array.from(grid.querySelectorAll('.data')).forEach(card => {
      const label = card.querySelector('.label');
      if (!label) return;
      if (label.textContent.trim().toUpperCase() === 'BMS') label.textContent = 'BMS TEMP';
    });

    // Compact grid: four telemetry cards on phones, two columns on larger screens.
    let style = document.getElementById('dashboard-layout-v2-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dashboard-layout-v2-style';
      style.textContent = `
        #dashboard .mini-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
        #dashboard .mini-grid .mini{min-width:0}
        #dashboard .charge-estimate span{white-space:nowrap;letter-spacing:.1em}
        #dashboard .telemetry .data-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        #dashboard .telemetry .data{min-width:0}
        @media(max-width:650px){
          #dashboard .mini-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
          #dashboard .mini-grid .mini{padding:8px 5px}
          #dashboard .mini-grid .mini span{font-size:5.5px;letter-spacing:.08em}
          #dashboard .mini-grid .mini b{font-size:11px}
          #dashboard .charge-estimate b{font-size:10px}
          #dashboard .telemetry .data-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
          #dashboard .telemetry .data{padding:8px 6px;min-height:48px}
          #dashboard .telemetry .data b{font-size:12px}
          #dashboard .telemetry .label{font-size:6.5px}
        }
      `;
      document.head.appendChild(style);
    }

    if (soc && miniSoc && !miniSoc.dataset.v2Observer) {
      miniSoc.dataset.v2Observer = '1';
      new MutationObserver(() => { miniSoc.textContent = soc.textContent; })
        .observe(soc, { childList: true, characterData: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
})();
