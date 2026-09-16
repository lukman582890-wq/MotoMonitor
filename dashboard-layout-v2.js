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

    // Compact 3-column grid on phones, 2-column grid elsewhere.
    let style = document.getElementById('dashboard-layout-v2-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dashboard-layout-v2-style';
      style.textContent = `
        #dashboard .telemetry .data-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        #dashboard .telemetry .data{min-width:0}
        @media(max-width:650px){
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
