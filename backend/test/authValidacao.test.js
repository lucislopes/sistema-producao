import test from 'node:test';
import assert from 'node:assert/strict';
import {login} from '../src/controllers/auth.controller.js';
test('login rejeita corpo ausente, tipos incorretos e tamanho excessivo sem consultar o banco',async()=>{
 for(const body of [undefined,{}, {email:123,senha:'senha'}, {email:'a@b.com',senha:{}}, {email:'a'.repeat(255),senha:'senha'}, {email:'a@b.com',senha:'a'.repeat(1025)}]){
  const res={status(code){this.code=code;return this},json(data){this.data=data;return this}};await login({body},res);assert.equal(res.code,400);assert.equal(res.data.error,'Informe e-mail e senha válidos');
 }
});
