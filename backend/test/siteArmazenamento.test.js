import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { obterArmazenamento, salvarCota, MIB, comTrava } from '../src/utils/siteArmazenamento.js';
import { salvarImagemSite } from '../src/utils/siteUpload.js';
test('cota persistente conta arquivos antigos, alerta e bloqueia sem gravar novo arquivo', async () => {
  const parent=path.resolve('node_modules/.cache'); await mkdir(parent,{recursive:true});
  const root=await mkdtemp(path.join(parent,'quota-test-'));
  try {
    assert.equal((await obterArmazenamento(root)).cotaBytes,1024*MIB);
    await salvarCota(root,1);
    await mkdir(path.join(root,'site','produtos'),{recursive:true});
    await writeFile(path.join(root,'site','produtos','antiga.png'),Buffer.alloc(MIB));
    const info=await obterArmazenamento(root);
    assert.equal(info.arquivos,1); assert.equal(info.usadoBytes,MIB); assert.equal(info.alerta,true); assert.equal(info.bloqueado,true);
    const input=await sharp({create:{width:10,height:10,channels:3,background:'red'}}).png().toBuffer();
    await assert.rejects(salvarImagemSite(input,'image/png','produtos',root),e=>e.status===413);
    assert.equal((await readdir(path.join(root,'site','produtos'))).length,1);
    await assert.rejects(salvarCota(root,0),e=>e.status===400);
    await salvarCota(root,2); assert.equal((await obterArmazenamento(root)).bloqueado,false);
    await comTrava(root,async()=> { await assert.rejects(salvarCota(root,3),e=>e.status===503); });
    await assert.rejects(salvarImagemSite(Buffer.from('invalid'),'image/png','produtos',root));
  } finally { await rm(root,{recursive:true,force:true}); }
});
test('banners limitam a 1920 pixels e arquivos corrompidos não são armazenados',async()=>{
  const parent=path.resolve('node_modules/.cache'); await mkdir(parent,{recursive:true});
  const root=await mkdtemp(path.join(parent,'quota-test-'));
  try {
    const input=await sharp({create:{width:2500,height:1000,channels:3,background:'green'}}).png().toBuffer();
    const result=await salvarImagemSite(input,'image/png','banners',root);
    const meta=await sharp(await readFile(path.join(root,result.url.replace('/api/uploads/','')))).metadata();
    assert.equal(meta.width,1920); assert.equal(meta.height,768);
    const corrupt=Buffer.from(input); corrupt.fill(0,40);
    await assert.rejects(salvarImagemSite(corrupt,'image/png','banners',root));
    assert.equal((await obterArmazenamento(root)).arquivos,1);
  } finally { await rm(root,{recursive:true,force:true}); }
});
