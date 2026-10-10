import test from 'node:test';
import assert from 'node:assert/strict';
import {edicaoSecoesSite,editorSecao} from './edicaoSecoesSite.js';
import {secoesSite} from '../../../site/config.js';
import {camposConteudo,camposImagens} from '../../../backend/src/utils/siteConteudo.js';
import {textosPadrao} from '../../../backend/src/utils/siteTextos.js';
test('todas as partes possuem editor ou destino e todos os campos são persistidos',()=>{
 const padrao=textosPadrao();
 for(const [id] of secoesSite){
  const editor=edicaoSecoesSite[id];assert.ok(editor,id);
  assert.ok(editor.campos?.length||editor.links?.length,id);
  for(const key of editor.campos||[]){assert.ok(camposConteudo[key],key);assert.equal(typeof padrao[key],'string',key)}
  for(const key of editor.imagens||[])assert.ok(key==='imagemHomeUrl'||camposImagens[key],key);
 }
 assert.ok(editorSecao('solucoes').imagens.includes('imagemHomeUrl'));
});
test('história e contato publicados levam à origem que controla o site',()=>{
 assert.deepEqual(editorSecao('sobre',{HISTORIA:{id:'1'}}).links,[['/empresa/paginas?tipo=HISTORIA','Editar História publicada']]);
 assert.equal(editorSecao('sobre',{HISTORIA:{}}).campos.length,0);
 assert.ok(!editorSecao('contato',{CONTATO:{}}).campos.includes('tituloContato'));
 assert.ok(editorSecao('contato',{CONTATO:{}}).campos.includes('enderecoContato'));
});
