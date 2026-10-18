/** Presentation helpers; no patient data is persisted here. */
export const pages=[['unit','grid','Live sessions'],['twin','users','Patient twin'],['scenarios','flask','Scenario lab'],['workflow','file','Review & handover'],['evidence','chart','Evidence & model']];
export function pageFromHash(hash){const id=hash.replace(/^#/,'');return pages.some(p=>p[0]===id)?id:null;}
export function rankSessions(rows,filter='all'){
 const rank={'current-low':0,review:1,watch:2,unavailable:3,stable:4};
 return rows.filter(x=>filter!=='priority'||['current-low','review','watch','unavailable'].includes(x.f.status)).sort((a,b)=>(rank[a.f.status]??5)-(rank[b.f.status]??5)||a.p.name.localeCompare(b.p.name));
}
export function reviewAt(events,patient,minute){return events.some(e=>e.patient===patient&&e.minute===minute&&e.action.startsWith('Observed-rate forecast reviewed'));}

// Local storage is an untrusted input, including when an older version wrote it.
export function restoreReviews(value){
 if(!Array.isArray(value))return [];
 return value.filter(e=>e&&typeof e.patient==='string'&&/^[-a-zA-Z0-9]{1,60}$/.test(e.patient)&&typeof e.time==='string'&&Number.isFinite(Date.parse(e.time))&&Number.isFinite(e.minute)&&e.minute>=0&&e.minute<=1440&&typeof e.action==='string'&&/^Observed-rate forecast reviewed \((current-low|review|watch|stable)\)$/.test(e.action)).slice(-100).map(({patient,minute,time,action})=>({patient,minute,time,action}));
}
export function pendingReviews(rows,events,minute){return rankSessions(rows,'priority').filter(r=>r.f.valid&&!reviewAt(events,r.p.id,minute));}
export function workloadInput(key,raw){
 if(!['patients','checks','manual','review'].includes(key)||String(raw).trim()==='')throw Error('Enter a number before continuing.');
 const value=Number(raw),count=['patients','checks'].includes(key);
 if(!Number.isFinite(value)||value<(key==='manual'?1:0)||value>10000||(count&&!Number.isInteger(value)))throw Error(count?'Patient and review-cycle counts must be whole numbers from 0 to 10,000.':'Enter seconds within the displayed bounds.');
 return value;
}
export function validateEvaluation(data){
 if(!data||data.model!=='nephra-state-space-1.1'||!Number.isInteger(data.patients)||data.patients<=0||!Number.isInteger(data.windows)||data.windows<=0||!Number.isInteger(data.eventWindows)||data.eventWindows<0||data.eventWindows>data.windows)throw Error('Invalid benchmark summary.');
 if(!data.methods||Array.isArray(data.methods)||Object.keys(data.methods).length!==3)throw Error('Invalid benchmark methods.');
 for(const name of ['Personalised twin','Recent linear trend','Last cuff carried forward']){
  const m=data.methods?.[name],c=m?.confusion;
  if(!m||!Number.isFinite(m.mae)||m.mae<0||!Number.isFinite(m.recall)||m.recall<0||m.recall>1||!c||!['tp','tn','fp','fn'].every(k=>Number.isInteger(c[k])&&c[k]>=0)||c.tp+c.tn+c.fp+c.fn!==data.windows||c.tp+c.fn!==data.eventWindows)throw Error('Invalid benchmark method.');
  if(c.tp+c.fn===0||Math.abs(m.recall-c.tp/(c.tp+c.fn))>1e-9)throw Error('Benchmark recall does not match its event counts.');
 }
 return data;
}
