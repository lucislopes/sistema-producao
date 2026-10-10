import test from 'node:test';
import assert from 'node:assert/strict';
import { limitarProcessamento } from '../src/utils/limitarProcessamento.js';
import { resumoSite } from '../src/utils/acompanhamento.js';

test('processamento caro tem concorrência limitada e libera vaga após erro',async()=>{
 let liberar;const pendente=new Promise(r=>{liberar=r});
 const limitar=limitarProcessamento(1);
 const lenta=limitar(async()=>{await pendente;throw new Error('teste')});
 const res={setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}};
 const primeira=lenta({},res);const rejeitada=assert.rejects(primeira,/teste/);
 await limitar(async()=>assert.fail('não executar'))({},res);
 assert.equal(res.code,503);liberar();await rejeitada;
 let executou=false;await limitar(async()=>{executou=true})({},res);assert.equal(executou,true);
});
test('histórico do site omite motivos financeiros, funcionários e texto interno',()=>{
 const r=resumoSite({numeroPedido:1,origemPedido:'INTERNO',status:'ABERTO',historicos:[{tipo:'FRETE_ALTERADO',descricao:'desconto reservado'}, {tipo:'PEDIDO_CRIADO',descricao:'informação interna',usuario:{funcionario:{nome:'Operador'}}}]});
 assert.equal(r.historico.length,1);assert.equal(r.historico[0].descricao,'Pedido recebido pela equipe.');
 for(const segredo of ['desconto reservado','informação interna','Operador'])assert.ok(!JSON.stringify(r).includes(segredo));
});
