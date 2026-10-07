import test from 'node:test';
import assert from 'node:assert/strict';
import {patients,generateSession,publicReadings,cohort} from '../dist/lib/data.js';
import {estimate,forecast,validateReadings,validatePatient,workload,handover} from '../dist/lib/twin.js';
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
