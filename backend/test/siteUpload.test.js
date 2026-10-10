import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir,mkdtemp,readFile,unlink,rmdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { validarImagem,salvarImagemSite,UPLOAD_LIMIT } from '../src/utils/siteUpload.js';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6xoAAAAASUVORK5CYII=','base64');
test('assinatura deve coincidir com MIME; rejeita SVG, arquivo vazio, tamanho excessivo e destino externo',async()=>{
  assert.equal(validarImagem(png,'image/png'),'png');
  assert.throws(()=>validarImagem(png,'image/jpeg'));
  assert.throws(()=>validarImagem(Buffer.from('<svg onload="alert(1)"></svg>'),'image/png'));
  assert.throws(()=>validarImagem(Buffer.alloc(UPLOAD_LIMIT+1),'image/png'));
  assert.throws(()=>validarImagem(Buffer.alloc(0),'image/png'));
  await assert.rejects(salvarImagemSite(png,'image/png','../../fora'));
});
test('filesystem recebe somente WebP otimizado com UUID e transparência preservada',async()=>{
  const parent=path.resolve('node_modules/.cache');await mkdir(parent,{recursive:true});
  const root=await mkdtemp(path.join(parent,'upload-test-'));
  let file;
  try {
    const input=await sharp({create:{width:2400,height:1600,channels:4,background:{r:10,g:20,b:30,alpha:0.5}}}).png().toBuffer();
    const result=await salvarImagemSite(input,'image/png','produtos',root);
    assert.match(result.url,/^\/api\/uploads\/site\/produtos\/[a-f0-9-]{36}\.webp$/);
    file=path.join(root,result.url.replace('/api/uploads/',''));
    const output=await readFile(file);
    const meta=await sharp(output).metadata();
    assert.equal(meta.width,1200); assert.equal(meta.height,800); assert.equal(meta.hasAlpha,true);
    assert.equal(result.bytes,output.length); assert.ok(result.bytes < input.length);
  } finally {
    if(file)await unlink(file);
    await rmdir(path.join(root,'site','produtos'));await rmdir(path.join(root,'site'));await rmdir(root);
  }
});
