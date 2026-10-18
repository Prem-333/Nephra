import { icon } from '../core/icons.js';
import { escapeHTML as esc } from '../../../shared/engine/session.js';

/** Render a patient profile card with vitals. */
export function profile(p, s) {
  return `<div class="profile-header"><div class="profile"><div class="profile-avatar">${esc(p.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</div><div><h2>${esc(p.name)}</h2><div class="meta">${esc(p.id)} · ${esc(p.age)} years · ${esc(p.sex)} · ${p.weight.toFixed(0)} kg dry weight</div></div></div><span class="tag">SESSION ${String(Math.floor(state.now / 60)).padStart(2, '0')}:${String(state.now % 60).padStart(2, '0')}</span></div>
  <div class="vitals">${[
    ['Systolic pressure', s.valid ? s.bp.sbp.toFixed(0) : '—', 'mmHg', s.valid ? `Cuff ${s.cuffAge} min ago` : 'Awaiting valid cuff'],
    ['Heart rate', s.valid ? s.last.hr : '—', 'bpm', 'Synthetic pulse sensor'],
    ['Relative blood volume', s.valid ? s.last.rbv.toFixed(1) : '—', '%', 'Relative to session start'],
    ['Fluid removed', s.valid ? s.last.removed.toFixed(2) : '—', 'L', `${(s.last?.uf ?? p.uf).toFixed(2)} L/h UF stream`],
  ].map(([l, n, u, d]) =>
    `<div class="vital"><div class="vital-label">${l}</div><div class="vital-num">${n}<span class="vital-unit">${u}</span></div><div class="vital-sub">${d}</div></div>`
  ).join('')}</div>`;
}

import * as state from '../core/state.js';
