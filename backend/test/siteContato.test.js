import test from 'node:test';
import assert from 'node:assert/strict';
import { validarConteudo } from '../src/utils/siteConteudo.js';
test('contatos comerciais são editáveis e localização bloqueia links executáveis',()=>{
  const result=validarConteudo({conteudo:{enderecoContato:'Rua de exemplo, 10',horarioContato:'Segunda a sexta',orientacoesRetirada:'Confirmar antes de retirar',localizacaoUrl:'https://example.com/mapa'}});
  assert.equal(result.conteudo.enderecoContato,'Rua de exemplo, 10');
  assert.equal(result.conteudo.localizacaoUrl,'https://example.com/mapa');
  assert.throws(()=>validarConteudo({conteudo:{localizacaoUrl:'javascript:alert(1)'}}));
});
