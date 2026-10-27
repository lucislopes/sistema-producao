import {configLogin,criarLogin,verificarLogin,trocarCodigo,decifrarToken} from '../utils/instagramConexao.js';
import {Router,json,raw} from 'express';
import {filtroPaginasSite} from '../utils/filtroPaginasSite.js';
import {prisma} from '../lib/prisma.js';
import {authMiddleware} from '../middlewares/auth.middleware.js';
import {acessoSite,validarMarketing,statusPublicacao} from '../utils/siteMarketing.js';
import {configuracaoInstagram,publicarInstagram} from '../utils/instagramSite.js';
import {salvarImagemSite,limitarUpload} from '../utils/siteUpload.js';
export const marketingAdminRoutes=Router(),marketingPublicRoutes=Router();
marketingAdminRoutes.get('/instagram/callback',async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 const login=configLogin();if(!login.pronto)return res.status(409).send('Conexão Instagram ainda não configurada nesta instalação.');
 const destino=new URL('/empresa/publicacoes',process.env.SITE_PUBLIC_URL);
 try{
   const state=verificarLogin(req.query.state);const saved=await prisma.instagramConexaoSite.findUnique({where:{id:'principal'}});
   if(saved?.nonceHash!==state.nonceHash||saved.usuarioId!==state.usuarioId)throw new Error('Autorização expirada.');
   const user=await prisma.usuario.findUnique({where:{id:state.usuarioId},include:{funcionario:true}});
   if(!user||user.funcionario.ativo===false||!acessoSite({...user,funcao:user.funcionario.funcao},'PROMOCOES'))throw new Error('Sem permissão.');
   const claim=await prisma.instagramConexaoSite.updateMany({where:{id:'principal',nonceHash:state.nonceHash},data:{nonceHash:null,usuarioId:null}});if(!claim.count)throw new Error('Autorização já utilizada.');
   if(req.query.error)throw new Error('Autorização recusada.');
   const data=await trocarCodigo(req.query.code);await prisma.instagramConexaoSite.update({where:{id:'principal'},data});destino.searchParams.set('instagram','conectado');
 }catch{destino.searchParams.set('instagram','falha')}
 res.redirect(303,destino.href);
});
marketingAdminRoutes.use(authMiddleware,(req,res,next)=>{res.setHeader('Cache-Control','private, no-store');next()});
const permitir=p=>(req,res,next)=>acessoSite(req.user,p)?next():res.status(403).json({error:'Sem permissão para esta área do site.'});
const tratar=fn=>async(req,res,next)=>{try{await fn(req,res)}catch(e){if(e.status)return res.status(e.status).json({error:e.message});if(e.code==='P2025')return res.status(404).json({error:'Registro não encontrado.'});if(e.code==='P2002')return res.status(409).json({error:'URL já cadastrada.'});next(e)}};
for(const [tipo,model,permission]of [['paginas','paginaSite','CONTEUDO'],['publicacoes','publicacaoSite','PROMOCOES']]){
  marketingAdminRoutes.get(`/${tipo}`,permitir(permission),tratar(async(req,res)=>{const pagina=Math.max(1,Math.min(10000,Math.floor(Number(req.query.pagina))||1));const where=tipo==='paginas'?filtroPaginasSite(req.query.tipo):{};const [itens,total]=await Promise.all([prisma[model].findMany({where,take:20,skip:(pagina-1)*20,orderBy:[{ordem:'asc'},{createdAt:'desc'}]}),prisma[model].count({where})]);res.json({itens:itens.map(i=>tipo==='publicacoes'?{...i,situacao:statusPublicacao(i)}:i),total,pagina})}));
  marketingAdminRoutes.post(`/${tipo}`,permitir(permission),json({limit:'30kb'}),tratar(async(req,res)=>res.status(201).json(await prisma[model].create({data:validarMarketing(req.body,tipo==='paginas')}))));
  marketingAdminRoutes.put(`/${tipo}/:id`,permitir(permission),json({limit:'30kb'}),tratar(async(req,res)=>res.json(await prisma[model].update({where:{id:req.params.id},data:validarMarketing(req.body,tipo==='paginas')}))));
  marketingAdminRoutes.delete(`/${tipo}/:id`,permitir(permission),tratar(async(req,res)=>{await prisma[model].delete({where:{id:req.params.id}});res.status(204).end()}));
}
async function ambienteInstagram(){
 const saved=await prisma.instagramConexaoSite.findUnique({where:{id:'principal'}});
 if(saved?.tokenCifrado&&saved.expiraEm>new Date())return {...process.env,INSTAGRAM_ACCESS_TOKEN:decifrarToken(saved.tokenCifrado),INSTAGRAM_ACCOUNT_ID:saved.conta};
 return process.env;
}
marketingAdminRoutes.get('/instagram',permitir('PROMOCOES'),tratar(async(req,res)=>{const c=configuracaoInstagram(await ambienteInstagram()),saved=await prisma.instagramConexaoSite.findUnique({where:{id:'principal'}});res.json({configurado:!!(c.token&&c.conta&&c.origem?.startsWith('https://')),conexaoDisponivel:configLogin().pronto,username:saved?.expiraEm>new Date()?saved.username:null,expiraEm:saved?.expiraEm,permissoes:['instagram_business_basic','instagram_business_content_publish']})}));
marketingAdminRoutes.post('/instagram/conectar',permitir('PROMOCOES'),tratar(async(req,res)=>{const login=criarLogin(req.user.id);await prisma.instagramConexaoSite.upsert({where:{id:'principal'},create:{nonceHash:login.nonceHash,usuarioId:req.user.id},update:{nonceHash:login.nonceHash,usuarioId:req.user.id}});res.json({url:login.url})}));
marketingAdminRoutes.get('/publicacoes/:id/instagram',permitir('PROMOCOES'),tratar(async(req,res)=>{const p=await prisma.publicacaoSite.findUnique({where:{id:req.params.id},select:{instagramId:true,instagramContainer:true}});if(!p)throw Object.assign(new Error('Anúncio não encontrado.'),{status:404});res.json({envios:await prisma.instagramEnvioSite.findMany({where:{publicacaoId:req.params.id},select:{formato:true,estado:true,instagramId:true}}),legado:!!(p.instagramId||p.instagramContainer)})}));
marketingAdminRoutes.post('/arte',permitir('PROMOCOES'),limitarUpload,raw({type:'image/jpeg',limit:'5mb'}),tratar(async(req,res)=>res.status(201).json(await salvarImagemSite(req.body,'image/jpeg','banners',undefined,true))));
marketingAdminRoutes.post('/publicacoes/:id/instagram',permitir('PROMOCOES'),json({limit:'4kb'}),tratar(async(req,res)=>{
  if(req.body?.autorizado!==true)return res.status(400).json({error:'Confirme a autorização de publicação.'});
  if(!['FEED','STORIES'].includes(req.body.formato))return res.status(400).json({error:'Formato inválido.'});
  const p=await prisma.publicacaoSite.findUnique({where:{id:req.params.id}});
  if(!p)throw Object.assign(new Error('Publicação não encontrada.'),{status:404});
  if(p.instagramId||p.instagramContainer)throw Object.assign(new Error('Este anúncio possui envio antigo sem formato identificado. Duplique o anúncio para enviar Feed e Stories com segurança.'),{status:409});
  const env=await ambienteInstagram(),conta=env.INSTAGRAM_ACCOUNT_ID;
  if(!env.INSTAGRAM_ACCESS_TOKEN||!conta)throw Object.assign(new Error('Conecte o Instagram antes de publicar.'),{status:409});
  const formato=req.body.formato;
  const envio=await prisma.instagramEnvioSite.upsert({where:{publicacaoId_formato:{publicacaoId:p.id,formato}},create:{publicacaoId:p.id,formato,conta},update:{}});
  if(envio.instagramId)return res.json({estado:'PUBLICADO',id:envio.instagramId,formato});
  if(envio.conta!==conta)throw Object.assign(new Error('Este envio pertence a outra conta. Crie outro anúncio para a nova conta.'),{status:409});
  const claim=await prisma.instagramEnvioSite.updateMany({where:{id:envio.id,estado:{not:'ENVIANDO'},instagramId:null},data:{estado:'ENVIANDO'}});
  if(!claim.count)throw Object.assign(new Error('Envio pendente de confirmação. Confira a conta antes de repetir para evitar duplicação.'),{status:409});
  try{
    const r=await publicarInstagram({imagemUrl:req.body.imagemUrl,legenda:`${p.arte.legenda||p.descricao}\n${p.arte.hashtags||''}`,formato,container:envio.container},{env});
    await prisma.instagramEnvioSite.update({where:{id:envio.id},data:{instagramId:r.id,container:r.container,estado:r.estado}});res.json({...r,formato});
  }catch(error){if(!envio.container)await prisma.instagramEnvioSite.update({where:{id:envio.id},data:{estado:'MANUAL'}});throw error;}
}));
marketingAdminRoutes.get('/permissoes',permitir('ADMINISTRAR'),tratar(async(req,res)=>res.json(await prisma.usuario.findMany({take:200,select:{id:true,email:true,permissoesSite:true,somenteSite:true,funcionario:{select:{nome:true,funcao:true}}}}))));
marketingAdminRoutes.put('/permissoes/:id',permitir('ADMINISTRAR'),json({limit:'2kb'}),tratar(async(req,res)=>{
  const p=req.body?.permissoesSite;if(!Array.isArray(p)||p.some(v=>!['CONTEUDO','PROMOCOES','RELATORIOS_EMPRESA','CONFIGURACAO_SITE'].includes(v))||typeof req.body.somenteSite!=='boolean')throw Object.assign(new Error('Permissões inválidas.'),{status:400});
  const u=await prisma.usuario.findUnique({where:{id:req.params.id},include:{funcionario:true}});if(!u)throw Object.assign(new Error('Usuário não encontrado.'),{status:404});
  if(u.funcionario.funcao==='ADMIN')throw Object.assign(new Error('Administradores mantêm acesso completo.'),{status:400});
  res.json(await prisma.usuario.update({where:{id:u.id},data:{permissoesSite:[...new Set(p)],somenteSite:req.body.somenteSite},select:{id:true,permissoesSite:true,somenteSite:true}}));
}));
marketingPublicRoutes.use(['/paginas','/publicacoes'],async(req,res,next)=>{try{const c=await prisma.configuracaoSite.findUnique({where:{id:'principal'},select:{ativo:true}});if(!c?.ativo)return res.status(404).json({error:'Site indisponível.'});res.setHeader('Cache-Control','no-store');next()}catch(e){next(e)}});
marketingPublicRoutes.get('/paginas',tratar(async(req,res)=>res.json(await prisma.paginaSite.findMany({where:{ativo:true},take:100,orderBy:[{ordem:'asc'},{titulo:'asc'},{id:'asc'}]}))));
marketingPublicRoutes.get('/publicacoes',tratar(async(req,res)=>{const agora=new Date();const itens=await prisma.publicacaoSite.findMany({where:{status:'PUBLICADO',AND:[{OR:[{inicio:null},{inicio:{lte:agora}}]},{OR:[{fim:null},{fim:{gt:agora}}]}]},take:100,orderBy:[{destaque:'desc'},{ordem:'asc'},{createdAt:'desc'}],select:{id:true,tipo:true,titulo:true,descricao:true,imagemUrl:true,ajusteImagem:true,preco:true,precoAnterior:true,fim:true,destaque:true,arte:true}});res.json(itens.map(({arte,...item})=>({...item,imagemUrl:arte?.capaSiteUrl||item.imagemUrl,galeria:arte?.galeria||[],ajustesGaleria:arte?.ajustesGaleria||{},condicaoPagamento:arte?.condicaoPagamento||'',categoria:arte?.categoria||'MATERIAIS'})))}));
