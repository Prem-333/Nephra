import { labels } from '../core/constants.js';

/** Render a coloured status pill badge. */
export function pill(f) {
  return `<span class="pill ${f.status}">${labels[f.status]}</span>`;
}
