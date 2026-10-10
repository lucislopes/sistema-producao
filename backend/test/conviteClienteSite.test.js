import test from 'node:test';
import assert from 'node:assert/strict';
import { enderecoClienteSite } from '../src/utils/conviteClienteSite.js';
test('convite abre página de ativação direta e mantém segredo no fragmento',()=>{
 const token='a'.repeat(64);
 const url=new URL(enderecoClienteSite('https://empresa.example/',token,true));
 assert.equal(url.pathname,'/ativar-acesso.html');assert.equal(url.search,'');assert.equal(url.hash,'#'+token);
 assert.equal(enderecoClienteSite('https://empresa.example/site',token,true),`https://empresa.example/site/ativar-acesso.html#${token}`);
 assert.equal(new URL(enderecoClienteSite('https://empresa.example/',null,true)).hash,'#area-cliente');
 assert.throws(()=>enderecoClienteSite('',token,true));
});
