import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createRepository } from './repository.js';
import { validateWorkspace, calculate } from './service.js';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf','.md':'text/markdown; charset=utf-8' };
const fail = (status, code, message) => Object.assign(Error(message), { status, code });
function validated(fn) { try { return fn(); } catch (error) { if (!error.status) { error.status=400; error.code='VALIDATION'; } throw error; } }
async function jsonBody(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw fail(415, 'CONTENT_TYPE', 'Send application/json.');
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8 * 1024 * 1024) throw fail(413, 'BODY_TOO_LARGE', 'Workspace payload exceeds 8 MB.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw fail(400, 'INVALID_JSON', 'The request body is not valid JSON.'); }
}
export function createApp({ database = ':memory:', frontend = path.join(root,'frontend'), shared = path.join(root,'shared') } = {}) {
  const repository = createRepository(database);
  const server = http.createServer(async (req, res) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Cache-Control','no-store');
    const send = (status, body) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body)); };
    try {
      const host = req.headers.host || '';
      const port = server.address()?.port;
      if (![ `localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`, process.env.RENDER_EXTERNAL_HOSTNAME ].includes(host)) throw fail(403,'HOST_DENIED','This research backend accepts loopback hosts only.');
      const origin = req.headers.origin;
const allowedOrigins = [
  `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`,
  `http://${host}`
];

if (
  (origin && !allowedOrigins.includes(origin)) ||
  req.headers['sec-fetch-site'] === 'cross-site' &&
  (!origin || !allowedOrigins.includes(origin))
) {
  throw fail(403, 'ORIGIN_DENIED', 'Cross-origin requests are not allowed.');
}      const url = new URL(req.url, `http://${host}`);
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname === '/api/health' && req.method === 'GET') return send(200,{status:'ok',version:'1.4.0',syntheticOnly:true,persistence:'sqlite'});
        let id = /(?:^|;\s*)nephra_workspace=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
        let saved = id ? repository.get(id) : null;
        if (url.pathname === '/api/workspace' && req.method === 'GET') {
          if (!saved) {
            id = repository.create(); saved = repository.get(id);
            res.setHeader('Set-Cookie',`nephra_workspace=${id}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=2592000`);
          }
          return send(200,{synthetic:true,...saved});
        }
        if (!saved) throw fail(401,'WORKSPACE_REQUIRED','Open the workspace before saving or calculating.');
        if (url.pathname === '/api/workspace' && req.method === 'PUT') {
          const input = await jsonBody(req), clean = validated(()=>validateWorkspace(input));
          return send(200,{synthetic:true,...repository.save(id,input.revision,clean.sessions,clean.events)});
        }
        if (url.pathname === '/api/forecast' && req.method === 'POST') { const input=await jsonBody(req);return send(200,validated(()=>calculate(saved,input))); }
        if (url.pathname === '/api/evaluation' && req.method === 'GET') return send(200,JSON.parse(await readFile(path.join(frontend,'public/data/evaluation.json'),'utf8')));
        throw fail(404,'NOT_FOUND','API endpoint not found.');
      }
      if (!['GET','HEAD'].includes(req.method)) throw fail(405,'METHOD_NOT_ALLOWED','Use GET or HEAD for frontend assets.');
      let pathname;
      try { pathname = decodeURIComponent(url.pathname); } catch { throw fail(400,'BAD_PATH','Invalid URL path.'); }
      if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(x=>x.startsWith('.'))) throw fail(403,'PATH_DENIED','Path is not accessible.');
      const base = pathname.startsWith('/shared/') ? shared : pathname.startsWith('/src/') || pathname === '/' ? frontend : path.join(frontend,'public');
      const rel = pathname.startsWith('/shared/') ? pathname.slice(8) : pathname === '/' ? 'index.html' : pathname.slice(1);
      const resolvedBase = await realpath(base), target = await realpath(path.resolve(base,rel));
      if (!target.startsWith(resolvedBase + path.sep)) throw fail(403,'PATH_DENIED','Path is not accessible.');
      const data = await readFile(target);
      res.writeHead(200,{'Content-Type':mime[path.extname(target)] || 'application/octet-stream','Content-Length':data.length});
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      if (res.headersSent) { res.end(); return; }
      const status = error.status || (error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500);
      send(status,{error:{code:error.status?error.code:status===404?'NOT_FOUND':'INTERNAL_ERROR',message:status===500?'The server could not complete this request.':status===404?'Resource not found.':error.message},requestId});
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.on('close',()=>repository.close());
  return server;
}
