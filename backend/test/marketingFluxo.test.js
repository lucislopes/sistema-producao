import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import {mkdir,mkdtemp,readFile,unlink,rmdir} from 'node:fs/promises';
import path from 'node:path';
import {prisma} from '../src/lib/prisma.js';
import {siteAdminRoutes} from '../src/routes/site.routes.js';
import {marketingAdminRoutes,marketingPublicRoutes} from '../src/routes/marketingSite.routes.js';

test('fluxo HTTP: upload real, criar, salvar enquadramento, reabrir, publicar no site e preparar JPEG',async()=>{
 const original=[],env={JWT_SECRET:process.env.JWT_SECRET,UPLOAD_DIR:process.env.UPLOAD_DIR,INSTAGRAM_ACCESS_TOKEN:process.env.INSTAGRAM_ACCESS_TOKEN,INSTAGRAM_ACCOUNT_ID:process.env.INSTAGRAM_ACCOUNT_ID,SITE_PUBLIC_URL:process.env.SITE_PUBLIC_URL};
 const stub=(delegate,key,fn)=>{original.push([delegate,key,delegate[key]]);delegate[key]=fn};
 const nativeFetch=global.fetch;let metaCalls=0;global.fetch=async(url,opts)=>String(url).startsWith('https://graph.instagram.com/')?(metaCalls++,{ok:true,json:async()=>String(url).includes('media_publish')?{id:'media-'+metaCalls}:opts.method==='GET'?{status_code:'FINISHED'}:{id:'container-'+metaCalls}}):nativeFetch(url,opts);
 const envios=new Map();stub(prisma.instagramConexaoSite,'findUnique',async()=>null);stub(prisma.publicacaoSite,'findUnique',async({where})=>structuredClone(registros.get(where.id)));stub(prisma.instagramEnvioSite,'upsert',async({create})=>{const key=create.formato;if(!envios.has(key))envios.set(key,{id:key,estado:'NOVO',...create});return structuredClone(envios.get(key))});stub(prisma.instagramEnvioSite,'updateMany',async({where,data})=>{const item=envios.get(where.id);if(item.estado==='ENVIANDO'||item.instagramId)return {count:0};Object.assign(item,data);return {count:1}});stub(prisma.instagramEnvioSite,'update',async({where,data})=>{const item=envios.get(where.id);Object.assign(item,data);return structuredClone(item)});stub(prisma.instagramEnvioSite,'findMany',async()=>[...envios.values()].map(i=>structuredClone(i)));
 const registros=new Map();const clone=v=>structuredClone(v);
 stub(prisma.usuario,'findUnique',async()=>({id:'teste-fluxo',funcionario:{id:'f',ativo:true,funcao:'ADMIN'}}));
 stub(prisma.configuracaoSite,'findUnique',async()=>({ativo:true}));
 stub(prisma.publicacaoSite,'create',async({data})=>{const item={id:'campanha-teste',createdAt:new Date(),...data};registros.set(item.id,item);return clone(item)});
 stub(prisma.publicacaoSite,'update',async({where,data})=>{const item={...registros.get(where.id),...data};registros.set(where.id,item);return clone(item)});
 stub(prisma.publicacaoSite,'count',async()=>registros.size);
 stub(prisma.publicacaoSite,'findMany',async({where})=>[...registros.values()].filter(i=>!where||((!where.status||i.status===where.status)&&(!i.inicio||i.inicio<=new Date())&&(!i.fim||i.fim>new Date()))).map(clone));
 const parent=path.resolve('node_modules/.cache');await mkdir(parent,{recursive:true});const root=await mkdtemp(path.join(parent,'marketing-flow-'));process.env.UPLOAD_DIR=root;process.env.JWT_SECRET='somente-teste-local';
 const app=express();app.use('/site',siteAdminRoutes);app.use('/marketing-site',marketingAdminRoutes);app.use('/public',marketingPublicRoutes);
 app.use((err,req,res,next)=>res.status(err.status||500).json({error:err.message}));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const origin=`http://127.0.0.1:${server.address().port}`,token=jwt.sign({id:'teste-fluxo'},process.env.JWT_SECRET),files=[];
 const request=(url,method='GET',body,mime='application/json')=>fetch(origin+url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':mime},...(body?{body:mime==='application/json'?JSON.stringify(body):body}:{})});
 try{
  const png=await sharp({create:{width:1200,height:800,channels:3,background:'#237443'}}).png().toBuffer();
  let response=await request('/site/imagens/banners','POST',png,'image/png');assert.equal(response.status,201);const image=await response.json();files.push(path.join(root,image.url.replace('/api/uploads/','')));assert.equal((await sharp(await readFile(files[0])).metadata()).format,'webp');
  response=await request('/site/imagens/banners','POST',png,'image/png');const extra=await response.json();files.push(path.join(root,extra.url.replace('/api/uploads/','')));
  const body={titulo:'Promoção teste',descricao:'Oferta com foto real',tipo:'PROMOCAO',status:'RASCUNHO',imagemUrl:image.url,preco:'299.90',arte:{condicaoPagamento:'À vista no Pix',rodapeEndereco:'ADE Conjunto 21 LT 24 — Águas Claras',rodapeTelefone:'(61) 3399-0616',galeria:[extra.url],capaSiteUrl:image.url,modelo:'impacto',zoomImagem:1.5,posicaoX:.25,posicaoY:.7}};
  response=await request('/marketing-site/publicacoes','POST',body);assert.equal(response.status,201);const saved=await response.json();assert.equal(saved.arte.condicaoPagamento,'À vista no Pix');assert.equal(saved.arte.rodapeTelefone,'(61) 3399-0616');assert.equal(saved.imagemUrl,image.url);assert.deepEqual(saved.arte.galeria,[extra.url]);
  let lista=await request('/marketing-site/publicacoes').then(r=>r.json());assert.equal(lista.itens[0].arte.posicaoY,.7);assert.equal((await request('/public/publicacoes').then(r=>r.json())).length,0);
  response=await request('/marketing-site/publicacoes/'+saved.id,'PUT',{...lista.itens[0],status:'PUBLICADO'});assert.equal(response.status,200);
  lista=await request('/public/publicacoes').then(r=>r.json());assert.equal(lista.length,1);assert.equal(lista[0].imagemUrl,image.url);assert.equal(lista[0].preco,299.9);assert.equal(lista[0].condicaoPagamento,'À vista no Pix');assert.equal(lista[0].destaque,false);assert.deepEqual(lista[0].galeria,[extra.url]);
  for(const height of [1350,1920]){const jpg=await sharp({create:{width:1080,height,channels:3,background:'#237443'}}).jpeg().toBuffer();response=await request('/marketing-site/arte','POST',jpg,'image/jpeg');assert.equal(response.status,201);const artifact=await response.json();files.push(path.join(root,artifact.url.replace('/api/uploads/','')));const meta=await sharp(await readFile(files.at(-1))).metadata();assert.equal(meta.width,1080);assert.equal(meta.height,height);assert.equal(meta.format,'jpeg')}
  const cover=files.at(-2);const coverUrl='/api/uploads/'+path.relative(root,cover).replaceAll('\\','/');response=await request('/marketing-site/publicacoes/'+saved.id,'PUT',{...body,status:'PUBLICADO',arte:{...body.arte,capaSiteUrl:coverUrl}});assert.equal(response.status,200);lista=await request('/public/publicacoes').then(r=>r.json());assert.equal(lista[0].imagemUrl,coverUrl);assert.deepEqual(lista[0].galeria,[extra.url]);
  process.env.INSTAGRAM_ACCESS_TOKEN='simulado-sem-acesso-real';process.env.INSTAGRAM_ACCOUNT_ID='123';process.env.SITE_PUBLIC_URL='https://empresa.example';
  for(const formato of ['FEED','STORIES']){const data={autorizado:true,formato,imagemUrl:'/api/uploads/site/banners/12345678-1234-1234-1234-123456789abc.jpg'};response=await request('/marketing-site/publicacoes/'+saved.id+'/instagram','POST',data);assert.equal(response.status,200);assert.equal((await response.json()).estado,'PROCESSANDO');response=await request('/marketing-site/publicacoes/'+saved.id+'/instagram','POST',data);assert.equal((await response.json()).estado,'PUBLICADO');const calls=metaCalls;await request('/marketing-site/publicacoes/'+saved.id+'/instagram','POST',data);assert.equal(metaCalls,calls)}
  response=await request('/marketing-site/publicacoes/'+saved.id,'PUT',{...body,inicio:'2099-01-01',status:'PUBLICADO'});assert.equal(response.status,200);assert.equal((await request('/public/publicacoes').then(r=>r.json())).length,0);
 }finally{global.fetch=nativeFetch;for(const [delegate,key,fn]of original)delegate[key]=fn;for(const [key,value]of Object.entries(env)){if(value===undefined)delete process.env[key];else process.env[key]=value}await new Promise(r=>server.close(r));for(const file of files)await unlink(file);for(const dir of [path.join(root,'site','banners'),path.join(root,'site'),root])await rmdir(dir).catch(e=>{if(e.code!=='ENOENT')throw e});await prisma.$disconnect()}
});
