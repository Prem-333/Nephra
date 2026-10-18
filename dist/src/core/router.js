import { pages } from '../../../shared/engine/workspace.js';
import * as state from './state.js';

/**
 * Navigate to a workspace page, update browser history, and re-render.
 * The `renderFn` is injected by the orchestrator to avoid circular imports.
 */
let _render = () => {};
let _stop   = () => {};

export function initRouter(renderFn, stopFn) {
  _render = renderFn;
  _stop   = stopFn;
}

export function navigate(target, push = true) {
  if (!pages.some((p) => p[0] === target)) return;
  _stop();
  state.setView(target);
  if (push) history.pushState(null, '', '#' + target);
  _render();
  document.getElementById('main').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

// Browser history listeners.
window.addEventListener('hashchange', () => {
  const target = pages.some((p) => p[0] === location.hash.replace(/^#/, ''))
    ? location.hash.replace(/^#/, '')
    : null;
  if (target && target !== state.view) navigate(target, false);
});

window.addEventListener('popstate', () => {
  const id = location.hash.replace(/^#/, '');
  const target = pages.some((p) => p[0] === id) ? id : null;
  if (target || !location.hash) navigate(target || 'unit', false);
});
