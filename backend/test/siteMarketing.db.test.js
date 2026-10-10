import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import {prisma} from '../src/lib/prisma.js';
import {marketingAdminRoutes,marketingPublicRoutes} from '../src/routes/marketingSite.routes.js';
test('banco local: CRUD, paginação, agendamento e isolamento de permissões', {skip:process.env.RUN_SITE_DB_TESTS!=='1'},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
 const marker=`teste-marketing-${Date.now()}`;let u,f,id;const app=express();app.use('/marketing-site',marketingAdminRoutes);app.use('/public',marketingPublicRoutes);app.get('/pedidos',(await import('../src/middlewares/auth.middleware.js')).authMiddleware,(req,res)=>res.json({}));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const origem=`http://127.0.0.1:${server.address().port}`;
 try{
 f=await prisma.funcionario.create({data:{nome:marker,funcao:'VENDEDOR'}});u=await prisma.usuario.create({data:{email:`${marker}@example.invalid`,senha:'nao-e-credencial',funcionarioId:f.id,somenteSite:true,permissoesSite:['PROMOCOES']}});const token=jwt.sign({id:u.id},process.env.JWT_SECRET);const request=(path,method='GET',body)=>fetch(origem+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await request('/marketing-site/paginas')).status,403);assert.equal((await request('/pedidos')).status,403);assert.equal((await request('/marketing-site/permissoes')).status,403);
 const base={titulo:marker,descricao:'Descrição de teste.',tipo:'PROMOCAO',status:'PUBLICADO',inicio:'2099-01-01',fim:'2099-02-01',destaque:true};let response=await request('/marketing-site/publicacoes','POST',base);assert.equal(response.status,201);const created=await response.json();id=created.id;
 response=await request('/marketing-site/publicacoes');const list=await response.json();assert.ok(list.total>=1);assert.ok(list.itens.length<=20);
 const config=await prisma.configuracaoSite.findUnique({where:{id:'principal'}});if(config?.ativo){const publicos=await fetch(origem+'/public/publicacoes').then(r=>r.json());assert.ok(!publicos.some(i=>i.id===id));}
 assert.equal((await request(`/marketing-site/publicacoes/${id}/instagram`,'POST',{autorizado:false})).status,400);
 assert.equal((await request(`/marketing-site/publicacoes/${id}`,'PUT',{...base,status:'RASCUNHO'})).status,200);assert.equal((await request(`/marketing-site/publicacoes/${id}`,'DELETE')).status,204);id=null;
 }finally{if(id)await prisma.publicacaoSite.delete({where:{id}});if(u)await prisma.usuario.delete({where:{id:u.id}});if(f)await prisma.funcionario.delete({where:{id:f.id}});await new Promise(r=>server.close(r));await prisma.$disconnect()}
});
