export const MODEL_VERSION='nephra-state-space-1.0';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const finite=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;

export function validatePatient(p) {
  for(const [key,a,b] of [['weight',30,200],['baselineSBP',80,220],['refill',0.1,1.5],['sensitivity',10,180],['uf',0,2],['excess',.5,8]])
    if(!finite(p?.[key],a,b)) throw new Error(`Invalid patient ${key}: expected ${a} to ${b}.`);
  if(typeof p.id!=='string'||!/^[-a-zA-Z0-9]{1,60}$/.test(p.id)) throw new Error('Patient ID must be 1-60 letters, digits or hyphens.');
  return p;
}
export function validateReadings(rows) {
  if(!Array.isArray(rows)||!rows.length||rows.length>1441) throw new Error('Supply 1-1441 chronological readings.');
  let last=-1;
  for(const x of rows) {
    if(!finite(x.minute,0,1440)||x.minute<=last) throw new Error('Reading minutes must be strictly increasing.');
    for(const [key,a,b] of [['uf',0,2],['rbv',30,110],['hr',30,220],['removed',0,15]]) if(!finite(x[key],a,b)) throw new Error(`Invalid sensor ${key}.`);
    if(x.sbp!==null&&!finite(x.sbp,40,240)) throw new Error('Invalid systolic blood pressure.');
    if(!['good','poor'].includes(x.quality)) throw new Error('Sensor quality must be good or poor.');
    last=x.minute;
  } return rows;
}
function regression(rows) {
  const n=rows.length, mx=rows.reduce((s,x)=>s+x.minute,0)/n,my=rows.reduce((s,x)=>s+x.sbp,0)/n;
  const denom=rows.reduce((s,x)=>s+(x.minute-mx)**2,0);
  const slope=denom?rows.reduce((s,x)=>s+(x.minute-mx)*(x.sbp-my),0)/denom:0;
  const rmse=Math.sqrt(rows.reduce((s,x)=>s+(x.sbp-my-slope*(x.minute-mx))**2,0)/n);
  return {slope,rmse};
}

/** Causal replay only: records after `now` are excluded before estimation.
 * Scalar Kalman correction of circulating-volume deficit using relative-blood-volume sensors;
 * historical refilling prior plus online sensor-derived refill; pressure trend fusion.
 * Bands and ensemble fractions are model sensitivity summaries, NOT calibrated CI/risk. */
