import {validatePatient,validateReadings} from './twin.js';

export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const displayText=value=>String(value).replace(/[\r\n\t\u0000-\u001f]/g,' ').trim().slice(0,60);

export function parseSession(data) {
  if(!data||data.synthetic!==true)throw Error('Only explicitly synthetic demo sessions are accepted.');
  validatePatient(data.patient);validateReadings(data.readings);
  if(data.readings.at(-1).minute-data.readings[0].minute<30)throw Error('Supply at least 30 minutes of observations.');
  const p=data.patient,sex=typeof p.sex==='string'?p.sex.trim().toUpperCase():'';
  const patient={id:p.id,name:(typeof p.name==='string'?displayText(p.name):'')||p.id,age:Number.isFinite(p.age)&&p.age>=0&&p.age<=120?p.age:'Unknown',sex:['F','FEMALE'].includes(sex)?'F':['M','MALE'].includes(sex)?'M':'Unknown',bed:'IMP'};
  for(const key of ['weight','baselineSBP','refill','sensitivity','uf','excess','history'])if(p[key]!==undefined)patient[key]=p[key];
  const readings=data.readings.map(({minute,sbp,rbv,hr,uf,removed,quality})=>({minute,sbp,rbv,hr,uf,removed,quality}));
  return {patient,readings};
}

// Imports are separate sessions, so an ID collision cannot overwrite a demo or its review history.
export function uniqueImportId(id,ids) {
  const existing=new Set(ids);if(!existing.has(id))return id;
  for(let i=1;;i++){const suffix=`-IMP-${i}`,candidate=id.slice(0,60-suffix.length)+suffix;if(!existing.has(candidate))return candidate;}
}

export function replayBounds(readings) {
  return {min:readings[0].minute,max:readings.at(-1).minute};
}
export function clampReplayTime(readings,minute) {
  const {min,max}=replayBounds(readings);return Math.min(max,Math.max(min,minute));
}
export function nextReplayTime(readings,minute,speed) {
  const {max}=replayBounds(readings);const now=Math.min(max,minute+speed);return {now,finished:now>=max};
}
