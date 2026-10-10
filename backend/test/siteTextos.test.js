import test from 'node:test';
import assert from 'node:assert/strict';
import {conteudoEfetivo,textosPadrao} from '../src/utils/siteTextos.js';
import {camposConteudo,camposImagens,validarConteudo} from '../src/utils/siteConteudo.js';
import {configuracaoPublica} from '../src/utils/configuracaoSite.js';
test('todos os campos do editor têm os textos iniciais e preservam personalizações',()=>{
  assert.deepEqual(Object.keys(textosPadrao()).sort(),Object.keys({...camposConteudo,...camposImagens}).sort());
  const result=conteudoEfetivo({tituloHome:'Meu título',textoSobre:'',chamadaHome:'   '},'Empresa B');
  assert.equal(result.tituloHome,'Meu título');assert.equal(result.chamadaHome,textosPadrao().chamadaHome);
  assert.ok(result.textoSobre.includes('Empresa B'));assert.ok(!result.textoSobre.includes('Ferramad'));
});
test('API pública e editor utilizam a mesma composição de textos',()=>{
  const custom={descricaoHome:'Descrição personalizada'};
  assert.deepEqual(configuracaoPublica({nome:'Empresa B'},{ativo:true,conteudo:custom}).conteudo,conteudoEfetivo(custom,'Empresa B'));
});

test('fotos das seções rejeitam URLs executáveis e preservam upload seguro',()=>{
 assert.equal(validarConteudo({conteudo:{software1LogoUrl:'/assets/software-cortecloud.svg'}}).conteudo.software1LogoUrl,'/assets/software-cortecloud.svg');
 assert.throws(()=>validarConteudo({conteudo:{imagemSobreUrl:'javascript:alert(1)'}}));
 const url='/api/uploads/site/configuracao/644d6a74-249d-4176-a2ca-4a09ac6b6c36.webp';
 assert.equal(validarConteudo({conteudo:{imagemSobreUrl:url}}).conteudo.imagemSobreUrl,url);
});
