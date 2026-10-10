import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import {prisma} from '../src/lib/prisma.js';
import router from '../src/routes/empresaIndicadores.routes.js';
import reports from '../src/routes/siteRelatorios.routes.js';
import {authMiddleware} from '../src/middlewares/auth.middleware.js';
test('indicadores reais: acesso explícito, 24 meses, somas do banco e revogação imediata',{skip:process.env.RUN_SITE_DB_TESTS!=='1'},async()=>{
  assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
  const app=express();app.use('/empresa',router);app.use('/site-relatorios',reports);app.get('/pedidos',authMiddleware,(req,res)=>res.json({}));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const origin=`http://127.0.0.1:${server.address().port}`;let f,u;
  try{
    f=await prisma.funcionario.create({data:{nome:'Teste indicadores '+Date.now(),funcao:'VENDEDOR'}});u=await prisma.usuario.create({data:{email:`teste-empresa-${Date.now()}@example.invalid`,senha:'nao-e-credencial',funcionarioId:f.id,somenteSite:true,permissoesSite:[]}});
    const token=jwt.sign({id:u.id},process.env.JWT_SECRET),request=path=>fetch(origin+path,{headers:{Authorization:'Bearer '+token}});
    assert.equal((await fetch(origin+'/empresa/indicadores')).status,401);assert.equal((await request('/empresa/indicadores')).status,403);
    await prisma.usuario.update({where:{id:u.id},data:{permissoesSite:['RELATORIOS_EMPRESA']}});
    assert.equal((await request('/empresa/indicadores')).status,403);assert.equal((await request('/site-relatorios')).status,403);const resumo=await request('/site-relatorios/resumo');assert.equal(resumo.status,200);assert.equal(typeof (await resumo.json()).total,'number');await prisma.usuario.update({where:{id:u.id},data:{somenteSite:false}});const response=await request('/empresa/indicadores');assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);const data=await response.json();assert.equal(data.historico.length,24);
    assert.equal(Object.values(data.atual.pedidos).reduce((a,b)=>a+b,0),await prisma.pedido.count());
    const from=new Date(data.periodo.inicio+'T00:00:00-03:00'),to=new Date(data.atualizadoEm);assert.equal(data.historico.reduce((n,i)=>n+i.pedidos,0),await prisma.pedido.count({where:{dataPedido:{gte:from,lte:to}}}));
    assert.equal((await request('/pedidos')).status,200);
    const rel=await request('/site-relatorios?inicio='+data.periodo.inicio+'&fim='+data.periodo.fim);assert.equal(rel.status,200);const report=await rel.json();assert.ok(Array.isArray(report.rankingClientes));assert.ok(report.rankingClientes.length<=5);assert.ok(report.rankingClientes.every(i=>Number.isFinite(i.valor)&&Number.isInteger(i.pedidos)));
    await prisma.usuario.update({where:{id:u.id},data:{permissoesSite:[]}});assert.equal((await request('/empresa/indicadores')).status,403);
  }finally{if(u)await prisma.usuario.delete({where:{id:u.id}});if(f)await prisma.funcionario.delete({where:{id:f.id}});await new Promise(r=>server.close(r));await prisma.$disconnect();}
});
