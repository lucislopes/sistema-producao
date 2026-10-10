export function analisarPeriodo(historico,inicio,fim,metrica='pedidos'){
  const selecionado=historico.filter(i=>i.mes>=inicio&&i.mes<=fim);
  const index=historico.findIndex(i=>i.mes===inicio);
  const anterior=historico.slice(Math.max(0,index-selecionado.length),Math.max(0,index));
  const total=selecionado.reduce((s,i)=>s+Number(i[metrica]||0),0);
  const base=anterior.reduce((s,i)=>s+Number(i[metrica]||0),0);
  const comparavel=anterior.length===selecionado.length&&selecionado.length>0;
  return {selecionado,anterior,total,base,variacao:comparavel&&base>0?(total-base)/base*100:null,comparavel};
}
