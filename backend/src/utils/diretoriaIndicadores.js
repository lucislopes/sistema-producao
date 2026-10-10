import {Prisma} from '@prisma/client';
export const STATUS_CARTEIRA=['ABERTO','EM_SEPARACAO','EM_PRODUCAO','CONCLUIDO','PRONTO_ENTREGA','SAIU_ENTREGA'];
export const percentual=(parte,total)=>total?Number((Number(parte)/Number(total)*100).toFixed(1)):null;
export function resumirCarteira(grupos){
 const resumo={pedidos:0,valor:0,atrasados:0,valorAtrasado:0,semPrazo:0,semValor:0,proximos:0};
 for(const grupo of grupos)for(const key of Object.keys(resumo))resumo[key]+=Number(grupo[key]||0);
 return {...resumo,valor:Number(resumo.valor.toFixed(2)),valorAtrasado:Number(resumo.valorAtrasado.toFixed(2)),percentualAtrasado:percentual(resumo.atrasados,resumo.pedidos),coberturaValor:percentual(resumo.pedidos-resumo.semValor,resumo.pedidos)};
}
export function datasDiretoria(query,agora=new Date()){
 const today=agora.toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 const inicio=query.dataInicio,fim=query.dataFim;
 const valida=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!valida(inicio)||!valida(fim)||inicio>fim||Date.parse(fim)-Date.parse(inicio)>732*86400000)throw Object.assign(new Error('Informe um período válido de até 24 meses.'),{status:400});
 return {inicio,fim,from:new Date(inicio+'T00:00:00-03:00'),dueFrom:new Date(inicio+'T00:00:00Z'),dueTo:new Date(Date.parse(fim+'T00:00:00Z')+86400000),to:new Date(Math.min(new Date(fim+'T23:59:59.999-03:00').getTime(),agora.getTime())),hoje:new Date(today+'T00:00:00Z'),amanha:new Date(Date.parse(today+'T00:00:00Z')+86400000),limite:new Date(Date.parse(today+'T00:00:00Z')+8*86400000)};
}
export async function consultarDiretoria(db,query,agora=new Date()){
 const d=datasDiretoria(query,agora),active=Prisma.join(STATUS_CARTEIRA);
 const [carteira,filas,entregas,clientes,volume,chapas]=await Promise.all([
 db.$queryRaw(Prisma.sql`SELECT p.status,COUNT(*)::int AS pedidos,COALESCE(SUM(p."valorTotal"),0)::float AS valor,COUNT(*) FILTER(WHERE p."valorTotal" IS NULL)::int AS "semValor",COUNT(*) FILTER(WHERE p."dataEntrega" IS NULL)::int AS "semPrazo",COUNT(*) FILTER(WHERE p."dataEntrega"<${d.hoje})::int AS atrasados,COALESCE(SUM(p."valorTotal") FILTER(WHERE p."dataEntrega"<${d.hoje}),0)::float AS "valorAtrasado",COUNT(*) FILTER(WHERE p."dataEntrega">=${d.hoje} AND p."dataEntrega"<${d.limite})::int AS proximos FROM "Pedido" p WHERE p.status::text IN (${active}) GROUP BY p.status`),
 db.$queryRaw(Prisma.sql`SELECT t.id,t.nome,COUNT(*) FILTER(WHERE s.status='ABERTO')::int AS aguardando,COUNT(*) FILTER(WHERE s.status='INICIADO')::int AS executando,COUNT(DISTINCT p.id)::int AS pedidos FROM "ServicoPlano" s JOIN "TipoServico" t ON t.id=s."tipoServicoId" JOIN "PlanoCorte" pc ON pc.id=s."planoId" JOIN "Pedido" p ON p.id=pc."pedidoId" WHERE p.status::text IN (${active}) AND s.status IN ('ABERTO','INICIADO') GROUP BY t.id,t.nome ORDER BY COUNT(*) DESC,t.nome`),
 db.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS entregues,COUNT(*) FILTER(WHERE p."dataEntrega" IS NOT NULL AND h.real IS NOT NULL)::int AS avaliados,COUNT(*) FILTER(WHERE p."dataEntrega" IS NOT NULL AND h.real IS NOT NULL AND (h.real AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date<=p."dataEntrega"::date)::int AS "noPrazo",COUNT(*) FILTER(WHERE h.real IS NULL)::int AS "semBaixa",AVG(EXTRACT(EPOCH FROM (h.real-p."dataPedido"))/86400) FILTER(WHERE h.real>=p."dataPedido")::float AS "cicloDias",COUNT(*) FILTER(WHERE h.real>=p."dataPedido")::int AS "baseCiclo" FROM "Pedido" p LEFT JOIN LATERAL(SELECT MIN("createdAt") AS real FROM "HistoricoPedido" WHERE "pedidoId"=p.id AND tipo='EXPEDICAO_ATUALIZADA' AND descricao ILIKE '%para ENTREGUE%') h ON true WHERE p.status='ENTREGUE' AND p."dataEntrega">=${d.dueFrom} AND p."dataEntrega"<${d.dueTo}`),
 db.$queryRaw(Prisma.sql`SELECT c.id,c.nome,COUNT(*)::int AS pedidos,COALESCE(SUM(p."valorTotal"),0)::float AS valor FROM "Pedido" p JOIN "Cliente" c ON c.id=p."clienteId" WHERE p.status<>'CANCELADO' AND p."dataPedido">=${d.from} AND p."dataPedido"<=${d.to} GROUP BY c.id,c.nome ORDER BY valor DESC,c.id LIMIT 5`),
 db.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS pedidos,COUNT(*) FILTER(WHERE "valorTotal" IS NULL)::int AS "semValor",COUNT(DISTINCT "clienteId")::int AS clientes,COALESCE(SUM("valorTotal"),0)::float AS valor FROM "Pedido" WHERE status<>'CANCELADO' AND "dataPedido">=${d.from} AND "dataPedido"<=${d.to}`),
 db.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS planos,COALESCE(SUM(pc."quantidadeChapas"),0)::int AS chapas FROM "PlanoCorte" pc JOIN "Pedido" p ON p.id=pc."pedidoId" WHERE p.status::text IN (${active}) AND EXISTS(SELECT 1 FROM "ServicoPlano" s WHERE s."planoId"=pc.id AND s.status IN ('ABERTO','INICIADO'))`)
 ]);
 const prazo=entregas[0],comercial=volume[0];
 return {atualizadoEm:agora,periodo:{inicio:d.inicio,fim:d.fim},carteira:{resumo:resumirCarteira(carteira),grupos:carteira},filas,chapas:chapas[0],entregas:{...prazo,pontualidade:percentual(prazo.noPrazo,prazo.avaliados),cobertura:percentual(prazo.avaliados,prazo.entregues),cicloDias:prazo.cicloDias==null?null:Number(prazo.cicloDias.toFixed(1))},comercial:{...comercial,principais:clientes,concentracao:percentual(clientes.reduce((n,c)=>n+c.valor,0),comercial.valor)}};
}
export async function detalhesDiretoria(db,query,agora=new Date()){
 const d=datasDiretoria(query,agora),pagina=Number(query.pagina||0);
 if(!Number.isInteger(pagina)||pagina<0||pagina>10000)throw Object.assign(new Error('Página inválida.'),{status:400});
 const filtro=query.filtro||'TODOS',status=query.status,servico=query.servico;
 if(!['TODOS','ATRASADOS','SEM_PRAZO','PROXIMOS','FUTUROS'].includes(filtro)||status&&!STATUS_CARTEIRA.includes(status)||servico&&(typeof servico!=='string'||servico.length>100))throw Object.assign(new Error('Filtro inválido.'),{status:400});
 const where=Prisma.sql`p.status::text IN (${Prisma.join(STATUS_CARTEIRA)}) AND (${filtro}<>'ATRASADOS' OR p."dataEntrega"<${d.hoje}) AND (${filtro}<>'SEM_PRAZO' OR p."dataEntrega" IS NULL) AND (${filtro}<>'FUTUROS' OR p."dataEntrega">=${d.limite}) AND (${filtro}<>'PROXIMOS' OR (p."dataEntrega">=${d.hoje} AND p."dataEntrega"<${d.limite})) ${status?Prisma.sql`AND p.status::text=${status}`:Prisma.empty} ${servico?Prisma.sql`AND EXISTS(SELECT 1 FROM "ServicoPlano" s JOIN "PlanoCorte" pc ON pc.id=s."planoId" WHERE pc."pedidoId"=p.id AND s."tipoServicoId"=${servico} AND s.status IN ('ABERTO','INICIADO'))`:Prisma.empty}`;
 const [itens,totais]=await Promise.all([
 db.$queryRaw(Prisma.sql`SELECT p.id,p."numeroPedido",p."numeroPedidoManual",p.status,p."dataEntrega",p."valorTotal"::float AS valor,c.nome AS cliente,f.nome AS vendedor FROM "Pedido" p JOIN "Cliente" c ON c.id=p."clienteId" JOIN "Funcionario" f ON f.id=p."vendedorId" WHERE ${where} ORDER BY p."dataEntrega" ASC NULLS LAST,p.id LIMIT 20 OFFSET ${pagina*20}`),
 db.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS total FROM "Pedido" p WHERE ${where}`)
 ]);return {itens,total:totais[0].total,pagina};
}
