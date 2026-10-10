import {opendir,stat,unlink} from 'node:fs/promises';
import path from 'node:path';
import {uploadRoot} from './siteUpload.js';
import {comTrava} from './siteArmazenamento.js';
export async function limparArtesTemporarias(root=uploadRoot(),agora=Date.now()){
 return comTrava(root,async()=>{const directory=path.resolve(root,'site','banners');let dir;try{dir=await opendir(directory)}catch(e){if(e.code==='ENOENT')return 0;throw e}let removed=0;for await(const entry of dir){if(!entry.isFile()||! /^[a-f0-9-]{36}\.jpg$/.test(entry.name))continue;const file=path.resolve(directory,entry.name);if(path.dirname(file)!==directory)continue;const info=await stat(file);if(agora-info.mtimeMs>=30*86400000){await unlink(file);removed++;if(removed>=200)break}}return removed});
}
export function iniciarLimpezaArtes(){const limpar=()=>limparArtesTemporarias().catch(e=>{if(e.status!==503)console.error('Falha na limpeza das artes temporárias.')});limpar();const timer=setInterval(limpar,3600000);timer.unref();}
