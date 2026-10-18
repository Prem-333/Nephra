import * as state from '../core/state.js';

/** Persist review events to localStorage with a fallback toast. */
export function persistEvents() {
  try {
    localStorage.setItem('nephra-reviews-v1', JSON.stringify(state.events));
  } catch {
    // Deferred import to avoid circular dependency at module load time.
    import('../components/toast.js').then(({ toast }) =>
      toast('Changes remain available for this session only.')
    );
  }
}

/** Save a review event and trim to the last 100 entries. */
export function saveEvent(action) {
  const events = [...state.events, {
    patient: state.selected,
    minute:  state.now,
    time:    new Date().toISOString(),
    action,
  }].slice(-100);
  state.setEvents(events);
  persistEvents();
}
