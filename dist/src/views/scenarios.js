import { icon } from '../core/icons.js';
import * as state from '../core/state.js';
import { escapeHTML as esc } from '../../../shared/engine/session.js';
import { forecast as computeForecast } from '../../../shared/engine/twin.js';
import { header } from '../components/header.js';
import { chart } from '../components/chart.js';
import { replay } from '../components/replay.js';

/**
 * Render the Scenario Lab page — hypothetical UF rate comparison.
 * @param {Function} stateOf - computes {s, f} for a patient
 */
export function scenarios(stateOf) {
  const p = state.patients.find(pt => pt.id === state.selected);
  const { s, f } = stateOf();
  const alt = computeForecast(p, s, { uf: state.scenarioUF });

  return header(
    'Scenario lab',
    'Explore a hypothetical fluid-removal change for the selected synthetic patient.',
    `<button data-view="unit">${icon('grid')} Back to sessions</button>`
  ) +
  `<div class="notice">Simulation only. A gentler removal rate can leave more fluid unremoved. These curves do not prescribe treatment or control a dialysis machine.</div><div class="scenario-layout"><section class="panel"><div class="panel-head"><h2 class="section-title">Scenario inputs</h2>${icon('flask')}</div><div class="body scenario-controls"><div class="field"><label for="scenario-patient">Synthetic patient</label><select id="scenario-patient">${state.patients.map(pt =>
    `<option value="${pt.id}" ${pt.id === state.selected ? 'selected' : ''}>${esc(pt.name)} · ${pt.id}</option>`
  ).join('')}</select></div><div class="field"><label for="uf">Hypothetical UF rate</label><div class="field-value"><output id="uf-value">${state.scenarioUF.toFixed(2)}</output> <span class="meta">L/hour</span></div><input id="uf" type="range" min="0" max="2" step="0.01" value="${state.scenarioUF}"><div class="compare-note">Observed rate: ${(s.last?.uf ?? p.uf).toFixed(2)} L/hour</div></div><div class="field"><label>Comparison window</label><div class="field-value">30 <span class="meta">minutes</span></div><div class="compare-note">Both simulations start at minute ${state.now} with the same estimated patient state.</div></div><div class="preset-row" aria-label="Scenario presets"><button data-preset="-.2">−0.20 L/h</button><button data-preset=".2">+0.20 L/h</button><button id="reset-scenario">Observed rate</button></div><div class="model-note">No saline, medication, or machine commands are issued. No scenario becomes the patient record.</div></div></section><div class="detail"><section class="panel"><div class="forecast-head"><h2 class="section-title">Predicted pressure comparison</h2><div class="legend"><span><i class="swatch dashed"></i>Observed rate</span><span><i class="swatch" style="background:#8372b3"></i>Scenario</span></div></div><div class="chart-wrap">${chart(p, s, f, alt)}</div><div class="comparison"><div><div class="eyebrow">Observed rate projection</div><div class="compare-num">${f.valid ? f.nadir.toFixed(1) : '—'} <span class="meta">mmHg</span></div><div class="compare-note">Predicted lowest SBP<br>${f.valid ? f.removed.toFixed(2) : '—'} L removed over next 30 minutes</div></div><div><div class="eyebrow">Hypothetical projection</div><div class="compare-num" style="color:#8372b3">${alt.valid ? alt.nadir.toFixed(1) : '—'} <span class="meta">mmHg</span></div><div class="compare-note">Predicted lowest SBP<br>${alt.valid ? alt.removed.toFixed(2) : '—'} L removed over next 30 minutes</div></div></div></section><section class="panel"><div class="body prose"><h2 class="section-title" style="margin-top:0">The tradeoff stays visible</h2><p>${alt.valid ? `${Math.abs(f.removed - alt.removed) < 1e-9 ? 'Both scenarios remove <strong>the same amount of fluid</strong>' : `This scenario removes <strong>${Math.abs(f.removed - alt.removed).toFixed(2)} L ${alt.removed < f.removed ? 'less' : 'more'}</strong> fluid`} over 30 minutes. The model estimates a <strong>${(alt.nadir - f.nadir).toFixed(1)} mmHg</strong> change in the pressure nadir.` : 'No comparison is available until observations are reliable.'}</p><p>Pressure is only one part of dialysis care. Volume status, adequacy, symptoms and clinician judgement are outside this simplified simulation.</p></div></section></div></div>${replay()}`;
}
