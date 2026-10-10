import test from 'node:test';import assert from 'node:assert/strict';import 'dotenv/config';
import {prisma} from '../src/lib/prisma.js';import {consultarProducaoDiretoria} from '../src/utils/diretoriaProducao.js';import {datasDiretoria,STATUS_CARTEIRA} from '../src/utils/diretoriaIndicadores.js';
test('produção local confere serviços e tempos com registros sem alterar dados',{skip:process.env.RUN_SITE_DB_TESTS!=='1'},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
 try{const agora=new Date(),query={dataInicio:'2026-01-01',dataFim:agora.toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})},d=datasDiretoria(query,agora),result=await consultarProducaoDiretoria(prisma,query,agora);
 const rows=await prisma.servicoPlano.findMany({where:{status:'CONCLUIDO',dataFim:{gte:d.from,lte:d.to},plano:{pedido:{status:{not:'CANCELADO'}}}},select:{dataInicio:true,dataFim:true}}),valid=rows.filter(s=>s.dataInicio&&s.dataFim>=s.dataInicio);
 assert.equal(result.resumo.concluidos,rows.length);assert.equal(result.resumo.baseTempo,valid.length);assert.equal(result.servicos.reduce((n,s)=>n+s.concluidos,0),rows.length);
 const minutes=valid.reduce((n,s)=>n+(s.dataFim-s.dataInicio)/60000,0);assert.ok(Math.abs(result.resumo.minutos-minutes)<.001);
 const pending=await prisma.servicoPlano.count({where:{status:{in:['ABERTO','INICIADO']},plano:{pedido:{status:{in:STATUS_CARTEIRA}}}}});assert.equal(result.resumo.aguardando+result.resumo.executando,pending);
 }finally{await prisma.$disconnect()}
});
