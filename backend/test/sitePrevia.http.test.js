import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import {prisma} from '../src/lib/prisma.js';
import {siteAdminRoutes} from '../src/routes/site.routes.js';

test('prévia funciona com permissões independentes e site desativado, sem liberar escrita de configuração',async()=>{
  const backups=[],mock=(obj,key,fn)=>{backups.push(()=>{obj[key]=fn.original});fn.original=obj[key];obj[key]=fn};
  let permissoes=[],funcao='VENDEDOR',queries=0;
  const secret=process.env.JWT_SECRET;process.env.JWT_SECRET='teste-previa-local';
  mock(prisma.usuario,'findUnique',async()=>({somenteSite:true,permissoesSite:permissoes,funcionario:{id:'f',funcao,ativo:true}}));
  mock(prisma.configuracaoEmpresa,'findFirst',async()=>{queries++;return {nome:'Empresa',telefone:'',email:'',logoUrl:''}});
  mock(prisma.configuracaoSite,'findUnique',async()=>({ativo:false,conteudo:{tituloHome:'Título salvo'}}));
  for(const model of ['produtoSite','categoriaSite','paginaSite'])mock(prisma[model],'findMany',async args=>{assert.equal(args.where.ativo,true);return []});
  const app=express();app.use('/site',siteAdminRoutes);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const url=`http://127.0.0.1:${server.address().port}/site`,token=jwt.sign({id:'teste-previa'},process.env.JWT_SECRET);
  const request=(path,method='GET')=>fetch(url+path,{method,headers:{Authorization:'Bearer '+token}});
  try{
    assert.equal((await fetch(url+'/previa')).status,401);
    assert.equal((await request('/previa')).status,403);assert.equal(queries,0);
    for(const p of ['CONFIGURACAO_SITE','CONTEUDO','PROMOCOES']){
      permissoes=[p];const r=await request('/previa');assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);const data=await r.json();assert.equal(data.configuracao.ativo,false);assert.equal(data.configuracao.conteudo.tituloHome,'Título salvo');assert.deepEqual(data.paginas,[]);
    }
    permissoes=['CONTEUDO'];assert.equal((await request('/configuracao','PUT')).status,403);
    permissoes=['PROMOCOES'];assert.equal((await request('/conteudo','PUT')).status,403);
    permissoes=['CONFIGURACAO_SITE'];assert.equal((await request('/conteudo','PUT')).status,403);
    permissoes=[];assert.equal((await request('/previa')).status,403);
  }finally{backups.reverse().forEach(restore=>restore());if(secret===undefined)delete process.env.JWT_SECRET;else process.env.JWT_SECRET=secret;await new Promise(r=>server.close(r));await prisma.$disconnect()}
});
