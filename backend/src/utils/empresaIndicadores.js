export function mesesHistorico(agora = new Date()) {
  const hoje = agora.toLocaleDateString('en-CA', {timeZone:'America/Sao_Paulo'});
  const [ano,mes] = hoje.split('-').map(Number);
  return Array.from({length:24},(_,i)=>new Date(Date.UTC(ano,mes-24+i,1)).toISOString().slice(0,7));
}
export function preencherHistorico(meses,pedidos,servicos) {
  const p=new Map(pedidos.map(i=>[i.mes,i])),s=new Map(servicos.map(i=>[i.mes,i]));
  return meses.map(mes=>({mes,pedidosComValor:p.get(mes)?.pedidosComValor||0,pedidos:p.get(mes)?.pedidos||0,valor:p.get(mes)?.valor||0,cancelados:p.get(mes)?.cancelados||0,servicosConcluidos:s.get(mes)?.quantidade||0}));
}
