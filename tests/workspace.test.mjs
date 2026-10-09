import test from 'node:test';
import assert from 'node:assert/strict';
import {pageFromHash,rankSessions,reviewAt} from '../dist/lib/workspace.js';
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
