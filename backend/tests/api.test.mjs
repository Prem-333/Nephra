import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { createRepository } from '../src/repository.js';
import { patients, generateSession, publicReadings } from '../../shared/engine/data.js';
import { estimate, forecast } from '../../shared/engine/twin.js';

async function start(t,options={}) {
  const server=createApp(options);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const base=`http://127.0.0.1:${server.address().port}`;
  return {server,base,call:(route,options={})=>fetch(base+route,options)};
}
async function workspace(call){const response=await call('/api/workspace');assert.equal(response.status,200);return {cookie:response.headers.get('set-cookie').split(';')[0],data:await response.json()};}
const payload=(revision=0)=>({synthetic:true,revision,sessions:[],events:[]});
const put=(cookie,body,headers={})=>({method:'PUT',headers:{cookie,'content-type':'application/json',...headers},body:JSON.stringify(body)});

test('health, modular frontend and shared engine are served without exposing backend files',async t=>{
  const {call}=await start(t);
  assert.equal((await (await call('/api/health')).json()).persistence,'sqlite');
  for(const route of ['/','/src/app.js','/shared/engine/twin.js','/assets/body-female.png'])assert.equal((await call(route)).status,200,route);
  for(const route of ['/backend/src/app.js','/.env','/%2e%2e%5cpackage.json'])assert.ok([403,404].includes((await call(route)).status),route);
  assert.equal((await call('/',{method:'POST'})).status,405);
  assert.equal((await call('/',{method:'HEAD'})).headers.get('x-content-type-options'),'nosniff');
});
test('browser workspaces are isolated and use an HttpOnly SameSite cookie',async t=>{
  const {call}=await start(t);const first=await workspace(call),second=await workspace(call);
  assert.notEqual(first.cookie,second.cookie);
  assert.equal((await call('/api/workspace',put(first.cookie,payload()))).status,200);
  assert.equal((await (await call('/api/workspace',{headers:{cookie:first.cookie}})).json()).revision,1);
  assert.equal((await (await call('/api/workspace',{headers:{cookie:second.cookie}})).json()).revision,0);
  const cookie=(await call('/api/workspace')).headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
});
test('synthetic imports and valid reviews round-trip with unknown metadata stripped',async t=>{
  const {call}=await start(t),{cookie}=await workspace(call);
  const patient={...patients[0],id:'IMPORT-1',extra:'discard'},readings=publicReadings(generateSession(patients[0]));
  const status=forecast(patient,estimate(patient,readings,120)).status;
  const body={...payload(),sessions:[{synthetic:true,patient,readings}],events:[{patient:patient.id,minute:120,time:new Date().toISOString(),action:`Observed-rate forecast reviewed (${status})`}]};
  const response=await call('/api/workspace',put(cookie,body));assert.equal(response.status,200,await response.clone().text());
  const saved=await response.json();assert.equal(saved.sessions[0].patient.extra,undefined);assert.equal(saved.events.length,1);assert.equal(saved.revision,1);
});
test('stale and concurrent saves cannot overwrite a newer workspace',async t=>{
  const {call}=await start(t),{cookie}=await workspace(call);
  const responses=await Promise.all([call('/api/workspace',put(cookie,payload())),call('/api/workspace',put(cookie,payload()))]);
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  assert.equal((await (await call('/api/workspace',{headers:{cookie}})).json()).revision,1);
});
test('invalid payloads do not mutate the saved revision',async t=>{
  const {call}=await start(t),{cookie}=await workspace(call);
  for(const invalid of [{...payload(),synthetic:false},{...payload(),revision:-1},{...payload(),sessions:[null]},{...payload(),events:[{}]},{...payload(),sessions:Array(21).fill({})},{...payload(),events:[{patient:'MISSING',minute:120,time:new Date().toISOString(),action:'Observed-rate forecast reviewed (stable)'}]}]){
    assert.equal((await call('/api/workspace',put(cookie,invalid))).status,400);
  }
  assert.equal((await (await call('/api/workspace',{headers:{cookie}})).json()).revision,0);
});
test('cross-origin access, missing workspaces, malformed JSON and wrong content types fail explicitly',async t=>{
  const {call}=await start(t),{cookie}=await workspace(call);
  assert.equal((await call('/api/workspace',put('',payload()))).status,401);
  assert.equal((await call('/api/workspace',put(cookie,payload(),{origin:'https://other.example'}))).status,403);
  assert.equal((await call('/api/workspace',put(cookie,payload(),{'sec-fetch-site':'cross-site'}))).status,403);
  assert.equal((await call('/api/workspace',put(cookie,payload(),{'content-type':'text/plain'}))).status,415);
  const bad=await call('/api/workspace',{method:'PUT',headers:{cookie,'content-type':'application/json'},body:'{' });assert.equal(bad.status,400);assert.ok((await bad.json()).requestId);
});
test('oversized bodies are rejected with a bounded error response',async t=>{
  const {call}=await start(t),{cookie}=await workspace(call);
  const response=await call('/api/workspace',{method:'PUT',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({padding:'x'.repeat(8*1024*1024)})});assert.equal(response.status,413);
});
test('server and browser engine produce the same forecast and scenario',async t=>{
  const {call}=await start(t),{cookie}=await workspace(call);
  const input={patientId:'NP-001',minute:120,uf:.4};
  const response=await call('/api/forecast',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify(input)});assert.equal(response.status,200);
  const result=await response.json(),patient=patients[0],state=estimate(patient,publicReadings(generateSession(patient)),120);
  assert.deepEqual(result.prediction,forecast(patient,state));assert.deepEqual(result.scenario,forecast(patient,state,{uf:.4}));
  const bad=await call('/api/forecast',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({...input,uf:3})});assert.equal(bad.status,400);
});
test('saved workspaces survive closing and reopening the SQLite connection',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'nephra-db-'));const filename=path.join(dir,'test.sqlite');
  let db;
  try{db=createRepository(filename);const id=db.create();db.save(id,0,[],[]);db.close();db=createRepository(filename);assert.equal(db.get(id).revision,1);}
  finally{db?.close();assert.equal(path.dirname(path.resolve(dir)),path.resolve(tmpdir()));assert.ok(path.basename(dir).startsWith('nephra-'));await rm(dir,{recursive:true,force:true});}
});
