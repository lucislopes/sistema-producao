import { createHmac, timingSafeEqual, randomUUID, createHash } from 'node:crypto';
import { mkdir, readdir, lstat, writeFile, unlink, statfs } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { uploadRoot, validarImagem } from './siteUpload.js';

export const LIMITE_ANEXO = 5 * 1024 * 1024;
export const QUOTA_ANEXOS = 250 * 1024 * 1024;
export const RETENCAO_DIAS = 30;
const failure = (message,status=400) => Object.assign(new Error(message),{status});
export const raizAnexos = () => path.join(uploadRoot(),'anexos-orcamentos');
export function caminhoAnexo(arquivo,root=raizAnexos()) {
  if(!/^[a-f0-9-]{36}\.(pdf|webp)$/.test(arquivo)) throw failure('Arquivo inválido.');
  return path.join(root,arquivo);
}
export function tokenAnexos(chave) {
  return createHmac('sha256',process.env.JWT_SECRET).update(`anexos-orcamento:${chave}`).digest('hex');
}
export function autorizaAnexos(q,token,now=new Date()) {
  return Boolean(q && typeof token==='string' && /^[a-f0-9]{64}$/.test(token) &&
    now.getTime()-new Date(q.createdAt).getTime()<30*60000 &&
    timingSafeEqual(Buffer.from(token,'hex'),Buffer.from(tokenAnexos(q.chave),'hex')));
}
export function nomeSeguro(nome) {
  return String(nome||'arquivo').replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,150) || 'arquivo';
}
export async function prepararAnexo(buffer,mime,nome) {
  if(!Buffer.isBuffer(buffer)||!buffer.length||buffer.length>LIMITE_ANEXO) throw failure('Envie um arquivo de até 5 MB.');
  if(mime==='application/pdf') {
    if(buffer.subarray(0,5).toString()!=='%PDF-' || !buffer.subarray(-2048).includes(Buffer.from('%%EOF'))) throw failure('PDF inválido.');
    return {buffer,mime,ext:'pdf',nome:nomeSeguro(nome).replace(/\.[^.]*$/,'')+'.pdf'};
  }
  if(!['image/png','image/jpeg'].includes(mime)) throw failure('Envie somente PDF, JPG ou PNG.');
  try {
    validarImagem(buffer,mime);
    const image=sharp(buffer,{limitInputPixels:40000000,failOn:'warning'});
    if((await image.metadata()).pages>1)throw Error();
    const output=await image.rotate().webp({quality:90}).toBuffer();
    if(output.length>LIMITE_ANEXO)throw Error();
    return {buffer:output,mime:'image/webp',ext:'webp',nome:nomeSeguro(nome).replace(/\.[^.]*$/,'')+'.webp'};
  } catch { throw failure('Imagem inválida ou acima de 40 megapixels.'); }
}
export async function ocuparAnexos(root=raizAnexos()) {
  await mkdir(root,{recursive:true});let bytes=0,count=0;
  for(const arquivo of await readdir(root)) {
    if(!/^[a-f0-9-]{36}\.(pdf|webp)$/.test(arquivo))continue;
    const stat=await lstat(caminhoAnexo(arquivo,root));
    if(!stat.isFile()||stat.isSymbolicLink())throw failure('Armazenamento indisponível.',503);
    bytes+=stat.size;count++;
  }
  return {bytes,count};
}
const lock = tx => tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('anexos-orcamentos'))`;
export async function guardarAnexo(prisma,q,file,hash,root=raizAnexos()) {
  let criado;
  try {
    return await prisma.$transaction(async tx=>{
      await lock(tx);
      const repetido=await tx.anexoOrcamentoSite.findUnique({where:{orcamentoId_hash:{orcamentoId:q.id,hash}}});
      if(repetido)return repetido;
      if(await tx.anexoOrcamentoSite.count({where:{orcamentoId:q.id}})>=3)throw failure('Limite de 3 arquivos por orçamento.');
      const usage=await ocuparAnexos(root);
      const disk=await statfs(root);if(Number(disk.bavail)*Number(disk.bsize)<file.buffer.length+256*1024*1024)throw failure('Disco com pouco espaço. Seu orçamento permanece registrado; envie um link.',507);
      if(usage.bytes+file.buffer.length>QUOTA_ANEXOS||usage.count>=500)throw failure('Limite de anexos atingido. Seu orçamento continua registrado; envie um link ou fale com a equipe.',507);
      const arquivo=`${randomUUID()}.${file.ext}`;
      await writeFile(caminhoAnexo(arquivo,root),file.buffer,{flag:'wx'});criado=arquivo;
      return tx.anexoOrcamentoSite.create({data:{id:randomUUID(),orcamentoId:q.id,nome:file.nome,mime:file.mime,bytes:file.buffer.length,hash,arquivo,expiraEm:new Date(Date.now()+RETENCAO_DIAS*86400000)}});
    },{timeout:20000});
  } catch(e) {if(criado)await unlink(caminhoAnexo(criado,root)).catch(()=>{});throw e;}
}
export const hashArquivo = buffer => createHash('sha256').update(buffer).digest('hex');
export const resumoAnexo = a => ({id:a.id,nome:a.nome,bytes:a.bytes,expiraEm:a.expiraEm,removidoEm:a.removidoEm});
export async function limparAnexos(prisma,now=new Date(),root=raizAnexos(),scope={}) {
  return prisma.$transaction(async tx=>{
    await lock(tx);let removidos=0;
    const expirados=await tx.anexoOrcamentoSite.findMany({where:{...scope,removidoEm:null,expiraEm:{lte:now}},take:200});
    for(const a of expirados) {
      await unlink(caminhoAnexo(a.arquivo,root)).catch(e=>{if(e.code!=='ENOENT')throw e;});
      await tx.anexoOrcamentoSite.update({where:{id:a.id},data:{removidoEm:now}});removidos++;
    }
    // Arquivos órfãos de interrupções são removidos após o mesmo prazo, em lotes limitados.
    await mkdir(root,{recursive:true});let vistos=0;
    for(const arquivo of await readdir(root)) {
      if(!/^[a-f0-9-]{36}\.(pdf|webp)$/.test(arquivo))continue;
      if(++vistos>500)break;
      const stat=await lstat(caminhoAnexo(arquivo,root));
      if(stat.isFile()&&!stat.isSymbolicLink() && stat.mtimeMs<now.getTime()-RETENCAO_DIAS*86400000 && !await tx.anexoOrcamentoSite.findFirst({where:{arquivo,removidoEm:null}})) {
        await unlink(caminhoAnexo(arquivo,root));removidos++;
      }
    }
    return removidos;
  },{timeout:20000});
}
export function iniciarLimpezaAnexos(prisma) {
  let running=false;
  const run=async()=>{if(running)return;running=true;try{await limparAnexos(prisma);}catch{console.error('Falha na limpeza de anexos temporários; nova tentativa em uma hora.');}finally{running=false;}};
  run();const timer=setInterval(run,60*60000);timer.unref();return timer;
}
