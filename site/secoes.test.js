import test from 'node:test';
import assert from 'node:assert/strict';
import {secoesSite,ordenarSecoes,aplicarOrdemSecoes,aplicarVisibilidadeSecoes} from './config.js';
import {validarConteudo} from '../backend/src/utils/siteConteudo.js';
import {conteudoEfetivo} from '../backend/src/utils/siteTextos.js';
test('ordem completa é validada, preservada na resposta pública e renderizada movendo os mesmos elementos',()=>{
  const ordem=ordenarSecoes();ordem.splice(ordem.indexOf('servicos'),1);ordem.unshift('servicos');
  const salvo=validarConteudo({conteudo:{ordemSecoes:ordem},imagemHomeUrl:''});
  assert.deepEqual(conteudoEfetivo(salvo.conteudo,'Empresa').ordemSecoes,ordem);
  const formulario={id:'orcamento',valor:'dados digitados'},servicos={id:'servicos'},banner={id:'banners'};
  const main={children:[banner,formulario,servicos],append(el){this.children=this.children.filter(e=>e!==el);this.children.push(el)}};
  aplicarOrdemSecoes(main,ordem);
  assert.deepEqual(main.children.map(el=>el.id),['servicos','banners','orcamento']);
  assert.equal(main.children[2],formulario);assert.equal(formulario.valor,'dados digitados');
  for(const invalida of [[],['servicos'],[...ordem.slice(1),ordem[1]],[...ordem.slice(1),'script']])assert.throws(()=>validarConteudo({conteudo:{ordemSecoes:invalida}}));
});
test('configurações antigas mantêm a ordem padrão; ids desconhecidos e repetidos não afetam o site',()=>{
  assert.deepEqual(ordenarSecoes(),secoesSite.map(([id])=>id));
  assert.equal(ordenarSecoes(['servicos','servicos','script'])[0],'servicos');
  assert.equal(ordenarSecoes(['servicos','servicos','script']).length,secoesSite.length);
  assert.equal(conteudoEfetivo({},'Empresa').ordemSecoes,undefined);
});
test('desativar preserva conteúdo e posição, oculta atalhos e permite reativação',()=>{
  const dados=validarConteudo({conteudo:{ordemSecoes:ordenarSecoes(),secoesDesativadas:['servicos','orcamento']}});
  assert.deepEqual(conteudoEfetivo(dados.conteudo,'Empresa').secoesDesativadas,['servicos','orcamento']);
  const elemento=(id,href)=>{const classes=new Set();return {id,conteudo:'preservado',classes,classList:{toggle(nome,ativa){if(ativa)classes.add(nome);else classes.delete(nome)}},getAttribute(){return href}}};
  const servicos=elemento('servicos'),catalogo=elemento('catalogo'),atalho=elemento('', '#servicos'),botao=elemento('','./index.html#orcamento'),pagina=elemento('','./pagina.html?tipo=SERVICO');
  const main={children:[servicos,catalogo]};
  aplicarVisibilidadeSecoes(main,dados.conteudo.secoesDesativadas,[atalho,botao,pagina]);
  assert.equal(servicos.classes.has('secao-desativada'),true);assert.equal(atalho.classes.has('secao-desativada'),true);assert.equal(botao.classes.has('secao-desativada'),true);
  assert.equal(catalogo.classes.size,0);assert.equal(pagina.classes.size,0);assert.equal(servicos.conteudo,'preservado');
  aplicarVisibilidadeSecoes(main,[],[atalho,botao]);
  assert.equal(servicos.classes.size,0);assert.equal(atalho.classes.size,0);assert.deepEqual(main.children,[servicos,catalogo]);
  assert.equal(conteudoEfetivo({},'Empresa').secoesDesativadas,undefined);
  for(const lista of [null,{},['servicos','servicos'],['script'],[false]])assert.throws(()=>validarConteudo({conteudo:{secoesDesativadas:lista}}));
});
