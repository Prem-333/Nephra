import * as state from '../core/state.js';

/** Render an expandable table of forecast values at 5-minute intervals. */
export function forecastTable(f) {
  if (!f.valid) return '';
  return `<details class="chart-explorer" ${state.expandedForecast ? 'open' : ''}><summary>Explore forecast values · 5-minute intervals</summary><div class="table-wrap"><table class="table"><caption class="sr-only">Simulated pressure and heuristic sensitivity limits</caption><thead><tr><th>Minute</th><th>SBP</th><th>Sensitivity range</th></tr></thead><tbody>${f.points.filter((p, i) => i % 5 === 0).map(p =>
    `<tr><td>${p.minute}</td><td>${p.sbp.toFixed(1)} mmHg</td><td>${p.low.toFixed(1)}–${p.high.toFixed(1)} mmHg</td></tr>`
  ).join('')}</tbody></table></div></details>`;
}
