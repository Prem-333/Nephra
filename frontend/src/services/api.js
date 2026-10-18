import * as state from '../core/state.js';
import { patients as defaults } from '../../../shared/engine/data.js';

export const backend = { connected:false, revision:0, status:'Browser demo', saving:false };
async function request(url, options={}) {
  const response = await fetch(url,{...options,credentials:'same-origin',signal:AbortSignal.timeout(8000)});
  if (!(response.headers.get('content-type') || '').includes('application/json')) throw Error('The research API is unavailable.');
  const body = await response.json();
  if (!response.ok) throw Error(body.error?.message || 'The research API is unavailable.');
  return body;
}
export async function connectBackend() {
  try {
    const response = await fetch('/api/workspace',{credentials:'same-origin',signal:AbortSignal.timeout(1800)});
    if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) return;
    const saved = await response.json();
    if (saved.synthetic !== true || !Number.isInteger(saved.revision) || !Array.isArray(saved.sessions) || !Array.isArray(saved.events)) return;
    backend.connected = true;backend.revision = saved.revision;backend.status='Local backend connected';
    for (const session of saved.sessions) {
      state.setPatients([...state.patients,session.patient]);state.streams[session.patient.id]=session.readings;
    }
    state.setEvents(saved.events);
  } catch { /* The published static demo remains fully usable without the local API. */ }
}
/** Explicit, transactional save. Failure leaves the user's in-memory work intact. */
export async function saveWorkspace() {
  if (!backend.connected || backend.saving) return;
  backend.saving=true;backend.status='Saving workspace…';
  const builtin = new Set(defaults.map(p=>p.id));
  const snapshot = {
    synthetic:true, revision:backend.revision,
    sessions:state.patients.filter(p=>!builtin.has(p.id)).map(patient=>({synthetic:true,patient,readings:state.streams[patient.id]})),
    events:structuredClone(state.events)
  };
  try {
    const saved=await request('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(snapshot)});
    backend.revision=saved.revision;backend.status='Workspace saved';
    return saved;
  } catch(error) {backend.status='Save needs attention';throw error;}
  finally {backend.saving=false;}
}
