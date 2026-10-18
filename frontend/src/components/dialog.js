import { icon } from '../core/icons.js';
import { labels } from '../core/constants.js';
import * as state from '../core/state.js';
import { navigate } from '../core/router.js';
import { pages } from '../../../shared/engine/workspace.js';
import { escapeHTML as esc } from '../../../shared/engine/session.js';

/** Pause replay (used before dialogs). */
let _pauseReplay = () => {};
export function initDialog(pauseFn) { _pauseReplay = pauseFn; }

/** Show a modal dialog with a title and HTML body. */
export function showDialog(title, body) {
  _pauseReplay();
  const dialog = document.getElementById('workspace-dialog');
  const opener = document.activeElement;
  dialog.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${title}</h2><button id="close-dialog" aria-label="Close dialog">×</button></div><div class="dialog-body">${body}</div>`;
  dialog.showModal();
  dialog.querySelector('#close-dialog').onclick = () => dialog.close();
  dialog.onclose = () => opener?.isConnected && opener.focus();
  dialog.onclick = (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    }
  };
  return dialog;
}

/** Open the workspace guide dialog. */
export function openGuide() {
  const dialog = showDialog('A clearer path through care', `<div class="guide-step"><span>01</span><div><h3>Understand the patient</h3><p>Choose a synthetic patient. Hover, tap or focus the numbered body signals to inspect their measurements and origins.</p></div></div><div class="guide-step"><span>02</span><div><h3>Explore what could change</h3><p>Move through session time or compare fluid-removal rates in Scenario lab. Every comparison starts from the same patient state.</p></div></div><div class="guide-step"><span>03</span><div><h3>Prepare the next review</h3><p>Open Review & handover to copy, print or export a draft. Review markers can be undone. Use Save workspace when the local backend is connected to keep them across reloads.</p></div></div><div class="notice">Synthetic research workspace. No real patient data, machine control or clinical decision automation.</div><button id="guide-start" class="primary">Explore patient twin</button><p class="dialog-hint">Ctrl / ⌘ K: find a patient or page · Esc: close dialog<br>Tab: move between controls · Arrow keys: adjust sliders</p>`);
  dialog.querySelector('#guide-start').onclick = () => { dialog.close(); navigate('twin'); };
}

/** Open the command palette (Ctrl+K). */
export function openCommand(choosePatientFn) {
  const dialog = showDialog('Find your next step', `<label class="sr-only" for="command-search">Search patients and pages</label><input class="dialog-search" id="command-search" placeholder="Search a patient or workspace…" autocomplete="off"><div class="command-list" id="command-results"></div><p class="dialog-hint">Enter opens the first result. Tab moves through results. Esc closes.</p>`);
  const input = dialog.querySelector('#command-search');
  const list = dialog.querySelector('#command-results');
  const update = () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML =
      pages.filter(p => p[2].toLowerCase().includes(q)).map(([id, i, label]) =>
        `<button data-command-view="${id}">${icon(i)}${label}<small>Workspace</small></button>`
      ).join('') +
      state.patients.filter(p => (p.name + ' ' + p.id).toLowerCase().includes(q)).map(p =>
        `<button data-command-patient="${esc(p.id)}">${icon('users')}${esc(p.name)}<small>${esc(p.id)}</small></button>`
      ).join('');
    if (!list.children.length)
      list.innerHTML = '<div class="empty"><strong>No results found</strong><p>Try a patient name, ID or page title.</p></div>';
    list.querySelectorAll('button').forEach(b => b.onclick = () => {
      dialog.close();
      if (b.dataset.commandPatient) { choosePatientFn(b.dataset.commandPatient); navigate('twin'); }
      else navigate(b.dataset.commandView);
    });
  };
  input.oninput = update;
  input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); list.querySelector('button')?.click(); } };
  update();
  input.focus();
}
