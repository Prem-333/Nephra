import { icon } from '../core/icons.js';
import * as state from '../core/state.js';
import { escapeHTML as esc } from '../../../shared/engine/session.js';
import { handover, workload } from '../../../shared/engine/twin.js';
import { reviewAt } from '../../../shared/engine/workspace.js';
import { header } from '../components/header.js';
import { pill } from '../components/pill.js';
import { patientContext } from '../components/patient-context.js';

/**
 * Render the Review & Handover page.
 * @param {Function} stateOf - computes {s, f} for a patient
 */
export function workflow(stateOf) {
  const p = state.patients.find(pt => pt.id === state.selected);
  const { s, f } = stateOf();
  const w = workload(state.assumptions);

  return header(
    'Review & handover',
    'Prepare routine documentation, then keep a human in the decision loop.',
    `<button id="copy-review">${icon('file')} Copy draft</button><button id="print-review">Print</button><button class="primary" id="export">${icon('download')} Export draft</button>`
  ) +
  `${patientContext(p, s, f)}<div class="evidence-grid"><section class="panel"><div class="panel-head"><h2 class="section-title">Automatically assembled review draft</h2><span class="tag">${esc(p.id)}</span></div><div class="body">${reviewAt(state.events, state.selected, state.now) ? `<div class="review-state">${icon('check')} Reviewed at minute ${state.now} in this browser</div>` : ''}<pre class="note-preview" tabindex="0" role="region" aria-label="Review draft">${esc(handover(p, s, f, state.events))}</pre><div class="actions" style="margin-top:16px"><button class="primary" id="review" ${!f.valid || reviewAt(state.events, state.selected, state.now) ? 'disabled' : ''}>${icon('check')} ${reviewAt(state.events, state.selected, state.now) ? 'Reviewed' : 'Mark reviewed'}</button><button id="next-review">Next pending review</button><button id="export-audit">Export review log</button></div><p class="model-note">A local review marker is a demo workflow action, not an authenticated clinical signature. This browser stores up to 100 review actions.</p></div></section><section class="panel"><div class="panel-head"><h2 class="section-title">Workload target calculator</h2>${icon('clock')}</div><div class="body"><div class="notice">Planning assumptions, not measured time savings. This calculator covers repetitive preparation only.</div><div class="workload-fields">${[['patients', 'Patients per day'], ['checks', 'Review cycles per patient'], ['manual', 'Manual preparation (sec)'], ['review', 'Assisted preparation (sec)']].map(([k, l]) =>
    `<div class="field"><label for="work-${k}">${l}</label><input type="number" id="work-${k}" data-assumption="${k}" min="${k === 'manual' ? 1 : 0}" max="10000" step="${['patients', 'checks'].includes(k) ? 1 : .1}" value="${state.assumptions[k]}"></div>`
  ).join('')}</div><div class="workload-result"><strong>${Math.abs(w.reduction).toFixed(0)}%</strong><span>modelled ${w.reduction < 0 ? 'increase' : 'reduction'} in preparation time</span></div><div class="drivers"><div class="driver"><span>Manual preparation</span><b>${w.before.toFixed(1)} min/day</b></div><div class="driver"><span>Assisted preparation</span><b>${w.after.toFixed(1)} min/day</b></div><div class="driver"><span>Potential time difference</span><b>${w.saved.toFixed(1)} min/day</b></div></div><div class="model-note">A 90% target assumes 90 seconds becomes 9 seconds. Clinical assessment, bedside care, checks, training and exception handling are excluded. Validate using a prospective time-and-motion study.</div></div></section><section class="panel"><div class="panel-head"><h2 class="section-title">Local review history</h2><button id="clear-log">Clear demo log</button></div><div class="body">${state.events.length ? state.events.slice(-8).reverse().map(x =>
    `<div class="audit-row"><strong>${esc(x.patient)}</strong> · ${esc(x.action)} at minute ${x.minute}<br><small>${esc(x.time)}</small></div>`
  ).join('') : '<div class="empty">No reviews recorded in this browser.</div>'}</div></section><section class="panel"><div class="panel-head"><h2 class="section-title">Pilot measurement plan</h2>${icon('chart')}</div><div class="body prose"><p>Time the same chart preparation task with and without NEPHRA using randomised task order and equivalent case complexity.</p><p>Report median time, omissions, corrections, extra reviews and clinician satisfaction. Count setup time and false alerts separately. Do not infer a 90% reduction in total nursing work.</p></div></section></div>`;
}
