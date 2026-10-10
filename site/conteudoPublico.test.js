import test from 'node:test';
import assert from 'node:assert/strict';
import {resolverConteudo,paginasPublicadas,estiloImagem,aplicarAjusteImagem} from './config.js';

test('história e contato publicados controlam os mesmos textos e fotos na home e na prévia',()=>{
  const config={conteudo:{tituloSobre:'Antigo',textoSobre:'Antigo',textoSobreComplemento:'Complemento antigo',imagemSobreUrl:'foto-antiga',enderecoContato:'Endereço cadastrado',horarioContato:'9h às 18h'}};
  const paginas=[{id:'h',tipo:'HISTORIA',titulo:'Nova história',descricao:'Texto completo\nSegundo parágrafo',imagemUrl:'foto-nova',ativo:true},{id:'c',tipo:'CONTATO',titulo:'Fale conosco',descricao:'Novo atendimento',imagemUrl:'equipe-nova',ativo:true}];
  const result=resolverConteudo(config,paginas);
  assert.equal(result.conteudo.imagemSobreUrl,'foto-nova');assert.equal(result.conteudo.tituloSobre,'Nova história');assert.equal(result.conteudo.textoSobre,paginas[0].descricao);assert.equal(result.conteudo.textoSobreComplemento,'');
  assert.equal(result.conteudo.imagemAtendimentoUrl,'equipe-nova');assert.equal(result.conteudo.textoContato,'Novo atendimento');assert.equal(result.conteudo.enderecoContato,'Endereço cadastrado');assert.equal(result.conteudo.horarioContato,'9h às 18h');
  assert.equal(config.conteudo.imagemSobreUrl,'foto-antiga');
});
test('enquadramento acompanha a imagem institucional e galeria preserva controle individual',()=>{
 const ajuste={modo:'cover',x:15,y:80};const config=resolverConteudo({ajustesImagens:{imagemSobreUrl:{modo:'contain'}}},[{tipo:'HISTORIA',imagemUrl:'nova',ajusteImagem:ajuste}]);
 assert.deepEqual(config.ajustesImagens.imagemSobreUrl,ajuste);
 const imagem={style:{},dataset:{}};aplicarAjusteImagem(imagem,config.ajustesImagens.imagemSobreUrl);
 assert.equal(imagem.style.objectFit,'cover');assert.equal(imagem.style.objectPosition,'15% 80%');assert.equal(imagem.style.transform,'none');
 assert.equal(estiloImagem({modo:'natural'}).objectFit,'scale-down');
 assert.equal(estiloImagem({modo:'contain'}).objectFit,'contain');
});
test('retirar publicação restaura conteúdo institucional e remover foto não ressuscita foto antiga',()=>{
  const config={conteudo:{imagemSobreUrl:'foto-antiga',textoSobre:'Texto base'}};
  assert.equal(resolverConteudo(config,[{tipo:'HISTORIA',ativo:false,imagemUrl:'foto-oculta'}]).conteudo.imagemSobreUrl,'foto-antiga');
  assert.equal(resolverConteudo(config,[{tipo:'HISTORIA',ativo:true,imagemUrl:null}]).conteudo.imagemSobreUrl,'');
});
test('ordem, título e ID determinam a página principal sem depender da resposta do servidor',()=>{
  const paginas=[{id:'z',tipo:'HISTORIA',ordem:1,titulo:'Z'},{id:'b',tipo:'HISTORIA',ordem:0,titulo:'A'},{id:'a',tipo:'HISTORIA',ordem:0,titulo:'A'}];
  assert.equal(resolverConteudo({},paginas).fontes.HISTORIA.id,'a');
  assert.equal(paginasPublicadas(paginas)[0].id,'a');assert.equal(paginas[0].id,'z');
});
test('serviços publicados indicam origem e páginas de marca não alteram identidade institucional',()=>{
  const base={conteudo:{tituloHome:'Título editado',imagemServicosUrl:'central',imagemCatalogoUrl:'estoque'}};
  const result=resolverConteudo(base,[{id:'s',tipo:'SERVICO',ativo:true},{id:'x',tipo:'SERVICO',ativo:false},{tipo:'MARCA',imagemUrl:'marca'}]);
  assert.equal(result.fontes.SERVICO.length,1);assert.deepEqual(result.conteudo,base.conteudo);
});
