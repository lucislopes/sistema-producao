import test from 'node:test';
import assert from 'node:assert/strict';
import {rotaSomenteSite,acessoSite} from '../src/utils/siteMarketing.js';
test('relatórios reutilizados exigem permissão específica e whitelist',()=>{
 for(const nome of ['comercial-vendedores','pontualidade-entregas','pedidos-parados']){
  assert.equal(rotaSomenteSite('/empresa/relatorios/'+nome,['RELATORIOS_EMPRESA']),false);
  assert.equal(rotaSomenteSite('/empresa/relatorios/'+nome,['CONTEUDO']),false);
 }
 for(const rota of ['/empresa/relatorios/auditoria-cadastro','/relatorios-novos/comercial-vendedores','/empresa/relatorios/pedidos-parados/editar'])assert.equal(rotaSomenteSite(rota,['RELATORIOS_EMPRESA']),false);
 assert.equal(acessoSite({funcao:'VENDEDOR',permissoesSite:['CONTEUDO']},'RELATORIOS_EMPRESA'),false);
});
