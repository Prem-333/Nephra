import { patients, generateSession, publicReadings } from '../../shared/engine/data.js';
import { parseSession } from '../../shared/engine/session.js';
import { restoreReviews } from '../../shared/engine/workspace.js';
import { estimate, forecast, handover } from '../../shared/engine/twin.js';

const defaults = patients.map(patient => ({ patient, readings: publicReadings(generateSession(patient)) }));
export function validateWorkspace(body) {
  if (!body || body.synthetic !== true || !Number.isInteger(body.revision) || body.revision < 0) throw Error('A synthetic workspace and non-negative revision are required.');
  if (!Array.isArray(body.sessions) || body.sessions.length > 20) throw Error('Save at most 20 imported synthetic sessions.');
  const sessions = body.sessions.map(parseSession);
  const ids = new Set(patients.map(p => p.id));
  for (const s of sessions) {
    if (ids.has(s.patient.id)) throw Error('Session IDs must be unique and cannot replace built-in patients.');
    ids.add(s.patient.id);
  }
  if (!Array.isArray(body.events) || body.events.length > 100) throw Error('Save at most 100 review markers.');
  const events = restoreReviews(body.events);
  if (events.length !== body.events.length) throw Error('Review markers contain invalid fields.');
  const all = new Map([...defaults, ...sessions].map(s => [s.patient.id, s]));
  const seen = new Set();
  for (const event of events) {
    const session = all.get(event.patient), key = `${event.patient}:${event.minute}`;
    if (!session || seen.has(key)) throw Error('Review markers must refer to a unique patient and replay minute.');
    const state = estimate(session.patient, session.readings, event.minute);
    const prediction = forecast(session.patient, state);
    if (!prediction.valid || event.action !== `Observed-rate forecast reviewed (${prediction.status})`) throw Error('Review marker does not match an available observed-rate forecast.');
    seen.add(key);
  }
  return { sessions, events };
}
export function calculate(saved, input) {
  if (!input || typeof input.patientId !== 'string') throw Error('Select a patient ID.');
  const session = [...defaults, ...saved.sessions].find(s => s.patient.id === input.patientId);
  if (!session) throw Object.assign(Error('Synthetic session not found.'), { status: 404, code: 'NOT_FOUND' });
  const state = estimate(session.patient, session.readings, input.minute);
  const prediction = forecast(session.patient, state);
  const scenario = input.uf === undefined ? null : forecast(session.patient, state, { uf: input.uf });
  return { synthetic: true, patientId: input.patientId, state, prediction, scenario, draft: handover(session.patient, state, prediction, saved.events) };
}
