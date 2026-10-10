import {acessoRotaSite} from '../utils/siteMarketing.js';
import { Router, json, raw } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';
import { bloquearAgenda } from '../utils/limitesDiarios.js';
import { criarHandlersConfiguracaoSite, configuracaoPublica, empresaPublicaSelect } from '../utils/configuracaoSite.js';
import { criarHandlersConteudoSite, selectsSite } from '../utils/siteConteudo.js';
import { salvarImagemSite, limitarUpload, uploadRoot } from '../utils/siteUpload.js';
import { obterArmazenamento, salvarCota } from '../utils/siteArmazenamento.js';

const handlers = criarHandlersConfiguracaoSite(prisma, bloquearAgenda);
export const siteAdminRoutes = Router();
siteAdminRoutes.use(authMiddleware, (req,res,next)=>{if(acessoRotaSite(req.user,req.path))return next();res.status(403).json({error:'Sem permissão para gerenciar esta área do site.'});});
siteAdminRoutes.use((req,res,next)=>{res.setHeader('Cache-Control','private, no-store');next()});
siteAdminRoutes.get('/previa',async(req,res,next)=>{
  res.setHeader('Cache-Control','private, no-store');
  try {
    const [empresa,config,produtos,categorias,paginas] = await Promise.all([
      prisma.configuracaoEmpresa.findFirst({select:empresaPublicaSelect}),
      prisma.configuracaoSite.findUnique({where:{id:'principal'}}),
      prisma.produtoSite.findMany({where:{ativo:true,OR:[{categoriaId:null},{categoria:{ativo:true}}]},select:selectsSite.produtos,take:500,orderBy:[{ordem:'asc'},{id:'asc'}]}),
      prisma.categoriaSite.findMany({where:{ativo:true},select:selectsSite.categorias,take:500,orderBy:[{ordem:'asc'},{id:'asc'}]}),
      prisma.paginaSite.findMany({where:{ativo:true},take:100,orderBy:[{ordem:'asc'},{titulo:'asc'},{id:'asc'}]})
    ]);
    res.json({configuracao:configuracaoPublica(empresa,config),produtos,categorias,paginas});
  }catch(error){next(error)}
});
siteAdminRoutes.get('/armazenamento', async (req,res,next) => {
  try { res.json(await obterArmazenamento(uploadRoot())); } catch(e) { next(e); }
});
siteAdminRoutes.put('/armazenamento', roleMiddleware('ADMIN'), json({limit:'1kb'}), async (req,res,next) => {
  try { res.json(await salvarCota(uploadRoot(), req.body?.cotaMB)); }
  catch(e) { if(e.status) return res.status(e.status).json({error:e.message}); next(e); }
});
siteAdminRoutes.get('/configuracao', handlers.obter);
siteAdminRoutes.put('/configuracao', json({ limit: '3mb' }), handlers.salvar);
const cms = criarHandlersConteudoSite(prisma);
siteAdminRoutes.get('/conteudo', cms.obter);
siteAdminRoutes.put('/conteudo', json({limit:'100kb'}), cms.salvar);
for (const tipo of ['produtos','categorias','banners']) {
  siteAdminRoutes.get(`/${tipo}`, cms.listar(tipo));
  siteAdminRoutes.post(`/${tipo}`, json({limit:'30kb'}), cms.salvarRegistro(tipo));
  siteAdminRoutes.put(`/${tipo}/:id`, json({limit:'30kb'}), cms.salvarRegistro(tipo));
  siteAdminRoutes.patch(`/${tipo}/:id/desativar`, async (req,res,next)=>{
    try { const model={produtos:'produtoSite',categorias:'categoriaSite',banners:'bannerSite'}[tipo];res.json(await prisma[model].update({where:{id:req.params.id},data:{ativo:false}})); }
    catch(e){if(e.code==='P2025')return res.status(404).json({error:'Registro não encontrado.'});next(e);}
  });
}
siteAdminRoutes.post('/imagens/:grupo', limitarUpload, raw({type:['image/png','image/jpeg','image/webp'],limit:'5mb'}), async (req,res,next) => {
  try {
    if (!['configuracao','conteudo','produtos','categorias','banners'].includes(req.params.grupo)) return res.status(400).json({error:'Destino da imagem inválido.'});
    let result;
    try { result = await salvarImagemSite(req.body, req.get('Content-Type')?.split(';')[0].trim().toLowerCase(), req.params.grupo==='conteudo'?'configuracao':req.params.grupo); }
    catch(error) { if (error.code) throw error; return res.status(error.status || 400).json({error:error.message}); }
    res.status(201).json(result);
  } catch(error) { next(error); }
});
siteAdminRoutes.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Arquivo ou conteúdo maior que o limite permitido.' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  next(error);
});
export const sitePublicRoutes = Router();
sitePublicRoutes.get('/configuracao', handlers.publico);
for (const tipo of ['produtos','categorias','banners']) sitePublicRoutes.get(`/${tipo}`, cms.publico(tipo));
