import { icon } from '../core/icons.js';
import { escapeHTML as esc } from '../../../shared/engine/session.js';

/** Render full region detail card. */
export function regionDetails(region) {
  return `<div class="signal-detail-top"><span class="signal-kind ${region.tone}">${esc(region.kind)}</span><span class="eyebrow">${esc(region.location)}</span></div><h2>${esc(region.name)}</h2><div class="signal-big ${region.tone}">${esc(region.value)}</div><p class="signal-explanation">${esc(region.description)}</p><dl class="signal-facts">${region.facts.map(([name, value]) =>
    `<div><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`
  ).join('')}</dl><div class="signal-boundary">${icon('shield')}<span>${esc(region.boundary)}</span></div>`;
}

/** Render compact region peek for mobile. */
export function regionPeek(region) {
  return `<div><span>${esc(region.name)}</span><strong class="${region.tone}">${esc(region.value)}</strong></div><a href="#body-detail" class="detail-jump">Full details ↓</a>`;
}
