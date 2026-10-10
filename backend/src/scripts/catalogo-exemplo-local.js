import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { salvarImagemSite } from '../utils/siteUpload.js';
if (!['localhost','127.0.0.1','::1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname)) throw new Error('Este script é exclusivo do banco local.');
const prisma = new PrismaClient();
try {
  const categories = {};
  for (const [slug,nome] of [['exemplo-paineis','Painéis MDF'],['exemplo-acabamentos','Acabamentos'],['exemplo-servicos','Serviços']]) {
    categories[slug] = await prisma.categoriaSite.upsert({where:{slug},update:{},create:{slug,nome,ativo:true,ordem:10}});
  }
  const items = [
    ['branco','MDF Branco','#e8e6da','exemplo-paineis','18 mm · padrão ilustrativo'],
    ['carvalho','MDF Carvalho','#b9925b','exemplo-paineis','15 mm · padrão ilustrativo'],
    ['nogueira','MDF Nogueira','#62452f','exemplo-paineis','18 mm · padrão ilustrativo'],
    ['cinza','MDF Cinza','#858b85','exemplo-paineis','15 mm · padrão ilustrativo'],
    ['bordas','Fita de borda','#c8af84','exemplo-acabamentos','Padrões e larguras sob consulta'],
    ['corte','Corte sob medida','#20583e','exemplo-servicos','Envie sua lista de peças']
  ];
  let count=0;
  for(const [slug,nome,color,category,especificacao] of items) {
    const key=`exemplo-${slug}`;
    if(await prisma.produtoSite.findUnique({where:{slug:key}})) continue;
    const svg=`<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="#f2f0e9"/><path d="M110 190 530 110 690 350 270 430Z" fill="${color}"/><path d="M270 430 690 350 690 370 270 450Z" fill="#453a2b"/><path d="M110 190 270 430 270 450 110 210Z" fill="#a89779"/><text x="50" y="545" font-family="Arial" font-size="22" fill="#344b3c">ILUSTRAÇÃO • EXEMPLO EDITÁVEL</text></svg>`;
    const input=await sharp(Buffer.from(svg)).png().toBuffer();
    const image=await salvarImagemSite(input,'image/png','produtos');
    await prisma.produtoSite.create({data:{slug:key,nome:`${nome} — exemplo`,descricaoCurta:'Exemplo editável para demonstrar o catálogo.',descricao:'Produto fictício. Edite os dados e a imagem ou desative este registro antes da publicação comercial. Consulte materiais reais com a equipe.',especificacao,imagemPrincipalUrl:image.url,categoriaId:categories[category].id,ativo:true,destaque:false,ordem:10+count}});
    count++;
  }
  console.log(`${count} exemplos criados com IDs independentes. Registros anteriores preservados.`);
} finally { await prisma.$disconnect(); }
