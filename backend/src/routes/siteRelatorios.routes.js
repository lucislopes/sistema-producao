import { Prisma } from '@prisma/client';
import {origemPedidoSql,resumoOrigens} from '../utils/origemComercial.js';
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {acessoSite} from '../utils/siteMarketing.js';
import { ocuparAnexos, QUOTA_ANEXOS } from '../utils/anexosOrcamento.js';
const router=Router();
router.use(authMiddleware,(req,res,next)=>acessoSite(req.user,'RELATORIOS_EMPRESA')?next():res.status(403).json({error:'Sem permissão para relatórios da empresa.'}),(req,res,next)=>{res.setHeader('Cache-Control','private, no-store');next();});
router.get('/resumo',async(req,res)=>{
 try {
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  const inicio=req.query.inicio||today.slice(0,4)+'-01-01',fim=req.query.fim||today;
  const valid=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  if(!valid(inicio)||!valid(fim)||inicio>fim||Date.parse(fim)-Date.parse(inicio)>732*86400000)return res.status(400).json({error:'Escolha um período válido de até dois anos.'});
  const from=new Date(inicio+'T00:00:00-03:00'),to=new Date(fim+'T23:59:59.999-03:00'),where={createdAt:{gte:from,lte:to}};
  const [rows,convertidos,avg]=await Promise.all([
   prisma.orcamentoSite.groupBy({by:['status'],where,_count:{_all:true}}),
   prisma.orcamentoSite.count({where:{...where,pedidoId:{not:null}}}),
   prisma.$queryRaw`SELECT AVG(EXTRACT(EPOCH FROM ("primeiroAtendimento"-"createdAt"))/3600)::float AS horas FROM "OrcamentoSite" WHERE "createdAt">=${from} AND "createdAt"<=${to} AND "primeiroAtendimento" IS NOT NULL`
  ]);
  const total=rows.reduce((n,r)=>n+r._count._all,0);
  res.json({total,convertidos,conversao:total?convertidos/total*100:0,status:Object.fromEntries(rows.map(r=>[r.status,r._count._all])),atendimentoHoras:avg[0].horas});
 }catch(error){console.error('Resumo do site:',error.message);res.status(500).json({error:'Não foi possível carregar os relatórios do site.'})}
});
router.get('/',(req,res,next)=>req.user.somenteSite?res.status(403).json({error:'Relatório disponível somente no sistema.'}):next(),async(req,res)=>{
 try{
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 const end=req.query.fim||today;const start=req.query.inicio||(today.slice(0,4)+'-01-01');
 const valid=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!valid(start)||!valid(end)||start>end||Date.parse(end)-Date.parse(start)>732*86400000)return res.status(400).json({error:'Escolha um período válido de até dois anos.'});
 const from=new Date(start+'T00:00:00-03:00'),to=new Date(end+'T23:59:59.999-03:00');
 const range={gte:from,lte:to};
 const page=Number(req.query.pagina||0);if(!Number.isInteger(page)||page<0||page>10000)return res.status(400).json({error:'Página inválida.'});
 const source=req.query.origem||'TODOS';if(!['TODOS','SITE','SISTEMA','SITE_WHATSAPP','WHATSAPP','LOJA','INDICACAO','EMAIL','OUTRO'].includes(source))return res.status(400).json({error:'Origem inválida.'});
 const orderPage=Number(req.query.paginaPedidos||0);if(!Number.isInteger(orderPage)||orderPage<0||orderPage>10000)return res.status(400).json({error:'Página de pedidos inválida.'});
 const quoteWhere={createdAt:range,...(!['TODOS','SITE'].includes(source)?{id:'__sem_orcamentos_do_site__'}:{})};
 const origin=Prisma.sql`(${source}='TODOS' OR (${source}='SITE' AND (${origemPedidoSql}) IN ('SITE_FORMULARIO','SITE_WHATSAPP')) OR (${source} NOT IN ('TODOS','SITE') AND (${origemPedidoSql})=${source}))`;
 const active=['ABERTO','EM_SEPARACAO','EM_PRODUCAO','CONCLUIDO','PRONTO_ENTREGA','SAIU_ENTREGA'];
 const [quotes,converted,pedidos,late,recent,avg,usage,expiring,orderRows,orderTotals,plans,services,ranking,comercial]=await Promise.all([
 prisma.orcamentoSite.groupBy({by:['status'],where:quoteWhere,_count:{_all:true}}),
 prisma.orcamentoSite.count({where:{...quoteWhere,pedidoId:{not:null}}}),
 prisma.$queryRaw(Prisma.sql`SELECT p.status, COUNT(*)::int AS quantidade FROM "Pedido" p WHERE p."dataPedido">=${from} AND p."dataPedido"<=${to} AND ${origin} GROUP BY p.status`),
 prisma.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS quantidade FROM "Pedido" p WHERE p.status::text IN (${Prisma.join(active)}) AND p."dataEntrega"<${new Date(today+'T00:00:00-03:00')} AND ${origin}`),
 prisma.orcamentoSite.findMany({where:quoteWhere,orderBy:[{createdAt:'desc'},{id:'desc'}],skip:page*20,take:21,select:{id:true,protocolo:true,nome:true,status:true,pedidoId:true,createdAt:true}}),
 prisma.$queryRaw`SELECT AVG(EXTRACT(EPOCH FROM ("primeiroAtendimento"-"createdAt"))/3600)::float AS horas, COUNT(*)::int AS quantidade FROM "OrcamentoSite" WHERE "createdAt">=${from} AND "createdAt"<=${to} AND "primeiroAtendimento" IS NOT NULL AND ${source} IN ('TODOS','SITE')`,
 ocuparAnexos(),
 prisma.anexoOrcamentoSite.count({where:{removidoEm:null,expiraEm:{gt:new Date(),lte:new Date(Date.now()+7*86400000)}}}),
 prisma.$queryRaw(Prisma.sql`SELECT p.id,p."numeroPedido",p."numeroPedidoManual",p.status,p."dataPedido",p."dataEntrega",p."valorTotal"::float AS valor,c.nome,(${origemPedidoSql}) AS origem FROM "Pedido" p JOIN "Cliente" c ON c.id=p."clienteId" WHERE p."dataPedido">=${from} AND p."dataPedido"<=${to} AND ${origin} ORDER BY p."dataPedido" DESC,p.id DESC LIMIT 21 OFFSET ${orderPage*20}`),
 prisma.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS total,COALESCE(SUM(p."valorTotal") FILTER(WHERE p.status<>'CANCELADO'),0)::float AS valor FROM "Pedido" p WHERE p."dataPedido">=${from} AND p."dataPedido"<=${to} AND ${origin}`),
 prisma.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS planos,COALESCE(SUM(pc."quantidadeChapas"),0)::int AS chapas FROM "PlanoCorte" pc JOIN "Pedido" p ON p.id=pc."pedidoId" WHERE p."dataPedido">=${from} AND p."dataPedido"<=${to} AND p.status<>'CANCELADO' AND ${origin}`),
 prisma.$queryRaw(Prisma.sql`SELECT sp.status,COUNT(*)::int AS quantidade FROM "ServicoPlano" sp JOIN "PlanoCorte" pc ON pc.id=sp."planoId" JOIN "Pedido" p ON p.id=pc."pedidoId" WHERE p."dataPedido">=${from} AND p."dataPedido"<=${to} AND p.status<>'CANCELADO' AND ${origin} GROUP BY sp.status`),
 prisma.$queryRaw(Prisma.sql`SELECT c.nome,COUNT(*)::int AS pedidos,COALESCE(SUM(p."valorTotal"),0)::float AS valor FROM "Pedido" p JOIN "Cliente" c ON c.id=p."clienteId" WHERE p."dataPedido">=${from} AND p."dataPedido"<=${to} AND p.status<>'CANCELADO' AND ${origin} GROUP BY c.id,c.nome ORDER BY valor DESC,c.id LIMIT 5`),prisma.$queryRaw(Prisma.sql`SELECT (${origemPedidoSql}) AS origem,COUNT(*)::int AS pedidos,COALESCE(SUM(p."valorTotal"),0)::float AS valor,COUNT(o."primeiraRespostaEm")::int AS respondidos,AVG(EXTRACT(EPOCH FROM(o."primeiraRespostaEm"-o."contatoRecebidoEm"))/60)::float AS "respostaMinutos" FROM "Pedido" p LEFT JOIN "OrigemComercialPedido" o ON o."pedidoId"=p.id WHERE p."dataPedido">=${from} AND p."dataPedido"<=${to} AND p.status<>'CANCELADO' GROUP BY 1`)]);
 const counts=rows=>Object.fromEntries(rows.map(r=>[r.status,r._count._all]));const total=quotes.reduce((n,r)=>n+r._count._all,0);
 res.json({comercial:resumoOrigens(comercial),rankingClientes:ranking,periodo:{inicio:start,fim:end,origem:source},orcamentos:{total,status:counts(quotes),convertidos:converted,conversao:total?converted/total*100:0,atendimentoHoras:avg[0].horas,atendidos:avg[0].quantidade},pedidos:{status:Object.fromEntries(pedidos.map(r=>[r.status,r.quantidade])),atrasadosAtuais:late[0].quantidade,total:orderTotals[0].total,valor:orderTotals[0].valor,lista:{items:orderRows.slice(0,20),mais:orderRows.length>20,pagina:orderPage}},producao:{...plans[0],servicos:Object.fromEntries(services.map(r=>[r.status,r.quantidade]))},arquivos:{...usage,limiteBytes:QUOTA_ANEXOS,expiramEm7Dias:expiring},lista:{items:recent.slice(0,20),mais:recent.length>20,pagina:page}});
 }catch(error){console.error('Falha nos relatórios do site:',error.message);res.status(500).json({error:'Não foi possível carregar os relatórios.'});}
});
export default router;
