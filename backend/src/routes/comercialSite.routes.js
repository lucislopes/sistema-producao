import {numeroPedidoComercial,vincularPedidoSite} from '../utils/vinculoPedidoSite.js';
import {validarOrigemComercial} from '../utils/origemComercial.js';
import { readFile } from 'node:fs/promises';
import { Router, json, raw } from 'express';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';
import { criarLimitadorConsulta, resumoSite } from '../utils/acompanhamento.js';
import { bloquearAgenda, validarLimitesPedido } from '../utils/limitesDiarios.js';
import { validarSolicitacao, etapasOrcamento, textoSolicitacao } from '../utils/orcamentoSite.js';
import { limitarProcessamento } from '../utils/limitarProcessamento.js';
import { enderecoClienteSite } from '../utils/conviteClienteSite.js';
import { tokenAnexos,autorizaAnexos,prepararAnexo,guardarAnexo,hashArquivo,resumoAnexo,caminhoAnexo,LIMITE_ANEXO,ocuparAnexos,QUOTA_ANEXOS } from '../utils/anexosOrcamento.js';
const digest=value=>createHash('sha256').update(value).digest('hex');
const failure=(res,e)=>res.status(e.statusCode||e.status||500).json({error:e.status||e.statusCode?e.message:'Não foi possível concluir. Tente novamente.'});
const bad=message=>Object.assign(new Error(message),{status:400});
export const comercialPublicRoutes=Router();
comercialPublicRoutes.use(json({limit:'40kb'}),(req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
comercialPublicRoutes.post('/orcamentos',criarLimitadorConsulta({limite:10}),async(req,res)=>{
 try{
  if(!(await prisma.configuracaoSite.findUnique({where:{id:'principal'}}))?.ativo)return res.status(404).json({error:'Atendimento indisponível.'});
  let dados;try{dados=validarSolicitacao(req.body)}catch(e){throw bad(e.message)}
  const result=await prisma.orcamentoSite.upsert({where:{chave:dados.chave},update:{},create:{id:randomUUID(),...dados}});
  res.status(201).json({protocolo:result.protocolo,id:result.id,tokenAnexos:tokenAnexos(result.chave)});
 }catch(e){failure(res,e)}
});
const anexoLimiter=criarLimitadorConsulta({limite:15});
const anexoProcessamento=limitarProcessamento(1);
comercialPublicRoutes.post('/orcamentos/:id/anexos',anexoLimiter,async(req,res,next)=>{
 try{
  if(!(await prisma.configuracaoSite.findUnique({where:{id:'principal'},select:{ativo:true}}))?.ativo)return res.status(404).json({error:'Atendimento indisponível.'});
  const q=await prisma.orcamentoSite.findUnique({where:{id:req.params.id}});
  if(!autorizaAnexos(q,req.headers['x-upload-token']))return res.status(401).json({error:'Prazo de envio encerrado ou acesso inválido. Seu orçamento permanece registrado.'});
  req.orcamentoAnexo=q;next();
 }catch(e){failure(res,e)}
},anexoProcessamento(async(req,res)=>{
 await new Promise(resolve=>raw({type:['application/pdf','image/jpeg','image/png'],limit:LIMITE_ANEXO})(req,res,async error=>{
  if(error){res.status(error.status||400).json({error:'Envie um arquivo de até 5 MB.'});resolve();return;}
  try{
   let nome;try{nome=decodeURIComponent(req.headers['x-file-name']||'arquivo');}catch{throw bad('Nome de arquivo inválido.');}
   const file=await prepararAnexo(req.body,req.headers['content-type']?.split(';')[0],nome);
   const saved=await guardarAnexo(prisma,req.orcamentoAnexo,file,hashArquivo(req.body));
   res.status(201).json(resumoAnexo(saved));
  }catch(e){failure(res,e)}finally{resolve();}
 }));
}));
const loginLimiter=criarLimitadorConsulta({limite:10});
const senhaLimiter=limitarProcessamento(2);
comercialPublicRoutes.post('/cliente/ativar',loginLimiter,senhaLimiter(async(req,res)=>{
 try{
  const {convite,documento,senha}=req.body||{};
  if(typeof convite!=='string'||!/^[a-f0-9]{64}$/.test(convite)||typeof senha!=='string'||senha.length<10||Buffer.byteLength(senha,'utf8')>72||typeof documento!=='string')throw bad('Convite ou dados inválidos. A senha precisa ter de 10 a 72 caracteres.');
  const acesso=await prisma.acessoClienteSite.findUnique({where:{conviteHash:digest(convite)},include:{cliente:true}});
  if(!acesso||!acesso.ativo||!acesso.conviteExpira||acesso.conviteExpira<new Date()||acesso.cliente.documento?.replace(/\D/g,'')!==documento.replace(/\D/g,''))throw bad('Convite ou dados inválidos. Solicite um novo convite à equipe.');
  const hash=await bcrypt.hash(senha,12);
  const updated=await prisma.acessoClienteSite.updateMany({where:{id:acesso.id,conviteHash:digest(convite)},data:{senhaHash:hash,conviteHash:null,conviteExpira:null,versao:{increment:1}}});
  if(updated.count!==1)throw bad('Convite já utilizado.');
  res.json({ok:true});
 }catch(e){failure(res,e)}
}));
comercialPublicRoutes.post('/cliente/login',loginLimiter,senhaLimiter(async(req,res)=>{
 try{
  const {documento,senha}=req.body||{};const doc=typeof documento==='string'?documento.replace(/\D/g,''):'';
  if(![11,14].includes(doc.length)||typeof senha!=='string'||Buffer.byteLength(senha,'utf8')>72) return res.status(401).json({error:'Documento ou senha inválidos.'});
  const matches=await prisma.$queryRaw`SELECT "id" FROM "Cliente" WHERE regexp_replace(COALESCE("documento",''),'[^0-9]','','g')=${doc} LIMIT 2`;
  const access=matches.length===1?await prisma.acessoClienteSite.findUnique({where:{clienteId:matches[0].id}}):null;
  const dummy='$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';
  const valid=await bcrypt.compare(senha,access?.senhaHash||dummy);
  if(!access?.ativo||!access.senhaHash||!valid)return res.status(401).json({error:'Documento ou senha inválidos.'});
  res.json({token:jwt.sign({acessoId:access.id,versao:access.versao},process.env.JWT_SECRET,{expiresIn:'1h',audience:'cliente-site',issuer:'sistema-producao'}),nome:(await prisma.cliente.findUnique({where:{id:access.clienteId}})).nome});
 }catch(e){failure(res,e)}
}));
async function clienteAuth(req,res,next){try{const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];const decoded=jwt.verify(token,process.env.JWT_SECRET,{audience:'cliente-site',issuer:'sistema-producao'});const access=await prisma.acessoClienteSite.findUnique({where:{id:decoded.acessoId}});if(!access?.ativo||access.versao!==decoded.versao)throw new Error();req.clienteId=access.clienteId;next();}catch{return res.status(401).json({error:'Sessão expirada. Entre novamente.'});}}
comercialPublicRoutes.get('/cliente/pedidos',clienteAuth,async(req,res)=>{
 try{const page=Math.max(0,Math.min(10000,parseInt(req.query.pagina)||0));const activeWhere={clienteId:req.clienteId,status:{notIn:['ENTREGUE','CANCELADO']}};const activeCount=await prisma.pedido.count({where:activeWhere});const offset=page*20;const active=offset<activeCount?await prisma.pedido.findMany({where:activeWhere,select:{id:true,numeroPedido:true,numeroPedidoManual:true,origemPedido:true,status:true,dataEntrega:true,tipoEntrega:true,updatedAt:true},orderBy:[{updatedAt:'desc'},{id:'desc'}],skip:offset,take:21}):[];const completed=active.length<21?await prisma.pedido.findMany({where:{clienteId:req.clienteId,status:{in:['ENTREGUE','CANCELADO']}},select:{id:true,numeroPedido:true,numeroPedidoManual:true,origemPedido:true,status:true,dataEntrega:true,tipoEntrega:true,updatedAt:true},orderBy:[{updatedAt:'desc'},{id:'desc'}],skip:Math.max(0,offset-activeCount),take:21-active.length}):[];const items=[...active,...completed];res.json({pedidos:items.slice(0,20).map(p=>({...resumoSite({...p,historicos:[]}),id:p.id,emAndamento:!['ENTREGUE','CANCELADO'].includes(p.status)})),mais:items.length>20});}catch(e){failure(res,e)}
});
comercialPublicRoutes.get('/cliente/pedidos/:id',clienteAuth,async(req,res)=>{
 try{const p=await prisma.pedido.findFirst({where:{id:req.params.id,clienteId:req.clienteId},select:{numeroPedido:true,numeroPedidoManual:true,origemPedido:true,status:true,dataEntrega:true,tipoEntrega:true,historicos:{select:{tipo:true,descricao:true,createdAt:true},orderBy:{createdAt:'desc'},take:100}}});if(!p)return res.status(404).json({error:'Pedido não encontrado.'});const q=await prisma.orcamentoSite.findFirst({where:{pedidoId:req.params.id}});res.json({...resumoSite(p),recompra:{pecas:q?.detalhes.pecas||[],materiais:q?.detalhes.materiais||[]}});}catch(e){failure(res,e)}
});
comercialPublicRoutes.post('/cliente/pedidos/:id/recomprar',clienteAuth,criarLimitadorConsulta({limite:10}),async(req,res)=>{
 try{const q=await prisma.orcamentoSite.findFirst({where:{pedidoId:req.params.id}});const p=await prisma.pedido.findFirst({where:{id:req.params.id,clienteId:req.clienteId},include:{cliente:true}});if(!p)return res.status(404).json({error:'Pedido não encontrado.'});let dados;try{dados=validarSolicitacao({...req.body,nome:p.cliente.nome,telefone:p.cliente.telefone||req.body.telefone,documento:p.cliente.documento?.replace(/\D/g,''),email:p.cliente.email||'',observacao:req.body.observacao||`Recompra do pedido ${p.numeroPedidoManual||p.numeroPedido}. Confirmar materiais, medidas e valores com a equipe.`,pecas:req.body.pecas||q?.detalhes.pecas||[],materiais:req.body.materiais||q?.detalhes.materiais||[]})}catch(e){throw bad(e.message)}const result=await prisma.orcamentoSite.upsert({where:{chave:dados.chave},update:{},create:{id:randomUUID(),...dados}});res.status(201).json({protocolo:result.protocolo,id:result.id,tokenAnexos:tokenAnexos(result.chave)});}catch(e){failure(res,e)}
});
export const comercialAdminRoutes=Router();
comercialAdminRoutes.use(authMiddleware,roleMiddleware('ADMIN'),json({limit:'40kb'}));
comercialAdminRoutes.get('/anexos/armazenamento',async(req,res)=>{try{const usage=await ocuparAnexos();res.json({...usage,limiteBytes:QUOTA_ANEXOS,retencaoDias:30});}catch(e){failure(res,e)}});
comercialAdminRoutes.get('/anexos/:id',async(req,res)=>{
 try{const a=await prisma.anexoOrcamentoSite.findUnique({where:{id:req.params.id}});
  if(!a)return res.status(404).json({error:'Anexo não encontrado.'});
  if(a.removidoEm||a.expiraEm<=new Date())return res.status(410).json({error:'Anexo expirado. O orçamento continua disponível.'});
  res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(a.nome).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}`);
  res.type('application/octet-stream');res.send(await readFile(caminhoAnexo(a.arquivo)));
 }catch(e){failure(res,e)}
});
comercialAdminRoutes.get('/pedidos/:id/origem-comercial',async(req,res)=>{
 try{if(!await prisma.pedido.findUnique({where:{id:req.params.id},select:{id:true}}))return res.status(404).json({error:'Pedido não encontrado.'});const rows=await prisma.$queryRaw`SELECT * FROM "OrigemComercialPedido" WHERE "pedidoId"=${req.params.id}`;res.json(rows[0]||{origem:'SISTEMA',contatoRecebidoEm:null,primeiraRespostaEm:null})}catch(e){failure(res,e)}
});
comercialAdminRoutes.put('/pedidos/:id/origem-comercial',async(req,res)=>{
 try{const d=validarOrigemComercial(req.body);await prisma.$transaction(async tx=>{await bloquearAgenda(tx);if(!await tx.pedido.findUnique({where:{id:req.params.id},select:{id:true}}))throw bad('Pedido não encontrado.');await tx.$executeRaw`INSERT INTO "OrigemComercialPedido"("pedidoId",origem,"contatoRecebidoEm","primeiraRespostaEm","updatedAt") VALUES(${req.params.id},${d.origem},${d.contatoRecebidoEm},${d.primeiraRespostaEm},NOW()) ON CONFLICT("pedidoId") DO UPDATE SET origem=EXCLUDED.origem,"contatoRecebidoEm"=EXCLUDED."contatoRecebidoEm","primeiraRespostaEm"=EXCLUDED."primeiraRespostaEm","updatedAt"=NOW()`;await tx.historicoPedido.create({data:{pedidoId:req.params.id,usuarioId:req.user.id,tipo:'PEDIDO_ATUALIZADO',descricao:`Origem comercial registrada: ${d.origem}. Horários de contato e resposta informados manualmente.`}})});res.json(d)}catch(e){failure(res,e)}
});
comercialAdminRoutes.get('/pedidos-vinculo',async(req,res)=>{
 try{const busca=String(req.query.busca||'').trim().slice(0,100);if(!busca)return res.json([]);const numero=/^\d+$/.test(busca)?Number(busca):null;const items=await prisma.pedido.findMany({where:{status:{not:'CANCELADO'},OR:[{numeroPedidoManual:{contains:busca,mode:'insensitive'}},{cliente:{nome:{contains:busca,mode:'insensitive'}}},...(Number.isSafeInteger(numero)?[{numeroPedido:numero}]:[])]},select:{id:true,numeroPedido:true,numeroPedidoManual:true,status:true,valorTotal:true,cliente:{select:{nome:true}}},orderBy:{createdAt:'desc'},take:20});res.json(items)}catch(e){failure(res,e)}
});
comercialAdminRoutes.get('/pedidos/:id/vinculo-site',async(req,res)=>{
 try{res.json(await prisma.orcamentoSite.findUnique({where:{pedidoId:req.params.id},select:{id:true,protocolo:true,nome:true}}))}catch(e){failure(res,e)}
});
comercialAdminRoutes.get('/orcamentos-vinculo',async(req,res)=>{
 try{const busca=String(req.query.busca||'').trim().slice(0,100);if(!busca)return res.json([]);const numero=/^\d+$/.test(busca)?Number(busca):null;res.json(await prisma.orcamentoSite.findMany({where:{pedidoId:null,status:'APROVADO',OR:[{nome:{contains:busca,mode:'insensitive'}},...(Number.isSafeInteger(numero)?[{protocolo:numero}]:[])]},select:{id:true,protocolo:true,nome:true,telefone:true},orderBy:{createdAt:'desc'},take:20}))}catch(e){failure(res,e)}
});
comercialAdminRoutes.post('/orcamentos/:id/vincular',async(req,res)=>{
 try{const p=await prisma.$transaction(async tx=>{await bloquearAgenda(tx);return vincularPedidoSite(tx,{orcamentoId:req.params.id,pedidoId:req.body.pedidoId,usuarioId:req.user.id})});res.json({pedidoId:p.id,numero:p.numeroPedidoManual||p.numeroPedido})}catch(e){if(e.code==='P2002')return res.status(409).json({error:'Pedido ou orçamento já vinculado. Atualize a tela.'});failure(res,e)}
});
comercialAdminRoutes.get('/orcamentos',async(req,res)=>{
 try{const pagina=Math.max(0,Math.min(10000,parseInt(req.query.pagina)||0));const status=etapasOrcamento.includes(req.query.status)?req.query.status:undefined;const items=await prisma.orcamentoSite.findMany({where:status?{status}:undefined,orderBy:[{createdAt:'desc'},{id:'desc'}],skip:pagina*20,take:21,select:{id:true,protocolo:true,nome:true,status:true,pedidoId:true,createdAt:true}});res.json({items:items.slice(0,20),mais:items.length>20,pagina});}catch(e){failure(res,e)}
});
comercialAdminRoutes.get('/orcamentos/:id',async(req,res)=>{try{const item=await prisma.orcamentoSite.findUnique({where:{id:req.params.id},include:{anexos:{select:{id:true,nome:true,bytes:true,expiraEm:true,removidoEm:true},orderBy:{createdAt:'asc'}}}});if(!item)return res.status(404).json({error:'Orçamento não encontrado.'});res.json(item);}catch(e){failure(res,e)}});
comercialAdminRoutes.patch('/orcamentos/:id',async(req,res)=>{
 try{const b=req.body;if(!etapasOrcamento.includes(b.status))throw bad('Situação inválida.');for(const key of ['notaInterna','proposta'])if(typeof b[key]!=='string'||b[key].length>5000)throw bad('Texto inválido.');if(b.responsavelId&&!await prisma.funcionario.findFirst({where:{id:b.responsavelId,ativo:true}}))throw bad('Responsável inválido.');const valor=b.valor===''||b.valor==null?null:Number(b.valor);if(valor!==null&&(!Number.isFinite(valor)||valor<0||valor>99999999))throw bad('Valor inválido.');const q=await prisma.orcamentoSite.findUnique({where:{id:req.params.id}});if(!q)return res.status(404).json({error:'Orçamento não encontrado.'});if(q.pedidoId)throw bad('Orçamento já convertido.');res.json(await prisma.orcamentoSite.update({where:{id:q.id},data:{status:b.status,notaInterna:b.notaInterna,proposta:b.proposta,valor,responsavelId:b.responsavelId||null,primeiroAtendimento:q.primeiroAtendimento||new Date()}}));}catch(e){failure(res,e)}
});
comercialAdminRoutes.post('/orcamentos/:id/converter',async(req,res)=>{
 try{const result=await prisma.$transaction(async tx=>{await bloquearAgenda(tx);const q=await tx.orcamentoSite.findUnique({where:{id:req.params.id}});if(!q||q.status!=='APROVADO')throw bad('Aprove o orçamento antes de converter.');if(q.pedidoId)return tx.pedido.findUnique({where:{id:q.pedidoId}});const b=req.body;if(!await tx.cliente.findUnique({where:{id:b.clienteId||''}})||!await tx.funcionario.findFirst({where:{id:b.vendedorId||'',ativo:true,funcao:{in:['ADMIN','VENDEDOR','VENDEDOR_OPERADOR']}}}))throw bad('Selecione cliente e vendedor válidos.');if(!['CLIENTE_RETIRA','ENTREGA_EMPRESA'].includes(b.tipoEntrega))throw bad('Selecione entrega ou retirada.');if(b.tipoEntrega==='ENTREGA_EMPRESA'&&!['EMPRESA','CLIENTE'].includes(b.responsavelFrete))throw bad('Informe o responsável pelo frete.');const dataEntrega=b.dataEntrega?new Date(`${b.dataEntrega}T12:00:00Z`):null;if(dataEntrega&&(Number.isNaN(dataEntrega.getTime())||dataEntrega.toISOString().slice(0,10)!==b.dataEntrega||b.dataEntrega<new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})))throw bad('Data prevista inválida.');const data={clienteId:b.clienteId,vendedorId:b.vendedorId,tipoEntrega:b.tipoEntrega,responsavelFrete:b.tipoEntrega==='CLIENTE_RETIRA'?null:b.responsavelFrete,dataEntrega,valorTotal:q.valor,tipoPedido:'COM_PRODUCAO',status:'ABERTO',...numeroPedidoComercial(b),observacoes:textoSolicitacao(q)};if(data.numeroPedidoManual&&await tx.pedido.findFirst({where:{origemPedido:data.origemPedido,numeroPedidoManual:data.numeroPedidoManual}}))throw bad('Número de pedido externo já cadastrado.');await validarLimitesPedido(tx,data);const p=await tx.pedido.create({data});await tx.historicoPedido.create({data:{pedidoId:p.id,usuarioId:req.user.id,tipo:'PEDIDO_CRIADO',descricao:`Pedido criado a partir do orçamento ${q.protocolo}. Lista de corte sujeita à revisão de produção.`}});await tx.orcamentoSite.update({where:{id:q.id},data:{pedidoId:p.id}});return p;},{isolationLevel:'ReadCommitted'});res.json({pedidoId:result.id,numero:result.numeroPedidoManual||result.numeroPedido});}catch(e){if(e.code==='P2002')return res.status(409).json({error:'Número externo já cadastrado ou orçamento já convertido. Atualize a tela.'});failure(res,e)}
});
comercialAdminRoutes.post('/pedidos/:id/acesso',async(req,res)=>{try{
 const pedido=await prisma.pedido.findUnique({where:{id:req.params.id},include:{cliente:true}});
 if(!pedido)return res.status(404).json({error:'Pedido não encontrado.'});
 const config=await prisma.configuracaoSite.findUnique({where:{id:'principal'}});
 if(!config?.ativo)throw bad('Ative o site antes de preparar o acesso.');
 let base=config.siteUrl;
 if(!base){if(process.env.NODE_ENV==='production')throw bad('Configure o endereço público do site.');base='http://127.0.0.1:5180/';}
 const link=new URL(base);if(!['http:','https:'].includes(link.protocol))throw bad('Configure um endereço válido do site.');
 let numero=String(pedido.cliente.telefone||'').replace(/\D/g,'');if([10,11].includes(numero.length))numero='55'+numero;
 if(!/^55\d{10,11}$/.test(numero))throw bad('Cadastre o WhatsApp brasileiro do cliente com DDD.');
 if(![11,14].includes(pedido.cliente.documento?.replace(/\D/g,'').length))throw bad('Cadastre CPF/CNPJ completo antes de liberar o acesso.');
 const convite=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pedido.clienteId}))`;
  const atual=await tx.acessoClienteSite.findUnique({where:{clienteId:pedido.clienteId}});
  if(atual?.ativo&&atual.senhaHash)return null;
  const token=randomBytes(32).toString('hex');
  await tx.acessoClienteSite.upsert({where:{clienteId:pedido.clienteId},create:{clienteId:pedido.clienteId,conviteHash:digest(token),conviteExpira:new Date(Date.now()+86400000)},update:{ativo:true,senhaHash:null,conviteHash:digest(token),conviteExpira:new Date(Date.now()+86400000),versao:{increment:1}}});
  return token;
 });
 const endereco=enderecoClienteSite(base,convite);
 const texto=`Olá, ${pedido.cliente.nome}! Seu pedido #${pedido.numeroPedidoManual||pedido.numeroPedido} foi registrado.\n\n${convite?'Crie sua senha para acompanhar os pedidos. O convite vale por 24 horas.':'Acompanhe seus pedidos com seu CPF/CNPJ e a senha cadastrada.'}\n\nClique no link abaixo:\n\n${endereco}`;
 res.setHeader('Cache-Control','no-store');res.json({novoAcesso:!!convite,link:endereco,texto,whatsappUrl:`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`});
 }catch(e){failure(res,e)}});
