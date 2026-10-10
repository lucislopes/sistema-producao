import test from 'node:test';
import assert from 'node:assert/strict';
import { validarConteudo,validarRegistroSite,imagemSite,criarHandlersConteudoSite } from '../src/utils/siteConteudo.js';
const product={nome:'MDF Branco',slug:'mdf-branco',ativo:true,destaque:false,ordem:0,categoriaId:'',descricaoCurta:'',descricao:'',especificacao:'',imagemPrincipalUrl:''};
test('campos de conteúdo limitados; URLs de imagem e link bloqueiam scripts e caminhos arbitrários',()=>{
  assert.deepEqual(validarConteudo({conteudo:{tituloHome:' Meu projeto ',segredo:'ocultar'},imagemHomeUrl:''}).conteudo,{tituloHome:'Meu projeto'});
  for(const value of ['javascript:alert(1)','/api/uploads/../../.env','data:image/svg+xml;base64,x'])assert.throws(()=>imagemSite(value));
  assert.equal(imagemSite('/api/uploads/site/produtos/12345678-1234-1234-1234-123456789abc.webp'),'/api/uploads/site/produtos/12345678-1234-1234-1234-123456789abc.webp');
  assert.throws(()=>validarRegistroSite('banners',{titulo:'Banner',ativo:true,ordem:0,link:'javascript:alert(1)'}));
  for(const patch of [{slug:'Espaços aqui'},{ordem:-1},{ativo:'true'},{nome:[]},{descricao:'a'.repeat(5001)}])assert.throws(()=>validarRegistroSite('produtos',{...product,...patch}));
});
test('publicação filtra ativos, categoria e campos permitidos; desativação bloqueia consulta',async()=>{
  let args;
  const prisma={configuracaoSite:{findUnique:async()=>({ativo:true})},produtoSite:{findMany:async query=>{args=query;return []}}};
  const res={setHeader(){},json(value){this.data=value},status(value){this.code=value;return this}};
  await criarHandlersConteudoSite(prisma).publico('produtos')({},res,error=>{throw error});
  assert.equal(args.where.ativo,true);assert.deepEqual(args.where.OR,[{categoriaId:null},{categoria:{ativo:true}}]);
  assert.equal(args.select.ativo,undefined);assert.equal(args.take,500);
  prisma.configuracaoSite.findUnique=async()=>({ativo:false});
  prisma.produtoSite.findMany=async()=>assert.fail('Não consultar catálogo desativado');
  await criarHandlersConteudoSite(prisma).publico('produtos')({},res,error=>{throw error});assert.equal(res.code,404);
});
