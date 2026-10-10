import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
import {criarHandlersConteudoSite} from '../src/utils/siteConteudo.js';
dotenv.config({quiet:true});
const res=()=>({code:200,setHeader(){},status(code){this.code=code;return this},json(data){this.data=data;return this}});
test('CMS no banco local: textos, catálogo, categoria inativa, banner, slug duplicado e rollback', {skip:process.env.RUN_SITE_DB_TESTS!=='1'},async()=>{
  if(!['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname))throw new Error('Somente banco local');
  const prisma=new PrismaClient();const rollback=new Error('ROLLBACK_CMS');
  try{await assert.rejects(prisma.$transaction(async tx=>{
    await tx.configuracaoSite.upsert({where:{id:'principal'},create:{id:'principal',ativo:true},update:{ativo:true}});
    const cms=criarHandlersConteudoSite(tx);const next=error=>{throw error};
    const content=res();await cms.salvar({body:{conteudo:{tituloHome:'Título local',textoSobre:'Texto da empresa'},imagemHomeUrl:''}},content,next);assert.equal(content.data.conteudo.tituloHome,'Título local');
    const slug=`teste-${Date.now()}`;const category=res();await cms.salvarRegistro('categorias')({params:{},body:{nome:'Categoria teste',slug,ativo:true,ordem:0}},category,next);assert.equal(category.code,201);
    const product=res();const body={nome:'Produto teste',slug,ativo:true,destaque:true,ordem:0,categoriaId:category.data.id};await cms.salvarRegistro('produtos')({params:{},body},product,next);
    const published=res();await cms.publico('produtos')({},published,next);assert.ok(published.data.some(item=>item.id===product.data.id));assert.equal('createdAt' in published.data.find(item=>item.id===product.data.id),false);
    await cms.salvarRegistro('categorias')({params:{id:category.data.id},body:{nome:'Categoria teste',slug,ativo:false,ordem:0}},res(),next);
    const hidden=res();await cms.publico('produtos')({},hidden,next);assert.equal(hidden.data.some(item=>item.id===product.data.id),false);
    const banner=res();await cms.salvarRegistro('banners')({params:{},body:{titulo:'Banner teste',ativo:true,ordem:1,link:'https://example.com/',textoBotao:'Ver detalhes'}},banner,next);
    const banners=res();await cms.publico('banners')({},banners,next);assert.ok(banners.data.some(item=>item.id===banner.data.id));
    const duplicate=res();await cms.salvarRegistro('produtos')({params:{},body},duplicate,next);assert.equal(duplicate.code,409);
    // A violação de unicidade é o último cenário; a transação inteira é revertida.
    throw rollback;
  }),error=>error===rollback)}finally{await prisma.$disconnect()}
});