comercialAdminRoutes.get('/avisos',async(req,res)=>{try{
 const pagina=Math.max(0,Math.min(10000,parseInt(req.query.pagina)||0));
 const ids=await prisma.$queryRaw`SELECT p."id" FROM "Pedido" p LEFT JOIN "AvisoPedidoSite" a ON a."pedidoId"=p."id" WHERE p."status"='PRONTO_ENTREGA' ORDER BY (a."avisadoEm" IS NOT NULL), p."updatedAt" DESC, p."id" DESC LIMIT 21 OFFSET ${pagina*20}`;
 const pedidos=await prisma.pedido.findMany({where:{id:{in:ids.slice(0,20).map(p=>p.id)}},select:{id:true,numeroPedido:true,numeroPedidoManual:true,tipoEntrega:true,cliente:{select:{nome:true,telefone:true}}}});
 const avisos=await prisma.avisoPedidoSite.findMany({where:{pedidoId:{in:pedidos.map(p=>p.id)}}});
 const porId=new Map(pedidos.map(p=>[p.id,p])),avisosPorId=new Map(avisos.map(a=>[a.pedidoId,a.avisadoEm]));
 res.json({items:ids.slice(0,20).map(({id})=>({...porId.get(id),avisadoEm:avisosPorId.get(id)||null})),mais:ids.length>20});
 }catch(e){failure(res,e)}});
