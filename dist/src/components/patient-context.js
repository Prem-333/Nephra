import { icon } from '../core/icons.js';
import { escapeHTML as esc } from '../../../shared/engine/session.js';
import * as state from '../core/state.js';
import { pill } from './pill.js';

/** Render the selected patient context bar (used on workflow page). */
export function patientContext(p, s, f) {
  return `<section class="patient-context" aria-label="Selected review patient"><div class="profile-avatar">${esc(p.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</div><div class="context-picker"><label for="context-patient">Preparing a review for</label><select id="context-patient">${state.patients.map(pt =>
    `<option value="${pt.id}" ${pt.id === state.selected ? 'selected' : ''}>${esc(pt.name)} · ${esc(pt.id)}</option>`
  ).join('')}</select></div><div class="context-meta">Minute <strong>${state.now}</strong><span>Latest cuff <strong>${s.valid ? s.bp.sbp.toFixed(0) + ' mmHg' : 'Unavailable'}</strong></span></div>${pill(f)}<button data-view="twin">Open patient twin ↗</button></section>`;
}
