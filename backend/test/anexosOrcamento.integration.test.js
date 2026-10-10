import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, readdir, readFile, open, unlink, rmdir } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/lib/prisma.js';
import { comercialPublicRoutes,comercialAdminRoutes } from '../src/routes/comercialSite.routes.js';
import { limparAnexos,raizAnexos,caminhoAnexo,QUOTA_ANEXOS } from '../src/utils/anexosOrcamento.js';

test('local: anexos privados, idempotentes, limitados e excluídos após 30 dias',{skip:process.env.RUN_SITE_DB_TESTS!=='1'},async()=>{
  assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
  const originalRoot=process.env.UPLOAD_DIR;await mkdir('node_modules/.cache',{recursive:true});
  const root=await mkdtemp(path.resolve('node_modules/.cache/anexos-test-'));process.env.UPLOAD_DIR=root;
  const admin=await prisma.usuario.findFirst({where:{funcionario:{funcao:'ADMIN',ativo:true}}});
  const adminToken=jwt.sign({id:admin.id},process.env.JWT_SECRET,{expiresIn:'5m'});
  const app=express();app.use('/public',comercialPublicRoutes);app.use('/admin',comercialAdminRoutes);
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}`;let q;
  const pdf=Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');
  try {
    const response=await fetch(base+'/public/orcamentos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chave:randomUUID(),nome:'Teste descartável de anexos',telefone:'61995822399',observacao:'Projeto de teste',linkProjeto:'https://example.com/projeto'})});
    const receipt=await response.json();assert.equal(response.status,201,JSON.stringify(receipt));q=receipt.id;
    const upload=(body=pdf,token=receipt.tokenAnexos)=>fetch(`${base}/public/orcamentos/${q}/anexos`,{method:'POST',headers:{'Content-Type':'application/pdf','X-Upload-Token':token,'X-File-Name':'teste.pdf'},body});
    assert.equal((await upload(pdf,'invalido')).status,401);
    const firstResponse=await upload();const first=await firstResponse.json();assert.equal(firstResponse.status,201,JSON.stringify(first));
    assert.equal((await (await upload()).json()).id,first.id);
    assert.ok(new Date(first.expiraEm)>new Date(Date.now()+29*86400000));
    assert.equal((await fetch(`${base}/admin/anexos/${first.id}`)).status,401);
    const download=await fetch(`${base}/admin/anexos/${first.id}`,{headers:{Authorization:`Bearer ${adminToken}`}});
    assert.equal(download.status,200);assert.match(download.headers.get('content-disposition'),/^attachment/);
    assert.equal(download.headers.get('cache-control'),'private, no-store');assert.deepEqual(Buffer.from(await download.arrayBuffer()),pdf);
    await upload(Buffer.from(pdf.toString().replace('1 0','2 0')));await upload(Buffer.from(pdf.toString().replace('1 0','3 0')));
    assert.equal((await upload(Buffer.from(pdf.toString().replace('1 0','4 0')))).status,400);
    const active=await prisma.anexoOrcamentoSite.findMany({where:{orcamentoId:q}});assert.equal(active.length,3);
    await prisma.anexoOrcamentoSite.update({where:{id:first.id},data:{expiraEm:new Date(Date.now()-1000)}});
    assert.equal((await fetch(`${base}/admin/anexos/${first.id}`,{headers:{Authorization:`Bearer ${adminToken}`}})).status,410);
    await limparAnexos(prisma,new Date(),raizAnexos(),{orcamentoId:q});
    assert.ok(await prisma.orcamentoSite.findUnique({where:{id:q}}));
    assert.ok((await prisma.anexoOrcamentoSite.findUnique({where:{id:first.id}})).removidoEm);
    assert.ok(!((await readdir(raizAnexos())).includes(active.find(a=>a.id===first.id).arquivo)));
    assert.equal((await readdir(raizAnexos())).length,2);
    // Ocupação inclui arquivos órfãos, para que reinícios não contornem a cota.
    const quotaFile=caminhoAnexo(`${randomUUID()}.pdf`);const handle=await open(quotaFile,'wx');await handle.truncate(QUOTA_ANEXOS);await handle.close();
    const other=await prisma.orcamentoSite.create({data:{chave:randomUUID(),nome:'Teste cota',telefone:'61995822399',detalhes:{}}});
    const {tokenAnexos}=await import('../src/utils/anexosOrcamento.js');
    try{const blocked=await fetch(`${base}/public/orcamentos/${other.id}/anexos`,{method:'POST',headers:{'Content-Type':'application/pdf','X-Upload-Token':tokenAnexos(other.chave)},body:pdf});assert.equal(blocked.status,507);}finally{await prisma.orcamentoSite.delete({where:{id:other.id}});}
  } finally {
    if(q)await prisma.orcamentoSite.delete({where:{id:q}});
    const dir=path.join(root,'anexos-orcamentos');for(const file of await readdir(dir).catch(()=>[]))await unlink(caminhoAnexo(file,dir));
    await rmdir(dir).catch(()=>{});await rmdir(root);
    if(originalRoot===undefined)delete process.env.UPLOAD_DIR;else process.env.UPLOAD_DIR=originalRoot;
    await new Promise(r=>server.close(r));await prisma.$disconnect();
  }
});
