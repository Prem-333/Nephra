import { icon } from '../core/icons.js';
import { labels } from '../core/constants.js';
import * as state from '../core/state.js';
import { escapeHTML as esc } from '../../../shared/engine/session.js';
import { bodySignals } from '../../../shared/engine/body.js';
import { header } from '../components/header.js';
import { pill } from '../components/pill.js';
import { chart } from '../components/chart.js';
import { replay } from '../components/replay.js';
import { forecastTable } from '../components/forecast-table.js';
import { regionDetails, regionPeek } from '../components/region-detail.js';

function sessionSummary(s, f) {
  return `<div class="session-summary" aria-label="Session at a glance"><div class="summary-status">${icon(f.valid ? 'pulse' : 'shield')}<div><span class="eyebrow">Session at a glance</span><b>${labels[f.status]}</b><small>${f.valid ? 'Synthetic replay · minute ' + state.now : 'Forecast paused · check observations'}</small></div></div><div class="summary-item"><span>Latest cuff pressure</span><strong>${s.valid ? s.bp.sbp.toFixed(0) : '—'} <small>mmHg</small></strong><small>${s.valid ? s.cuffAge + ' min ago' : 'Awaiting reliable data'}</small></div><div class="summary-item"><span>30-min predicted low</span><strong>${f.valid ? f.nadir.toFixed(0) : '—'} <small>mmHg</small></strong><small>Modelled projection</small></div><div class="summary-item"><span>Fluid removed</span><strong>${s.valid ? s.last.removed.toFixed(2) : '—'} <small>L</small></strong><small>${s.valid ? s.last.uf.toFixed(2) + ' L/h observed' : 'No reliable reading'}</small></div></div>`;
}

/**
 * Render the Patient Digital Twin page — body map, signals, and forecast.
 * @param {Function} stateOf - computes {s, f} for a patient
 */
export function twinView(stateOf) {
  const p = state.patients.find(pt => pt.id === state.selected);
  const { s, f } = stateOf();
  const body = bodySignals(p, s, f);
  const active = body.regions.find(x => x.id === state.activeRegion) || body.regions[0];

  return header(
    'Patient digital twin',
    'A patient-specific view of circulation, fluid balance and the next 30 minutes.',
    `<div class="twin-patient-select"><label for="twin-patient">Patient</label><select id="twin-patient" aria-label="Select patient">${state.patients.map(pt =>
      `<option value="${pt.id}" ${pt.id === state.selected ? 'selected' : ''}>${esc(pt.name)} · ${esc(pt.id)} · ${pt.sex === 'F' ? 'Female' : pt.sex === 'M' ? 'Male' : 'Unspecified'}</option>`
    ).join('')}</select></div><button data-view="scenarios">${icon('flask')} Scenario lab</button>`
  ) +
  ` ${sessionSummary(s, f)}<div class="twin-layout"><section class="panel body-panel" id="body-overview" tabindex="-1"><div class="panel-head"><div><h2 class="section-title">${esc(p.name)} <span class="meta">${esc(p.id)}</span></h2><p class="meta">${body.label} · illustrative anatomy</p></div>${pill(f)}</div><div class="body-peek" id="body-peek">${regionPeek(active)}</div><div class="body-visual"><div class="body-map" role="group" aria-label="Interactive ${esc(body.label.toLowerCase())}"><img class="body-image" src="./assets/body-${body.anatomy === 'female' ? 'female' : 'male'}.png" alt="${esc(body.label)}; decorative shape, use the named signal buttons for measurements" draggable="false">${body.regions.map((r, i) =>
    `<span class="body-glow ${r.tone}" style="left:${r.x}%;top:${r.y}%" aria-hidden="true"></span><button class="body-hotspot ${r.tone} ${r.id === state.activeRegion ? 'selected' : ''}" style="left:${r.x}%;top:${r.y}%" data-region="${r.id}" aria-label="${i + 1} ${esc(r.name)} ${esc(r.value)}" aria-pressed="${r.id === state.activeRegion}" aria-controls="body-detail"><span>${i + 1}</span><span class="hotspot-tooltip">${esc(r.name)}<b>${esc(r.value)}</b></span></button>`
  ).join('')}</div><div class="body-map-caption">FRONT VIEW <span>Signal locations are schematic</span></div></div><div class="heat-legend"><span><i class="heat-dot observed"></i>Observed</span><span><i class="heat-dot watch"></i>Watch</span><span><i class="heat-dot review"></i>Review</span><span><i class="heat-dot context"></i>History</span><span><i class="heat-dot unknown"></i>Unmeasured</span></div><p class="body-map-note">Colours organise whole-body measurements and model output. This is not an organ-damage, temperature or perfusion scan.</p></section>
  <div class="twin-right"><section class="panel"><div class="signal-picker" role="group" aria-label="Body signals">${body.regions.map((r, i) =>
    `<button data-region="${r.id}" class="signal-chip ${r.id === state.activeRegion ? 'selected' : ''}" aria-pressed="${r.id === state.activeRegion}" aria-controls="body-detail"><span class="heat-dot ${r.tone}"></span>${i + 1}. ${esc(r.name)}</button>`
  ).join('')}</div><div id="body-detail" class="body signal-detail" tabindex="-1" aria-live="polite" aria-atomic="true">${regionDetails(active)}</div><a href="#body-overview" class="back-to-body">↑ Back to body map</a></section>
  <section class="panel"><div class="forecast-head"><h2 class="section-title">Pressure trajectory</h2><span class="tag">30 MIN FORECAST</span></div><div class="chart-wrap">${chart(p, s, f)}</div>${forecastTable(f)}<div class="forecast-foot">Shading shows model sensitivity. The anatomy illustration does not change the prediction.</div></section></div></div>${replay()}`;
}
