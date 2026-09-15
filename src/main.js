import './style.css';
import { BleClient } from '@capacitor-community/bluetooth-le';

const state = {
  bms: { connected: false, voltage: null, current: null, soc: null, temperature: null },
  controller: { connected: false, voltage: null, current: null, speed: null, temperature: null },
  log: []
};

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="app-shell">
    <header class="topbar">
      <div><h1>MotoMonitor</h1><p>Vehicle telemetry monitor</p></div>
      <div class="status-pill" id="app-status">READY</div>
    </header>

    <section class="hero-card">
      <div class="speed"><span id="speed">--</span><small>km/h</small></div>
      <div class="hero-stats">
        <div><span>Battery</span><strong id="soc">--%</strong></div>
        <div><span>Power</span><strong id="power">-- W</strong></div>
        <div><span>Voltage</span><strong id="voltage">-- V</strong></div>
      </div>
    </section>

    <section class="grid">
      <article class="card">
        <div class="card-head"><h2>BMS</h2><span id="bms-status" class="dot off">OFF</span></div>
        <div class="metrics">
          <div><span>Voltage</span><b id="bms-voltage">-- V</b></div>
          <div><span>Current</span><b id="bms-current">-- A</b></div>
          <div><span>SOC</span><b id="bms-soc">-- %</b></div>
          <div><span>Temperature</span><b id="bms-temp">-- °C</b></div>
        </div>
        <button id="connect-bms">Connect BMS</button>
      </article>

      <article class="card">
        <div class="card-head"><h2>Controller</h2><span id="ctrl-status" class="dot off">OFF</span></div>
        <div class="metrics">
          <div><span>Voltage</span><b id="ctrl-voltage">-- V</b></div>
          <div><span>Current</span><b id="ctrl-current">-- A</b></div>
          <div><span>Speed</span><b id="ctrl-speed">-- km/h</b></div>
          <div><span>Temperature</span><b id="ctrl-temp">-- °C</b></div>
        </div>
        <button id="connect-controller">Scan Bluetooth</button>
      </article>
    </section>

    <section class="card log-card"><div class="card-head"><h2>Event log</h2><button class="secondary" id="clear-log">Clear</button></div><pre id="log">MotoMonitor initialized.</pre></section>
  </main>`;

function writeLog(message) {
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  state.log.unshift(line);
  state.log = state.log.slice(0, 30);
  document.querySelector('#log').textContent = state.log.join('\n');
}

function render() {
  const { bms, controller } = state;
  const power = Number.isFinite(bms.voltage) && Number.isFinite(bms.current) ? bms.voltage * bms.current : null;
  document.querySelector('#speed').textContent = controller.speed ?? '--';
  document.querySelector('#soc').textContent = bms.soc == null ? '--%' : `${Math.round(bms.soc)}%`;
  document.querySelector('#power').textContent = power == null ? '-- W' : `${Math.round(power)} W`;
  document.querySelector('#voltage').textContent = bms.voltage == null ? '-- V' : `${bms.voltage.toFixed(1)} V`;
  document.querySelector('#bms-voltage').textContent = bms.voltage == null ? '-- V' : `${bms.voltage.toFixed(1)} V`;
  document.querySelector('#bms-current').textContent = bms.current == null ? '-- A' : `${bms.current.toFixed(1)} A`;
  document.querySelector('#bms-soc').textContent = bms.soc == null ? '-- %' : `${Math.round(bms.soc)} %`;
  document.querySelector('#bms-temp').textContent = bms.temperature == null ? '-- °C' : `${bms.temperature.toFixed(1)} °C`;
  document.querySelector('#ctrl-voltage').textContent = controller.voltage == null ? '-- V' : `${controller.voltage.toFixed(1)} V`;
  document.querySelector('#ctrl-current').textContent = controller.current == null ? '-- A' : `${controller.current.toFixed(1)} A`;
  document.querySelector('#ctrl-speed').textContent = controller.speed == null ? '-- km/h' : `${controller.speed} km/h`;
  document.querySelector('#ctrl-temp').textContent = controller.temperature == null ? '-- °C' : `${controller.temperature.toFixed(1)} °C`;
  setStatus('#bms-status', bms.connected);
  setStatus('#ctrl-status', controller.connected);
}

function setStatus(selector, connected) {
  const el = document.querySelector(selector);
  el.textContent = connected ? 'ON' : 'OFF';
  el.className = `dot ${connected ? 'on' : 'off'}`;
}

async function scanBluetooth() {
  try {
    await BleClient.initialize();
    const device = await BleClient.requestDevice({ allowDuplicates: false, services: [] });
    writeLog(`Bluetooth device selected: ${device.name || device.deviceId}`);
    state.controller.connected = true;
    render();
  } catch (error) {
    writeLog(`Bluetooth scan: ${error?.message || error}`);
  }
}

document.querySelector('#connect-controller').addEventListener('click', scanBluetooth);
document.querySelector('#connect-bms').addEventListener('click', () => {
  writeLog('BMS transport is scaffolded; protocol will be added for the new hardware.');
});
document.querySelector('#clear-log').addEventListener('click', () => { state.log = []; render(); document.querySelector('#log').textContent = 'Log cleared.'; });

render();
writeLog('UI ready. Hardware protocol layer pending.');
