import test from 'node:test';
import assert from 'node:assert/strict';
import {patients,generateSession,publicReadings,cohort} from '../shared/engine/data.js';
import {estimate,forecast,validateReadings,validatePatient,workload,handover} from '../shared/engine/twin.js';
const p=patients[0],rows=publicReadings(generateSession(p));
test('forecast is causal: future observations cannot affect a current forecast',()=>{
 const a=forecast(p,estimate(p,rows,120)),b=forecast(p,estimate(p,rows.filter(x=>x.minute<=120),120));assert.deepEqual(a,b);
 const changed=rows.map(x=>x.minute>120?{...x,sbp:200,rbv:100}:x);assert.deepEqual(a,forecast(p,estimate(p,changed,120)));
});
test('physiology personalisation changes projections with identical observations',()=>{
 const modified={...p,sensitivity:p.sensitivity*1.4};assert.notEqual(forecast(p,estimate(p,rows,120)).nadir,forecast(modified,estimate(modified,rows,120)).nadir);
});
test('scenario responds monotonically and preserves the observed history',()=>{
 const s=estimate(p,rows,120),copy=JSON.stringify(rows);const low=forecast(p,s,{uf:.4}),base=forecast(p,s),high=forecast(p,s,{uf:1.2});
 assert.ok(low.nadir>=base.nadir);assert.ok(base.nadir>=high.nadir);assert.ok(low.removed<base.removed);assert.equal(JSON.stringify(rows),copy);
});
test('unreliable, insufficient and stale observations suppress forecasts',()=>{
 for(const r of [rows.filter(x=>x.minute<90),rows.map(x=>x.minute>105?{...x,quality:'poor'}:x),rows.filter(x=>x.minute===120)]) {const f=forecast(p,estimate(p,r,120));assert.equal(f.valid,false);assert.equal(f.riskFraction,null);}
});
test('invalid sensor data and nonmonotonic timestamps are rejected',()=>{
 assert.throws(()=>validateReadings([{...rows[0],rbv:NaN}]));assert.throws(()=>validateReadings([rows[0],rows[0]]));assert.throws(()=>validateReadings([{...rows[0],uf:3}]));assert.throws(()=>validatePatient({...p,weight:-1}));
});
test('bounds on scenarios and horizons are enforced',()=>{const s=estimate(p,rows,120);assert.throws(()=>forecast(p,s,{uf:NaN}));assert.throws(()=>forecast(p,s,{horizon:300}));});
test('no future observations are exposed by state estimation',()=>{assert.ok(estimate(p,rows,120).observed.every(x=>x.minute<=120));});
test('synthetic cohort seeds are deterministic and separated',()=>{assert.deepEqual(cohort(2,123),cohort(2,123));assert.notDeepEqual(cohort(2,123),cohort(2,456));});
test('uncertainty grows and is finite across demo patients',()=>{for(const pt of patients){const s=estimate(pt,publicReadings(generateSession(pt)),120),f=forecast(pt,s);assert.ok(f.valid);assert.ok(f.points.every(x=>[x.sbp,x.low,x.high].every(Number.isFinite)&&x.low<=x.sbp&&x.sbp<=x.high));assert.ok(f.points.at(-1).high-f.points.at(-1).low>0);}});
test('workload target reports assumptions rather than measured performance',()=>{const w=workload();assert.equal(w.reduction,90);assert.equal(w.before,288);assert.equal(w.after,28.8);assert.throws(()=>workload({manual:0}));});
test('handover handles missing observations without inventing a forecast',()=>{const s=estimate(p,rows.filter(x=>x.minute<20),120);assert.match(handover(p,s,forecast(p,s)),/Forecast withheld/);});
test('current low pressure takes precedence over future warning',()=>{const low=rows.map(x=>x.sbp!==null?{...x,sbp:80}:x);assert.equal(forecast(p,estimate(p,low,120)).status,'current-low');});
test('baseline follows the latest dynamic removal rate rather than historical default',()=>{const changed=rows.map(x=>x.minute>=115?{...x,uf:.5}:x);const s=estimate(p,changed,120);assert.equal(forecast(p,s).uf,.5);});

test('refill and deficit use removed volume over the interval, not an instantaneous rate',()=>{
 const base=estimate(p,rows,120),changed=estimate(p,rows.map(x=>x.minute===120?{...x,uf:1.8}:x),120);
 assert.equal(changed.refill,base.refill);assert.equal(changed.deficit,base.deficit);
 assert.equal(forecast(p,changed).uf,1.8);
 assert.notEqual(forecast(p,changed).nadir,forecast(p,base).nadir);
});
test('constant blood volume implies observed refill equals interval-average removal',()=>{
 const constant=rows.map(x=>({...x,rbv:100,removed:x.minute/60,uf:x.minute===120?2:1}));
 const s=estimate(p,constant,120),expected=.65+.35*p.refill*Math.max(.28,1-2*.1/p.excess);
 assert.ok(Math.abs(s.refill-expected)<1e-10);
});
test('decreasing cumulative removal and invalid historical counts are rejected',()=>{
 assert.throws(()=>validateReadings([{...rows[0],removed:1},{...rows[1],removed:.5}]),/must not decrease/);
 for(const history of [-1,7,1.5,'3',null])assert.throws(()=>validatePatient({...p,history}),/history/);
});
test('fractional horizons are rejected instead of misreporting forecast duration',()=>{
 assert.throws(()=>forecast(p,estimate(p,rows,120),{horizon:5.5}),/whole-minute/);
});
test('every minute of all demo sessions supports bounded scenarios or explicit withholding',()=>{
 for(const patient of patients){const readings=publicReadings(generateSession(patient));
  for(let minute=0;minute<=240;minute++){
   const state=estimate(patient,readings,minute);
   for(const uf of [0,.62,2]){const prediction=forecast(patient,state,{uf});
    if(!state.valid){assert.equal(prediction.valid,false);continue;}
    assert.equal(prediction.points.length,31);assert.ok(Number.isFinite(prediction.nadir));
    assert.ok(prediction.points.every(point=>[point.sbp,point.low,point.high].every(Number.isFinite)));
   }
  }
 }
});
