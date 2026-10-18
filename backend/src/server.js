import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('PORT must be an integer from 1 to 65535.');
const database = process.env.NEPHRA_DB || fileURLToPath(new URL('../data/nephra.sqlite',import.meta.url));
const server = createApp({database});
server.listen(port,'127.0.0.1',()=>console.log(`NEPHRA frontend + API: http://127.0.0.1:${port}`));
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.close(()=>process.exit(0)));
