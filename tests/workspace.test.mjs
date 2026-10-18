import test from 'node:test';
import assert from 'node:assert/strict';
import {pageFromHash,rankSessions,reviewAt} from '../shared/engine/workspace.js';
import {restoreReviews,pendingReviews,workloadInput,validateEvaluation} from '../shared/engine/workspace.js';
import {readFileSync} from 'node:fs';
test('only workspace routes are recognised; body anchors remain in-page links',()=>{
 assert.equal(pageFromHash('#scenarios'),'scenarios');assert.equal(pageFromHash('#body-detail'),null);assert.equal(pageFromHash('#unknown'),null);
});
test('attention queue prioritises low pressure, review, watch and unavailable data without mutating input',()=>{
 const rows=['stable','watch','current-low','unavailable','review'].map((status,i)=>({p:{name:'Patient '+i},f:{status}}));
 const original=rows.map(r=>r.f.status);
 assert.deepEqual(rankSessions(rows).map(r=>r.f.status),['current-low','review','watch','unavailable','stable']);
 assert.equal(rankSessions(rows,'priority').length,4);assert.deepEqual(rows.map(r=>r.f.status),original);
});
test('review state is specific to the patient and replay minute',()=>{
 const events=[{patient:'NP-001',minute:120,action:'Observed-rate forecast reviewed (review)'}];
 assert.equal(reviewAt(events,'NP-001',120),true);assert.equal(reviewAt(events,'NP-002',120),false);assert.equal(reviewAt(events,'NP-001',121),false);assert.equal(reviewAt([],'NP-001',120),false);
});
test('stored review history drops malformed, future-version and unbounded records',()=>{
 const good={patient:'NP-001',minute:120,time:'2026-10-17T10:00:00.000Z',action:'Observed-rate forecast reviewed (review)'};
 assert.deepEqual(restoreReviews([good,null,{...good,patient:undefined},{...good,minute:-1},{...good,minute:Infinity},{...good,time:'invalid'},{...good,action:'bad'},{...good,patient:'<script>'}]),[good]);
 assert.deepEqual(restoreReviews({}),[]);
 assert.equal(restoreReviews(Array(105).fill(good)).length,100);
});
test('pending queue skips reviewed and withheld forecasts and preserves priority',()=>{
 const rows=['stable','watch','current-low','unavailable','review'].map((status,i)=>({p:{name:'Patient '+i,id:'P-'+i},f:{valid:status!=='unavailable',status}}));
 const events=[{patient:'P-2',minute:120,action:'Observed-rate forecast reviewed (current-low)'}];
 assert.deepEqual(pendingReviews(rows,events,120).map(x=>x.p.id),['P-4','P-1']);
 assert.equal(pendingReviews(rows,events,121)[0].p.id,'P-2');
});
test('workload inputs reject blanks, fractional counts, negatives and nonfinite values',()=>{
 for(const raw of ['','  ','NaN','Infinity','-1','10001','1.5'])assert.throws(()=>workloadInput('patients',raw));
 assert.throws(()=>workloadInput('manual','0'));assert.throws(()=>workloadInput('unknown','1'));
 assert.equal(workloadInput('manual','90.5'),90.5);assert.equal(workloadInput('review','0'),0);assert.equal(workloadInput('patients','0'),0);
});
test('benchmark loader rejects malformed methods and inconsistent event totals',()=>{
 const e=JSON.parse(readFileSync(new URL('../frontend/public/data/evaluation.json',import.meta.url),'utf8'));
 assert.equal(validateEvaluation(e),e);
 for(const patch of [{methods:{}},{methods:{'Personalised twin':null}},{windows:e.windows+1},{eventWindows:-1},{patients:0},{model:'unknown'}])assert.throws(()=>validateEvaluation({...e,...patch}));
 const invalid=structuredClone(e);invalid.methods['Personalised twin'].recall=NaN;assert.throws(()=>validateEvaluation(invalid));
 const extra=structuredClone(e);extra.methods['Unexpected method']=null;assert.throws(()=>validateEvaluation(extra));
 const inconsistent=structuredClone(e);inconsistent.methods['Personalised twin'].recall=1;assert.throws(()=>validateEvaluation(inconsistent));
});
