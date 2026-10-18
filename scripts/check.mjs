import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
for(const dir of ['frontend/src','shared','backend/src','scripts'])for(const file of await files(dir)){
 if(!/\.(m?js)$/.test(file))continue;
 const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
const result=spawnSync(process.execPath,['--test',...await files('tests'),...await files('backend/tests')],{stdio:'inherit'});
process.exit(result.status||0);
