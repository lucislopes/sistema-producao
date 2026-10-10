import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { comTrava, verificarEspaco, erroEspaco } from './siteArmazenamento.js';
export const UPLOAD_LIMIT = 5 * 1024 * 1024;
const defaultRoot = fileURLToPath(new URL('../../uploads/', import.meta.url));
export const uploadRoot = () => path.resolve(process.env.UPLOAD_DIR || defaultRoot);
export function validarImagem(buffer, mime) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 16 || buffer.length > UPLOAD_LIMIT) throw new Error('Envie uma imagem de até 5 MB.');
  if (mime === 'image/png' && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && buffer.subarray(12,16).toString() === 'IHDR' && buffer.length >= 33 && buffer.readUInt32BE(16) > 0 && buffer.readUInt32BE(20) > 0) return 'png';
  if (mime === 'image/jpeg' && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 && buffer[buffer.length-2] === 255 && buffer[buffer.length-1] === 217) return 'jpg';
  if (mime === 'image/webp' && buffer.subarray(0,4).toString() === 'RIFF' && buffer.subarray(8,12).toString() === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(buffer.subarray(12,16).toString()) && buffer.readUInt32LE(4) + 8 === buffer.length) return 'webp';
  throw new Error('Arquivo inválido. Selecione uma imagem PNG, JPG ou WebP.');
}
export async function salvarImagemSite(buffer, mime, grupo, root = uploadRoot(), exportacao = false) {
  if (!['configuracao','produtos','categorias','banners'].includes(grupo)) throw new Error('Destino da imagem inválido.');
  validarImagem(buffer, mime);
  return comTrava(root, async () => {
  let optimized;
  try {
    const size = ['produtos','categorias'].includes(grupo) ? 1200 : 1920;
    const image = sharp(buffer, { limitInputPixels: 40000000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (metadata.pages > 1) throw new Error('animated');
    const pipeline = image.rotate().resize(size, size, { fit:'inside', withoutEnlargement:true });
    if(exportacao && (metadata.width!==1080 || ![1350,1920].includes(metadata.height))) throw new Error('dimensions');
    optimized = await (exportacao ? pipeline.jpeg({quality:90}) : pipeline.webp({quality:82, effort:4})).toBuffer();
  } catch { throw erroEspaco('Imagem inválida, animada ou acima de 40 megapixels. Envie PNG, JPG ou WebP estático.', 400); }
  const name = `${randomUUID()}.${exportacao?'jpg':'webp'}`;
  const directory = path.join(root, 'site', grupo);
    await verificarEspaco(root, optimized.length);
    await mkdir(directory, {recursive:true});
    await writeFile(path.join(directory,name), optimized, {flag:'wx'});
    return {url:`/api/uploads/site/${grupo}/${name}`, bytes:optimized.length, originalBytes:buffer.length};
  });
}
const recentes = new Map();
export function limitarUpload(req,res,next) {
  const now=Date.now();
  for (const [key,value] of recentes) if (value.until <= now) recentes.delete(key);
  const key=req.user.id;
  const record=recentes.get(key) || {count:0,until:now+15*60*1000};
  if (record.count >= 30) { res.setHeader('Retry-After',Math.ceil((record.until-now)/1000)); return res.status(429).json({error:'Limite de imagens atingido. Aguarde alguns minutos.'}); }
  record.count++; recentes.set(key,record); next();
}
