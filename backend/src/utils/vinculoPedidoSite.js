const bad=message=>Object.assign(new Error(message),{status:400});
export function numeroPedidoComercial(body){
 const origem=body.origemPedido||'INTERNO';
 if(!['INTERNO','EXTERNO'].includes(origem))throw bad('Origem da numeração inválida.');
 if(body.numeroPedidoManual!=null&&typeof body.numeroPedidoManual!=='string')throw bad('Número do pedido inválido.');
 const numero=origem==='EXTERNO'?(body.numeroPedidoManual||'').replace(/\s/g,''):null;
 if(origem==='EXTERNO'&&(!numero||numero.length>100))throw bad('Informe o número do pedido externo, com até 100 caracteres.');
 return {origemPedido:origem,numeroPedidoManual:numero};
}
export async function vincularPedidoSite(tx,{orcamentoId,pedidoId,usuarioId}){
 if(typeof pedidoId!=='string'||!pedidoId||pedidoId.length>100)throw bad('Selecione um pedido válido.');
 const q=await tx.orcamentoSite.findUnique({where:{id:orcamentoId}});
 if(!q)throw bad('Orçamento não encontrado.');
 if(q.pedidoId&&q.pedidoId!==pedidoId)throw bad('Este orçamento já está vinculado a outro pedido.');
 const p=await tx.pedido.findUnique({where:{id:pedidoId}});
 if(!p||p.status==='CANCELADO')throw bad('Selecione um pedido existente que não esteja cancelado.');
 if(q.pedidoId===pedidoId)return p;
 if(q.status!=='APROVADO')throw bad('Salve o orçamento como aprovado antes de vincular.');
 const vinculado=await tx.orcamentoSite.findUnique({where:{pedidoId}});
 if(vinculado)throw bad('Este pedido já está vinculado a outro orçamento do site.');
 await tx.orcamentoSite.update({where:{id:q.id},data:{pedidoId,primeiroAtendimento:q.primeiroAtendimento||new Date()}});
 await tx.historicoPedido.create({data:{pedidoId,usuarioId,tipo:'PEDIDO_ATUALIZADO',descricao:`Origem site: pedido vinculado ao orçamento #${q.protocolo}. Nenhum dado comercial ou de produção do pedido foi alterado.`}});
 return p;
}
