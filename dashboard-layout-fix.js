/* Dashboard layout: replace Gear mini-card with SOC and combine BMS temperature with battery telemetry. */
(function () {
  function applyLayout() {
    const miniCards = document.querySelectorAll('.mini-grid .mini');
    const battery = document.querySelector('#dashboard .telemetry');
    if (!miniCards.length || !battery) return;

    // The third mini card is no longer Gear; it becomes a compact SOC readout.
    const mini = miniCards[2];
    if (mini) {
      const label = mini.querySelector('span');
      const value = mini.querySelector('b');
      if (label) label.textContent = 'SOC';
      if (value) value.textContent = (document.getElementById('soc')?.textContent || '78%');
    }

    const grid = battery.querySelector('.data-grid');
    if (grid && !grid.querySelector('.bms-temp')) {
      const temp = document.createElement('div');
      temp.className = 'data bms-temp';
      temp.innerHTML = '<span class="label">Temperature BMS</span><b>38 °C</b>';
      grid.appendChild(temp);
    }

    // Keep voltage/current together with BMS temperature in the same Battery/SOC box.
    const currentLabel = grid?.querySelector('.data:nth-child(2) .label');
    if (currentLabel) currentLabel.textContent = 'BMS Current';

    // Remove the separate Temperature panel from the dashboard.
    const panels = document.querySelectorAll('#dashboard .telemetry');
    panels.forEach((panel, index) => {
      if (index === 1) panel.style.display = 'none';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLayout, { once: true });
  } else {
    applyLayout();
  }
})();
