import test from 'node:test';
import assert from 'node:assert/strict';
import {validarRegistroSite,selectsSite} from '../src/utils/siteConteudo.js';
const base={nome:'Serra',slug:'serra',ativo:true,destaque:true,ordem:0};
test('catálogo aceita vendas distintas e preços opcionais sem quebrar produtos antigos',()=>{
 assert.equal(validarRegistroSite('produtos',base).tipoVenda,'MATERIAL');
 assert.equal(validarRegistroSite('produtos',base).preco,null);
 const data=validarRegistroSite('produtos',{...base,tipoVenda:'MAQUINA',preco:'1999.90',precoAnterior:'2500',marca:'Marca',condicao:'Novo'});
 assert.equal(data.preco,1999.9);assert.equal(data.tipoVenda,'MAQUINA');assert.equal(selectsSite.produtos.preco,true);
});
test('rejeita preços negativos, não finitos, desconto invertido e classificação desconhecida',()=>{
 for(const patch of [{preco:-1},{preco:'NaN'},{preco:'12.999'},{preco:'1e5'},{preco:20,precoAnterior:10},{precoAnterior:10},{tipoVenda:'ADMIN'}])assert.throws(()=>validarRegistroSite('produtos',{...base,...patch}));
});
