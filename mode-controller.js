(() => {
  'use strict';

  const modes = [
    { name: 'ECO', gear: '1', gearLabel: 'Eco' },
    { name: 'MID', gear: '2', gearLabel: 'Mid' },
    { name: 'SPORT', gear: '3', gearLabel: 'Sport' }
  ];

  const speedControl = document.getElementById('speedControl');
  const modeControl = document.getElementById('modeControl');
  const modeText = document.getElementById('modeText');
  const gearTexts = document.querySelectorAll('.mini-grid .mini:nth-child(3) b, .gear strong');
  const gearLabels = document.querySelectorAll('.gear small');

  if (!speedControl || !modeControl || !modeText) return;

  let index = Number.parseInt(localStorage.getItem('tilano-mode-index') || '0', 10);
  if (!Number.isInteger(index) || index < 0 || index >= modes.length) index = 0;

  function renderMode() {
    const mode = modes[index];
    modeText.textContent = mode.name;

    gearTexts.forEach((el) => {
      if (el.classList.contains('gear')) return;
      if (el.closest('.gear')) {
        el.textContent = mode.gear;
      } else {
        el.textContent = `${mode.gear} · ${mode.gearLabel}`;
      }
    });

    document.querySelectorAll('.gear strong').forEach((el) => { el.textContent = mode.gear; });
    document.querySelectorAll('.gear small').forEach((el) => { el.textContent = mode.gearLabel; });
    document.body.dataset.ridingMode = mode.name;
    document.body.dataset.gear = mode.gear;
    localStorage.setItem('tilano-mode-index', String(index));
  }

  function setMode(nextIndex) {
    index = (nextIndex + modes.length) % modes.length;
    renderMode();
  }

  // Tap/click the main SPEED control to cycle: ECO -> MID -> SPORT -> ECO.
  speedControl.addEventListener('click', (event) => {
    if (event.target.closest('#modeControl')) return;
    setMode(index + 1);
  });

  // Arrow controls remain individually usable.
  document.getElementById('modePrev')?.addEventListener('click', (event) => {
    event.stopPropagation();
    setMode(index - 1);
  });

  document.getElementById('modeNext')?.addEventListener('click', (event) => {
    event.stopPropagation();
    setMode(index + 1);
  });

  modeControl.addEventListener('click', (event) => {
    if (event.target.closest('#modePrev, #modeNext')) return;
    event.stopPropagation();
    setMode(index + 1);
  });

  renderMode();
})();