export function estimate(p,readings,now) {
  validatePatient(p); validateReadings(readings);
  if(!finite(now,0,1440)) throw new Error('Invalid replay time.');
  const observed=readings.filter(x=>x.minute<=now), good=observed.filter(x=>x.quality==='good');
  const cuff=good.filter(x=>x.sbp!==null), recent=cuff.filter(x=>x.minute>=now-25);
  const last=good.at(-1),bp=cuff.at(-1);
  if(!last||!bp||recent.length<3||now-last.minute>3||now-bp.minute>10) return {valid:false,reason:'Insufficient or stale data. A recent cuff reading and at least three good readings in 25 minutes are required.',observed,now};
  const plasma=p.weight*.07; let deficit=0,variance=.04,previous=0;
  for(const row of good) {
    const dt=row.minute-previous;
    deficit+=(row.uf-p.refill*Math.max(.28,1-row.removed*.1/p.excess))*dt/60;
    variance+=.00015*dt;
    const measurement=plasma*(1-row.rbv/100), gain=variance/(variance+.0025);
    deficit+=gain*(measurement-deficit); variance=(1-gain)*variance; previous=row.minute;
  }
  const start=good.find(x=>x.minute>=now-20)||good[0];
  const refillObserved=last.minute>start.minute?last.uf-(start.rbv-last.rbv)*plasma/100*60/(last.minute-start.minute):p.refill;
  const refill=clamp(.65*refillObserved+.35*p.refill*Math.max(.28,1-last.removed*.1/p.excess),.05,1.5);
  const trend=regression(recent), slope=clamp(trend.slope,-1.8,.8);
  const sbp=bp.sbp+slope*(now-bp.minute);
  return {valid:true,now,observed,last,bp,sbp,deficit,variance,refill,slope,rmse:trend.rmse,plasma,
    completeness:Math.round(100*good.length/observed.length),cuffAge:now-bp.minute,
    drivers:[{label:'Pressure trend',value:`${(slope*10).toFixed(1)} mmHg / 10 min`},{label:'Estimated circulating-volume deficit',value:`${deficit.toFixed(2)} L`},{label:'Estimated refilling',value:`${refill.toFixed(2)} L/h`},{label:'Prior hypotensive sessions',value:`${p.history??'Unknown'} / last 6 (history only)`}]};
}
export function forecast(p,state,{uf=state.last?.uf??p.uf,horizon=30}={}) {
  if(!state.valid) return {valid:false,reason:state.reason,points:[],crossing:null,riskFraction:null,status:'unavailable'};
  if(!finite(uf,0,2)||!finite(horizon,5,60)) throw new Error('Scenario outside supported bounds.');
  let deficit=state.deficit; const points=[{minute:state.now,sbp:state.sbp,low:state.sbp,high:state.sbp}];
  for(let t=1;t<=horizon;t++) {
    const refill=state.refill*Math.exp(-t/(p.excess*600));
    deficit+=(uf-refill)/60;
    const physics=-p.sensitivity*(deficit-state.deficit);
    // Trend must also respond to the scenario UF change, not just historical UF.
    const trend=(state.slope-p.sensitivity*(uf-state.last.uf)/60)*t;
    const sbp=state.sbp+.7*physics+.3*trend;
    const spread=2.5+Math.sqrt(t)*.8+state.rmse*.6+Math.abs(physics-trend)*.2;
    points.push({minute:state.now+t,sbp,low:sbp-spread,high:sbp+spread});
  }
  const nadir=Math.min(...points.map(x=>x.sbp));
  // Deterministic 21-member sensitivity ensemble, deliberately not called probability.
  let crossings=0;
  for(let i=-10;i<=10;i++) if(points.some((x,j)=>j>0&&x.sbp+(i/10)*(x.high-x.sbp)<90)) crossings++;
  const crossing=points.find(x=>x.sbp<90)?.minute??null;
  const status=state.sbp<90?'current-low':crossing!==null?'review':points.some(x=>x.low<90)?'watch':'stable';
  return {valid:true,points,nadir,crossing,riskFraction:crossings/21,status,uf,horizon,removed:uf*horizon/60,version:MODEL_VERSION};
}
export function workload({patients=24,checks=8,manual=90,review=9}={}) {
  if(![patients,checks,manual,review].every(x=>finite(x,0,10000))||manual===0) throw new Error('Invalid workload assumptions.');
  const before=patients*checks*manual/60, after=patients*checks*review/60;
  return {before,after,saved:before-after,reduction:(1-review/manual)*100};
}
export function handover(p,s,f,events=[]) {
  if(!s.valid||!f.valid) return `NEPHRA | ${p.id}\nSYNTHETIC RESEARCH DEMO\nForecast withheld: ${s.reason}\nObtain valid observations and clinical review.\n`;
  return `NEPHRA | DIALYSIS REVIEW DRAFT\nSYNTHETIC RESEARCH DEMO - NOT A TREATMENT ORDER\nModel: ${MODEL_VERSION}\nPatient: ${p.name} (${p.id}) | replay minute ${s.now}\n\nOBSERVED\nLatest cuff: ${s.bp.sbp.toFixed(1)} mmHg at minute ${s.bp.minute}\nHeart rate: ${s.last.hr} bpm | Relative blood volume: ${s.last.rbv}%\nUF stream: ${s.last.uf.toFixed(2)} L/h | Removed: ${s.last.removed.toFixed(2)} L\n\nMODEL ESTIMATES\n30-minute predicted nadir: ${f.nadir.toFixed(1)} mmHg\nStatus: ${f.status}\nPredicted threshold crossing: ${f.crossing===null?'None in this window':`minute ${f.crossing}`}\nScenario ensemble below 90 mmHg: ${Math.round(f.riskFraction*100)}% (not clinical probability)\n${s.drivers.map(x=>`${x.label}: ${x.value}`).join('\n')}\n\nREVIEW\nVerify measurements and symptoms; follow the treating team's protocol.\nNo machine commands or treatment changes were sent.\nReviewer must check and sign this draft.\n\nLOCAL REVIEW HISTORY\n${events.filter(x=>x.patient===p.id).map(x=>`${x.time} | ${x.action} | minute ${x.minute}`).join('\n')||'No review recorded.'}\n`;
}

