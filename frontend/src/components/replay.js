import { icon } from '../core/icons.js';
import * as state from '../core/state.js';
import { replayBounds } from '../../../shared/engine/session.js';
import { timeLabel } from '../utils/format.js';

/** Render the session replay controls bar. */
export function replay() {
  const { min, max } = replayBounds(state.streams[state.selected]);
  return `<div class="replay"><button id="play" aria-label="${state.playing ? 'Pause' : 'Play'} synthetic replay">${icon(state.playing ? 'pause' : 'play')}${state.playing ? 'Pause' : 'Replay'}</button><label for="timeline">Session time</label><input id="timeline" type="range" min="${min}" max="${max}" step="1" value="${state.now}" aria-label="Replay minute"><output id="timeline-value">${timeLabel(state.now)} / ${timeLabel(max)}</output><select id="speed" aria-label="Replay speed"><option value="2" ${state.speed === 2 ? 'selected' : ''}>2 min / sec</option><option value="5" ${state.speed === 5 ? 'selected' : ''}>5 min / sec</option></select><button id="quality" aria-pressed="${state.quality}" title="Simulate unreliable recent sensor observations">${icon('settings')}${state.quality ? 'Restore sensors' : 'Test dropout'}</button></div>`;
}
