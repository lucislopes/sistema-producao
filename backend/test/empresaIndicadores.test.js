import test from 'node:test';
import assert from 'node:assert/strict';
import {mesesHistorico,preencherHistorico} from '../src/utils/empresaIndicadores.js';
import {rotaSomenteSite} from '../src/utils/siteMarketing.js';
test('histórico inclui exatamente 24 meses, inclusive virada de ano no fuso de Brasília',()=>{
  const meses=mesesHistorico(new Date('2026-01-01T01:00:00Z'));
  assert.equal(meses.length,24);assert.equal(meses[0],'2024-01');assert.equal(meses.at(-1),'2025-12');
});
test('meses sem registros ficam com zero sem perder valores reais nem misturar conclusão e criação',()=>{
  assert.deepEqual(preencherHistorico(['2025-01','2025-02'],[{mes:'2025-01',pedidosComValor:2,pedidos:3,valor:150.25,cancelados:1}],[{mes:'2025-02',quantidade:2}]),[{mes:'2025-01',pedidosComValor:2,pedidos:3,valor:150.25,cancelados:1,servicosConcluidos:0},{mes:'2025-02',pedidosComValor:0,pedidos:0,valor:0,cancelados:0,servicosConcluidos:2}]);
});
test('acesso limitado permite relatórios somente com autorização explícita, sem abrir módulos operacionais',()=>{
  for(const url of ['/empresa/indicadores','/site-relatorios']){assert.equal(rotaSomenteSite(url),false);assert.equal(rotaSomenteSite(url,['RELATORIOS_EMPRESA']),false);}
  for(const url of ['/pedidos','/empresa/qualquer','/site-relatorios/exportar'])assert.equal(rotaSomenteSite(url,['RELATORIOS_EMPRESA']),false);
});

 test('relatórios do site permitem somente o resumo com autorização',()=>{assert.equal(rotaSomenteSite('/site-relatorios/resumo',['RELATORIOS_EMPRESA']),true);assert.equal(rotaSomenteSite('/site-relatorios/resumo',['CONTEUDO']),false)});
