import test from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import {prisma} from '../src/lib/prisma.js';
test('banco local preserva ajustes de imagens em todos os tipos de cadastro com rollback',{skip:process.env.RUN_SITE_DB_TESTS!=='1'},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
 const rollback=new Error('ROLLBACK_AJUSTES_IMAGENS');
 try{await assert.rejects(prisma.$transaction(async tx=>{
   const ajuste={modo:'cover',x:25,y:75},sufixo=Date.now().toString();
   for(const [model,data]of [
     ['categoriaSite',{nome:'Teste imagem',slug:'teste-ajuste-categoria-'+sufixo}],
     ['produtoSite',{nome:'Teste imagem',slug:'teste-ajuste-produto-'+sufixo}],
     ['bannerSite',{titulo:'Teste imagem'}],
     ['paginaSite',{titulo:'Teste imagem',slug:'teste-ajuste-pagina-'+sufixo,tipo:'HISTORIA',descricao:'Teste'}],
     ['publicacaoSite',{titulo:'Teste imagem',descricao:'Teste'}]
   ]){const salvo=await tx[model].create({data:{...data,ajusteImagem:ajuste}});const lido=await tx[model].findUnique({where:{id:salvo.id}});assert.deepEqual(lido.ajusteImagem,ajuste)}
   const config=await tx.configuracaoSite.upsert({where:{id:'principal'},create:{id:'principal',ajustesImagens:{imagemHomeUrl:ajuste}},update:{ajustesImagens:{imagemHomeUrl:ajuste}}});assert.deepEqual(config.ajustesImagens.imagemHomeUrl,ajuste);
   throw rollback;
 }),error=>error===rollback)}finally{await prisma.$disconnect()}
});
