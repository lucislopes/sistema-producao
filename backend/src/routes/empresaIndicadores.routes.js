import {Router} from 'express';
import {prisma} from '../lib/prisma.js';
import {authMiddleware} from '../middlewares/auth.middleware.js';
import {acessoSite} from '../utils/siteMarketing.js';
import {mesesHistorico,preencherHistorico} from '../utils/empresaIndicadores.js';
const router=Router();
router.use(authMiddleware,(req,res,next)=>{
  res.setHeader('Cache-Control','private, no-store');
  if(!acessoSite(req.user,'RELATORIOS_EMPRESA'))return res.status(403).json({error:'Sem permissão para os indicadores da empresa.'});
  next();
});
router.get('/indicadores',async(req,res)=>{
  try {
    const agora=new Date(),meses=mesesHistorico(agora),from=new Date(meses[0]+'-01T00:00:00-03:00');
    const hoje=agora.toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
    const [status,atrasados,mensal,concluidos,servicos]=await Promise.all([
      prisma.pedido.groupBy({by:['status'],_count:{_all:true}}),
      prisma.pedido.count({where:{status:{in:['ABERTO','EM_SEPARACAO','EM_PRODUCAO','CONCLUIDO','PRONTO_ENTREGA','SAIU_ENTREGA']},dataEntrega:{lt:new Date(hoje+'T00:00:00-03:00')}}}),
      prisma.$queryRaw`SELECT to_char("dataPedido" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo','YYYY-MM') AS mes, COUNT(*)::int AS pedidos,COUNT(*) FILTER(WHERE status<>'CANCELADO' AND "valorTotal" IS NOT NULL)::int AS "pedidosComValor",COUNT(*) FILTER(WHERE status='CANCELADO')::int AS cancelados,COALESCE(SUM("valorTotal") FILTER(WHERE status<>'CANCELADO'),0)::float AS valor FROM "Pedido" WHERE "dataPedido">=${from} AND "dataPedido"<=${agora} GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw`SELECT to_char("dataFim" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo','YYYY-MM') AS mes,COUNT(*)::int AS quantidade FROM "ServicoPlano" WHERE status='CONCLUIDO' AND "dataFim">=${from} AND "dataFim"<=${agora} GROUP BY 1 ORDER BY 1`,
      prisma.servicoPlano.groupBy({by:['status'],_count:{_all:true}})
    ]);
    res.json({atualizadoEm:agora,periodo:{inicio:meses[0]+'-01',fim:hoje},atual:{pedidos:Object.fromEntries(status.map(i=>[i.status,i._count._all])),servicos:Object.fromEntries(servicos.map(i=>[i.status,i._count._all])),atrasados},historico:preencherHistorico(meses,mensal,concluidos)});
  }catch(error){console.error('Indicadores empresa:',error.message);res.status(500).json({error:'Não foi possível consultar os indicadores.'});}
});
export default router;
