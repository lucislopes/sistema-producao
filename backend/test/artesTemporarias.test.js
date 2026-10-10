import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,utimes,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {limparArtesTemporarias} from '../src/utils/artesTemporarias.js';
test('somente artes JPEG expiradas são removidas após 30 dias; preserva fotos WebP e arquivos recentes',async()=>{const root=await mkdtemp(path.join(tmpdir(),'teste-artes-'));const dir=path.join(root,'site','banners');await mkdir(dir,{recursive:true});const antigo=path.join(dir,'12345678-1234-1234-1234-123456789abc.jpg'),foto=antigo.replace('.jpg','.webp'),recente=path.join(dir,'22345678-1234-1234-1234-123456789abc.jpg');try{await Promise.all([antigo,foto,recente].map(f=>writeFile(f,'teste')));const data=new Date(Date.now()-31*86400000);await utimes(antigo,data,data);await utimes(foto,data,data);assert.equal(await limparArtesTemporarias(root),1);await assert.rejects(access(antigo));await access(foto);await access(recente)}finally{assert.ok(root.startsWith(path.resolve(tmpdir())+path.sep));await rm(root,{recursive:true,force:true})}});
