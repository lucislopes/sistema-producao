import test from 'node:test';
import assert from 'node:assert/strict';
import {consultarProducaoDiretoria} from '../src/utils/diretoriaProducao.js';
import {rotaSomenteSite} from '../src/utils/siteMarketing.js';
test('produção separa carga atual, pedidos distintos e tempos válidos no período',async()=>{
 const calls=[],responses=[[{id:'a',nome:'Ana',concluidos:3,pedidos:2,baseTempo:2,minutos:90,aguardando:4,executando:1,pedidosAtuais:3},{id:null,nome:'Sem operador atribuído',concluidos:1,pedidos:1,baseTempo:0,minutos:0,aguardando:2,executando:0,pedidosAtuais:1}],[]];
 const result=await consultarProducaoDiretoria({$queryRaw:async q=>{calls.push(q);return responses.shift()}},{dataInicio:'2026-10-01',dataFim:'2026-10-08'},new Date('2026-10-08T15:00:00Z'));
 assert.deepEqual(result.resumo,{concluidos:4,baseTempo:2,coberturaTempo:50,mediaMinutos:45,minutos:90,aguardando:6,executando:1});
 assert.match(calls[0].sql,/COUNT\(DISTINCT "pedidoId"\)/);assert.match(calls[0].sql,/"dataFim">="dataInicio"/);assert.match(calls[0].sql,/FULL JOIN/);assert.match(calls[1].sql,/p.status<>'CANCELADO'/);
});
test('produção sem base não inventa médias e exige permissão de relatórios',async()=>{
 const result=await consultarProducaoDiretoria({$queryRaw:async()=>[]},{dataInicio:'2026-10-01',dataFim:'2026-10-08'});assert.equal(result.resumo.mediaMinutos,null);assert.equal(result.resumo.coberturaTempo,null);
 assert.equal(rotaSomenteSite('/empresa/relatorios/diretoria/producao',['RELATORIOS_EMPRESA']),false);assert.equal(rotaSomenteSite('/empresa/relatorios/diretoria/producao',['CONTEUDO']),false);
});
