import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { tokenAnexos, autorizaAnexos, prepararAnexo, caminhoAnexo, RETENCAO_DIAS } from '../src/utils/anexosOrcamento.js';

test('capacidade de envio vale apenas para seu orçamento durante 30 minutos',()=>{
  process.env.JWT_SECRET ||= 'segredo-descartavel-de-teste';
  const q={chave:'chave-a',createdAt:new Date()};const token=tokenAnexos(q.chave);
  assert.equal(autorizaAnexos(q,token),true);
  assert.equal(autorizaAnexos({...q,chave:'outra'},token),false);
  assert.equal(autorizaAnexos(q,'invalido'),false);
  assert.equal(autorizaAnexos(q,token,new Date(q.createdAt.getTime()+30*60000)),false);
  assert.equal(RETENCAO_DIAS,30);
  assert.throws(()=>caminhoAnexo('../../outside.pdf'));
});
test('anexos rejeitam conteúdo disfarçado e convertem imagens em arquivo estático',async()=>{
  await assert.rejects(()=>prepararAnexo(Buffer.from('<script>alert(1)</script>'),'application/pdf','falso.pdf'));
  await assert.rejects(()=>prepararAnexo(Buffer.alloc(5*1024*1024+1),'application/pdf','grande.pdf'));
  await assert.rejects(()=>prepararAnexo(Buffer.from('arquivo qualquer'),'application/zip','arquivo.zip'));
  const image=await sharp({create:{width:40,height:20,channels:4,background:'#889955'}}).png().toBuffer();
  const result=await prepararAnexo(image,'image/png','../../projeto.png');
  assert.equal(result.mime,'image/webp');assert.ok(!result.nome.includes('/'));
  assert.equal((await sharp(result.buffer).metadata()).format,'webp');
});
