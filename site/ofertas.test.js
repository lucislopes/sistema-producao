import test from 'node:test';
import assert from 'node:assert/strict';
import {resumoOferta,contatoOferta,incluirOferta,adicionarOfertaAoFormulario} from './ofertas.js';
test('WhatsApp recebe oferta e preço sem perder caracteres especiais',()=>{
 const oferta={titulo:'MDF & ferramentas + corte',preco:'199.90'};
 const url=new URL(contatoOferta(oferta,'5561999999999'));assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/5561999999999');assert.match(url.searchParams.get('text'),/MDF & ferramentas \+ corte/);assert.match(url.searchParams.get('text'),/199,90/);assert.match(url.searchParams.get('text'),/disponibilidade/);assert.equal(contatoOferta(oferta,''),null);
 assert.ok(!resumoOferta({titulo:'Serviço',preco:null}).includes('R$'));assert.match(resumoOferta({titulo:'Oferta',preco:0}),/0,00/);
});
test('incluir oferta preserva texto, não duplica e não corta observações no limite',()=>{
 const resumo=resumoOferta({titulo:'MDF Branco',preco:199});const original='Preciso também de corte.';assert.equal(incluirOferta(original,resumo),original+'\n'+resumo);assert.equal(incluirOferta(original+'\n'+resumo,resumo),original+'\n'+resumo);assert.equal(incluirOferta('x'.repeat(3000),resumo),null);
});
test('formulário recebe oferta e invalida revisão anterior através do evento input',()=>{
 let events=0;const form={elements:{observacao:{value:'Meu projeto',maxLength:3000}},dispatchEvent(e){assert.equal(e.type,'input');events++}};
 assert.equal(adicionarOfertaAoFormulario(form,'Tenho interesse na oferta: MDF.'),true);assert.match(form.elements.observacao.value,/Meu projeto\nTenho interesse/);assert.equal(events,1);form.elements.observacao.value='x'.repeat(3000);assert.equal(adicionarOfertaAoFormulario(form,'Outra oferta'),false);assert.equal(events,1);
});
