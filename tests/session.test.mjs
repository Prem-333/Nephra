import test from 'node:test';
import assert from 'node:assert/strict';
import {patients,generateSession,publicReadings} from '../shared/engine/data.js';
import {parseSession,uniqueImportId,replayBounds,clampReplayTime,nextReplayTime,escapeHTML} from '../shared/engine/session.js';
const patient=patients[0],readings=publicReadings(generateSession(patient));
const session={synthetic:true,patient,readings};

test('imported history cannot inject markup into the dashboard',()=>{
  assert.throws(()=>parseSession({...session,patient:{...patient,history:'<img src=x onerror=alert(1)>'}}),/history/);
  assert.equal(escapeHTML('<img title="x">&\''),'&lt;img title=&quot;x&quot;&gt;&amp;&#39;');
});
test('import requires actual elapsed coverage, not a large final timestamp',()=>{
  assert.throws(()=>parseSession({...session,readings:readings.slice(0,10).map(r=>({...r,minute:r.minute+300}))}),/30 minutes/);
  assert.throws(()=>parseSession(null),/synthetic/);
  assert.throws(()=>parseSession({...session,readings:[null]}),/reading/);
});
test('import strips hidden truth and unknown metadata and normalises display context',()=>{
  const result=parseSession({...session,patient:{...patient,sex:' female ',age:-1,name:'Demo\nName',unexpected:'unused'},readings:generateSession(patient)});
  assert.equal(result.patient.sex,'F');assert.equal(result.patient.age,'Unknown');assert.equal(result.patient.name,'Demo Name');
  assert.equal('unexpected' in result.patient,false);assert.equal('truth' in result.readings[0],false);
});
test('empty or non-text imported names fall back to the validated patient ID',()=>{
 for(const name of ['   ','\n\t',{},[],null])assert.equal(parseSession({...session,patient:{...patient,name}}).patient.name,patient.id);
});
test('duplicate imports receive distinct bounded IDs without overwriting reviewed sessions',()=>{
  assert.equal(uniqueImportId('NP-001',['NP-001','NP-001-IMP-1']),'NP-001-IMP-2');
  const long='A'.repeat(60);assert.equal(uniqueImportId(long,[long]).length,60);
});
test('late and short imported sessions use their own replay range',()=>{
  const late=readings.slice(0,61).map(r=>({...r,minute:r.minute+300}));
  assert.deepEqual(replayBounds(late),{min:300,max:360});assert.equal(clampReplayTime(late,120),300);
  assert.deepEqual(nextReplayTime(late,359,5),{now:360,finished:true});
  const short=readings.slice(0,31);assert.equal(clampReplayTime(short,120),30);
  assert.deepEqual(nextReplayTime(short,29,2),{now:30,finished:true});
  assert.deepEqual(nextReplayTime(readings,210,2),{now:212,finished:false});
});
