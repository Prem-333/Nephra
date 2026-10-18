import { patients as initialPatients, generateSession, publicReadings } from '../../../shared/engine/data.js';
import { pageFromHash, restoreReviews } from '../../../shared/engine/workspace.js';
import { defaultAssumptions } from './constants.js';

// ---------------------------------------------------------------------------
// Mutable application state — imported by views and the orchestrator.
// ---------------------------------------------------------------------------

export let patients = [...initialPatients];

export const streams = Object.assign(
  Object.create(null),
  Object.fromEntries(patients.map((p) => [p.id, publicReadings(generateSession(p))]))
);

export let selected  = patients[0].id;
export let now       = 120;
export let view      = pageFromHash(location.hash) || 'unit';
export let playing   = false;
export let timer     = null;
export let speed     = 2;
export let query     = '';
export let quality   = false;
export let scenarioUF = 0.62;

export let assumptions = { ...defaultAssumptions };
export let events      = [];
export let evaluation  = null;

export let activeRegion    = 'pressure';
export let restoringFocus  = false;
export let sessionFilter   = 'all';
export let expandedForecast = false;
export let evaluationStatus = 'loading';
export let importError     = '';

export let focusMode = false;
try { focusMode = localStorage.getItem('nephra-focus') === 'true'; } catch { /* noop */ }
document.body.classList.toggle('focus-mode', focusMode);

try {
  const stored = JSON.parse(localStorage.getItem('nephra-reviews-v1') || '[]');
  events = restoreReviews(stored);
} catch { /* noop */ }

// ---------------------------------------------------------------------------
// Setters — because ES module exports are live bindings but not reassignable
// from outside. Views call these to mutate shared state.
// ---------------------------------------------------------------------------

export function setPatients(v)         { patients = v; }
export function setSelected(v)         { selected = v; }
export function setNow(v)              { now = v; }
export function setView(v)             { view = v; }
export function setPlaying(v)          { playing = v; }
export function setTimer(v)            { timer = v; }
export function setSpeed(v)            { speed = v; }
export function setQuery(v)            { query = v; }
export function setQuality(v)          { quality = v; }
export function setScenarioUF(v)       { scenarioUF = v; }
export function setAssumptions(v)      { assumptions = v; }
export function setEvents(v)           { events = v; }
export function setEvaluation(v)       { evaluation = v; }
export function setActiveRegion(v)     { activeRegion = v; }
export function setRestoringFocus(v)   { restoringFocus = v; }
export function setSessionFilter(v)    { sessionFilter = v; }
export function setExpandedForecast(v) { expandedForecast = v; }
export function setEvaluationStatus(v) { evaluationStatus = v; }
export function setImportError(v)      { importError = v; }
export function setFocusMode(v)        { focusMode = v; }
