import test from 'node:test';import assert from 'node:assert/strict';import 'dotenv/config';
import {prisma} from '../src/lib/prisma.js';import {consultarDiretoria,detalhesDiretoria,STATUS_CARTEIRA} from '../src/utils/diretoriaIndicadores.js';
test('PostgreSQL local: agregações e detalhes da diretoria conferem com a carteira sem alterar registros',{skip:process.env.RUN_SITE_DB_TESTS!=='1'},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));const agora=new Date(),query={dataInicio:'2026-01-01',dataFim:agora.toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})};
 try{const data=await consultarDiretoria(prisma,query,agora),total=await prisma.pedido.count({where:{status:{in:STATUS_CARTEIRA}}});assert.equal(data.carteira.resumo.pedidos,total);assert.equal(data.carteira.grupos.reduce((n,g)=>n+g.pedidos,0),total);assert.equal(data.carteira.grupos.reduce((n,g)=>n+g.valor,0),data.carteira.resumo.valor);assert.ok(data.entregas.noPrazo<=data.entregas.avaliados);assert.ok(data.entregas.avaliados<=data.entregas.entregues);
 const details=await detalhesDiretoria(prisma,{...query,filtro:'ATRASADOS'},agora);assert.equal(details.total,data.carteira.resumo.atrasados);assert.ok(details.itens.length<=20);for(const grupo of data.carteira.grupos){const detalhe=await detalhesDiretoria(prisma,{...query,status:grupo.status},agora);assert.equal(detalhe.total,grupo.pedidos)}
 for(const fila of data.filas){const detalhes=await detalhesDiretoria(prisma,{...query,servico:fila.id},agora);assert.equal(detalhes.total,fila.pedidos)}
 }finally{await prisma.$disconnect()}
});
