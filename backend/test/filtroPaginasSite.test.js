import test from 'node:test';
import assert from 'node:assert/strict';
import {filtroPaginasSite} from '../src/utils/filtroPaginasSite.js';
test('administração encontra serviços ativos e inativos sem perder paginação por tipo',()=>{
  const where=filtroPaginasSite('SERVICO');
  assert.deepEqual(where,{tipo:'SERVICO'});
  const registros=[{tipo:'SERVICO',ativo:true},{tipo:'SERVICO',ativo:false},{tipo:'MARCA',ativo:true}];
  assert.equal(registros.filter(r=>r.tipo===where.tipo).length,2);
  assert.deepEqual(filtroPaginasSite(),{});
  assert.deepEqual(filtroPaginasSite(''),{});
  for(const tipo of ['script',{},['SERVICO']])assert.throws(()=>filtroPaginasSite(tipo),e=>e.status===400);
});
