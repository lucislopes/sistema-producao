import test from 'node:test';
import assert from 'node:assert/strict';
import {alterarPublicacao,alterarArtePublicacao,logoDaArte} from './publicacaoSite.js';
test('nova fotografia ou preço não continuam publicados com uma capa gerada antiga',()=>{
  const base={imagemUrl:'foto-antiga',titulo:'Oferta',preco:10,arte:{capaSiteUrl:'arte-antiga',galeria:['outra-foto']}};
  for(const [campo,valor] of [['imagemUrl','foto-nova'],['preco',12],['titulo','Nova oferta']]){
    const novo=alterarPublicacao(base,campo,valor);
    assert.equal(novo.arte.capaSiteUrl,null);assert.deepEqual(novo.arte.galeria,['outra-foto']);
  }
  assert.equal(alterarPublicacao(base,'status','PUBLICADO').arte.capaSiteUrl,'arte-antiga');
  assert.equal(alterarPublicacao(base,'preco',10).arte.capaSiteUrl,'arte-antiga');
  assert.equal(base.arte.capaSiteUrl,'arte-antiga');
});
test('layout, cores e enquadramento invalidam a capa; legenda e galeria preservam a capa escolhida',()=>{
 const base={arte:{modelo:'impacto',corPrimaria:'#000000',zoomImagem:1,capaSiteUrl:'arte-antiga'}};
 for(const [campo,valor]of [['modelo','premium'],['corPrimaria','#ffffff'],['zoomImagem',1.5],['condicaoPagamento','À vista'],['rodapeEndereco','Endereço novo'],['rodapeTelefone','(61) 3399-0616']])assert.equal(alterarArtePublicacao(base,campo,valor).arte.capaSiteUrl,null);
 for(const campo of ['legenda','hashtags','galeria'])assert.equal(alterarArtePublicacao(base,campo,'novo').arte.capaSiteUrl,'arte-antiga');
 assert.equal(alterarArtePublicacao(base,'capaSiteUrl','arte-nova').arte.capaSiteUrl,'arte-nova');
});

test('logo da empresa tem prioridade sobre fotografia cadastrada na arte',()=>{
 const registro={imagemUrl:'painel.webp',arte:{logoUrl:'painel.webp'}};
 assert.equal(logoDaArte(registro,{logoUrl:'marca.png'}),'marca.png');
 assert.equal(logoDaArte(registro),null);
 assert.equal(logoDaArte({arte:{logoUrl:'marca-alternativa.png'}}),'marca-alternativa.png');
 assert.equal(logoDaArte({},{logo:'marca-legada.png'}),'marca-legada.png');
});
