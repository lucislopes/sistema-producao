import test from 'node:test';
import assert from 'node:assert/strict';
import { linkOrcamentoWhatsApp } from './whatsapp.js';
test('destino válido e mensagem codificada integralmente, sem interpretar caracteres como parâmetros',()=>{
  const text='Nome: João\nMDF & bordas #1? 2 peças';
  const url=new URL(linkOrcamentoWhatsApp('+55 (11) 99999-9999',text));
  assert.equal(url.pathname,'/5511999999999'); assert.equal(url.searchParams.get('text'),text);
  assert.equal([...url.searchParams].length,1);
  assert.equal(linkOrcamentoWhatsApp('',text),null); assert.equal(linkOrcamentoWhatsApp('123',text),null);
});
