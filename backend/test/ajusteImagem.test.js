import test from 'node:test';
import assert from 'node:assert/strict';
import {validarAjusteImagem,validarAjustesImagens} from '../src/utils/ajusteImagem.js';
import {validarRegistroSite,validarConteudo} from '../src/utils/siteConteudo.js';
import {validarMarketing} from '../src/utils/siteMarketing.js';
test('enquadramento aceita modos sem deformação e bloqueia números e estilos arbitrários',()=>{
 for(const modo of ['contain','cover','natural'])assert.deepEqual(validarAjusteImagem({modo,x:0,y:100,position:'fixed'}),{modo,x:0,y:100});
 for(const valor of [null,[],{modo:'fill'},{modo:'cover',x:101},{modo:'cover',y:-1},{x:'50'},{x:NaN},{y:Infinity}])assert.throws(()=>validarAjusteImagem(valor));
 assert.deepEqual(validarAjustesImagens({imagemHomeUrl:{modo:'cover',x:30,y:50},injetado:{modo:'fill'}}),{imagemHomeUrl:{modo:'cover',x:30,y:50}});
});
test('cadastros preservam o enquadramento de cada foto e ajustes próprios da galeria',()=>{
 const ajuste={modo:'cover',x:20,y:70};
 const registro=validarRegistroSite('banners',{titulo:'Banner',ativo:true,ordem:0,imagemUrl:'',ajusteImagem:ajuste});assert.deepEqual(registro.ajusteImagem,ajuste);
 const conteudo=validarConteudo({conteudo:{},imagemHomeUrl:'',ajustesImagens:{imagemHomeUrl:ajuste}});assert.deepEqual(conteudo.ajustesImagens.imagemHomeUrl,ajuste);
 const marketing=validarMarketing({titulo:'Oferta',descricao:'Descrição',tipo:'PROMOCAO',status:'RASCUNHO',ajusteImagem:ajuste,arte:{galeria:['https://example.com/foto.jpg'],ajustesGaleria:{'https://example.com/foto.jpg':{modo:'natural'}}}});assert.deepEqual(marketing.ajusteImagem,ajuste);assert.equal(marketing.arte.ajustesGaleria['https://example.com/foto.jpg'].modo,'natural');
});
