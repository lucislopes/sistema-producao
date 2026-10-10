import test from 'node:test';
import assert from 'node:assert/strict';
import {validarRedesSociais,validarConfiguracaoSite} from '../src/utils/configuracaoSite.js';
import {linksRedes} from '../../site/redes.js';
test('redes aceitam perfis oficiais, campos vazios ocultam e campos desconhecidos não são publicados',()=>{
 assert.deepEqual(validarRedesSociais({facebook:'https://www.facebook.com/empresa',instagram:'',segredo:'ocultar'}),{facebook:'https://www.facebook.com/empresa'});
 for(const v of [[],null,'https://instagram.com'])assert.throws(()=>validarRedesSociais(v));
 for(const u of ['javascript:alert(1)','https://instagram.com.evil.example/p','https://evilinstagram.com','https://user:pass@instagram.com/p'])assert.throws(()=>validarRedesSociais({instagram:u}));
});
test('ícones mostram apenas redes válidas e mantêm compatibilidade com Instagram e WhatsApp existentes',()=>{
 const links=linksRedes({instagramUrl:'https://instagram.com/empresa',redesSociais:{youtube:'https://youtube.com/@empresa',facebook:'',linkedin:'javascript:alert(1)'},whatsapp:'5561981528012'});
 assert.deepEqual(links.map(i=>i.key),['instagram','youtube','whatsapp']);assert.equal(links[2].url,'https://wa.me/5561981528012');
 assert.deepEqual(linksRedes({redesSociais:{instagram:''},instagramUrl:'https://instagram.com/empresa'}),[]);
 assert.deepEqual(linksRedes({}),[]);
});
test('configuração sincroniza link Instagram e permite remoção sem quebrar clientes antigos',()=>{
 const base={nome:'Empresa',telefone:'',email:'',logoUrl:'',ativo:true,corPrimaria:'#084f2b',corDestaque:'#ffbd16',whatsapp:'',instagramUrl:'https://instagram.com/antigo',siteUrl:'',sistemaUrl:''};
 assert.equal(validarConfiguracaoSite({...base,redesSociais:{instagram:'https://instagram.com/novo'}},'').site.instagramUrl,'https://instagram.com/novo');
 assert.equal(validarConfiguracaoSite({...base,redesSociais:{}},'').site.instagramUrl,'');
 assert.equal(validarConfiguracaoSite(base,'').site.redesSociais,undefined);
});
