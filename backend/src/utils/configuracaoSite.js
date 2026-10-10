import { conteudoEfetivo } from './siteTextos.js';
import {validarAjustesImagens} from './ajusteImagem.js';
export const siteDefaults = {
  ativo: false, corPrimaria: '#084f2b', corDestaque: '#ffbd16',
  redesSociais: {}, whatsapp: '', instagramUrl: '', siteUrl: '', sistemaUrl: ''
};
export const empresaPublicaSelect = { nome: true, telefone: true, email: true, logoUrl: true };
export function whatsappBrasil(value) {
  let numero = texto(value, 'WhatsApp', 25).replace(/[\s()+.-]/g, '');
  if (!numero) return '';
  if (/^55\d{10,11}$/.test(numero)) numero = numero.slice(2);
  if (!/^[1-9]\d[2-9]\d{7,8}$/.test(numero)) throw new Error('Informe o WhatsApp brasileiro com DDD e 8 ou 9 dígitos. O código +55 é automático.');
  return `55${numero}`;
}

function texto(value, field, max, required = false) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`Valor inválido para ${field}.`);
  const result = value.trim();
  if (required && !result) throw new Error(`Informe ${field}.`);
  return result;
}
export function urlPublica(value, field) {
  const result = texto(value, field, 2048);
  if (!result) return '';
  let url;
  try { url = new URL(result); } catch { throw new Error(`Informe uma URL completa para ${field}.`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(`URL inválida para ${field}. Use HTTP ou HTTPS, sem credenciais.`);
  return url.href;
}
export const redesPermitidas={instagram:['instagram.com'],facebook:['facebook.com','fb.com'],youtube:['youtube.com','youtu.be'],linkedin:['linkedin.com'],tiktok:['tiktok.com'],x:['x.com','twitter.com'],pinterest:['pinterest.com','pinterest.com.br','pin.it'],telegram:['t.me','telegram.me'],threads:['threads.com','threads.net']};
export function validarRedesSociais(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Redes sociais inválidas.');
 const out={};for(const [key,domains] of Object.entries(redesPermitidas)){
   if(value[key]===undefined||value[key]==='')continue;
   const url=urlPublica(value[key],key);if(!url)continue;
   const host=new URL(url).hostname;if(!domains.some(d=>host===d||host.endsWith('.'+d)))throw new Error(`Use o endereço oficial de ${key}.`);
   out[key]=url;
 }return out;
}
export function validarConfiguracaoSite(body, logoAnterior) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Configuração inválida.');
  const site = {};
  if(body.nomePublicoSite !== undefined) texto(body.nomePublicoSite,'nome público do site',150);
  if(body.ajustesImagens!==undefined)site.ajustesImagens=validarAjustesImagens(body.ajustesImagens);
  if (typeof body.ativo !== 'boolean') throw new Error('Informe se o site está ativo.');
  site.ativo = body.ativo;
  for (const field of ['corPrimaria', 'corDestaque']) {
    if (typeof body[field] !== 'string' || !/^#[0-9a-f]{6}$/i.test(body[field])) throw new Error('As cores devem usar o formato #RRGGBB.');
    site[field] = body[field].toLowerCase();
  }
  site.whatsapp = whatsappBrasil(body.whatsapp);
  for (const field of ['instagramUrl', 'siteUrl', 'sistemaUrl']) site[field] = urlPublica(body[field], field);
  if(body.redesSociais!==undefined){site.redesSociais=validarRedesSociais(body.redesSociais);site.instagramUrl=site.redesSociais.instagram||'';}
  const empresa = {};
  empresa.nome = texto(body.nome, 'nome da empresa', 150, true);
  empresa.telefone = texto(body.telefone, 'telefone', 30);
  empresa.email = texto(body.email, 'e-mail', 150);
  if (empresa.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empresa.email)) throw new Error('E-mail inválido.');
  empresa.logoUrl = texto(body.logoUrl, 'logo', 3_000_000);
  // Compatibilidade com o cadastro atual de logos; novos arquivos persistentes virão no módulo de uploads.
  if (empresa.logoUrl && empresa.logoUrl !== logoAnterior && !/^\/api\/uploads\/site\/configuracao\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(empresa.logoUrl) && !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(empresa.logoUrl)) {
    empresa.logoUrl = urlPublica(empresa.logoUrl, 'logo');
  }
  return { site, empresa };
}
export function configuracaoPublica(empresa, site) {
  return {
    nomePublicoSite: site?.conteudo?.nomePublicoSite || '',
    nome: empresa?.nome || '', telefone: empresa?.telefone || '', email: empresa?.email || '', logoUrl: empresa?.logoUrl || '',
    ...Object.fromEntries(Object.keys(siteDefaults).map(key => [key, site?.[key] ?? siteDefaults[key]])),
    conteudo: conteudoEfetivo(site?.conteudo, site?.conteudo?.nomePublicoSite || empresa?.nome || 'Sua empresa'), imagemHomeUrl: site?.imagemHomeUrl || '',ajustesImagens:site?.ajustesImagens||{}
  };
}
export function criarHandlersConfiguracaoSite(prisma, bloquearAgenda) {
  return {
    async obter(req, res, next) {
      try {
        const [empresa, site] = await Promise.all([
          prisma.configuracaoEmpresa.findFirst({ select: empresaPublicaSelect }),
          prisma.configuracaoSite.findUnique({ where: { id: 'principal' } })
        ]);
        return res.json(configuracaoPublica(empresa, site));
      } catch (error) { next(error); }
    },
    async salvar(req, res, next) {
      try {
        const result = await prisma.$transaction(async tx => {
          await bloquearAgenda(tx);
          const atual = await tx.configuracaoEmpresa.findFirst({ select: { id: true, logoUrl: true } });
          let dados;
          try { dados = validarConfiguracaoSite(req.body, atual?.logoUrl); }
          catch (error) { throw Object.assign(error, { validation: true }); }
          const empresa = atual
            ? await tx.configuracaoEmpresa.update({ where: { id: atual.id }, data: dados.empresa, select: empresaPublicaSelect })
            : await tx.configuracaoEmpresa.create({ data: dados.empresa, select: empresaPublicaSelect });
          if (req.body.nomePublicoSite !== undefined) {
            const anterior = await tx.configuracaoSite.findUnique({where:{id:'principal'}});
            dados.site.conteudo = {...anterior?.conteudo, nomePublicoSite:texto(req.body.nomePublicoSite,'nome público do site',150)};
          }
          const site = await tx.configuracaoSite.upsert({ where: { id: 'principal' }, create: { id: 'principal', ...dados.site }, update: dados.site });
          return configuracaoPublica(empresa, site);
        }, { isolationLevel: 'ReadCommitted' });
        return res.json(result);
      } catch (error) {
        if (error.validation) return res.status(400).json({ error: error.message });
        next(error);
      }
    },
    async publico(req, res, next) {
      res.setHeader('Cache-Control', 'no-store');
      try {
        const site = await prisma.configuracaoSite.findUnique({ where: { id: 'principal' } });
        if (!site?.ativo) return res.status(404).json({ error: 'Site desativado', code: 'SITE_DISABLED' });
        const empresa = await prisma.configuracaoEmpresa.findFirst({ select: empresaPublicaSelect });
        const config=configuracaoPublica(empresa,site);
        return res.json({...config,nome:config.nomePublicoSite||config.nome});
      } catch (error) { next(error); }
    }
  };
}
