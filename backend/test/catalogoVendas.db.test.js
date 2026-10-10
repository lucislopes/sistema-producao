import test from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import {prisma} from '../src/lib/prisma.js';
import {criarHandlersConteudoSite} from '../src/utils/siteConteudo.js';
test('venda local: CRUD persiste classificação/preços e público oculta retirada', {skip:process.env.RUN_SITE_DB_TESTS!=='1'},async()=>{
 const slug='teste-venda-'+Date.now();let id;
 const handlers=criarHandlersConteudoSite(prisma),res=()=>({setHeader(){},status(code){this.code=code;return this},json(data){this.data=data;return this}}),next=e=>{throw e};
 try{
   const result=res();await handlers.salvarRegistro('produtos')({params:{},body:{nome:'Equipamento de teste descartável',slug,tipoVenda:'MAQUINA',preco:'1200.50',precoAnterior:'1500',ativo:true,destaque:false,ordem:0}},result,next);
   id=result.data.id;assert.equal(result.code,201);assert.equal(Number(result.data.preco),1200.5);
   const published=res();await handlers.publico('produtos')({},published,next);const item=published.data.find(i=>i.id===id);assert.equal(item.tipoVenda,'MAQUINA');assert.equal(Number(item.precoAnterior),1500);
   const updated=res();await handlers.salvarRegistro('produtos')({params:{id},body:{nome:'Equipamento de teste descartável',slug,tipoVenda:'FERRAMENTA',ativo:false,destaque:false,ordem:0}},updated,next);assert.equal(updated.data.preco,null);
   const hidden=res();await handlers.publico('produtos')({},hidden,next);assert.equal(hidden.data.some(i=>i.id===id),false);
 }finally{if(id)await prisma.produtoSite.delete({where:{id}});await prisma.$disconnect()}
});
