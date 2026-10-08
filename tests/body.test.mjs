import test from 'node:test';
import assert from 'node:assert/strict';
import {bodySignals} from '../dist/lib/body.js';
import {patients,generateSession,publicReadings} from '../dist/lib/data.js';
import {estimate,forecast} from '../dist/lib/twin.js';
function signals(p=patients[0]){const s=estimate(p,publicReadings(generateSession(p)),120);return {s,f:forecast(p,s),body:bodySignals(p,s,forecast(p,s))};}
test('body illustration follows the selected record without inferring missing sex',()=>{assert.equal(signals().body.anatomy,'female');assert.equal(signals(patients[1]).body.anatomy,'male');const {s,f}=signals();assert.equal(bodySignals({...patients[0],sex:'unknown'},s,f).anatomy,'unspecified');});
test('body pressure colours follow the forecast rather than inventing organ scores',()=>{const {body,f}=signals();assert.equal(body.regions.find(x=>x.id==='pressure').tone,f.status==='review'?'review':'observed');assert.equal(body.regions.find(x=>x.id==='kidney').tone,'context');assert.equal(body.regions.find(x=>x.id==='unmeasured').tone,'unknown');});
test('dropout clears dynamic body values while retaining labelled historical context',()=>{const body=bodySignals(patients[0],{valid:false,reason:'Stale observations'},{valid:false});for(const id of ['pressure','circulation','fluid']){const region=body.regions.find(x=>x.id===id);assert.equal(region.tone,'unknown');assert.equal(region.facts.length,0);}assert.equal(body.regions.find(x=>x.id==='kidney').kind,'Historical context');});
test('anatomy selection cannot change measurements or model output',()=>{const {s,f}=signals();assert.deepEqual(bodySignals({...patients[0],sex:'M'},s,f).regions,bodySignals({...patients[0],sex:'F'},s,f).regions);});
