export const etapasOrcamento=['NOVO','EM_ANALISE','ENVIADO','APROVADO','PERDIDO'];
export function validarSolicitacao(body) {
  const text=(key,max,required=false)=>{const value=body?.[key];if(value===undefined&&!required)return '';if(typeof value!=='string'||value.length>max||required&&!value.trim())throw new Error(`Informe ${key} corretamente.`);return value.trim();};
  const nome=text('nome',100,true),telefone=text('telefone',25,true).replace(/\D/g,'');
  if(!/^\d{10,13}$/.test(telefone))throw new Error('Informe um telefone com DDD.');
  const email=text('email',150),documento=text('documento',18).replace(/\D/g,'');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('E-mail inválido.');
  if(documento&&![11,14].includes(documento.length))throw new Error('CPF/CNPJ inválido.');
  const observacao=text('observacao',3000),dataDesejada=text('dataDesejada',10),urgencia=text('urgencia',50);
  if(dataDesejada&&(!/^\d{4}-\d{2}-\d{2}$/.test(dataDesejada)||Number.isNaN(Date.parse(dataDesejada))||new Date(dataDesejada).toISOString().slice(0,10)!==dataDesejada))throw new Error('Data desejada inválida.');
  if(!['','Sem urgência','Tenho uma data definida','Preciso o quanto antes'].includes(urgencia))throw new Error('Urgência inválida.');
  const linkProjeto=text('linkProjeto',2048);
  if(linkProjeto){let url;try{url=new URL(linkProjeto);}catch{throw new Error('Link do projeto inválido.');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Link do projeto inválido.');}
  const lista=body?.pecas||[],materiais=body?.materiais||[];
  if(!Array.isArray(lista)||lista.length>50||!Array.isArray(materiais)||materiais.length>100)throw new Error('Lista acima do limite.');
  const short=(value,max)=>{if(typeof value!=='string'||value.length>max)throw new Error('Texto da peça inválido.');return value.trim();};
  const pecas=lista.map(p=>{if(!p||!['comprimento','largura','quantidade'].every(k=>Number.isInteger(p[k])&&p[k]>=1&&p[k]<=(k==='quantidade'?9999:10000)))throw new Error('Medidas ou quantidade inválidas.');if(!Array.isArray(p.bordas)||p.bordas.length>4||p.bordas.some(b=>!['Comprimento 1','Comprimento 2','Largura 1','Largura 2'].includes(b)))throw new Error('Bordas inválidas.');const nome=short(p.nome,100);if(!nome)throw new Error('Identifique a peça.');return {nome,material:short(p.material,150),comprimento:p.comprimento,largura:p.largura,quantidade:p.quantidade,bordas:[...new Set(p.bordas)]};});
  const itens=materiais.map(p=>{if(!p||!Number.isInteger(p.quantidade)||p.quantidade<1||p.quantidade>9999)throw new Error('Quantidade inválida.');return {nome:short(p.nome,150),quantidade:p.quantidade};});
  if(!observacao&&!pecas.length&&!itens.length)throw new Error('Descreva seu projeto ou adicione peças.');
  const chave=text('chave',36,true);if(!/^[a-f0-9-]{36}$/.test(chave))throw new Error('Identificador inválido.');
  return {chave,nome,telefone,email:email||null,documento:documento||null,detalhes:{observacao,dataDesejada,urgencia,linkProjeto,pecas,materiais:itens}};
}
export function textoSolicitacao(q){return [`Orçamento ${q.protocolo}`,q.detalhes.observacao, ...q.detalhes.pecas.map(p=>`${p.nome} | ${p.material} | ${p.comprimento} x ${p.largura} mm | ${p.quantidade} peças | Bordas: ${p.bordas.join(', ')||'sem fita'}`),...q.detalhes.materiais.map(p=>`${p.nome}: ${p.quantidade}`)].join('\n');}
