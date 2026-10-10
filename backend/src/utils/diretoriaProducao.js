import {Prisma} from '@prisma/client';
import {datasDiretoria,STATUS_CARTEIRA,percentual} from './diretoriaIndicadores.js';
export async function consultarProducaoDiretoria(db,query,agora=new Date()){
 const d=datasDiretoria(query,agora);
 const [operadores,servicos]=await Promise.all([
 db.$queryRaw(Prisma.sql`WITH base AS (
 SELECT s.*,pc."pedidoId",p.status AS "pedidoStatus" FROM "ServicoPlano" s JOIN "PlanoCorte" pc ON pc.id=s."planoId" JOIN "Pedido" p ON p.id=pc."pedidoId" WHERE p.status<>'CANCELADO'
 ), historico AS (
 SELECT "operadorId",COUNT(*)::int AS concluidos,COUNT(DISTINCT "pedidoId")::int AS pedidos,
 COUNT(*) FILTER(WHERE "dataInicio" IS NOT NULL AND "dataFim">="dataInicio")::int AS "baseTempo",
 COALESCE(SUM(EXTRACT(EPOCH FROM ("dataFim"-"dataInicio"))/60) FILTER(WHERE "dataInicio" IS NOT NULL AND "dataFim">="dataInicio"),0)::float AS minutos
 FROM base WHERE status='CONCLUIDO' AND "dataFim">=${d.from} AND "dataFim"<=${d.to} GROUP BY "operadorId"
 ), carga AS (
 SELECT "operadorId",COUNT(*) FILTER(WHERE status='ABERTO')::int AS aguardando,COUNT(*) FILTER(WHERE status='INICIADO')::int AS executando,COUNT(DISTINCT "pedidoId")::int AS "pedidosAtuais"
 FROM base WHERE "pedidoStatus"::text IN (${Prisma.join(STATUS_CARTEIRA)}) AND status IN ('ABERTO','INICIADO') GROUP BY "operadorId"
 ) SELECT COALESCE(h."operadorId",c."operadorId") AS id,COALESCE(f.nome,'Sem operador atribuído') AS nome,
 COALESCE(h.concluidos,0)::int AS concluidos,COALESCE(h.pedidos,0)::int AS pedidos,COALESCE(h."baseTempo",0)::int AS "baseTempo",COALESCE(h.minutos,0)::float AS minutos,
 COALESCE(c.aguardando,0)::int AS aguardando,COALESCE(c.executando,0)::int AS executando,COALESCE(c."pedidosAtuais",0)::int AS "pedidosAtuais"
 FROM historico h FULL JOIN carga c ON COALESCE(h."operadorId",'')=COALESCE(c."operadorId",'') LEFT JOIN "Funcionario" f ON f.id=COALESCE(h."operadorId",c."operadorId") ORDER BY concluidos DESC,nome`),
 db.$queryRaw(Prisma.sql`SELECT t.id,t.nome,COUNT(*)::int AS concluidos,COUNT(DISTINCT pc."pedidoId")::int AS pedidos,COUNT(*) FILTER(WHERE s."dataInicio" IS NOT NULL AND s."dataFim">=s."dataInicio")::int AS "baseTempo",AVG(EXTRACT(EPOCH FROM(s."dataFim"-s."dataInicio"))/60) FILTER(WHERE s."dataInicio" IS NOT NULL AND s."dataFim">=s."dataInicio")::float AS "mediaMinutos" FROM "ServicoPlano" s JOIN "TipoServico" t ON t.id=s."tipoServicoId" JOIN "PlanoCorte" pc ON pc.id=s."planoId" JOIN "Pedido" p ON p.id=pc."pedidoId" WHERE p.status<>'CANCELADO' AND s.status='CONCLUIDO' AND s."dataFim">=${d.from} AND s."dataFim"<=${d.to} GROUP BY t.id,t.nome ORDER BY concluidos DESC,t.nome`)
 ]);
 const concluidos=operadores.reduce((n,o)=>n+o.concluidos,0),baseTempo=operadores.reduce((n,o)=>n+o.baseTempo,0),minutos=operadores.reduce((n,o)=>n+o.minutos,0);
 return {operadores,servicos,resumo:{concluidos,baseTempo,coberturaTempo:percentual(baseTempo,concluidos),mediaMinutos:baseTempo?minutos/baseTempo:null,minutos,aguardando:operadores.reduce((n,o)=>n+o.aguardando,0),executando:operadores.reduce((n,o)=>n+o.executando,0)}};
}
