import test from 'node:test';
import assert from 'node:assert/strict';
import { documentoConfere, consultaPublica } from '../src/utils/acompanhamento.js';
test('consulta por documento completo exige igualdade, preserva zeros e mantém consulta antiga',()=>{
  assert.equal(documentoConfere('012.345.678-90','01234567890'),true);
  assert.equal(documentoConfere('012.345.678-90','01234567891'),false);
  assert.equal(documentoConfere('01.234.567/0001-89','01234567000189'),true);
  assert.equal(documentoConfere('012.345.678-90','01234'),true);
  assert.ok(consultaPublica({numero:'12',documento:'01234567890'}));
  assert.equal(consultaPublica({numero:'12',documento:'012345'}),null);
});
