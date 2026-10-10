// Configuração da prévia. Na integração, estes dados virão da API.
export const company = {
  name: 'Ferramad', logo: './assets/logo.webp', whatsapp: '',
  colors: { primary: '#084f2b', accent: '#ffbd16' },
};
// O proxy local e o Nginx em produção usam este caminho relativo.
export const configurationUrl = '/api/public/configuracao';
// Produtos ilustrativos: confirmar disponibilidade e serviços antes de publicar.
export const products = [
  { id: 'branco', name: 'MDF Branco', category: 'mdf', finish: 'Uma base versátil para seus móveis.', surface: 'white', tag: 'ESSENCIAL', thickness: 'Espessura sob consulta' },
  { id: 'carvalho', name: 'MDF Carvalho', category: 'mdf', finish: 'Textura amadeirada, presença natural.', surface: 'oak', tag: 'AMADEIRADO', thickness: 'Espessura sob consulta' },
  { id: 'nogueira', name: 'MDF Nogueira', category: 'mdf', finish: 'Tons profundos para projetos marcantes.', surface: 'walnut', tag: 'AMADEIRADO', thickness: 'Espessura sob consulta' },
  { id: 'cinza', name: 'MDF Cinza', category: 'mdf', finish: 'Acabamento neutro e contemporâneo.', surface: 'gray', tag: 'UNICOLOR', thickness: 'Espessura sob consulta' },
  { id: 'fita', name: 'Fitas de borda', category: 'acabamentos', finish: 'O acabamento que acompanha seu painel.', surface: 'edge', tag: 'ACABAMENTO', thickness: 'Padrões sob consulta' },
  { id: 'corte', name: 'Corte sob medida', category: 'servicos', finish: 'Peças nas medidas do seu projeto.', surface: 'cut', tag: 'SERVIÇO', thickness: 'Envie sua lista de peças' },
];
// A primeira página institucional publicada controla a seção correspondente.
// A mesma regra é usada pelo site e pela conferência no editor.
export function paginasPublicadas(paginas = []) {
  return paginas.filter(p => p.ativo !== false).slice().sort((a,b) =>
    (a.ordem || 0) - (b.ordem || 0) || String(a.titulo || '').localeCompare(String(b.titulo || '')) || String(a.id || '').localeCompare(String(b.id || '')));
}
export function resolverConteudo(config = {}, paginas = []) {
  const publicadas = paginasPublicadas(paginas), conteudo = {...config.conteudo}, fontes = {}, ajustesImagens={...config.ajustesImagens};
  for (const [tipo, campos] of Object.entries({
    HISTORIA: ['tituloSobre','textoSobre','imagemSobreUrl'],
    CONTATO: ['tituloContato','textoContato','imagemAtendimentoUrl']
  })) {
    const pagina = publicadas.find(p => p.tipo === tipo);
    if (!pagina) continue;
    fontes[tipo] = pagina;
    conteudo[campos[0]] = pagina.titulo || '';
    conteudo[campos[1]] = pagina.descricao || '';
    conteudo[campos[2]] = pagina.imagemUrl || '';
    ajustesImagens[campos[2]]=pagina.ajusteImagem||{};
    if (tipo === 'HISTORIA') conteudo.textoSobreComplemento = '';
  }
  fontes.SERVICO = publicadas.filter(p => p.tipo === 'SERVICO');
  return {...config, conteudo, fontes,ajustesImagens};
}
export const perfisImagem={
 logo:{largura:800,altura:400,modo:'contain',nota:'Use fundo transparente e margem pequena ao redor da marca.'},
 software:{largura:600,altura:240,modo:'contain',nota:'Logo horizontal com fundo transparente.'},
 principal:{largura:1600,altura:1200,modo:'cover',nota:'Mantenha o assunto principal próximo ao centro.'},
 secao:{largura:1600,altura:1200,modo:'cover',nota:'Foto horizontal; evite textos junto às bordas.'},
 pagina:{largura:1600,altura:1200,modo:'contain',nota:'Fotos horizontais funcionam na seção inicial e na página de detalhes.'},
 produto:{largura:1200,altura:900,modo:'contain',nota:'Mostre o produto inteiro, com fundo simples.'},
 categoria:{largura:1200,altura:900,modo:'contain',nota:'Foto horizontal representativa da categoria.'},
 banner:{largura:1920,altura:960,modo:'cover',nota:'Deixe o lado esquerdo livre para o texto. No celular, confira o recorte.'},
 promocao:{largura:1080,altura:1350,modo:'contain',nota:'Arte para Feed: 1080 × 1350 px. Stories: 1080 × 1920 px.'}
};
export function estiloImagem(ajuste={},padrao='contain'){
 const modo=['cover','contain','natural'].includes(ajuste?.modo)?ajuste.modo:padrao;
 const pos=v=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(100,v)):50;
 return {objectFit:modo==='natural'?'scale-down':modo,objectPosition:`${pos(ajuste?.x)}% ${pos(ajuste?.y)}%`};
}
export function aplicarAjusteImagem(imagem,ajuste={},padrao='contain'){
 if(!imagem)return;
 Object.assign(imagem.style,estiloImagem(ajuste,padrao));
 // Animações de escala e regras para ilustrações não podem mudar a escolha.
 if(ajuste?.modo){imagem.style.transform='none';imagem.style.padding='0';imagem.dataset.ajusteImagem=ajuste.modo;}
}


export const secoesSite = [
  ['banners','Banners de destaque'], ['solucoes','Apresentação principal'],
  ['promocoes','Promoções e novidades'], ['publicos','Públicos atendidos'],
  ['beneficios','Benefícios'], ['marcas','Marcas'], ['catalogo','Vendas — materiais'],
  ['equipamentos','Vendas — máquinas e ferramentas'], ['servicos','Central de Serviços'],
  ['softwares','Softwares'], ['preparar-projeto','Orientações para o projeto'],
  ['como-funciona','Como funciona'], ['sobre','Sobre a empresa'],
  ['orcamento','Iniciar projeto no Cortecloud'], ['consultar-pedido','Consultar pedido'],
  ['area-cliente','Área do Cliente'], ['contato','Contato e localização']
];
export function ordenarSecoes(ordem) {
  const ids=secoesSite.map(([id])=>id);
  return [...new Set([...(Array.isArray(ordem)?ordem.filter(id=>ids.includes(id)):[]),...ids])];
}
// Mover os elementos preserva formulários, eventos, links e a ordem de leitura.
export function aplicarOrdemSecoes(main,ordem) {
  if(!main)return;
  const elementos=new Map(Array.from(main.children).map(el=>[el.id,el]));
  for(const id of ordenarSecoes(ordem))if(elementos.has(id))main.append(elementos.get(id));
}
export function aplicarVisibilidadeSecoes(main,desativadas=[],links=[]) {
  const ids=new Set(secoesSite.map(([id])=>id));
  const ocultas=new Set(Array.isArray(desativadas)?desativadas.filter(id=>ids.has(id)):[]);
  for(const el of Array.from(main?.children||[]))el.classList.toggle('secao-desativada',ocultas.has(el.id));
  for(const link of links){
    const href=link.getAttribute('href')||'';
    // Apenas atalhos para as partes desta página; páginas de detalhes continuam independentes.
    const alvo=/^(?:\.\/index\.html|index\.html|\/index\.html|\/)?#([^?]+)$/.exec(href)?.[1];
    link.classList.toggle('secao-desativada',ocultas.has(alvo));
  }
}
