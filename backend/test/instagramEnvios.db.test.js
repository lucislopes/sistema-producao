import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import {prisma} from '../src/lib/prisma.js';
import {marketingAdminRoutes} from '../src/routes/marketingSite.routes.js';
test('Feed e Stories independentes, idempotência e ausência de credenciais em respostas', {skip:process.env.RUN_SITE_DB_TESTS!=='1'},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
 const app=express();app.use('/marketing-site',marketingAdminRoutes);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const oldFetch=global.fetch,keys=['INSTAGRAM_ACCESS_TOKEN','INSTAGRAM_ACCOUNT_ID','SITE_PUBLIC_URL'],original=Object.fromEntries(keys.map(k=>[k,process.env[k]]));let f,u,p,calls=0;const marker=Date.now();
 try{
  process.env.INSTAGRAM_ACCESS_TOKEN='somente-teste-sem-publicacao';process.env.INSTAGRAM_ACCOUNT_ID='123';process.env.SITE_PUBLIC_URL='https://empresa.example';
  global.fetch=async(url,opts)=>{if(new URL(url).hostname!=='graph.instagram.com')return oldFetch(url,opts);calls++;return {ok:true,json:async()=>String(url).includes('media_publish')?{id:'publicado-'+calls}:opts.method==='GET'?{status_code:'FINISHED'}:{id:'container-'+calls}}};
  f=await prisma.funcionario.create({data:{nome:'Teste Instagram '+marker,funcao:'VENDEDOR'}});u=await prisma.usuario.create({data:{email:`teste-instagram-${marker}@example.invalid`,senha:'nao-e-credencial',funcionarioId:f.id,somenteSite:true,permissoesSite:['PROMOCOES']}});p=await prisma.publicacaoSite.create({data:{titulo:'Anúncio temporário',descricao:'Teste',arte:{}}});
  const token=jwt.sign({id:u.id},process.env.JWT_SECRET),origin=`http://127.0.0.1:${server.address().port}/marketing-site`,request=(path,body)=>fetch(origin+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  for(const formato of ['FEED','STORIES']){
    const body={autorizado:true,formato,imagemUrl:'/api/uploads/site/banners/12345678-1234-1234-1234-123456789abc.jpg'};
    let response=await request(`/publicacoes/${p.id}/instagram`,body);assert.equal(response.status,200);assert.equal((await response.json()).estado,'PROCESSANDO');
    response=await request(`/publicacoes/${p.id}/instagram`,body);assert.equal((await response.json()).estado,'PUBLICADO');
    const before=calls;await request(`/publicacoes/${p.id}/instagram`,body);assert.equal(calls,before);
  }
  const states=await request(`/publicacoes/${p.id}/instagram`).then(r=>r.json());assert.equal(states.envios.length,2);assert.ok(states.envios.every(i=>i.estado==='PUBLICADO'));
  const status=await request('/instagram').then(r=>r.json());assert.equal(status.token,undefined);assert.ok(!JSON.stringify(status).includes('somente-teste-sem-publicacao'));
  await prisma.usuario.update({where:{id:u.id},data:{permissoesSite:[]}});assert.equal((await request('/instagram/conectar',{})).status,403);
 }finally{global.fetch=oldFetch;for(const k of keys){if(original[k]===undefined)delete process.env[k];else process.env[k]=original[k]}if(p)await prisma.publicacaoSite.delete({where:{id:p.id}});if(u)await prisma.usuario.delete({where:{id:u.id}});if(f)await prisma.funcionario.delete({where:{id:f.id}});await new Promise(r=>server.close(r));await prisma.$disconnect()}
});
