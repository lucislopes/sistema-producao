import {PrismaClient} from '@prisma/client';
import {readFile,mkdir,copyFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const db=new PrismaClient(),root=path.resolve(process.argv[2]||'/pacote'),aplicar=process.argv.includes('--aplicar');
const modelos=['configuracaoSite','categoriaSite','produtoSite','bannerSite','paginaSite','publicacaoSite'];
const tabelas=['ConfiguracaoSite','CategoriaSite','ProdutoSite','BannerSite','PaginaSite','PublicacaoSite'];
const hash=b=>createHash('sha256').update(b).digest('hex');
try{
 const pacote=JSON.parse(await readFile(path.join(root,'conteudo.json'),'utf8'));
 const manifesto=JSON.parse(await readFile(path.join(root,'manifesto.json'),'utf8'));
 if(pacote.versao!==1||pacote.dados.configuracaoSite?.length!==1)throw new Error('Pacote inválido.');
 const normalizar=v=>{
  if(typeof v==='string'&&/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(v)){const u=new URL(v);return 'https://biomadeira.cooperagestao.com.br'+u.pathname+u.search+u.hash;}
  if(Array.isArray(v))return v.map(normalizar);
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,val])=>[k,normalizar(val)]));
  return v;
 };
 const dados=normalizar(pacote.dados);
 for(const m of modelos){if(!Array.isArray(dados[m])||dados[m].length!==manifesto.contagens[m])throw new Error('Contagem inválida: '+m);for(const r of dados[m])for(const k of ['createdAt','updatedAt','inicio','fim'])if(r[k])r[k]=new Date(r[k]);}
 dados.configuracaoSite[0].siteUrl='https://biomadeira.cooperagestao.com.br';
 dados.configuracaoSite[0].sistemaUrl='https://sistema.biomadeira.cooperagestao.com.br';
 const arquivos=[];
 for(const item of manifesto.arquivos){
  if(!/^uploads\/site\/(configuracao|produtos|categorias|banners)\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(item.arquivo))throw new Error('Caminho inválido.');
  const origem=path.join(root,item.arquivo),bytes=await readFile(origem);
  if(hash(bytes)!==item.sha256)throw new Error('Imagem alterada: '+item.arquivo);
  const destino=path.join(process.env.UPLOAD_DIR||'/app/uploads',item.arquivo.slice(8));
  try{if(hash(await readFile(destino))!==item.sha256)throw new Error('Imagem existente com conteúdo diferente: '+item.arquivo);}catch(e){if(e.code!=='ENOENT')throw e;}
  arquivos.push({origem,destino});
 }
 const existentes={};for(const m of modelos)existentes[m]=await db[m].count();
 console.log(JSON.stringify({modo:aplicar?'APLICAÇÃO':'CONFERÊNCIA SEM GRAVAÇÃO',existentes,importar:manifesto.contagens,imagens:arquivos.length,publicacoes:dados.publicacaoSite.map(p=>({titulo:p.titulo,status:p.status})),identidadeOperacional:'preservada'},null,2));
 if(Object.values(existentes).some(n=>n!==0))throw new Error('Importação bloqueada: tabelas do site não estão vazias.');
 if(aplicar){
  for(const f of arquivos){await mkdir(path.dirname(f.destino),{recursive:true});try{await copyFile(f.origem,f.destino,constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;if(hash(await readFile(f.destino))!==hash(await readFile(f.origem)))throw new Error('Conflito durante cópia.');}}
  await db.$transaction(async tx=>{
   for(const t of tabelas)await tx.$executeRawUnsafe('LOCK TABLE "'+t+'" IN EXCLUSIVE MODE');
   for(const m of modelos)if(await tx[m].count())throw new Error('Tabela preenchida durante importação: '+m);
   const antes=await Promise.all([tx.cliente.count(),tx.pedido.count(),tx.historicoPedido.count(),tx.usuario.count()]);
   for(const m of modelos)if(dados[m].length)await tx[m].createMany({data:dados[m]});
   const depois=await Promise.all([tx.cliente.count(),tx.pedido.count(),tx.historicoPedido.count(),tx.usuario.count()]);
   if(JSON.stringify(antes)!==JSON.stringify(depois))throw new Error('Contagens operacionais divergentes.');
  },{isolationLevel:'RepeatableRead',timeout:60000});
  console.log('IMPORTAÇÃO CONCLUÍDA. Dados operacionais preservados.');
 }
}catch(e){console.error(e.message);process.exitCode=1;}finally{await db.$disconnect();}
