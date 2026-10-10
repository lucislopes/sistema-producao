import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import {conteudoEfetivo} from '../src/utils/siteTextos.js';
const prisma=new PrismaClient();
try{
 const [site,empresa]=await Promise.all([prisma.configuracaoSite.findUnique({where:{id:'principal'}}),prisma.configuracaoEmpresa.findFirst()]);
 if(!site)throw new Error('Configure o site antes de inicializar o conteúdo.');
 const c=conteudoEfetivo(site.conteudo,empresa?.nome||'Sua empresa');
 const paginas=Array.from({length:5},(_,i)=>({slug:`servico-${i+1}`,tipo:'SERVICO',titulo:c[`servico${i+1}Titulo`],descricao:c[`servico${i+1}Texto`],imagemUrl:c.imagemServicosUrl||site.imagemHomeUrl,ordem:i,ativo:true}));
 paginas.push({slug:'usinagem',tipo:'SERVICO',titulo:'Usinagem e cortes especiais',descricao:'Consulte a preparação de peças conforme seu projeto. Nossa equipe orienta arquivos, medidas e viabilidade de execução.',imagemUrl:c.imagemServicosUrl||site.imagemHomeUrl,ordem:5,ativo:true});
 paginas.push({slug:'nossa-historia',tipo:'HISTORIA',titulo:c.tituloSobre||'Nossa história',descricao:[c.textoSobre,c.textoSobreComplemento].filter(Boolean).join('\n\n'),imagemUrl:c.imagemSobreUrl,ativo:true},
 {slug:'contato',tipo:'CONTATO',titulo:c.tituloContato||'Contato',descricao:[c.textoContato,empresa?.telefone,empresa?.email,c.enderecoContato,c.horarioContato].filter(Boolean).join('\n\n'),imagemUrl:c.imagemAtendimentoUrl,ativo:true},
 {slug:'localizacao',tipo:'LOCALIZACAO',titulo:'Visite nossa empresa',descricao:c.enderecoContato||'Consulte nossa equipe.',imagemUrl:c.imagemSobreUrl,link:c.localizacaoUrl||null,ativo:true});
 for(const p of paginas)if(p.titulo&&p.descricao)await prisma.paginaSite.upsert({where:{slug:p.slug},create:p,update:{}});
 if(await prisma.bannerSite.count({where:{ativo:true}})===0){for(const [i,titulo,descricao,imagem] of [[0,c.tituloServicos,c.publicoTitulo,c.imagemServicosUrl],[1,'Do material ao seu projeto',c.descricaoCatalogo,c.imagemCatalogoUrl],[2,'Uma equipe para orientar você',c.textoContato,c.imagemAtendimentoUrl]])if(imagem)await prisma.bannerSite.create({data:{titulo,subtitulo:descricao,imagemUrl:imagem,ordem:i,ativo:true,link:site.siteUrl?new URL('/index.html#orcamento',site.siteUrl).href:null,textoBotao:'Solicitar orçamento'}})}
 console.log('Conteúdo inicial criado. Registros existentes preservados. Promoções não foram inventadas.');
}finally{await prisma.$disconnect()}
