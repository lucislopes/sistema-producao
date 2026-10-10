import test from 'node:test';
import assert from 'node:assert/strict';
import {validarMarketing,statusPublicacao,acessoSite,rotaSomenteSite} from '../src/utils/siteMarketing.js';
import {publicarInstagram} from '../src/utils/instagramSite.js';
const base={titulo:'Corte MDF',descricao:'Seu projeto pronto.',tipo:'PROMOCAO',status:'PUBLICADO',arte:{modelo:'oferta'}};
test('agendamento, validade e rascunho não expõem conteúdo antes da hora',()=>{const agora=new Date('2026-10-07T12:00Z');assert.equal(statusPublicacao({...base,inicio:'2026-10-08'},agora),'AGENDADO');assert.equal(statusPublicacao({...base,fim:agora},agora),'EXPIRADO');assert.equal(statusPublicacao({...base,status:'RASCUNHO'},agora),'RASCUNHO');assert.equal(statusPublicacao(base,agora),'PUBLICADO')});
test('valida preços, datas, URLs e limita campos; ignora identificadores da Meta enviados pelo cliente',()=>{const v=validarMarketing({...base,preco:'123.45',instagramId:'falso'});assert.equal(v.preco,123.45);assert.equal(v.instagramId,undefined);for(const patch of [{preco:-1},{ordem:-1},{inicio:'2026-10-10',fim:'2026-10-09'},{imagemUrl:'javascript:alert(1)'},{descricao:'a'.repeat(10001)},{arte:{modelo:'inexistente'}}])assert.throws(()=>validarMarketing({...base,...patch}));assert.throws(()=>validarMarketing({...base,slug:'../../secret',tipo:'MARCA'},true))});
test('permissões de conteúdo e promoções são independentes e acesso somente ao site bloqueia operação',()=>{assert.equal(acessoSite({funcao:'VENDEDOR',permissoesSite:['PROMOCOES']},'CONTEUDO'),false);assert.equal(acessoSite({funcao:'VENDEDOR',permissoesSite:['PROMOCOES']},'PROMOCOES'),true);assert.equal(acessoSite({funcao:'ADMIN'},'ADMINISTRAR'),true);for(const path of ['/pedidos','/site-relatorios','/clientes','/site-falso'])assert.equal(rotaSomenteSite(path),false);for(const path of ['/auth/me','/auth/minha-senha','/site/banners','/marketing-site/publicacoes'])assert.equal(rotaSomenteSite(path),true)});
test('sem credenciais nunca chama a Meta nem informa publicação',async()=>{await assert.rejects(publicarInstagram({imagemUrl:'x'},{env:{},fetcher:()=>assert.fail()}),e=>e.status===409)});
const env={INSTAGRAM_ACCESS_TOKEN:'token-teste',INSTAGRAM_ACCOUNT_ID:'123',META_GRAPH_VERSION:'v25.0',SITE_PUBLIC_URL:'https://empresa.example'};
const imagemUrl='/api/uploads/site/banners/12345678-1234-1234-1234-123456789abc.jpg';
test('Meta exige JPEG HTTPS próprio, cria container, espera processamento e confirma ID real',async()=>{const calls=[];const fetcher=async(url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>url.includes('media_publish')?{id:'real-media'}:opts.method==='GET'?{status_code:'FINISHED'}:{id:'container-real'}}};await assert.rejects(publicarInstagram({imagemUrl:'https://outro.example/a.jpg'},{env,fetcher}),e=>e.status===400);const criado=await publicarInstagram({imagemUrl,legenda:'Legenda'},{env,fetcher});assert.equal(criado.estado,'PROCESSANDO');assert.equal(criado.id,undefined);const publicado=await publicarInstagram({container:criado.container},{env,fetcher});assert.equal(publicado.id,'real-media');assert.equal(calls.length,3);assert.match(calls[2].url,/graph.instagram.com\/v25.0\/123\/media_publish/);assert.equal(calls[0].opts.headers.Authorization,'Bearer token-teste')});
test('processamento pendente e falha Meta não simulam sucesso',async()=>{const pending=await publicarInstagram({container:'123'},{env,fetcher:async()=>({ok:true,json:async()=>({status_code:'IN_PROGRESS'})})});assert.equal(pending.estado,'PROCESSANDO');assert.equal(pending.id,undefined);await assert.rejects(publicarInstagram({imagemUrl},{env,fetcher:async()=>({ok:false,json:async()=>({error:{message:'segredo'}})})}),e=>e.status===502&&!e.message.includes('segredo'))});

test('anúncios classificam máquinas e ferramentas sem migração e rejeitam categorias desconhecidas',()=>{for(const categoria of ['MATERIAIS','SERVICOS','MAQUINAS','FERRAMENTAS'])assert.equal(validarMarketing({...base,arte:{modelo:'oferta',categoria}}).arte.categoria,categoria);assert.equal(validarMarketing(base).arte.categoria,'MATERIAIS');assert.throws(()=>validarMarketing({...base,arte:{categoria:'INVALIDA'}}));});

test('Stories envia arte sem legenda de Feed; Feed preserva caption',async()=>{
 const requests=[];const fetcher=async(url,opts)=>{requests.push(opts.body);return {ok:true,json:async()=>({id:'container'})}};
 await publicarInstagram({imagemUrl,legenda:'Minha legenda',formato:'STORIES'},{env,fetcher});assert.equal(requests[0].get('media_type'),'STORIES');assert.equal(requests[0].has('caption'),false);
 await publicarInstagram({imagemUrl,legenda:'Minha legenda',formato:'FEED'},{env,fetcher});assert.equal(requests[1].get('caption'),'Minha legenda');
});

test('modelos premium e antigos preservam imagem, preço e enquadramento ao salvar e reabrir',()=>{
 const imagemUrl='/api/uploads/site/banners/12345678-1234-1234-1234-123456789abc.webp';
 for(const modelo of ['impacto','premium','moderno','oferta','editorial','servico']){
  const criado=validarMarketing({...base,imagemUrl,preco:'299.90',arte:{modelo,zoomImagem:1.85,posicaoX:.2,posicaoY:.75}});
  const reaberto=validarMarketing(JSON.parse(JSON.stringify(criado)));
  assert.deepEqual(reaberto,criado);assert.equal(reaberto.imagemUrl,imagemUrl);assert.equal(reaberto.arte.zoomImagem,1.85);
 }
 for(const patch of [{zoomImagem:0},{zoomImagem:3},{posicaoX:-1},{posicaoY:2},{zoomImagem:'inválido'}])assert.throws(()=>validarMarketing({...base,arte:{modelo:'impacto',...patch}}));
});
