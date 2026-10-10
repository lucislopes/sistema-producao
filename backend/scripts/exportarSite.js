import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import {mkdir,writeFile,copyFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {uploadRoot} from '../src/utils/siteUpload.js';
const db=new PrismaClient();
const destino=path.resolve('../backups/site-exportacao-'+new Date().toISOString().replace(/[:.]/g,'-'));
const modelos=['configuracaoSite','categoriaSite','produtoSite','bannerSite','paginaSite','publicacaoSite'];
try {
 if(!['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname))throw new Error('Exportação permitida somente do banco local.');
 const dados=await db.$transaction(async tx=>{
  const out={};for(const modelo of modelos)out[modelo]=await tx[modelo].findMany();
  out.identidadePublica=await tx.configuracaoEmpresa.findFirst({select:{nome:true,telefone:true,email:true,logoUrl:true}});
  return out;
 },{isolationLevel:'RepeatableRead'});
 if(dados.configuracaoSite.length!==1)throw new Error('Configuração local ausente ou ambígua.');
 dados.configuracaoSite[0].siteUrl='https://biomadeira.cooperagestao.com.br';
 dados.configuracaoSite[0].sistemaUrl='https://sistema.biomadeira.cooperagestao.com.br';
 for(const item of dados.publicacaoSite){item.instagramId=null;item.instagramContainer=null;item.instagramEstado='MANUAL';}
 const imagens=new Set();
 const coletar=v=>{if(typeof v==='string'&&v.startsWith('/api/uploads/')){if(!/^\/api\/uploads\/site\/(configuracao|produtos|categorias|banners)\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(v))throw new Error('Referência de imagem inválida.');imagens.add(v)}else if(Array.isArray(v))v.forEach(coletar);else if(v&&typeof v==='object')Object.values(v).forEach(coletar)};
 coletar(dados);
 await mkdir(destino,{recursive:true});const arquivos=[];
 for(const url of imagens){const relativo=url.slice('/api/uploads/'.length);const origem=path.join(uploadRoot(),relativo);const bytes=await readFile(origem);const arquivo=path.join(destino,'uploads',relativo);await mkdir(path.dirname(arquivo),{recursive:true});await copyFile(origem,arquivo);arquivos.push({arquivo:'uploads/'+relativo,sha256:createHash('sha256').update(bytes).digest('hex')});}
 await writeFile(path.join(destino,'conteudo.json'),JSON.stringify({versao:1,dados},null,2));
 await writeFile(path.join(destino,'manifesto.json'),JSON.stringify({arquivos,contagens:Object.fromEntries(modelos.map(m=>[m,dados[m].length]))},null,2));
 console.log(JSON.stringify({destino,imagens:imagens.size,contagens:Object.fromEntries(modelos.map(m=>[m,dados[m].length]))},null,2));
} finally {await db.$disconnect()}
