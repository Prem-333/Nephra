import { icon } from '../core/icons.js';
import * as state from '../core/state.js';
import { escapeHTML as esc } from '../../../shared/engine/session.js';
import { rankSessions, reviewAt, pendingReviews } from '../../../shared/engine/workspace.js';
import { header } from '../components/header.js';
import { pill } from '../components/pill.js';
import { profile } from '../components/profile.js';
import { chart } from '../components/chart.js';
import { replay } from '../components/replay.js';

/**
 * Render the Unit Overview page — patient grid, stats, alerts, and detail panel.
 * @param {Function} stateOf - computes {s, f} for a patient
 */
export function unit(stateOf) {
  const p = state.patients.find(pt => pt.id === state.selected);
  const { s, f } = stateOf();
  const all = state.patients.map(pt => ({ p: pt, ...stateOf(pt) }));
  const urgent = all.filter(x => ['review', 'current-low'].includes(x.f.status)).length;
  const watch = all.filter(x => x.f.status === 'watch').length;
  const pending = pendingReviews(all, state.events, state.now);
  const completed = all.filter(x => reviewAt(state.events, x.p.id, state.now)).length;

  const stats = [
    ['users', state.patients.length, 'Synthetic sessions', ''],
    ['alert', urgent, 'Pressure alerts', 'warn'],
    ['pulse', watch, 'Sensitivity watch', ''],
    ['check', completed + ' / ' + state.patients.length, 'Reviewed at this minute', ''],
  ];

  return header(
    'Every patient. A clearer picture.',
    'Review the unit, understand the trajectory, and prepare the next handover.',
    `<button id="export">${icon('download')} Export review</button><button class="primary" data-view="twin">${icon('users')} Patient twin</button>`
  ) +
  `<div class="stats">${stats.map(([i, v, l, c]) =>
    `<div class="stat ${c}"><div class="stat-icon">${icon(i)}</div><div><div class="stat-value">${v}</div><div class="stat-label">${l}</div></div></div>`
  ).join('')}</div>
  <div class="review-brief"><div class="brief-mark">${icon('pulse')}</div><div><span class="eyebrow">YOUR REVIEW QUEUE · MINUTE ${state.now}</span><h2>${pending.length ? `${pending.length} session${pending.length === 1 ? '' : 's'} ready for a closer look` : 'No unreviewed pressure alerts'}</h2><p>${pending.length ? 'Start with the highest-priority forecast. Review markers apply to this replay minute only.' : 'Check any data-quality flags and continue monitoring the simulated session.'}</p></div><button class="primary" id="next-review" ${pending.length ? '' : 'disabled'}>Review next ${icon('users')}</button></div>
  <div class="workbench"><section class="panel patient-panel" aria-label="Patient selection"><div class="panel-head"><h2 class="section-title">Patient directory</h2><span class="tag">${state.patients.length}</span></div><div class="search">${icon('search')}<input id="search" placeholder="Find a patient" aria-label="Find a patient" value="${esc(state.query)}"></div><div class="filter-row" aria-label="Session filter"><button data-filter="all" class="${state.sessionFilter === 'all' ? 'active' : ''}" aria-pressed="${state.sessionFilter === 'all'}">All sessions</button><button data-filter="priority" class="${state.sessionFilter === 'priority' ? 'active' : ''}" aria-pressed="${state.sessionFilter === 'priority'}">Needs attention</button></div><div class="patient-list">${rankSessions(all, state.sessionFilter).filter(x => (x.p.name + x.p.id).toLowerCase().includes(state.query.toLowerCase())).map(({ p: pt, s: st, f: fc }) =>
    `<button class="patient ${pt.id === state.selected ? 'selected' : ''}" data-patient="${pt.id}" aria-pressed="${pt.id === state.selected}"><span class="patient-top"><span class="patient-name">${esc(pt.name)}</span><span class="bed">BED ${esc(pt.bed)}</span></span><span class="patient-meta">${esc(pt.id)} · ${Number.isFinite(pt.age) ? pt.age + "y" : "Age unknown"} · ${esc(pt.sex)}</span><span class="patient-bottom">${pill(fc)}<span>${reviewAt(state.events, pt.id, state.now) ? '<span class="review-check" title="Reviewed at this minute">✓ </span>' : ''}${st.valid ? st.bp.sbp.toFixed(0) : '—'} <span class="bed">mmHg</span></span></span></button>`
  ).join('') || `<div class="empty">${icon('search')}<strong>No matching sessions</strong><p>Try another name or reset your filters.</p><button id="reset-search">Show all patients</button></div>`}</div><div class="patient-note">Synthetic patients · Shared replay clock. Save imported sessions with the local backend to keep them after reload.</div></section>
  <div class="detail"><section class="panel">${profile(p, s)}</section><section class="panel"><div class="forecast-head"><h2 class="section-title">Pressure trajectory</h2><div class="legend"><span><i class="swatch"></i>Observed</span><span><i class="swatch dashed"></i>Forecast</span><span><i class="swatch band"></i>Sensitivity band</span></div></div><div class="chart-wrap">${chart(p, s, f)}</div><div class="forecast-foot">Patient-specific, 30-minute projection · Shading shows model sensitivity, not a calibrated confidence interval.</div>
  <div class="alert-strip ${f.status === 'stable' ? 'stable' : ''}"><div class="alert-main">${icon(f.status === 'stable' ? 'check' : 'alert')}<div><div class="alert-title">${!f.valid ? 'Reliable observations needed' : f.status === 'current-low' ? 'Latest estimate is below the reference threshold' : f.crossing !== null ? `Projected to cross 90 mmHg in ${Math.max(0, f.crossing - state.now)} minutes` : f.status === 'watch' ? 'Sensitivity band reaches the reference threshold' : 'No projected threshold crossing in this window'}</div><div class="alert-desc">${!f.valid ? 'Restore sensor quality to resume forecasting.' : 'Review observations and symptoms. All treatment decisions remain with the clinical team.'}</div></div></div><button id="review" ${!f.valid || reviewAt(state.events, state.selected, state.now) ? 'disabled' : ''}>${icon('check')} ${reviewAt(state.events, state.selected, state.now) ? 'Reviewed' : 'Mark reviewed'}</button></div></section>
  <div class="two-col"><section class="panel"><div class="panel-head"><h2 class="section-title">What shapes this forecast</h2>${icon('chart')}</div><div class="body"><div class="drivers">${s.valid ? s.drivers.map(d =>
    `<div class="driver"><span>${esc(d.label)}</span><b>${esc(d.value)}</b></div>`
  ).join('') : 'Awaiting valid observations.'}</div><div class="model-note">History sets the physiological prior. Sensor data updates the twin; prior episode count is context only.</div></div></section>
  <section class="panel"><div class="panel-head"><h2 class="section-title">One patient. Two data streams.</h2>${icon('database')}</div><div class="body"><div class="fusion"><div class="fusion-source">${icon('file')}<br>Historical record<small>Weight · refill · baseline BP</small></div><span class="fusion-plus">+</span><div class="fusion-source">${icon('pulse')}<br>Sensor stream<small>Pressure · pulse · blood volume</small></div></div><div class="fusion-result"><span>Continuously updated twin</span><b>${s.valid ? s.completeness + '% quality' : 'Withheld'}</b></div><div class="model-note">Cuff readings every 5 minutes; other synthetic sensors every minute.</div></div></section></div></div></div>${replay()}`;
}
