import test from 'node:test';
import assert from 'node:assert/strict';
import {analisarPeriodo} from './analiseEmpresa.js';
const hist=Array.from({length:6},(_,i)=>({mes:`2026-0${i+1}`,pedidos:i+1,valor:(i+1)*100}));
test('compara períodos completos de mesma duração sem misturar métricas',()=>{
 const a=analisarPeriodo(hist,'2026-04','2026-06','valor');
 assert.equal(a.total,1500);assert.equal(a.base,600);assert.equal(a.variacao,150);assert.equal(a.anterior.length,3);
});
test('não inventa comparação quando falta histórico ou base é zero',()=>{
 assert.equal(analisarPeriodo(hist,'2026-01','2026-06').variacao,null);
 assert.equal(analisarPeriodo(hist.map(i=>({...i,pedidos:0})),'2026-04','2026-06').variacao,null);
 assert.equal(analisarPeriodo(hist,'2025-01','2025-06').comparavel,false);
});
