import {Prisma} from '@prisma/client';
export const ORIGENS_COMERCIAIS=['SISTEMA','SITE_WHATSAPP','WHATSAPP','LOJA','INDICACAO','EMAIL','OUTRO'];
export function validarOrigemComercial(body,agora=new Date()){
 const bad=message=>{throw Object.assign(new Error(message),{status:400})};
 if(!ORIGENS_COMERCIAIS.includes(body?.origem))bad('Selecione uma origem válida.');
 const data=v=>{if(v==null||v==='')return null;if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v))bad('Horário inválido.');const d=new Date(v);if(!Number.isFinite(d.getTime())||d>agora)bad('Informe um horário válido, que não esteja no futuro.');return d};
 const recebido=data(body.contatoRecebidoEm),resposta=data(body.primeiraRespostaEm);
 if(resposta&&(!recebido||resposta<recebido))bad('A resposta deve ocorrer após o contato recebido.');
 return {origem:body.origem,contatoRecebidoEm:recebido,primeiraRespostaEm:resposta};
}
export const origemPedidoSql=Prisma.sql`CASE WHEN EXISTS(SELECT 1 FROM "OrcamentoSite" q WHERE q."pedidoId"=p.id) THEN 'SITE_FORMULARIO' ELSE COALESCE((SELECT o.origem FROM "OrigemComercialPedido" o WHERE o."pedidoId"=p.id),'SISTEMA') END`;
export function resumoOrigens(rows){const total=rows.reduce((n,r)=>n+r.pedidos,0),site=rows.filter(r=>['SITE_FORMULARIO','SITE_WHATSAPP'].includes(r.origem)).reduce((n,r)=>n+r.pedidos,0);return {grupos:rows,totalPedidos:total,pedidosSite:site,participacaoSite:total?Number((site/total*100).toFixed(1)):null}}
