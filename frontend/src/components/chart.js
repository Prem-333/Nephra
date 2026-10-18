import { icon } from '../core/icons.js';
import { escapeHTML as esc } from '../../../shared/engine/session.js';

/** Render the SVG pressure chart with observed + forecast lines. */
export function chart(p, s, f, alternative = null) {
  const now = s.now;
  if (!s.valid) return `<div class="error-box">${icon('shield')} <strong>Forecast withheld</strong><br>${esc(s.reason)}</div>`;

  const W = 820, H = 245, left = 43, right = 20, top = 25, bottom = 34;
  const minT = Math.max(0, now - 60), maxT = now + 30;
  const observed = s.observed.filter(x => x.minute >= minT && x.sbp !== null && x.quality === 'good');
  const values = [...observed.map(x => x.sbp), ...f.points.flatMap(x => [x.low, x.high]), ...(alternative?.points ?? []).flatMap(x => [x.low, x.high])];
  const minY = Math.floor(Math.min(80, ...values) / 10) * 10;
  const maxY = Math.ceil(Math.max(140, ...values) / 10) * 10;
  const x = v => left + (v - minT) / (maxT - minT) * (W - left - right);
  const y = v => top + (maxY - v) / (maxY - minY) * (H - top - bottom);
  const path = points => points.map((v, i) => `${i ? 'L' : 'M'}${x(v.minute).toFixed(1)},${y(v.sbp).toFixed(1)}`).join(' ');
  const band = f.points.map(v => `${x(v.minute)},${y(v.high)}`).concat([...f.points].reverse().map(v => `${x(v.minute)},${y(v.low)}`)).join(' ');

  let grid = '';
  for (let a = minY; a <= maxY; a += 20)
    grid += `<line x1="${left}" y1="${y(a)}" x2="${W - right}" y2="${y(a)}" stroke="#e7eeeb"/><text x="${left - 10}" y="${y(a) + 4}" text-anchor="end" fill="#7f928e" font-size="11">${a}</text>`;
  for (let t = minT; t <= maxT; t += 15)
    grid += `<text x="${x(t)}" y="${H - 10}" text-anchor="middle" fill="#7f928e" font-size="11">${t} min</text>`;

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Systolic blood pressure: observed history and 30-minute simulated forecast. Current estimate ${s.sbp.toFixed(0)}, predicted nadir ${f.nadir.toFixed(0)} millimetres of mercury.">
  <rect x="${x(now)}" y="${top}" width="${x(maxT) - x(now)}" height="${H - top - bottom}" fill="#f5faf7"/>${grid}
  <line x1="${left}" y1="${y(90)}" x2="${W - right}" y2="${y(90)}" stroke="#d4a777" stroke-dasharray="5 5"/><text x="${left + 7}" y="${y(90) - 7}" fill="#ae7544" font-size="11">90 mmHg reference</text>
  <polygon points="${band}" fill="#cae8dc" opacity=".6"/><path d="${path(observed)}" fill="none" stroke="#19877d" stroke-width="2.5"/><path d="${path(f.points)}" fill="none" stroke="#19877d" stroke-width="2.5" stroke-dasharray="6 5"/>
  ${alternative ? `<path d="${path(alternative.points)}" fill="none" stroke="#8372b3" stroke-width="2.5"/>` : ''}
  <line x1="${x(now)}" y1="${top}" x2="${x(now)}" y2="${H - bottom}" stroke="#b2c7bc" stroke-dasharray="3 4"/><circle cx="${x(now)}" cy="${y(s.sbp)}" r="4.5" fill="#19877d" stroke="white" stroke-width="2"/><text x="${x(now) + 8}" y="17" fill="#749487" font-size="11">NOW · ${now} MIN</text><text x="4" y="13" fill="#819990" font-size="10">mmHg</text></svg>`;
}
