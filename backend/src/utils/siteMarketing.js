import {validarAjusteImagem} from './ajusteImagem.js';
export function acessoSite(user, permissao) {
  return user?.funcao === 'ADMIN' || user?.permissoesSite?.includes(permissao) === true;
}
export function acessoRotaSite(user, path) {
  if (/^\/previa\/?$/.test(path)) return ['CONFIGURACAO_SITE','CONTEUDO','PROMOCOES'].some(p => acessoSite(user,p));
  if (/^\/configuracao\/?$/.test(path) || /^\/imagens\/configuracao\/?$/.test(path)) return acessoSite(user, 'CONFIGURACAO_SITE');
  if (/^\/imagens\/conteudo\/?$/.test(path)) return acessoSite(user, 'CONTEUDO');
  if (path.startsWith('/imagens/')) return acessoSite(user, 'PROMOCOES') || acessoSite(user, 'CONTEUDO');
  return acessoSite(user, 'CONTEUDO');
}
export function rotaSomenteSite(path, permissoes = []) {
  if(permissoes.includes('RELATORIOS_EMPRESA') && /^\/site-relatorios\/resumo\/?$/.test(path))return true;
  return /^\/auth\/(?:me|minha-senha)\/?$/.test(path) || /^\/(?:site|marketing-site)(?:\/|$)/.test(path);
}
export function statusPublicacao(item, agora = new Date()) {
  if(item.status==='RASCUNHO') return 'RASCUNHO';
  if(item.status==='EXPIRADO' || (item.fim && new Date(item.fim)<=agora))return 'EXPIRADO';
  return item.inicio && new Date(item.inicio)>agora ? 'AGENDADO' : 'PUBLICADO';
}
const falhar = mensagem => {throw Object.assign(new Error(mensagem),{status:400})};
const texto=(v,max,obrigatorio=false)=>{if(v==null)return obrigatorio?falhar('Preencha título e descrição.'):null;if(typeof v!=='string'||v.length>max)falhar('Texto inválido ou muito longo.');const t=v.trim();if(obrigatorio&&!t)falhar('Preencha título e descrição.');return t||null};
const url=v=>{if(!v)return null;if(typeof v!=='string'||v.length>2048)falhar('URL inválida.');if(/^\/api\/uploads\/site\/(?:banners|produtos|categorias|configuracao)\/[a-f0-9-]{36}\.(?:webp|png|jpg)$/.test(v))return v;try{const u=new URL(v);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw 0;return u.href}catch{falhar('Use uma URL HTTP/HTTPS válida.')}};
export function validarMarketing(b, pagina=false) {
  if(!b||typeof b!=='object')falhar('Conteúdo inválido.');
  const d={titulo:texto(b.titulo,150,true),descricao:texto(b.descricao,10000,true),imagemUrl:url(b.imagemUrl),ordem:Number(b.ordem??0)};
  if(b.ajusteImagem!==undefined)d.ajusteImagem=validarAjusteImagem(b.ajusteImagem);
  if(!Number.isInteger(d.ordem)||d.ordem<0||d.ordem>99999)falhar('Ordem inválida.');
  if(pagina){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b.slug||'')||b.slug.length>150)falhar('URL amigável inválida.');if(!['SERVICO','MARCA','HISTORIA','CONTATO','LOCALIZACAO'].includes(b.tipo))falhar('Tipo inválido.');return {...d,slug:b.slug,tipo:b.tipo,ativo:b.ativo===true,link:url(b.link)}}
  if(!['PROMOCAO','PUBLICACAO'].includes(b.tipo)||!['RASCUNHO','PUBLICADO','EXPIRADO'].includes(b.status))falhar('Tipo ou status inválido.');
  for(const k of ['preco','precoAnterior']){d[k]=b[k]==null||b[k]===''?null:Number(b[k]);if(d[k]!==null&&(!Number.isFinite(d[k])||d[k]<0||d[k]>99999999.99))falhar('Preço inválido.');}
  for(const k of ['inicio','fim']){d[k]=b[k]?new Date(b[k]):null;if(d[k]&&Number.isNaN(d[k].getTime()))falhar('Data inválida.');}
  if(d.inicio&&d.fim&&d.fim<=d.inicio)falhar('A validade deve terminar depois do início.');
  const a=b.arte||{};if(a.categoria!=null&&!['MATERIAIS','SERVICOS','MAQUINAS','FERRAMENTAS'].includes(a.categoria))falhar('Categoria de anúncio inválida.');if(!['editorial','oferta','servico','impacto','premium','moderno'].includes(a.modelo||'editorial'))falhar('Modelo inválido.');
  d.arte={categoria:a.categoria||'MATERIAIS',modelo:a.modelo||'editorial',corPrimaria:/^#[0-9a-f]{6}$/i.test(a.corPrimaria||'')?a.corPrimaria:'#084f2b',corDestaque:/^#[0-9a-f]{6}$/i.test(a.corDestaque||'')?a.corDestaque:'#ffbd16',logoUrl:url(a.logoUrl),chamada:texto(a.chamada,120)||'Fale com nossa equipe',legenda:texto(a.legenda,1800)||'',hashtags:texto(a.hashtags,300)||''};
  for(const [key,min,max,fallback] of [['zoomImagem',1,2.4,1],['posicaoX',0,1,.5],['posicaoY',0,1,.5]]){const value=a[key]==null?fallback:Number(a[key]);if(!Number.isFinite(value)||value<min||value>max)falhar('Enquadramento da imagem inválido.');d.arte[key]=value;}
  if(a.galeria!=null&&(!Array.isArray(a.galeria)||a.galeria.length>8))falhar('Use até 8 fotos adicionais na galeria.');
  for(const [key,max] of [['condicaoPagamento',100],['rodapeEndereco',180],['rodapeTelefone',30]])d.arte[key]=texto(a[key],max)||'';
  d.arte.galeria=[...new Set((a.galeria||[]).map(v=>{const image=url(v);if(!image)falhar('Imagem da galeria inválida.');return image}))];
  d.arte.capaSiteUrl=url(a.capaSiteUrl);
  if(a.ajustesGaleria!==undefined){
    if(!a.ajustesGaleria||typeof a.ajustesGaleria!=='object'||Array.isArray(a.ajustesGaleria)||Object.keys(a.ajustesGaleria).length>9)falhar('Ajustes da galeria inválidos.');
    d.arte.ajustesGaleria={};for(const [foto,ajuste]of Object.entries(a.ajustesGaleria)){const destino=url(foto);if(!destino)falhar('Foto da galeria inválida.');if(d.arte.galeria.includes(destino))d.arte.ajustesGaleria[destino]=validarAjusteImagem(ajuste);}
  }
  return {...d,tipo:b.tipo,status:b.status,destaque:b.destaque===true};
}
