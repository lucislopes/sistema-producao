import test from 'node:test';import assert from 'node:assert/strict';import {imagemCatalogo} from './imagensCatalogo.js';
test('fotos reais e novas imagens substituem automaticamente a ilustração de exemplo',()=>{
 const base={nome:'MDF Branco — exemplo',slug:'exemplo-branco',imagemPrincipalUrl:'/api/uploads/site/produtos/117f33d8-37ae-45ea-bfcb-39841f1dfe13.webp'};
 assert.match(imagemCatalogo(base),/mdf-branco-ilustrativo-v1.webp$/);
 const nova={...base,imagemPrincipalUrl:'/api/uploads/site/produtos/foto-nova.webp'};assert.equal(imagemCatalogo(nova),nova.imagemPrincipalUrl);
 for(const patch of [{nome:'MDF Branco real'},{slug:'produto-real'}])assert.equal(imagemCatalogo({...base,...patch}),base.imagemPrincipalUrl);
});
