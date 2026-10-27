import {imagemCatalogo} from './imagensCatalogo.js';
import {resolverConteudo,aplicarAjusteImagem,aplicarTamanhosSite} from './config.js';
import {aplicarOrdemSecoes,aplicarVisibilidadeSecoes} from './config.js';
import {contatoProduto,adicionarOfertaAoFormulario} from './ofertas.js';
import {mostrarRedes} from './redes.js';
import {montarCarrossel,carregarMarketing} from './marketing.js';
import { company, products as produtosDemonstracao, configurationUrl } from './config.js';
import { linkOrcamentoWhatsApp } from './whatsapp.js';
import { iniciarAreaCliente } from './cliente.js';
let products = produtosDemonstracao;
let liveSettings = null;
let livePages;
let liveCategories = [];
const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
async function carregarIdentidade() {
  let settings;
  let disabled = false;
  try {
    const response = await fetch(configurationUrl, { signal: AbortSignal.timeout(6000), cache: 'no-store' });
    if (!response.ok) {
      disabled = response.status === 404 && (await response.json()).code === 'SITE_DISABLED';
      throw new Error('Configuração indisponível');
    }
    settings = await response.json();
    if (!settings.ativo || !settings.nome) throw new Error('Configuração incompleta');
  } catch {
    const notice = document.createElement('p'); notice.className = 'configuration-notice'; notice.setAttribute('role', 'status');
    if (localPreview) {
      notice.textContent = disabled
        ? 'Prévia local ilustrativa: ative a configuração do site no Sistema-Produção para carregar a identidade cadastrada.'
        : 'Prévia local ilustrativa: a configuração do sistema está indisponível. As alterações cadastradas aparecerão ao conectar a API e recarregar.';
      document.body.prepend(notice);
      return;
    }
    document.querySelector('main').hidden = true; document.querySelector('.header').hidden = true;
    document.querySelector('.topbar').hidden = true; document.querySelector('footer').hidden = true;
    document.querySelector('.mobile-actions').hidden = true;
    document.title = 'Site indisponível';
    notice.textContent = disabled ? 'O site está temporariamente desativado.' : 'O site está temporariamente indisponível. Tente novamente mais tarde.';
    document.body.prepend(notice);
    return;
  }
  try {
    const response = await fetch('/api/public/paginas', {cache:'no-store',signal:AbortSignal.timeout(6000)});
    if (response.ok) livePages = await response.json();
  } catch { /* Os textos institucionais continuam disponíveis durante falha da API de páginas. */ }
  settings = resolverConteudo(settings, livePages);
  company.name = settings.nome;
  liveSettings = settings;
  aplicarTamanhosSite(settings.ajustesImagens?.tamanhosSite);
  if(settings.telefone){
    const telefone=document.createElement('a');telefone.className='header-phone';telefone.href='tel:'+settings.telefone.replace(/[^\d+]/g,'');telefone.setAttribute('aria-label','Ligar para '+settings.telefone);
    const label=document.createElement('span');label.textContent='Fale com a equipe';const numero=document.createElement('strong');numero.textContent=settings.telefone;telefone.append(label,numero);
    document.querySelector('.header-cta').before(telefone);
  }
  mostrarRedes(settings);
  company.logo = settings.logoUrl;
  company.whatsapp = settings.whatsapp;
  company.colors = { primary: settings.corPrimaria, accent: settings.corDestaque };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)) node.textContent = node.textContent.replace(/Ferramad/gi, company.name);
  }
  document.title = `${company.name} — Seu projeto começa com o corte certo`;
  document.querySelector('[name="description"]').content = `MDF, corte sob medida e acabamentos para marceneiros. Conheça ${company.name} e prepare sua solicitação de orçamento.`;
  document.querySelector('[property="og:title"]').content = `${company.name} — Do painel ao seu próximo projeto`;
  document.querySelector('[name="theme-color"]').content = company.colors.primary;
  document.querySelectorAll('img[src="./assets/logo-ferramad-original.png"]').forEach(image => {
    image.alt = company.name; aplicarAjusteImagem(image,settings.ajustesImagens?.logoUrl);
    if (company.logo) image.src = company.logo;
    else { const name = document.createElement('strong'); name.textContent = company.name; image.replaceWith(name); }
  });
  document.querySelector('.header .brand').setAttribute('aria-label', `${company.name}, início`);
  const links = document.createElement('div'); links.className = 'configured-links';
  function adicionarLink(label, href) {
    if (!href) return;
    const link = document.createElement('a'); link.textContent = label; link.href = href;
    link.rel = 'noopener noreferrer'; links.append(link);
  }
  if (settings.telefone) adicionarLink(`Telefone: ${settings.telefone}`, `tel:${settings.telefone.replace(/[^\d+]/g, '')}`);
  if (settings.email) adicionarLink(settings.email, `mailto:${settings.email}`);
  if (settings.whatsapp) adicionarLink(`Fale pelo WhatsApp: ${settings.whatsapp.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')}`, `https://wa.me/${settings.whatsapp}`);

  adicionarLink('Acesso ao sistema', settings.sistemaUrl);
  document.querySelector('footer').prepend(links);
  if (settings.siteUrl) {
    const canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = settings.siteUrl; document.head.append(canonical);
  }
  const schema=document.createElement('script');schema.type='application/ld+json';schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'LocalBusiness',name:settings.nome,telephone:settings.telefone,email:settings.email,image:settings.logoUrl,url:settings.siteUrl||location.origin,address:settings.conteudo?.enderecoContato});document.head.append(schema);
  const bindings = {
    beneficio1: ".value-strip>div:nth-child(1) strong",
    beneficio2: ".value-strip>div:nth-child(2) strong",
    beneficio3: ".value-strip>div:nth-child(3) strong",
    beneficio4: ".value-strip>div:nth-child(4) strong",
    tituloEquipamentos: "#equipamentos h2",
    descricaoEquipamentos: "#equipamentos .section-heading>p",
    tituloPreparacao: "#preparar-projeto h2",
    preparacao1Titulo: "#preparar-projeto article:nth-child(1) h3",
    preparacao1Texto: "#preparar-projeto article:nth-child(1) p",
    preparacao2Titulo: "#preparar-projeto article:nth-child(2) h3",
    preparacao2Texto: "#preparar-projeto article:nth-child(2) p",
    preparacao3Titulo: "#preparar-projeto article:nth-child(3) h3",
    preparacao3Texto: "#preparar-projeto article:nth-child(3) p",
    tituloConsulta: "#consultar-pedido h2",
    descricaoConsulta: "#consultar-pedido .quote-copy>p:not(.eyebrow)",
    tituloAreaCliente: "#area-cliente .quote-copy h2",
    descricaoAreaCliente: "#area-cliente .quote-copy>p:nth-of-type(2)",
    orientacaoAreaCliente: "#area-cliente .quote-copy>p:nth-of-type(3)",

    chamadaTopo: '.topbar>span', chamadaHome: '.hero-copy>.eyebrow',
    descricaoHome: '.hero-description', botaoHome: '.hero-actions>.button',
    chamadaCatalogo: '#catalogo .eyebrow', tituloCatalogo: '#catalogo h2', descricaoCatalogo: '#catalogo .section-heading>p',
    tituloServicos: '.service-intro h2', descricaoServicos: '.service-intro>p:not(.eyebrow)',
    servico1Titulo: '.service-list article:nth-child(1) h3', servico1Texto: '.service-list article:nth-child(1) p',
    servico2Titulo: '.service-list article:nth-child(2) h3', servico2Texto: '.service-list article:nth-child(2) p',
    servico3Titulo: '.service-list article:nth-child(3) h3', servico3Texto: '.service-list article:nth-child(3) p',
    tituloComoFunciona: '#como-funciona h2',
    passo1Titulo: '#como-funciona .steps article:nth-child(1) h3', passo1Texto: '#como-funciona .steps article:nth-child(1) p',
    passo2Titulo: '#como-funciona .steps article:nth-child(2) h3', passo2Texto: '#como-funciona .steps article:nth-child(2) p',
    passo3Titulo: '#como-funciona .steps article:nth-child(3) h3', passo3Texto: '#como-funciona .steps article:nth-child(3) p',
    tituloSobre: '#sobre h2', textoSobre: '#sobre>div:nth-child(2)>p:nth-of-type(2)', textoSobreComplemento: '#sobre>div:nth-child(2)>p:nth-of-type(3)',
    tituloContato: '#contato h2', textoContato: '#contato .contact-intro',
    publicoTitulo: '#publicos h2', publicoTexto: '.audience-description', softwareTitulo: '#softwares h2', softwareTexto: '.software-description',
    tituloProjetoSite: '#orcamento .quote-copy h2', descricaoProjetoSite: '#orcamento .quote-copy>p:not(.eyebrow)', textoRodape: '.footer-main>p'
  };
  const content = settings.conteudo || {};
  for (const [field, selector] of Object.entries(bindings)) {
    if (content[field] !== undefined) { const element = document.querySelector(selector); if(element){element.textContent = content[field]; element.classList.add('configured-text');} }
  }
  for (const n of [1,2]) {
    const logo=document.querySelector(`[data-software-logo="${n}"]`);
    const url=content[`software${n}LogoUrl`];
    if(url){aplicarAjusteImagem(logo,settings.ajustesImagens?.[`software${n}LogoUrl`]);logo.src=url;logo.alt=content[`software${n}Nome`] || `Software ${n}`;logo.hidden=false;}
  }
  document.querySelector('.hero-tools').hidden=!(content.software1LogoUrl || content.software2LogoUrl);
  document.querySelector('#publicos').hidden = !content.publicoTitulo;
  for (const n of [4,5]) {
    const article=document.querySelector(`[data-optional-service="${n}"]`);
    article.hidden=!content[`servico${n}Titulo`];
    article.querySelector('h3').textContent=content[`servico${n}Titulo`] || '';
    article.querySelector('p').textContent=content[`servico${n}Texto`] || '';
  }
  for (const n of [1,2]) {
    const label=document.querySelector(`[data-software="${n}"]`);
    const name=content[`software${n}Nome`] || '';
    const url=content[`software${n}LogoUrl`];
    label.replaceChildren();label.hidden=!(name || url);
    if(url){const logo=document.createElement('img');logo.src=url;logo.alt=name || `Software ${n}`;logo.loading='lazy';aplicarAjusteImagem(logo,settings.ajustesImagens?.[`software${n}LogoUrl`]);label.append(logo);}
    else label.textContent=name;
  }
  document.querySelector('#softwares').hidden=!(content.software1Nome || content.software2Nome || content.software1LogoUrl || content.software2LogoUrl);
  document.querySelectorAll('[data-site-image]').forEach(image=>{
    const url=content[image.dataset.siteImage];
    if(!url) return;
    image.src=url; image.hidden=false; aplicarAjusteImagem(image,settings.ajustesImagens?.[image.dataset.siteImage],'cover');
    if(image.parentElement.tagName==='FIGURE') image.parentElement.hidden=false;
    if(image.parentElement.classList.contains('about-mark')) {
      image.parentElement.classList.add('has-photo');
      [...image.parentElement.children].filter(child=>child!==image).forEach(child=>child.hidden=true);
    }
  });
  const contact = document.querySelector('#contact-details');
  // Os dados já têm seus próprios cartões; a apresentação mantém só o texto editorial.
  const intro=document.querySelector('#contato .contact-intro');
  const normalizarContato=valor=>String(valor||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR');
  const dadosContato=[content.enderecoContato,content.horarioContato,content.orientacoesRetirada,settings.telefone,settings.email,settings.whatsapp,settings.whatsapp?.replace(/^55(\d{2})(\d{4,5})(\d{4})$/,'($1) $2-$3')].map(normalizarContato).filter(Boolean);
  intro.textContent=String(content.textoContato||'').split(/\n\s*\n/).filter(parte=>!dadosContato.includes(normalizarContato(parte))).join('\n\n');
  intro.hidden=!intro.textContent.trim();
  for (const [label,value] of [['Endereço',content.enderecoContato],['Horário de atendimento',content.horarioContato],['Retirada',content.orientacoesRetirada]]) {
    if(!value) continue;
    const block=document.createElement('div'); const title=document.createElement('h3'); title.textContent=label; const description=document.createElement('p'); description.textContent=value; description.className='configured-text';block.append(title,description);contact.append(block);
  }
  for (const [label,value,href] of [
    ['Telefone',settings.telefone,settings.telefone?`tel:${settings.telefone.replace(/[^\d+]/g,'')}`:''],
    ['E-mail',settings.email,settings.email?`mailto:${settings.email}`:''],

  ]){
    if(!value)continue;
    const block=document.createElement('div');const heading=document.createElement('h3');heading.textContent=label;
    const link=document.createElement('a');link.textContent=value;link.href=href;link.className='contact-link';
    if(label==='WhatsApp'){link.target='_blank';link.rel='noopener noreferrer';}
    block.append(heading,link);contact.append(block);
  }
  const mapAddress = content.enderecoContato?.trim();
  const mapQuery = content.localizacaoMapa?.trim() || (mapAddress ? company.name : '');
  const locationUrl = content.localizacaoUrl || (mapAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : '');
  for(const [label,url] of [[`Fale pelo WhatsApp: ${String(settings.whatsapp || '').replace(/^55(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')}`,settings.whatsapp ? `https://wa.me/${settings.whatsapp}` : ''],['Abrir no Google Maps',mapAddress ? '' : locationUrl]]) {
    if(!url)continue;
    try { const parsed=new URL(url); if(!['https:','http:'].includes(parsed.protocol))continue; const link=document.createElement('a');link.className='button';link.textContent=label;link.href=parsed.href;link.target='_blank';link.rel='noopener noreferrer';contact.append(link); } catch {}
  }
  if (mapAddress) {
    const map = document.createElement('div'); map.className='contact-map';
    const heading=document.createElement('h3');heading.textContent='Como chegar';
    const hint=document.createElement('p');hint.textContent='Veja nossa localização e planeje sua visita ou retirada.';
    const frame=document.createElement('iframe');frame.title=`Mapa: ${mapAddress.replace(/\s+/g,' ')}`;
    frame.src=`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
    frame.loading='lazy';frame.referrerPolicy='no-referrer';frame.allowFullscreen=true;
    const route=document.createElement('a');route.className='button';route.textContent='Traçar rota';
    route.href=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;
    route.target='_blank';route.rel='noopener noreferrer';
    map.append(heading,hint,frame,route);document.querySelector('#contato').append(map);
  }
  document.querySelector('#contato').hidden=!contact.childElementCount;
  if (content.tituloHome || content.destaqueHome) {
    const title = document.querySelector('h1');
    const mainTitle = content.tituloHome || 'Você imagina.\nA gente corta.';
    const highlight = document.createElement('em'); highlight.textContent = content.destaqueHome || 'Seu projeto ganha forma.';
    title.replaceChildren(document.createTextNode(`${mainTitle}\n`), highlight); title.classList.add('configured-text');
  }
  const homeImage=document.querySelector('.hero-visual>img');
  homeImage.parentElement.hidden=!settings.imagemHomeUrl;
  if (settings.imagemHomeUrl) { aplicarAjusteImagem(homeImage,settings.ajustesImagens?.imagemHomeUrl,'cover'); homeImage.src = settings.imagemHomeUrl; homeImage.alt = `Materiais e marcenaria — ${company.name}`; document.querySelector('.hero').classList.add('has-home-photo'); }
  if (content.seoTitulo) { document.title = content.seoTitulo; document.querySelector('[property="og:title"]').content = content.seoTitulo; }
  if (content.seoDescricao) { document.querySelector('[name="description"]').content = content.seoDescricao; document.querySelector('[property="og:description"]').content = content.seoDescricao; }
}
await carregarIdentidade();
async function carregarCatalogo() {
  if (!liveSettings) return;
  const toolbar = document.querySelector('.filters'); toolbar.replaceChildren();
  const results = await Promise.allSettled(['produtos','categorias','banners'].map(async type => {
    const response = await fetch(`/api/public/${type}`, {cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!response.ok) throw new Error('Catálogo indisponível');
    return response.json();
  }));
  const [items,categories,banners] = results;
  if(categories.status==='fulfilled')liveCategories=categories.value;
  const catalogReady = items.status === 'fulfilled' && categories.status === 'fulfilled';
  products = catalogReady ? items.value.map(item=>({type:item.tipoVenda||'MATERIAL',price:item.preco==null?null:Number(item.preco),oldPrice:item.precoAnterior==null?null:Number(item.precoAnterior),brand:item.marca,condition:item.condicao,id:item.id,name:item.nome,category:item.categoriaId || '',finish:item.descricaoCurta,description:item.descricao,image:imagemCatalogo(item),ajusteImagem:item.ajusteImagem,illustrative:imagemCatalogo(item)!==item.imagemPrincipalUrl,tag:item.destaque?'DESTAQUE':'',thickness:item.especificacao})) : [];
  const all = document.createElement('button'); all.type='button'; all.dataset.filter='todos'; all.className='active'; all.textContent='Todos os materiais'; all.setAttribute('aria-pressed','true'); toolbar.append(all);
  if(categories.status === 'fulfilled') for(const category of categories.value) {
    const button=document.createElement('button');button.type='button';button.dataset.filter=category.id;button.textContent=category.nome;button.setAttribute('aria-pressed','false');toolbar.append(button);
  }
  document.querySelector('.catalog-note').textContent = catalogReady ? 'Consulte disponibilidade, padrões e condições no atendimento.' : 'Não foi possível carregar o catálogo. Recarregue a página ou fale com a equipe.';
  if(banners.status==='fulfilled') montarCarrossel(banners.value);
}
await carregarCatalogo();
await carregarMarketing(liveSettings||company, livePages);
// Com um banner de abertura, a próxima seção apresenta escolhas concretas.
if(document.querySelector('.home-carousel')){
  const hero=document.querySelector('.hero');
  hero.id='solucoes';
  hero.classList.add('service-overview');
  const links=document.createElement('nav');links.className='service-overview-links';links.setAttribute('aria-label','Conheça os serviços');
  for(const article of document.querySelectorAll('.service-list article:not([hidden])')){
    const title=article.querySelector('h3'),detail=article.querySelector('a');
    if(!title)continue;
    const link=document.createElement('a');link.href=detail?.getAttribute('href')||'#servicos';
    const name=document.createElement('span');name.textContent=title.textContent;
    const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
    link.append(name,arrow);links.append(link);
  }
  hero.append(links);
}
document.querySelector('.hero').id='solucoes';
const faixaBeneficios=document.querySelector('.value-strip');if(faixaBeneficios)faixaBeneficios.id='beneficios';
const destaques=document.querySelector('.home-carousel');if(destaques)destaques.id='banners';
const marcas=document.querySelector('.marketing-section:not(#promocoes)');if(marcas)marcas.id='marcas';
// Abertura comercial: serviços, materiais, ferramentas do projeto e contato Cortecloud.
const ordemAbertura=[document.querySelector('.home-carousel')?'banners':'solucoes','servicos','catalogo','softwares','orcamento','consultar-pedido','area-cliente'];
aplicarOrdemSecoes(document.querySelector('main'),[...ordemAbertura,...(liveSettings?.conteudo?.ordemSecoes||[])]);
// Marcas ficam temporariamente ocultas; o conteúdo cadastrado é preservado.
aplicarVisibilidadeSecoes(document.querySelector('main'),[...(liveSettings?.conteudo?.secoesDesativadas||[]),'marcas'],document.querySelectorAll('a[href]'));
const acessosCliente=document.createElement('div');
acessosCliente.className='customer-access';
const acompanhamento=document.querySelector('#consultar-pedido');
acompanhamento.before(acessosCliente);
acessosCliente.append(acompanhamento,document.querySelector('#area-cliente'));

document.body.classList.remove('identity-loading');
document.documentElement.style.setProperty('--primary', company.colors.primary);
document.documentElement.style.setProperty('--accent', company.colors.accent);
document.querySelector('#year').textContent = new Date().getFullYear();
const selected = new Map();
let toastTimer;
const toast = message => {
  const element = document.querySelector('#toast');
  element.textContent = message; element.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => element.hidden = true, 2800);
};
let materialFilter='todos',equipmentFilter='TODOS';
function renderProducts(filter = materialFilter, equipment = false) {
  if(!equipment)materialFilter=filter;
  if(!equipment){
    let details=document.querySelector('#category-details');
    if(!details){details=document.createElement('section');details.id='category-details';details.className='category-details';document.querySelector('#products').before(details);}
    details.replaceChildren();
    const category=liveCategories.find(c=>c.id===filter);
    details.hidden=!category;
    if(category){if(category.imagemUrl){const img=document.createElement('img');img.src=category.imagemUrl;img.alt=category.nome;aplicarAjusteImagem(img,category.ajusteImagem);img.loading='lazy';details.append(img);}const title=document.createElement('h3');title.textContent=category.nome;details.append(title);if(category.descricao){const text=document.createElement('p');text.textContent=category.descricao;details.append(text);}}
  }
  const query=document.querySelector(equipment?'#equipment-search':'#catalog-search').value.trim().toLocaleLowerCase('pt-BR');
  const visible = products.filter(p => (equipment?p.type==='MAQUINA'||p.type==='FERRAMENTA':!p.type||p.type==='MATERIAL') && (equipment?equipmentFilter==='TODOS'||p.type===equipmentFilter:filter==='todos'||p.category===filter) && `${p.name} ${p.brand||''} ${p.thickness||''}`.toLocaleLowerCase('pt-BR').includes(query));
  const container = document.querySelector(equipment?'#equipment-products':'#products'); container.replaceChildren();
  for (const product of visible) {
    const article = document.createElement('article'); article.className = 'product';article.dataset.productId=product.id;
    const swatch = document.createElement('div'); swatch.className = `swatch ${liveSettings ? 'published' : product.surface}`;
    const image = document.createElement('img'); if(!liveSettings || product.image) image.src = liveSettings ? product.image : './assets/marcenaria.png'; image.alt = liveSettings ? product.name : ''; image.loading = 'lazy'; aplicarAjusteImagem(image,product.ajusteImagem);
    const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = product.tag;
    if (!liveSettings || product.image) swatch.append(image);
    else { const placeholder=document.createElement('span');placeholder.className='no-product-image';placeholder.textContent='Imagem em breve';swatch.append(placeholder); }
    if(product.tag)swatch.append(tag);if(product.illustrative){const caption=document.createElement('span');caption.className='illustrative-caption';caption.textContent='Imagem ilustrativa · confirme o padrão';swatch.append(caption);}
    const details = document.createElement('div'); details.className = 'product-details';
    const title = document.createElement('div'); title.className = 'product-title';
    const heading = document.createElement('h3'); heading.textContent = product.name;
    const button = document.createElement('button'); button.className = 'add-product'; button.textContent = 'Adicionar ao orçamento +'; button.type = 'button';
    button.setAttribute('aria-label', `Adicionar ${product.name} ao orçamento`);
    button.addEventListener('click', () => {
      if((selected.get(product.id)||0)>=9999){toast('Limite de 9999 unidades por material.');return}selected.set(product.id, (selected.get(product.id) || 0) + 1); renderSelected(); form.dispatchEvent(new Event('input'));
      document.querySelector('#quote-result').hidden = true;
      button.textContent='✓ Incluído · adicionar mais';article.classList.add('product-selected');toast(`${product.name} adicionado à solicitação`);location.hash='orcamento';form.elements.nome.focus({preventScroll:true});form.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    });
    title.append(heading);
    const description = document.createElement('p'); description.textContent = product.finish;
    const thickness = document.createElement('small'); thickness.textContent = product.thickness;
    details.append(title, description, thickness);
    const price=document.createElement('div');price.className='product-price';
    if(product.price!=null&&product.oldPrice!=null&&product.oldPrice>product.price){const old=document.createElement('del');old.textContent=product.oldPrice.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});price.append(old);}
    const amount=document.createElement('strong');amount.textContent=product.price==null?'Preço sob consulta':product.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});price.append(amount);if(product.price==null){price.classList.add('on-request');const note=document.createElement('small');note.textContent='Fale com a equipe para confirmar o valor.';price.append(note);}
    if(product.brand||product.condition){const specs=document.createElement('p');specs.className='product-brand';specs.textContent=[product.brand,product.condition].filter(Boolean).join(' · ');details.append(specs);}
    details.append(price);article.append(swatch, details); container.append(article);
    if(product.description) {
      const disclosure=document.createElement('details');disclosure.className='product-description';
      const summary=document.createElement('summary');summary.textContent='Mais informações';
      const text=document.createElement('p');text.textContent=product.description;text.className='configured-text';disclosure.append(summary,text);details.append(disclosure);
    }
    const actions=document.createElement('div');actions.className='product-actions';const zap=contatoProduto({titulo:product.name,preco:product.price},company.whatsapp);if(zap){const link=document.createElement('a');link.href=zap;link.target='_blank';link.rel='noopener noreferrer';link.className='product-whatsapp';link.textContent='Consultar no WhatsApp ↗';link.setAttribute('aria-label','Consultar '+product.name+' no WhatsApp');actions.append(link)}if(equipment)actions.append(button);details.append(actions);if(equipment&&selected.has(product.id)){button.textContent='✓ Incluído · adicionar mais';article.classList.add('product-selected')}
  }
  if(equipment&&!visible.length&&!query&&equipmentFilter==='TODOS'){
    for(const [name,description,symbol] of [['Máquinas para produção','Consulte equipamentos e especificações para sua operação.','⚙'],['Ferramentas profissionais','Converse sobre as ferramentas para sua rotina de trabalho.','⌁'],['Acessórios e consumíveis','Encontre orientação para escolher os itens do seu projeto.','✧']]){
      const card=document.createElement('article');card.className='equipment-family';const icon=document.createElement('span');icon.className='equipment-symbol';icon.textContent=symbol;const h=document.createElement('h3');h.textContent=name;const text=document.createElement('p');text.textContent=description;const link=document.createElement('a');link.href='#orcamento';link.className='button';link.textContent='Consultar a equipe';card.append(icon,h,text,link);container.append(card);
    }
  }
  if(!visible.length){const empty=document.createElement('p');empty.className='empty-catalog';empty.textContent=equipment?'Catálogo de equipamentos em preparação. Consulte máquinas, ferramentas e condições com nossa equipe. ':'Quer encontrar o material certo? ';const link=document.createElement('a');link.className='text-link';link.href='#orcamento';link.textContent='Conte seu projeto e consulte a equipe.';empty.append(link);container.append(empty);}
  if(!equipment)document.querySelector('#product-count').textContent = `${visible.length} opções`;
}
function renderSelected() {
  const container = document.querySelector('#selected-items'); container.replaceChildren();
  const count = document.querySelector('.cart-count'); count.hidden = selected.size === 0; count.textContent = selected.size;
  if (!selected.size) {
    const empty = document.createElement('p'); empty.className = 'empty-selection';
    empty.textContent = 'Escolha materiais no catálogo ou descreva seu projeto abaixo.'; container.append(empty); return;
  }
  for (const [id, quantity] of selected) {
    const product = products.find(product => product.id === id);
    const row = document.createElement('div'); row.className = 'selected-item';
    const name = document.createElement('span'); name.textContent = product.name;
    const input = document.createElement('input'); input.type = 'number'; input.min = '1'; input.max = '9999'; input.step = '1'; input.value = quantity;
    input.setAttribute('aria-label', `Quantidade de ${product.name}`);
    input.addEventListener('change', () => { const value = Math.max(1, Math.min(9999, Math.floor(Number(input.value) || 1))); selected.set(id, value); input.value = value; form.dispatchEvent(new Event('input')); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-item'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remover ${product.name}`);
    remove.addEventListener('click', () => { selected.delete(id); renderSelected();document.querySelectorAll('.product').forEach(card=>{if(card.dataset.productId===id){card.classList.remove('product-selected');const addButton=card.querySelector('.add-product');if(addButton)addButton.textContent='Adicionar ao orçamento +'}}); form.dispatchEvent(new Event('input')); });
    row.append(name, input, remove); container.append(row);
  }
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(other => { const active = other === button; other.classList.toggle('active', active); other.setAttribute('aria-pressed', String(active)); });
  renderProducts(button.dataset.filter);
}));
const menu = document.querySelector('#menu-toggle');
menu.addEventListener('click', () => { const open = document.querySelector('#navigation').classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); });
document.querySelectorAll('#navigation a').forEach(link => link.addEventListener('click', () => { document.querySelector('#navigation').classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Abrir menu'); }));
const form = document.querySelector('#quote-form');
const selectedServices=new Set();
const needLabels={acesso:'Quero receber meu link de acesso ao Cortecloud',projeto:'Meu projeto está pronto para conferência e orçamento',materiais:'Quero consultar uma oferta ou material',orientacao:'Preciso de orientação para montar meu projeto'};
function atualizarFluxoOrcamento(){
 const need=form.elements.necessidade.value;
 document.querySelector('#project-options').hidden=need!=='projeto'&&!projectFiles.files.length&&!form.elements.linkProjeto.value;
 document.querySelector('#material-options').hidden=need!=='materiais'&&!selected.size&&!selectedServices.size;
 document.querySelector('#manual-cuts').hidden=true;
 document.querySelector('#selected-services').textContent=selectedServices.size?'Serviços: '+[...selectedServices].join(' · '):'';
 const dated=form.elements.urgencia.value==='Tenho uma data definida';
 document.querySelector('#desired-date').hidden=!dated;form.elements.dataDesejada.disabled=!dated;
 form.elements.observacao.placeholder=['orientacao','acesso'].includes(need)?'Se quiser, conte o que você pretende montar.':need==='projeto'?'Se quiser, acrescente observações sobre o arquivo, acabamento ou montagem.':'Ex.: peças para um armário, MDF branco de 18 mm, com acabamento de bordas.';
}
for(const article of document.querySelectorAll('.service-list article')){
 if(article.hidden)continue;
 const title=article.querySelector('h3').textContent;
 const content=article.querySelector('div');
 const note=document.createElement('p');note.className='service-quote-note';note.textContent='Valor conforme medidas, material e acabamento.';
 content.append(note);
 const zap=linkOrcamentoWhatsApp(company.whatsapp,`Olá! Tenho interesse no serviço: ${title}. Pode confirmar o valor e as condições?`);
 if(zap){
  const actions=document.createElement('div');actions.className='product-actions';
  const link=document.createElement('a');link.href=zap;link.target='_blank';link.rel='noopener noreferrer';link.className='product-whatsapp';link.textContent='Consultar no WhatsApp ↗';link.setAttribute('aria-label','Consultar '+title+' no WhatsApp');
  actions.append(link);content.append(actions);
 }
}
const projectFiles=document.querySelector('#project-files');
const attachmentResult=document.querySelector('#attachment-result');
const retryAttachments=document.querySelector('#retry-attachments');
let pendingFiles=[],uploadReceipt=null,uploadBusy=false,confirmed=false;
projectFiles.addEventListener('change',()=>{
 const files=[...projectFiles.files];
 const invalid=files.length>3 || files.some(f=>f.size>5*1024*1024||!['application/pdf','image/jpeg','image/png'].includes(f.type));
 if(invalid){projectFiles.value='';document.querySelector('#attachment-selection').textContent='Escolha até 3 arquivos PDF, JPG ou PNG de no máximo 5 MB cada.';return;}
 document.querySelector('#attachment-selection').textContent=files.map(f=>`${f.name} (${Math.ceil(f.size/1024)} KB)`).join(' · ');
});
async function uploadPending(){
 if(uploadBusy||!uploadReceipt)return;
 uploadBusy=true;retryAttachments.disabled=true;
 const failed=[];
 for(const file of pendingFiles){
  const line=document.createElement('p');line.textContent=`Enviando ${file.name}…`;attachmentResult.append(line);
  try{
   const response=await fetch(`/api/atendimento-site/orcamentos/${encodeURIComponent(uploadReceipt.id)}/anexos`,{method:'POST',headers:{'Content-Type':file.type,'X-Upload-Token':uploadReceipt.tokenAnexos,'X-File-Name':encodeURIComponent(file.name.slice(0,150))},body:file,signal:AbortSignal.timeout(60000)});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Falha no envio.');
   line.textContent=`${file.name}: enviado. Exclusão automática em ${new Date(result.expiraEm).toLocaleDateString('pt-BR')}.`;
  }catch(error){failed.push(file);line.textContent=`${file.name}: não enviado — ${error.message}. O orçamento já está registrado.`;}
 }
 pendingFiles=failed;document.querySelector('#discard-attachments').hidden=!failed.length;retryAttachments.hidden=!failed.length;retryAttachments.disabled=false;uploadBusy=false;
 if(!failed.length){projectFiles.value='';document.querySelector('#attachment-selection').textContent='';uploadReceipt=null;}
}
retryAttachments.addEventListener('click',()=>uploadPending());
document.querySelector('#discard-attachments').addEventListener('click',()=>{if(uploadBusy)return;pendingFiles=[];uploadReceipt=null;projectFiles.value='';retryAttachments.hidden=true;document.querySelector('#discard-attachments').hidden=true;document.querySelector('#attachment-selection').textContent='';toast('O orçamento permanece registrado. Os anexos pendentes não foram enviados.');});
document.querySelector('#confirm-quote').addEventListener('click',()=>{confirmed=true;form.requestSubmit();});
document.querySelector('#edit-quote').addEventListener('click',()=>{document.querySelector('#review-quote').hidden=false;confirmed=false;document.querySelector('#quote-review').hidden=true;form.elements.nome.focus();});
let cutNumber=0;
const cutItems=document.querySelector('#cut-items');
function adicionarPeca(values=null){
  if(cutItems.children.length>=50){toast('Limite de 50 peças por solicitação.');return;}
  const id=++cutNumber;
  const row=document.createElement('fieldset');row.className='cut-piece';
  const legend=document.createElement('legend');legend.textContent=`Peça ${id}`;row.append(legend);
  function input(key,label,type,max) {const wrapper=document.createElement('label');wrapper.textContent=label;const field=document.createElement('input');field.dataset.cut=key;field.type=type;field.required=true;field.setAttribute('aria-label',`${label} — peça ${id}`);if(type==='number'){field.min='1';field.max=String(max);field.step='1';}else field.maxLength=max;wrapper.append(field);row.append(wrapper);return field;}
  input('nome','Identificação da peça','text',100);
  const material=document.createElement('label');material.textContent='Material';const select=document.createElement('select');select.dataset.cut='material';select.setAttribute('aria-label',`Material — peça ${id}`);
  for(const name of ['A definir com a equipe',...products.map(p=>p.name)]){const option=document.createElement('option');option.value=name;option.textContent=name;select.append(option);}material.append(select);row.append(material);
  input('comprimento','Comprimento (mm)','number',10000);input('largura','Largura (mm)','number',10000);input('quantidade','Quantidade','number',9999).value='1';
  const edges=document.createElement('div');edges.className='cut-edges';const caption=document.createElement('strong');caption.textContent='Fita de borda';edges.append(caption);
  for(const value of ['Comprimento 1','Comprimento 2','Largura 1','Largura 2']){const label=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.dataset.edge=value;label.append(check,document.createTextNode(value));edges.append(label);}row.append(edges);
  const remove=document.createElement('button');remove.type='button';remove.className='text-link';remove.textContent='Remover peça';remove.setAttribute('aria-label',`Remover peça ${id}`);remove.addEventListener('click',()=>{row.remove();form.elements.observacao.required=false;form.dispatchEvent(new Event('input'));document.querySelector('#quote-result').hidden=!(pendingFiles.length||uploadBusy);});row.append(remove);cutItems.append(row);document.querySelector('#manual-cuts').open=true;form.dispatchEvent(new Event('input'));form.elements.observacao.required=false;document.querySelector('#quote-result').hidden=true;
  if(values){if(values.material && ![...select.options].some(o=>o.value===values.material)){const old=document.createElement('option');old.value=values.material;old.textContent=`${values.material} (confirmar disponibilidade)`;select.append(old);}for(const field of row.querySelectorAll('[data-cut]')){const key=field.dataset.cut;field.value=key==='nome'?values.nome:values[key];}for(const check of row.querySelectorAll('[data-edge]'))check.checked=values.bordas.includes(check.dataset.edge);}
}
document.querySelector('#add-cut').addEventListener('click',()=>adicionarPeca());

function dataLocalHoje() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
form.elements.dataDesejada.min = dataLocalHoje();
const whatsappDisponivel = Boolean(linkOrcamentoWhatsApp(company.whatsapp, ''));
form.querySelector('[type="submit"]').textContent = liveSettings ? 'Revisar solicitação' : 'Revisar solicitação para copiar';
form.querySelector('#quote-help').textContent = liveSettings ? 'Sua solicitação será registrada para atendimento. Depois, você poderá conversar com a equipe pelo WhatsApp.' : 'Prévia ilustrativa: ative a configuração do site para receber solicitações.';
let recompraId=null, chaveSolicitacao=crypto.randomUUID();
const portal=iniciarAreaCliente(data=>{selectedServices.clear();document.querySelectorAll('.service-select').forEach(b=>{b.textContent='Incluir na solicitação +';b.setAttribute('aria-pressed','false');b.closest('article')?.classList.remove('service-selected');});confirmed=false;document.querySelector('#quote-review').hidden=true;recompraId=data.pedidoId;chaveSolicitacao=crypto.randomUUID();form.reset();cutItems.replaceChildren();selected.clear();for(const item of data.materiais){const p=products.find(p=>p.name===item.nome);if(p)selected.set(p.id,item.quantidade);}renderSelected();for(const p of data.pecas)adicionarPeca(p);form.elements.observacao.required=false;form.elements.necessidade.value=data.pecas.length?'projeto':'materiais';atualizarFluxoOrcamento();form.elements.observacao.value=`Recompra do pedido ${data.numero}. Confirmar materiais, medidas e valores.`;form.elements.nome.value=data.nome;const extras=data.materiais.filter(item=>!products.some(p=>p.name===item.nome));if(extras.length)form.elements.observacao.value+='\nMateriais do pedido anterior a confirmar: '+extras.map(p=>`${p.nome} (${p.quantidade})`).join(', ');document.querySelector('#quote-help').textContent='Revise as peças e complete seu telefone antes de solicitar novamente. Será criado um novo orçamento.';document.querySelector('#orcamento').scrollIntoView({behavior:'smooth'});});
form.addEventListener('input', () => {document.querySelector('#review-quote').hidden=false;atualizarFluxoOrcamento();confirmed=false;document.querySelector('#quote-review').hidden=true;document.querySelector('#quote-result').hidden=!(pendingFiles.length||uploadBusy);});
form.addEventListener('change',()=>form.dispatchEvent(new Event('input')));
form.addEventListener('invalid',event=>{event.target.closest('details')?.setAttribute('open','');},true);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if(uploadBusy||pendingFiles.length){toast('Conclua os anexos pendentes antes de enviar uma nova solicitação.');return;}
  const data = new FormData(form);
  const need=needLabels[data.get('necessidade')]||needLabels.orientacao;
  const observation=String(data.get('observacao')||'').trim();
  const dataDesejada = String(data.get('dataDesejada') || '');
  if (dataDesejada && dataDesejada < dataLocalHoje()) { toast('Escolha uma data a partir de hoje.'); form.elements.dataDesejada.focus(); return; }
  const phone = String(data.get('telefone')).replace(/\D/g, '');
  if (phone.length < 10 || phone.length > 13) { toast('Informe um telefone com DDD.'); form.elements.telefone.focus(); return; }
  const lines = [`Atendimento do projeto — ${company.name}`, '', `Nome: ${String(data.get('nome')).trim()}`, `Telefone: ${String(data.get('telefone')).trim()}`];
  lines.push(`O que preciso: ${need}`);
  if (data.get('email')) lines.push(`E-mail: ${data.get('email')}`);
  if (dataDesejada) { const [ano,mes,dia] = dataDesejada.split('-'); lines.push(`Data desejada para entrega ou retirada: ${dia}/${mes}/${ano}`); }
  if (data.get('urgencia') && data.get('urgencia') !== 'Sem urgência') lines.push(`Urgência: ${data.get('urgencia')}`);
  if (dataDesejada || (data.get('urgencia') && data.get('urgencia') !== 'Sem urgência')) lines.push('Prazo sujeito à confirmação da equipe conforme os materiais e serviços solicitados.');
  if(selectedServices.size)lines.push('', 'Serviços solicitados:', ...[...selectedServices].map(name=>`• ${name}`));
  if(data.get('linkProjeto'))lines.push('',`Link do projeto: ${data.get('linkProjeto')}`);
  if (selected.size) { lines.push('', 'Materiais / serviços:'); for (const [id, quantity] of selected) lines.push(`• ${products.find(product => product.id === id).name} — quantidade solicitada: ${quantity}`); }
  if(cutItems.children.length){lines.push('','Lista de corte (medidas em mm):');for(const row of cutItems.children){const get=key=>row.querySelector(`[data-cut="${key}"]`).value;const edges=[...row.querySelectorAll('[data-edge]:checked')].map(el=>el.dataset.edge);lines.push(`• ${get('nome')} | ${get('material')} | ${get('comprimento')} x ${get('largura')} mm | ${get('quantidade')} peça(s) | Bordas: ${edges.join(', ') || 'sem fita solicitada'}`);}lines.push('Confirmar sentido do padrão, espessura e identificação das bordas com a equipe.');}
  if(observation)lines.push('', 'Detalhes do projeto:', observation);
  lines.push('', 'A empresa envia o acesso ao Cortecloud. O orçamento será preparado após a montagem e conferência do projeto.');
  if(!confirmed){
    const summary=document.querySelector('#quote-review-text');summary.replaceChildren();
    const section=(title,text)=>{const block=document.createElement('div');const heading=document.createElement('h4');heading.textContent=title;const paragraph=document.createElement('p');paragraph.textContent=text;block.append(heading,paragraph);summary.append(block);};
    section('Contato',`${String(data.get('nome')).trim()}\n${data.get('telefone')}${data.get('email')?'\n'+data.get('email'):''}${data.get('documento')?'\nCPF/CNPJ: '+data.get('documento'):''}`);
    section('Solicitação',need+(observation?'\n'+observation:''));
    const items=[...[...selected].map(([id,q])=>`${products.find(p=>p.id===id).name} — ${q}`),...[...selectedServices]];
    if(items.length)section('Materiais e serviços',items.join('\n'));
    if(cutItems.children.length)section('Lista de corte',`${cutItems.children.length} tipo(s) de peça\n`+lines.slice(lines.indexOf('Lista de corte (medidas em mm):')+1).filter(line=>line.startsWith('•')).join('\n'));
    if(dataDesejada)section('Prazo desejado',dataDesejada.split('-').reverse().join('/'));
    const files=[...projectFiles.files];if(files.length||data.get('linkProjeto'))section('Projeto',[...files.map(f=>`${f.name} (${Math.ceil(f.size/1024)} KB)`),data.get('linkProjeto')||'',files.length?'Arquivos excluídos após 30 dias.':''].filter(Boolean).join('\n'));
    document.querySelector('#review-quote').hidden=true;document.querySelector('#quote-review').hidden=false;document.querySelector('#quote-review').scrollIntoView({block:'center',behavior:'smooth'});return;
  }
  confirmed=false;document.querySelector('#quote-review').hidden=true;
  let protocolo=null;
  if(liveSettings){
    const button=form.querySelector('[type="submit"]');button.disabled=true;button.textContent='Registrando solicitação...';
    const payload={chave:chaveSolicitacao,nome:String(data.get('nome')).trim(),telefone:String(data.get('telefone')),email:String(data.get('email')||''),documento:String(data.get('documento')||''),dataDesejada,urgencia:String(data.get('urgencia')||''),observacao:`O que preciso: ${need}${observation?'\n'+observation:''}`,linkProjeto:String(data.get('linkProjeto')||''),materiais:[...selected].map(([id,quantidade])=>({nome:products.find(p=>p.id===id).name,quantidade})).concat([...selectedServices].map(nome=>({nome:`Serviço: ${nome}`,quantidade:1}))),pecas:[...cutItems.children].map(row=>{const get=key=>row.querySelector(`[data-cut="${key}"]`).value;return {nome:get('nome'),material:get('material'),comprimento:Number(get('comprimento')),largura:Number(get('largura')),quantidade:Number(get('quantidade')),bordas:[...row.querySelectorAll('[data-edge]:checked')].map(el=>el.dataset.edge)};})};
    try{let result;if(recompraId){result=await portal.request(`/cliente/pedidos/${encodeURIComponent(recompraId)}/recomprar`,payload);}else{const response=await fetch('/api/atendimento-site/orcamentos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível registrar.');}protocolo=result.protocolo;uploadReceipt=result;pendingFiles=[...projectFiles.files];attachmentResult.replaceChildren();chaveSolicitacao=crypto.randomUUID();recompraId=null;}
    catch(error){toast(error.message==='Failed to fetch'?'Não foi possível conectar. Sua solicitação não foi confirmada; tente novamente.':error.message);return;}
    finally{button.disabled=false;button.textContent='Revisar solicitação';}
    lines.unshift(`Protocolo #${protocolo} — solicitação registrada`,'');
  }
  document.querySelector('#quote-result>strong').textContent=protocolo?`Solicitação registrada — protocolo #${protocolo}`:'Sua solicitação está pronta';
  document.querySelector('#quote-text').value = lines.join('\n');
  const whatsappUrl = linkOrcamentoWhatsApp(company.whatsapp, lines.join('\n'));
  const whatsappLink = document.querySelector('#send-whatsapp');
  whatsappLink.hidden = !whatsappUrl;
  if (whatsappUrl) {
    whatsappLink.href = whatsappUrl;
    // Após registrar, o cliente escolhe se deseja abrir o WhatsApp pelo link.
  } else whatsappLink.removeAttribute('href');
  document.querySelector('#quote-result').hidden = false; document.querySelector('#copy-status').textContent = '';
  if(pendingFiles.length)await uploadPending();
  document.querySelector('#quote-result').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
});
document.querySelector('#copy-quote').addEventListener('click', async () => {
  const field = document.querySelector('#quote-text');
  try { await navigator.clipboard.writeText(field.value); document.querySelector('#copy-status').textContent = 'Solicitação copiada. Agora você pode compartilhá-la com a equipe.'; }
  catch { field.focus(); field.select(); document.querySelector('#copy-status').textContent = 'Selecione o texto e copie com Ctrl+C ou pelo menu do celular.'; }
});
renderProducts();renderProducts(materialFilter,true);renderSelected();
document.querySelector('#catalog-search').addEventListener('input',()=>renderProducts());
document.querySelector('#equipment-search').addEventListener('input',()=>renderProducts(materialFilter,true));
document.querySelectorAll('[data-equipment]').forEach(button=>button.addEventListener('click',()=>{equipmentFilter=button.dataset.equipment;document.querySelectorAll('[data-equipment]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderProducts(materialFilter,true)}));

const trackingForm = document.querySelector('#tracking-form');
const trackingResult = document.querySelector('#tracking-result');
const trackingError = document.querySelector('#tracking-error');
trackingForm.addEventListener('input', () => { trackingResult.hidden = true; trackingResult.replaceChildren(); trackingError.hidden = true; });
trackingForm.addEventListener('submit', async event => {
  event.preventDefault(); trackingResult.hidden = true; trackingResult.replaceChildren(); trackingError.hidden = true;
  const documento = trackingForm.elements.documento.value.replace(/\D/g, '');
  if (![11,14].includes(documento.length)) { trackingError.textContent = 'Informe o CPF com 11 dígitos ou CNPJ com 14 dígitos.'; trackingError.hidden = false; return; }
  const button = trackingForm.querySelector('button'); button.disabled = true; button.textContent = 'Consultando...'; trackingForm.setAttribute('aria-busy','true');
  try {
    const response = await fetch('/api/acompanhamento/consultar-site', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({numero:trackingForm.elements.numero.value.trim(),documento}),cache:'no-store',signal:AbortSignal.timeout(20000)});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível consultar agora.');
    trackingForm.elements.documento.value = '';
    function date(value, time=false) { if(!value) return 'Ainda não informada'; const d=new Date(value); return Number.isNaN(d.getTime()) ? 'Ainda não informada' : d.toLocaleString('pt-BR', time ? {dateStyle:'short',timeStyle:'short'} : {dateStyle:'short'}); }
    function node(tag, value, className) { const element=document.createElement(tag); if(value) element.textContent=value; if(className) element.className=className; return element; }
    const summary=node('div',null,'tracking-summary');
    const statusStyles = {
      'Pedido recebido': 'received', 'Em separação': 'preparing', 'Em produção': 'producing',
      'Produção concluída': 'finished', 'Pronto para entrega ou retirada': 'ready',
      'Saiu para entrega': 'shipping', 'Entregue': 'delivered', 'Cancelado': 'cancelled'
    };
    const statusClass = statusStyles[data.status] || 'received';
    summary.classList.add(`tracking-summary-${statusClass}`);
    summary.append(node('p','SEU PEDIDO','tracking-kicker'),node('h3',`Pedido ${data.numero}`),node('p',data.status,`tracking-status tracking-status-${statusClass}`));
    if (statusClass === 'ready') summary.append(node('p',data.tipoEntrega === 'Retirada pelo cliente'
      ? 'Suas peças estão prontas! Combine a retirada com a equipe.'
      : 'Seu pedido está pronto! Fale com a equipe para confirmar a entrega.', 'tracking-ready-message'));
    const details=node('dl',null,'tracking-details');
    for(const [label,value] of [['Previsão de entrega / retirada',date(data.dataEntrega)],['Forma de recebimento',data.tipoEntrega]]) { const block=node('div'); block.append(node('dt',label),node('dd',value)); details.append(block); }
    summary.append(details); trackingResult.append(summary);
    const history=node('div',null,'tracking-history'); history.append(node('h3','Cada etapa do seu projeto'),node('p','Atualizações mais recentes primeiro.','tracking-intro'));
    const timeline=node('ol',null,'tracking-timeline');
    for(const item of data.historico || []) { const row=node('li'); const time=node('time',date(item.data,true)); if(item.data) time.setAttribute('datetime',item.data); row.append(time,node('p',item.descricao)); timeline.append(row); }
    history.append(timeline);
    if (!data.historico?.length) history.append(node('p','Assim que houver uma atualização, ela aparecerá aqui.','tracking-empty'));
    history.append(node('p','Para atualizar, confirme novamente o documento e consulte.','form-note')); trackingResult.append(history); trackingResult.hidden=false;
    trackingResult.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'nearest'});
  } catch(error) { trackingError.textContent = error.name === 'TimeoutError' ? 'A consulta demorou. Tente novamente.' : error.message === 'Failed to fetch' ? 'Não foi possível conectar. Tente novamente.' : error.message; trackingError.hidden = false; }
  finally { button.disabled = false; button.textContent = 'Consultar pedido'; trackingForm.setAttribute('aria-busy','false'); }
});

const parametrosInteresse=new URLSearchParams(location.search),ofertaInicial=parametrosInteresse.get('oferta'),materialInicial=products.find(p=>p.id===parametrosInteresse.get('material'));if(ofertaInicial||materialInicial){let incluido=false;if(materialInicial){selected.set(materialInicial.id,Math.min(9999,(selected.get(materialInicial.id)||0)+1));renderSelected();form.dispatchEvent(new Event('input'));incluido=true}else incluido=adicionarOfertaAoFormulario(form,ofertaInicial);if(incluido){toast('Item incluído na solicitação. Preencha seus dados para enviar.');const url=new URL(location.href);url.searchParams.delete('oferta');url.searchParams.delete('material');history.replaceState(null,'',url.pathname+url.search+url.hash)}else toast('Reduza as observações para incluir o item.');}
