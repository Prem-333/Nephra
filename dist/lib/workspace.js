/** Presentation helpers; no patient data is persisted here. */
export const pages=[['unit','grid','Live sessions'],['twin','users','Patient twin'],['scenarios','flask','Scenario lab'],['workflow','file','Review & handover'],['evidence','chart','Evidence & model']];
export function pageFromHash(hash){const id=hash.replace(/^#/,'');return pages.some(p=>p[0]===id)?id:null;}
export function rankSessions(rows,filter='all'){
 const rank={'current-low':0,review:1,watch:2,unavailable:3,stable:4};
 return rows.filter(x=>filter!=='priority'||['current-low','review','watch','unavailable'].includes(x.f.status)).sort((a,b)=>(rank[a.f.status]??5)-(rank[b.f.status]??5)||a.p.name.localeCompare(b.p.name));
}
export function reviewAt(events,patient,minute){return events.some(e=>e.patient===patient&&e.minute===minute&&e.action.startsWith('Observed-rate forecast reviewed'));}
