import { backend, connectBackend, saveWorkspace } from './services/api.js';
// ---------------------------------------------------------------------------
// NEPHRA — Main Application Orchestrator
// Imports all modules, wires state, renders views, and binds events.
// ---------------------------------------------------------------------------

import { icon } from './core/icons.js';
import * as state from './core/state.js';
import { initRouter, navigate } from './core/router.js';

import { patients as initialPatients, generateSession, publicReadings } from '../../shared/engine/data.js';
import { estimate, forecast, handover } from '../../shared/engine/twin.js';
import { bodySignals } from '../../shared/engine/body.js';
import { escapeHTML as esc, parseSession, uniqueImportId, replayBounds, clampReplayTime, nextReplayTime } from '../../shared/engine/session.js';
import { pages, pageFromHash, reviewAt, pendingReviews, workloadInput, validateEvaluation } from '../../shared/engine/workspace.js';

import { toast } from './components/toast.js';
import { regionDetails, regionPeek } from './components/region-detail.js';
import { openGuide, openCommand, initDialog } from './components/dialog.js';

import { unit } from './views/unit.js';
import { twinView } from './views/twin.js';
import { scenarios } from './views/scenarios.js';
import { workflow } from './views/workflow.js';
import { evidence } from './views/evidence.js';

import { download } from './utils/download.js';
import { timeLabel } from './utils/format.js';
import { persistEvents, saveEvent } from './utils/storage.js';

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

const current = () => state.patients.find((p) => p.id === state.selected);
const effective = (p) =>
  state.streams[p.id].map((x) =>
    state.quality && x.minute > state.now - 15 && x.minute <= state.now
      ? { ...x, quality: 'poor' }
      : x
  );

