// Consulta somente dados públicos e arquivos; não salva nem publica cadastros.
const origem=process.argv[2]||'http://127.0.0.1:5180';
const fontes=['configuracao','produtos','categorias','banners','paginas','publicacoes'];
const dados=await Promise.all(fontes.map(async fonte=>{
  const r=await fetch(new URL('/api/public/'+fonte,origem),{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error(`${fonte}: HTTP ${r.status}`);
  return r.json();
}));
const imagens=new Set(),externas=new Set();
function coletar(valor,chave=''){
  if(typeof valor==='string'&&(/(?:imagem|logo|capa).*Url$/i.test(chave)||chave==='galeria')){
    if(valor.startsWith('/'))imagens.add(valor);else if(/^https?:/.test(valor))externas.add(valor);
  }else if(Array.isArray(valor))valor.forEach(v=>coletar(v,chave));
  else if(valor&&typeof valor==='object')Object.entries(valor).forEach(([k,v])=>coletar(v,k));
}
dados.forEach(d=>coletar(d));
const falhas=[];
await Promise.all([...imagens].map(async url=>{
  try{const r=await fetch(new URL(url,origem),{signal:AbortSignal.timeout(10000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))falhas.push({url,status:r.status,tipo:r.headers.get('content-type')});await r.arrayBuffer();}
  catch(error){falhas.push({url,erro:error.message})}
}));
console.log(JSON.stringify({fontes:fontes.length,imagensLocais:imagens.size,imagensExternasNaoVerificadas:externas.size,paginas:dados[4].length,produtos:dados[1].length,falhas},null,2));
if(falhas.length)process.exitCode=1;
