import { urlPublica } from './configuracaoSite.js';
import { conteudoEfetivo } from './siteTextos.js';
import {validarAjusteImagem,validarAjustesImagens} from './ajusteImagem.js';
export const camposImagens = { software1LogoUrl: 'Logo do software 1', software2LogoUrl: 'Logo do software 2', imagemCatalogoUrl: 'Estoque e materiais', imagemServicosUrl: 'Central de Serviços', imagemSobreUrl: 'Fachada / sobre a empresa', imagemAtendimentoUrl: 'Equipe de atendimento' };
export const camposConteudo = {
  tituloProjetoSite:['Iniciar projeto — título',200],descricaoProjetoSite:['Iniciar projeto — apresentação',600],
  beneficio1: ["Benefício 1", 200],
  beneficio2: ["Benefício 2", 200],
  beneficio3: ["Benefício 3", 200],
  beneficio4: ["Benefício 4", 200],
  tituloEquipamentos: ["Equipamentos — título", 200],
  descricaoEquipamentos: ["Equipamentos — apresentação", 600],
  tituloPreparacao: ["Orientações — título", 200],
  preparacao1Titulo: ["Orientação 1 — título", 150],
  preparacao1Texto: ["Orientação 1 — texto", 600],
  preparacao2Titulo: ["Orientação 2 — título", 150],
  preparacao2Texto: ["Orientação 2 — texto", 600],
  preparacao3Titulo: ["Orientação 3 — título", 150],
  preparacao3Texto: ["Orientação 3 — texto", 600],
  tituloConsulta: ["Consulta de pedido — título", 200],
  descricaoConsulta: ["Consulta de pedido — apresentação", 600],
  tituloAreaCliente: ["Área do Cliente — título", 200],
  descricaoAreaCliente: ["Área do Cliente — apresentação", 600],
  orientacaoAreaCliente: ["Área do Cliente — orientação", 600],

  tituloContato: ['Contato — título da seção', 200], textoContato: ['Contato — apresentação', 600],
  publicoTitulo: ['Destaque — públicos atendidos', 300], publicoTexto: ['Complemento — produtividade', 600],
  softwareTitulo: ['Softwares — título da seção', 200], softwareTexto: ['Softwares — descrição', 600],
  software1Nome: ['Software 1 — nome', 100], software2Nome: ['Software 2 — nome', 100],
  servico4Titulo: ['Serviço 4 — título', 150], servico4Texto: ['Serviço 4 — descrição', 600],
  servico5Titulo: ['Serviço 5 — título', 150], servico5Texto: ['Serviço 5 — descrição', 600],
  enderecoContato: ['Endereço de atendimento', 500], horarioContato: ['Horário de atendimento', 500],
  orientacoesRetirada: ['Orientações de retirada', 1000], localizacaoUrl: ['Link da localização (HTTP ou HTTPS)', 2048],
  localizacaoMapa: ['Local no mapa (nome, endereço ou coordenadas)', 500],
  chamadaTopo: ['Chamada do topo', 200],
  chamadaHome: ['Chamada da página inicial', 150],
  tituloHome: ['Título principal', 200],
  destaqueHome: ['Destaque do título', 150],
  descricaoHome: ['Descrição principal', 600],
  botaoHome: ['Texto do botão principal', 80],
  chamadaCatalogo: ['Chamada do catálogo', 150],
  tituloCatalogo: ['Título do catálogo', 200],
  descricaoCatalogo: ['Descrição do catálogo', 600],
  tituloServicos: ['Título dos serviços', 200],
  descricaoServicos: ['Descrição dos serviços', 600],
  servico1Titulo: ['Serviço 1 — título', 150], servico1Texto: ['Serviço 1 — descrição', 600],
  servico2Titulo: ['Serviço 2 — título', 150], servico2Texto: ['Serviço 2 — descrição', 600],
  servico3Titulo: ['Serviço 3 — título', 150], servico3Texto: ['Serviço 3 — descrição', 600],
  tituloSobre: ['Título sobre a empresa', 200],
  textoSobre: ['Texto sobre a empresa', 3000],
  textoSobreComplemento: ['Complemento sobre a empresa', 3000],
  tituloComoFunciona: ['Como funciona — título', 200],
  passo1Titulo: ['Passo 1 — título', 150], passo1Texto: ['Passo 1 — descrição', 600],
  passo2Titulo: ['Passo 2 — título', 150], passo2Texto: ['Passo 2 — descrição', 600],
  passo3Titulo: ['Passo 3 — título', 150], passo3Texto: ['Passo 3 — descrição', 600],
  tituloOrcamento: ['Título do orçamento', 200],
  descricaoOrcamento: ['Descrição do orçamento', 600],
  textoRodape: ['Descrição do rodapé', 300],
  seoTitulo: ['Título para buscadores', 150],
  seoDescricao: ['Descrição para buscadores', 300]
};
export function textoSite(value, field, max, required = false) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`Valor inválido para ${field}.`);
  const text = value.trim();
  if (required && !text) throw new Error(`Informe ${field}.`);
  return text;
}
export function imagemSite(value = '') {
  const result = textoSite(value, 'imagem', 2048);
  if (/^\/assets\/software-(?:cortecloud|hellomob)\.svg$/.test(result)) return result;
  if (!result || /^\/api\/uploads\/site\/(?:configuracao|produtos|categorias|banners)\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(result)) return result;
  return urlPublica(result, 'imagem');
}
export function validarConteudo(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !body.conteudo || typeof body.conteudo !== 'object' || Array.isArray(body.conteudo)) throw new Error('Conteúdo inválido.');
  const conteudo = {};
  if(body.conteudo.promocoesNoBanner!==undefined){
    if(typeof body.conteudo.promocoesNoBanner!=='boolean')throw new Error('Informe se as promoções aparecem no banner.');
    conteudo.promocoesNoBanner=body.conteudo.promocoesNoBanner;
  }
  const idsSecoes=['banners','solucoes','promocoes','publicos','beneficios','marcas','catalogo','equipamentos','servicos','softwares','preparar-projeto','como-funciona','sobre','orcamento','consultar-pedido','area-cliente','contato'];
  if(body.conteudo.secoesDesativadas!==undefined){
    const lista=body.conteudo.secoesDesativadas;
    if(!Array.isArray(lista)||lista.length>idsSecoes.length||new Set(lista).size!==lista.length||lista.some(id=>!idsSecoes.includes(id)))throw new Error('Seções desativadas inválidas.');
    conteudo.secoesDesativadas=lista;
  }
  if(body.conteudo.ordemSecoes!==undefined){
    const ids=idsSecoes;
    const ordem=body.conteudo.ordemSecoes;
    if(!Array.isArray(ordem)||ordem.length!==ids.length||new Set(ordem).size!==ids.length||ordem.some(id=>!ids.includes(id)))throw new Error('Ordem das seções inválida.');
    conteudo.ordemSecoes=ordem;
  }
  for (const [key, [label, max]] of Object.entries(camposConteudo)) {
    if (body.conteudo[key] !== undefined) conteudo[key] = key === 'localizacaoUrl' ? urlPublica(body.conteudo[key], label) : textoSite(body.conteudo[key], label, max);
  }
  for (const key of Object.keys(camposImagens)) if (body.conteudo[key] !== undefined) conteudo[key] = imagemSite(body.conteudo[key]);
  return { conteudo, imagemHomeUrl: imagemSite(body.imagemHomeUrl),...(body.ajustesImagens!==undefined?{ajustesImagens:validarAjustesImagens(body.ajustesImagens)}:{}) };
}
export function validarRegistroSite(tipo, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Registro inválido.');
  const banner = tipo === 'banners';
  const nome = banner ? 'titulo' : 'nome';
  const data = { [nome]: textoSite(body[nome], nome, 150, true) };
  if(body.ajusteImagem!==undefined)data.ajusteImagem=validarAjusteImagem(body.ajusteImagem);
  if (typeof body.ativo !== 'boolean') throw new Error('Informe se está ativo.');
  if (!Number.isInteger(body.ordem) || body.ordem < 0 || body.ordem > 99999) throw new Error('Ordem deve ser um inteiro de 0 a 99999.');
  Object.assign(data, { ativo: body.ativo, ordem: body.ordem });
  if (!banner) {
    data.slug = textoSite(body.slug, 'URL amigável', 150, true);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw new Error('URL amigável deve usar letras minúsculas, números e hífens.');
  }
  const fields = tipo === 'produtos' ? { descricaoCurta: 500, descricao: 5000, especificacao: 200 }
    : banner ? { subtitulo: 500, textoBotao: 80 } : { descricao: 1000 };
  for (const [key, max] of Object.entries(fields)) data[key] = textoSite(body[key] ?? '', key, max);
  const imagem = tipo === 'produtos' ? 'imagemPrincipalUrl' : 'imagemUrl';
  data[imagem] = imagemSite(body[imagem]);
  if (banner) data.link = urlPublica(body.link ?? '', 'link do banner');
  if (tipo === 'produtos') {
    if (typeof body.destaque !== 'boolean') throw new Error('Informe se é destaque.');
    data.tipoVenda = body.tipoVenda ?? 'MATERIAL';
    if (!['MATERIAL','MAQUINA','FERRAMENTA'].includes(data.tipoVenda)) throw new Error('Tipo de venda inválido.');
    for (const key of ['preco','precoAnterior']) {
      const v=body[key];
      if (v===undefined || v===null || v==='') data[key]=null;
      else {
        if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(String(v)) || !Number.isFinite(Number(v))) throw new Error('Preço inválido. Use até duas casas decimais.');
        data[key]=Number(v);
      }
    }
    if (data.precoAnterior!==null && (data.preco===null || data.precoAnterior<=data.preco)) throw new Error('Preço anterior deve ser maior que o preço atual.');
    data.marca=textoSite(body.marca ?? '', 'marca', 100);
    data.condicao=textoSite(body.condicao ?? '', 'condição', 100);
    data.destaque = body.destaque;
    data.categoriaId = body.categoriaId === '' || body.categoriaId === null || body.categoriaId === undefined ? null : textoSite(body.categoriaId, 'categoria', 100, true);
  }
  return data;
}
export const modelosSite = { produtos: 'produtoSite', categorias: 'categoriaSite', banners: 'bannerSite' };
export const selectsSite = {
  categorias: { id:true, nome:true, slug:true, descricao:true, imagemUrl:true, ajusteImagem:true, ordem:true },
  produtos: { tipoVenda:true, preco:true, precoAnterior:true, marca:true, condicao:true, id:true, nome:true, slug:true, descricaoCurta:true, descricao:true, imagemPrincipalUrl:true, ajusteImagem:true, especificacao:true, categoriaId:true, destaque:true, ordem:true },
  banners: { id:true, titulo:true, subtitulo:true, imagemUrl:true, ajusteImagem:true, link:true, textoBotao:true, ordem:true }
};
export function criarHandlersConteudoSite(prisma) {
  const fail = (error, res, next) => {
    if (error.validation) return res.status(400).json({ error: error.message });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Esta URL amigável já existe. Escolha outra.' });
    if (error.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado.' });
    if (error.code === 'P2003') return res.status(400).json({ error: 'Categoria não encontrada.' });
    return next(error);
  };
  return {
    async obter(req,res,next) {
      try {
        const [config,empresa] = await Promise.all([prisma.configuracaoSite.findUnique({where:{id:'principal'}}),prisma.configuracaoEmpresa.findFirst({select:{nome:true}})]);
        return res.json({ conteudo: conteudoEfetivo(config?.conteudo,empresa?.nome || 'Sua empresa'), imagemHomeUrl: config?.imagemHomeUrl || '', ajustesImagens:config?.ajustesImagens||{}, campos: camposConteudo, camposImagens, ativo:config?.ativo || false });
      } catch(error) { next(error); }
    },
    async salvar(req,res,next) {
      try {
        let data; try { data = validarConteudo(req.body); } catch(error) { throw Object.assign(error,{validation:true}); }
        const config = await prisma.configuracaoSite.upsert({where:{id:'principal'},create:{id:'principal',...data},update:data});
        const empresa=await prisma.configuracaoEmpresa.findFirst({select:{nome:true}});
        return res.json({conteudo:conteudoEfetivo(config.conteudo,empresa?.nome || 'Sua empresa'), imagemHomeUrl:config.imagemHomeUrl || '', ajustesImagens:config.ajustesImagens||{},campos:camposConteudo,camposImagens,ativo:config.ativo});
      } catch(error) { fail(error,res,next); }
    },
    listar: tipo => async (req,res,next) => {
      try { return res.json(await prisma[modelosSite[tipo]].findMany({orderBy:[{ordem:'asc'},{createdAt:'desc'}], take:500})); } catch(error) { next(error); }
    },
    salvarRegistro: tipo => async (req,res,next) => {
      try {
        let data; try { data = validarRegistroSite(tipo, req.body); } catch(error) { throw Object.assign(error,{validation:true}); }
        const model = prisma[modelosSite[tipo]];
        const result = req.params.id ? await model.update({where:{id:req.params.id},data}) : await model.create({data});
        return res.status(req.params.id ? 200 : 201).json(result);
      } catch(error) { fail(error,res,next); }
    },
    publico: tipo => async (req,res,next) => {
      res.setHeader('Cache-Control','no-store');
      try {
        const config = await prisma.configuracaoSite.findUnique({where:{id:'principal'},select:{ativo:true}});
        if (!config?.ativo) return res.status(404).json({error:'Site desativado',code:'SITE_DISABLED'});
        const where = tipo === 'produtos' ? {ativo:true, OR:[{categoriaId:null},{categoria:{ativo:true}}]} : {ativo:true};
        return res.json(await prisma[modelosSite[tipo]].findMany({where,select:selectsSite[tipo],orderBy:[{ordem:'asc'},{createdAt:'desc'}],take:500}));
      } catch(error) { next(error); }
    }
  };
}
