import test from 'node:test';
import assert from 'node:assert/strict';
import {acessoRotaSite,rotaSomenteSite} from '../src/utils/siteMarketing.js';

test('usuário não administrador configura o site e envia logo com autorização específica',()=>{
 const user={funcao:'VENDEDOR',somenteSite:true,permissoesSite:['CONFIGURACAO_SITE']};
 for(const path of ['/configuracao','/configuracao/','/imagens/configuracao'])assert.equal(acessoRotaSite(user,path),true);
 for(const path of ['/conteudo','/produtos','/imagens/produtos','/armazenamento'])assert.equal(acessoRotaSite(user,path),false);
 assert.equal(rotaSomenteSite('/site/configuracao',user.permissoesSite),true);
 assert.equal(rotaSomenteSite('/configuracao-empresa',user.permissoesSite),false);
});
test('conteúdo e promoções não concedem configuração; revogação e administração são respeitadas',()=>{
 for(const permissoesSite of [[],['CONTEUDO'],['PROMOCOES'],['RELATORIOS_EMPRESA']]){
  for(const path of ['/configuracao','/imagens/configuracao'])assert.equal(acessoRotaSite({funcao:'VENDEDOR',permissoesSite},path),false);
 }
 assert.equal(acessoRotaSite({funcao:'VENDEDOR',permissoesSite:['CONTEUDO']},'/produtos'),true);
 assert.equal(acessoRotaSite({funcao:'VENDEDOR',permissoesSite:['CONTEUDO']},'/imagens/conteudo'),true);
 assert.equal(acessoRotaSite({funcao:'VENDEDOR',permissoesSite:['PROMOCOES']},'/imagens/conteudo'),false);
 assert.equal(acessoRotaSite({funcao:'VENDEDOR',permissoesSite:['PROMOCOES']},'/imagens/banners'),true);
 for(const path of ['/configuracao','/imagens/configuracao','/conteudo','/armazenamento'])assert.equal(acessoRotaSite({funcao:'ADMIN'},path),true);
});