comercialAdminRoutes.post('/avisos/:id',async(req,res)=>{try{if(!await prisma.pedido.findFirst({where:{id:req.params.id,status:'PRONTO_ENTREGA'}}))throw bad('Pedido não está pronto.');res.json(await prisma.avisoPedidoSite.upsert({where:{pedidoId:req.params.id},update:{avisadoEm:new Date(),usuarioId:req.user.id},create:{pedidoId:req.params.id,avisadoEm:new Date(),usuarioId:req.user.id}}));}catch(e){failure(res,e)}});
comercialAdminRoutes.post('/clientes/:id/convite',async(req,res)=>{try{const c=await prisma.cliente.findUnique({where:{id:req.params.id}});if(!c||![11,14].includes(c.documento?.replace(/\D/g,'').length))throw bad('Cadastre CPF/CNPJ completo antes de liberar o acesso.');const token=randomBytes(32).toString('hex');const config=await prisma.configuracaoSite.findUnique({where:{id:'principal'}});const link=enderecoClienteSite(config?.siteUrl,token);await prisma.acessoClienteSite.upsert({where:{clienteId:c.id},create:{id:randomUUID(),clienteId:c.id,conviteHash:digest(token),conviteExpira:new Date(Date.now()+86400000)},update:{conviteHash:digest(token),conviteExpira:new Date(Date.now()+86400000),ativo:true,senhaHash:null,versao:{increment:1}}});res.setHeader('Cache-Control','no-store');res.json({convite:token,link,expiraHoras:24});}catch(e){failure(res,e)}});
comercialAdminRoutes.post('/clientes/:id/revogar',async(req,res)=>{try{await prisma.acessoClienteSite.updateMany({where:{clienteId:req.params.id},data:{ativo:false,conviteHash:null,conviteExpira:null,versao:{increment:1}}});res.json({ok:true});}catch(e){failure(res,e)}});
comercialAdminRoutes.get('/indicadores',async(req,res)=>{try{
 const since=new Date(Date.now()-30*86400000);
 const [r]=await prisma.$queryRaw`SELECT COUNT(*)::int AS solicitacoes, COUNT("pedidoId")::int AS convertidos, COUNT(*) FILTER (WHERE "status"='APROVADO')::int AS aprovados, AVG(EXTRACT(EPOCH FROM ("primeiroAtendimento"-"createdAt"))/3600)::float8 AS "tempoMedioHoras" FROM "OrcamentoSite" WHERE "createdAt">=${since}`;
 res.json({periodoDias:30,...r});
 }catch(e){failure(res,e)}});
