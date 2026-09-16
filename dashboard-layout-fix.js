/* Dashboard layout: replace Gear mini-card with SOC and combine all battery telemetry in one box. */
(function () {
  function applyLayout() {
    const miniCards = document.querySelectorAll('.mini-grid .mini');
    const battery = document.querySelector('#dashboard .telemetry');
    if (!miniCards.length || !battery) return;

    // Third mini card becomes the compact SOC readout.
    const mini = miniCards[2];
    if (mini) {
      const label = mini.querySelector('span');
      const value = mini.querySelector('b');
      if (label) label.textContent = 'SOC';
      if (value) {
        value.id = 'mini-soc';
        value.textContent = document.getElementById('soc')?.textContent || '78%';
      }
    }

    const grid = battery.querySelector('.data-grid');
    const tempPanel = document.querySelectorAll('#dashboard .telemetry')[1];
    if (!grid) return;

    // Hide the large SOC display but keep #soc in the DOM as the live data source.
    const socDisplay = battery.querySelector('.soc');
    if (socDisplay) socDisplay.style.display = 'none';
    battery.querySelector('.battery-icon')?.remove();
    battery.querySelector('.bar')?.remove();

    const heading = battery.querySelector('h3');
    if (heading) heading.textContent = 'BATTERY / BMS';

    // Voltage + BMS current remain the first two cards.
    const currentLabel = grid.querySelector('.data:nth-child(2) .label');
    if (currentLabel) currentLabel.textContent = 'BMS Current';

    // Move Controller, Motor, BMS and Cells into the same Battery/BMS box.
    if (tempPanel) {
      const tempGrid = tempPanel.querySelector('.data-grid');
      if (tempGrid) {
        [...tempGrid.querySelectorAll('.data')].forEach((card) => grid.appendChild(card));
      }
      tempPanel.remove();
    }

    const bmsCard = [...grid.querySelectorAll('.data')].find((card) => {
      return card.querySelector('.label')?.textContent.trim().toUpperCase() === 'BMS';
    });
    if (bmsCard) bmsCard.querySelector('.label').textContent = 'BMS TEMP';

    // Keep the compact SOC card synchronized with the hidden live SOC source.
    const soc = document.getElementById('soc');
    const miniSoc = document.getElementById('mini-soc');
    if (soc && miniSoc) {
      const observer = new MutationObserver(() => { miniSoc.textContent = soc.textContent; });
      observer.observe(soc, { childList: true, characterData: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLayout, { once: true });
  } else {
    applyLayout();
  }
})();
