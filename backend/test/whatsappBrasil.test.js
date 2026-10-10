import test from 'node:test';
import assert from 'node:assert/strict';
import { whatsappBrasil } from '../src/utils/configuracaoSite.js';
test('WhatsApp Brasil adiciona 55, mantém números completos e não confunde DDD 55',()=>{
  for(const value of ['61995822399','(61) 99582-2399','5561995822399','+55 61 99582-2399']) assert.equal(whatsappBrasil(value),'5561995822399');
  assert.equal(whatsappBrasil('55995822399'),'5555995822399');
  assert.equal(whatsappBrasil('6133224455'),'556133224455');
  assert.equal(whatsappBrasil(''),'');
  for(const value of ['+1 202 555 0123','123','abc','061995822399']) assert.throws(()=>whatsappBrasil(value));
});