function stateOf(p = current()) {
  const s = estimate(p, effective(p), state.now);
  return { s, f: forecast(p, s) };
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

function stop() {
  state.setPlaying(false);
  clearInterval(state.timer);
  state.setTimer(null);
}

function pauseReplay() {
  stop();
  const button = document.getElementById('play');
  if (button) {
    button.innerHTML = icon('play') + 'Replay';
    button.setAttribute('aria-label', 'Play synthetic replay');
  }
}

function choosePatient(id) {
  if (!state.streams[id]) return;
  stop();
  state.setSelected(id);
  state.setNow(clampReplayTime(state.streams[state.selected], state.now));
  state.setActiveRegion('pressure');
  state.setScenarioUF(Math.max(0, (stateOf().s.last?.uf ?? current().uf) - 0.2));
  render();
}

// ---------------------------------------------------------------------------
// Region selection (twin view in-place update)
// ---------------------------------------------------------------------------

function selectRegion(id) {
  if (state.view !== 'twin') return;
  const { s, f } = stateOf();
  const region = bodySignals(current(), s, f).regions.find((x) => x.id === id);
  if (!region) return;
  state.setActiveRegion(id);
  document.querySelectorAll('[data-region]').forEach((el) => {
    el.classList.toggle('selected', el.dataset.region === id);
    el.setAttribute('aria-pressed', String(el.dataset.region === id));
  });
  document.getElementById('body-detail').innerHTML = regionDetails(region);
  document.getElementById('body-peek').innerHTML = regionPeek(region);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function render() {
  const focused = document.activeElement;
  const focusId = focused?.id;
  const focusView = focused?.dataset?.view;
  const focusPatient = focused?.dataset?.patient;
  const focusRegion = focused?.dataset?.region;
  const focusClass = focused?.classList?.contains('body-hotspot') ? '.body-hotspot' : '.signal-chip';

  document.getElementById('app').innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand"><img src="./favicon.svg" alt="">NEPHRA</div><div class="brand-sub">PATIENT INTELLIGENCE</div><div class="nav-label">YOUR WORKSPACE</div><nav class="nav" aria-label="Main navigation">${pages.map(([v, i, l]) =>
    `<button data-view="${v}" class="${state.view === v ? 'active' : ''}" ${state.view === v ? 'aria-current="page"' : ''}>${icon(i)}${l}</button>`
  ).join('')}</nav><div class="sidebar-foot">${icon('shield')}<br><strong>Clarity for the next review.</strong><br>Synthetic research prototype<br>Workspace 1.4 · Research edition<hr><a href="./docs/presentation.pdf" target="_blank">Project presentation ↗</a></div></aside><div class="main-wrap"><header class="topbar"><div class="crumb"><span class="brand-mini">NEPHRA</span>Workspace &nbsp; / &nbsp; <b>${pages.find((p) => p[0] === state.view)?.[2]}</b></div><div class="topright"><span class="connection-note ${navigator.onLine ? '' : 'offline'}">${navigator.onLine ? backend.status : 'Offline · local session'}</span>${backend.connected ? `<button id="save-workspace" class="quick-button save-workspace" aria-label="${backend.saving?'Saving workspace':'Save workspace to local backend'}" ${backend.saving?'disabled':''}>${icon('database')}<span class="button-label">${backend.saving?'Saving…':'Save workspace'}</span></button>` : ''}<button id="open-command" class="quick-button" aria-label="Search patients or pages" title="Search (Ctrl or Command K)" aria-keyshortcuts="Control+k Meta+k">${icon('search')}<span class="button-label">Search</span></button><button id="focus-mode" class="quick-button" aria-pressed="${state.focusMode}" aria-label="${state.focusMode ? 'Show sidebar' : 'Focus mode: hide sidebar'}">${icon('grid')}</button><button id="open-guide" class="quick-button" aria-label="Open workspace guide">${icon('file')}<span class="button-label">Guide</span></button><span class="tag orange">SYNTHETIC DEMO</span></div></header><main id="main" class="content" tabindex="-1">${
    state.view === 'unit'      ? unit(stateOf) :
    state.view === 'twin'      ? twinView(stateOf) :
    state.view === 'scenarios' ? scenarios(stateOf) :
    state.view === 'evidence'  ? evidence() :
    workflow(stateOf)
  }<footer class="bottomline"><span>Research prototype · No real patient data · No treatment automation</span><span>Local computation &nbsp; · &nbsp; <a href="./docs/model-card.md" download>Model card</a></span></footer></main></div></div>`;

  bind();

  // Restore focus after re-render.
  const restore = focusId ? document.getElementById(focusId)
    : focusView ? document.querySelector(`[data-view="${CSS.escape(focusView)}"]`)
    : focusPatient ? document.querySelector(`[data-patient="${CSS.escape(focusPatient)}"]`)
    : focusRegion ? document.querySelector(`${focusClass}[data-region="${CSS.escape(focusRegion)}"]`)
    : null;
  state.setRestoringFocus(true);
  try { restore?.focus({ preventScroll: true }); } finally { state.setRestoringFocus(false); }
}

// ---------------------------------------------------------------------------
// Event binding (called after every render)
// ---------------------------------------------------------------------------

function bind() {
  document.querySelectorAll('[data-region]').forEach((el) => {
    el.addEventListener('mouseenter', () => selectRegion(el.dataset.region));
    el.addEventListener('focus', () => { if (!state.restoringFocus) selectRegion(el.dataset.region); });
    el.addEventListener('click', () => selectRegion(el.dataset.region));
  });
  document.querySelectorAll('[data-view]').forEach((b) => b.onclick = () => navigate(b.dataset.view));
  document.querySelectorAll('[data-patient]').forEach((b) => b.onclick = () => choosePatient(b.dataset.patient));

  const on = (id, event, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(event, fn); };
  const forecastDetails = document.querySelector('.chart-explorer');
  if (forecastDetails) forecastDetails.ontoggle = () => { state.setExpandedForecast(forecastDetails.open); };

  on('open-command', 'click', () => openCommand(choosePatient));
  on('open-guide', 'click', openGuide);
  on('save-workspace','click',async()=>{
    pauseReplay();const saving=saveWorkspace();render();
    try{await saving;toast('Synthetic sessions and reviews saved to the local backend.');}
    catch(error){toast(error.message);}
    render();
  });
  on('focus-mode', 'click', () => {
    state.setFocusMode(!state.focusMode);
    document.body.classList.toggle('focus-mode', state.focusMode);
    try { localStorage.setItem('nephra-focus', String(state.focusMode)); } catch { /* noop */ }
    render();
  });
  on('reset-search', 'click', () => { state.setQuery(''); state.setSessionFilter('all'); render(); });
  on('retry-evaluation', 'click', loadEvaluation);
  on('context-patient', 'change', (e) => choosePatient(e.target.value));
  on('next-review', 'click', () => {
    const next = pendingReviews(state.patients.map((p) => ({ p, ...stateOf(p) })), state.events, state.now)[0];
    if (!next) { toast('No pending pressure alerts at this replay minute. Check the unit for data-quality flags.'); return; }
    choosePatient(next.p.id);
    navigate('workflow');
  });
  on('copy-review', 'click', async () => {
    try { const { s, f } = stateOf(); await navigator.clipboard.writeText(handover(current(), s, f, state.events)); toast('Review draft copied.'); }
    catch { toast('Clipboard unavailable. Use Export draft instead.'); }
  });
  on('print-review', 'click', () => window.print());
  document.querySelectorAll('[data-filter]').forEach((el) => el.onclick = () => { state.setSessionFilter(el.dataset.filter); render(); });
  document.querySelectorAll('[data-preset]').forEach((el) => el.onclick = () => {
    pauseReplay();
    state.setScenarioUF(Math.round(Math.max(0, Math.min(2, state.scenarioUF + Number(el.dataset.preset))) * 100) / 100);
    render();
  });
  on('timeline', 'input', (e) => {
    pauseReplay();
    document.getElementById('timeline-value').textContent = `${timeLabel(+e.target.value)} / ${timeLabel(replayBounds(state.streams[state.selected]).max)}`;
  });
  on('timeline', 'change', (e) => { state.setNow(clampReplayTime(state.streams[state.selected], +e.target.value)); render(); });
  on('play', 'click', () => {
    if (state.playing) stop();
    else {
      const bounds = replayBounds(state.streams[state.selected]);
      if (state.now >= bounds.max) state.setNow(bounds.min);
      state.setPlaying(true);
      state.setTimer(setInterval(() => {
        const tick = nextReplayTime(state.streams[state.selected], state.now, state.speed);
        state.setNow(tick.now);
        if (tick.finished) stop();
        render();
      }, 1000));
    }
    render();
  });
  on('speed', 'change', (e) => state.setSpeed(+e.target.value));
  on('quality', 'click', () => {
    state.setQuality(!state.quality);
    render();
    toast(state.quality ? 'Recent readings marked unreliable; forecasts are withheld.' : 'Good sensor quality restored.');
  });
  on('search', 'input', (e) => {
    state.setQuery(e.target.value);
    const pos = e.target.selectionStart;
    render();
    const input = document.getElementById('search');
    input.focus();
    input.setSelectionRange(pos, pos);
  });
  on('scenario-patient', 'change', (e) => choosePatient(e.target.value));
  on('twin-patient', 'change', (e) => choosePatient(e.target.value));
  on('uf', 'input', (e) => { pauseReplay(); document.getElementById('uf-value').textContent = (+e.target.value).toFixed(2); });
  on('uf', 'change', (e) => { state.setScenarioUF(+e.target.value); render(); });
  on('reset-scenario', 'click', () => { pauseReplay(); state.setScenarioUF(stateOf().s.last?.uf ?? current().uf); render(); });
  on('review', 'click', () => {
    const { s, f } = stateOf();
    if (!s.valid || !f.valid || reviewAt(state.events, state.selected, state.now)) return;
    const previousReviews = [...state.events];
    saveEvent(`Observed-rate forecast reviewed (${f.status})`);
    const recorded = state.events.at(-1);
    render();
    toast('Review recorded for this session time.', () => {
      state.setEvents([...previousReviews, ...state.events.filter((e) => e !== recorded && !previousReviews.includes(e))].slice(-100));
      persistEvents();
      render();
    });
  });
  on('export', 'click', () => {
    const { s, f } = stateOf();
    download(`NEPHRA-${state.selected}-review.txt`, handover(current(), s, f, state.events));
    toast('Review draft exported.');
  });
  on('export-audit', 'click', () => download('NEPHRA-local-review-log.json', JSON.stringify({ demo: true, events: state.events }, null, 2), 'application/json'));
  on('clear-log', 'click', () => {
    const previous = [...state.events];
    state.setEvents([]);
    persistEvents();
    render();
    toast('Local review history cleared.', () => { state.setEvents([...previous, ...state.events].slice(-100)); persistEvents(); render(); });
  });
  document.querySelectorAll('[data-assumption]').forEach((el) => el.onchange = () => {
    pauseReplay();
    try {
      const a = { ...state.assumptions };
      a[el.dataset.assumption] = workloadInput(el.dataset.assumption, el.value);
      state.setAssumptions(a);
      render();
    } catch (error) {
      el.setAttribute('aria-invalid', 'true');
      toast(error.message);
      el.focus();
    }
  });
  on('sample', 'click', () =>
    download('nephra-synthetic-session.json', JSON.stringify({ synthetic: true, patient: initialPatients[0], readings: publicReadings(generateSession(initialPatients[0])) }, null, 2), 'application/json')
  );
  on('import', 'click', () => document.getElementById('import-file').click());
  on('import-file', 'change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.setImportError('');
    try {
      if (state.patients.length >= initialPatients.length + 20) throw Error('A workspace supports up to 20 imported sessions.');
      if (file.size > 2e6) throw Error('File exceeds 2 MB.');
      const { patient: p, readings } = parseSession(JSON.parse(await file.text()));
      p.id = uniqueImportId(p.id, [...state.patients.map((x) => x.id), ...state.events.map((x) => x.patient)]);
      state.setPatients(state.patients.concat(p));
      state.streams[p.id] = readings;
      state.setSelected(p.id);
      state.setNow(clampReplayTime(readings, readings[0].minute + 120));
      state.setQuality(false);
      state.setScenarioUF(Math.max(0, (stateOf().s.last?.uf ?? p.uf) - 0.2));
      state.setActiveRegion('pressure');
      state.setQuery('');
      state.setSessionFilter('all');
      state.setView('unit');
      history.pushState(null, '', '#unit');
      stop();
      render();
      document.getElementById('main').focus({ preventScroll: true });
      window.scrollTo(0, 0);
      toast(`Synthetic session ${p.id} imported locally.`);
    } catch (err) {
      state.setImportError(err.message);
      render();
      toast('Import rejected. See the explanation above.');
    } finally {
      e.target.value = '';
    }
  });
}

// ---------------------------------------------------------------------------
// Evaluation loader
// ---------------------------------------------------------------------------

async function loadEvaluation() {
  state.setEvaluationStatus('loading');
  if (state.view === 'evidence') render();
  try {
    const response = await fetch('./data/evaluation.json', { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw Error('Unavailable');
    const data = validateEvaluation(await response.json());
    state.setEvaluation(data);
    state.setEvaluationStatus('ready');
  } catch {
    state.setEvaluation(null);
    state.setEvaluationStatus('error');
  }
  if (state.view === 'evidence') render();
}

// ---------------------------------------------------------------------------
// Global keyboard shortcuts
// ---------------------------------------------------------------------------

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (!document.getElementById('workspace-dialog').open) openCommand(choosePatient);
  }
});

for (const event of ['online', 'offline'])
  window.addEventListener(event, () => {
    const el = document.querySelector('.connection-note');
    if (el) {
      el.textContent = navigator.onLine ? backend.status : 'Offline · local session';
      el.classList.toggle('offline', !navigator.onLine);
    }
  });

document.addEventListener('visibilitychange', () => { if (document.hidden) pauseReplay(); });

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------

initRouter(render, stop);
initDialog(pauseReplay);
await connectBackend();
render();
loadEvaluation();
