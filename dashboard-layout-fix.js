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

    // The large SOC number, battery icon and bar are intentionally removed.
    battery.querySelector('.soc')?.remove();
    battery.querySelector('.battery-icon')?.remove();
    battery.querySelector('.bar')?.remove();

    // Rename the section because SOC is now displayed in the mini telemetry row.
    const heading = battery.querySelector('h3');
    if (heading) heading.textContent = 'BATTERY / BMS';

    // Voltage + BMS current remain the first two cards.
    const currentLabel = grid.querySelector('.data:nth-child(2) .label');
    if (currentLabel) currentLabel.textContent = 'BMS Current';

    // Move all four temperature/cell cards into this same box.
    if (tempPanel) {
      const tempGrid = tempPanel.querySelector('.data-grid');
      if (tempGrid) {
        [...tempGrid.querySelectorAll('.data')].forEach((card) => grid.appendChild(card));
      }
      tempPanel.remove();
    }

    // Keep BMS temperature clearly labeled.
    const bmsCard = [...grid.querySelectorAll('.data')].find((card) => {
      return card.querySelector('.label')?.textContent.trim().toUpperCase() === 'BMS';
    });
    if (bmsCard) bmsCard.querySelector('.label').textContent = 'BMS TEMP';

    // Keep the compact SOC card synchronized if another script updates #soc.
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
