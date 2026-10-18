import { icon } from '../core/icons.js';
import * as state from '../core/state.js';
import { pages } from '../../../shared/engine/workspace.js';

/** Render the page header with title, subtitle, and optional action buttons. */
export function header(title, subtitle, actions = '') {
  document.title = `${title} · NEPHRA`;
  return `<div class="pagehead"><div><div class="page-kicker">NEPHRA / ${
    state.view === 'unit' ? 'Unit overview' :
    state.view === 'twin' ? 'Patient intelligence' :
    state.view === 'scenarios' ? 'Explore possibilities' :
    state.view === 'workflow' ? 'Connected workflow' :
    'Evidence & development'
  }</div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><div class="actions">${actions}</div></div>`;
}
