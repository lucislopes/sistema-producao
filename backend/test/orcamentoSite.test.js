import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validarSolicitacao } from '../src/utils/orcamentoSite.js';
const base=()=>({chave:randomUUID(),nome:'Teste',telefone:'61995822399',observacao:'Armário',pecas:[],materiais:[]});
test('solicitação preserva peças revisadas e rejeita quantidades, datas e textos inválidos',()=>{
 const b=base();b.pecas=[{nome:'Lateral',material:'MDF',comprimento:1800,largura:600,quantidade:2,bordas:['Comprimento 1']}];
 assert.equal(validarSolicitacao(b).detalhes.pecas[0].comprimento,1800);
 for(const n of [-1,0,10001,1.2])assert.throws(()=>validarSolicitacao({...b,pecas:[{...b.pecas[0],comprimento:n}]}));
 assert.throws(()=>validarSolicitacao({...b,dataDesejada:'2026-02-31'}));
 assert.throws(()=>validarSolicitacao({...b,chave:'guessable'}));
 assert.throws(()=>validarSolicitacao({...b,pecas:Array(51).fill(b.pecas[0])}));
});
