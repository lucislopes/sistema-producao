import test from 'node:test';
import assert from 'node:assert/strict';
import {card,galeriaPromocao,imagensPromocao,montarPromocaoBanner} from './marketing.js';
class Element{
 constructor(tag){this.tag=tag;this.style={};this.dataset={};this.children=[];this.attributes={};this.events={};this.classList={add:()=>{}}}
 append(...items){this.children.push(...items)}
 setAttribute(key,value){this.attributes[key]=value}
 addEventListener(key,fn){this.events[key]=fn}
 removeAttribute(key){delete this.attributes[key]}
 matches(){return false}
 contains(){return false}
}
test('promoções alternam em 10 segundos, controles pausam, e uma única oferta não cria temporizador',()=>{
 const orig={document:global.document,setInterval:global.setInterval,clearInterval:global.clearInterval,matchMedia:global.matchMedia};let callback,intervalo,criadas=0;
 const banner=new Element('section');global.document={hidden:false,createElement:tag=>new Element(tag),querySelector:()=>banner,addEventListener(){}};global.matchMedia=()=>({matches:false});global.setInterval=(fn,ms)=>{callback=fn;intervalo=ms;criadas++;return 1};global.clearInterval=()=>{callback=null};
 try{
  const box=montarPromocaoBanner([{id:'a',titulo:'MDF',imagemUrl:'a.jpg',preco:100,precoAnterior:150,condicaoPagamento:'À vista'},{id:'b',titulo:'Máquina',imagemUrl:'b.jpg',preco:null}]);
  const [,img,title,old,price,terms,link,controls]=box.children,[prev,count,next,pause]=controls.children;
  assert.equal(terms.textContent,'À vista');assert.equal(intervalo,10000);assert.equal(title.textContent,'MDF');assert.equal(link.href,'#oferta-a');callback();assert.equal(title.textContent,'Máquina');assert.equal(old.hidden,true);assert.equal(price.textContent,'Consulte as condições');assert.equal(count.textContent,'2 / 2');assert.equal(img.src,'b.jpg');
  pause.onclick();assert.equal(callback,null);assert.equal(pause.attributes['aria-pressed'],'true');prev.onclick();assert.equal(title.textContent,'MDF');assert.equal(callback,null);pause.onclick();assert.equal(typeof callback,'function');
  global.document.hidden=true;callback();assert.equal(title.textContent,'MDF');global.document.hidden=false;next.onclick();assert.equal(title.textContent,'Máquina');
  const independente=montarPromocaoBanner([{id:'x',titulo:'Independente',preco:50}],{conteudo:{secoesDesativadas:['promocoes']}});assert.ok(independente);assert.equal(independente.children[6].href,'./pagina.html?tipo=PROMOCAO#oferta-x');
  const antes=criadas,unica=montarPromocaoBanner([{titulo:'Única',preco:50}]);assert.equal(criadas,antes);assert.equal(unica.children[7].hidden,true);
  assert.equal(montarPromocaoBanner([{titulo:'Oculta'}],{conteudo:{promocoesNoBanner:false}}),undefined);
 }finally{Object.assign(global,orig)}
});
test('galeria navega por setas, teclado e gesto sem alterar outras promoções',()=>{
 const original=global.document;global.document={createElement:tag=>new Element(tag)};
 try{const item={titulo:'MDF',imagemUrl:'capa.jpg',galeria:['foto1.jpg','foto2.jpg','capa.jpg']};assert.deepEqual(imagensPromocao(item),['capa.jpg','foto1.jpg','foto2.jpg']);const gallery=galeriaPromocao(item),[image,controls]=gallery.children,[prev,count,next]=controls.children;assert.equal(image.src,'capa.jpg');next.onclick();assert.equal(image.src,'foto1.jpg');assert.equal(count.textContent,'2 / 3');gallery.events.keydown({key:'ArrowRight',preventDefault(){}});assert.equal(image.src,'foto2.jpg');next.onclick();assert.equal(image.src,'capa.jpg');prev.onclick();assert.equal(image.src,'foto2.jpg');image.events.touchstart({touches:[{clientX:200}]});image.events.touchend({changedTouches:[{clientX:100}]});assert.equal(image.src,'capa.jpg');assert.equal(galeriaPromocao({titulo:'Outro',imagemUrl:'outro.jpg'}).children[0].src,'outro.jpg')}finally{global.document=original}
});
test('material com slug oferece WhatsApp e orçamento com ID do produto, sem abrir página institucional',()=>{
 const original=global.document;global.document={createElement:tag=>new Element(tag)};
 try{
  const item={id:'material-123',slug:'mdf-branco',tipoVenda:'MATERIAL',titulo:'MDF Branco',descricao:'18 mm',preco:null};
  const result=card(item,{whatsapp:'5561999999999'}),actions=result.children.find(c=>c.className==='offer-actions');assert.ok(actions);
  const zap=new URL(actions.children[0].href);assert.equal(zap.hostname,'wa.me');assert.match(zap.searchParams.get('text'),/neste produto: MDF Branco/);assert.ok(!zap.searchParams.get('text').includes('R$'));
  const quote=new URL(actions.children[1].href,'http://localhost:5180/pagina.html');assert.equal(quote.origin,'http://localhost:5180');assert.equal(quote.pathname,'/index.html');assert.equal(quote.searchParams.get('material'),item.id);assert.equal(quote.hash,'#orcamento');assert.match(quote.searchParams.get('oferta'),/MDF Branco/);
  const marca=card({titulo:'Fabricante',descricao:'Marca parceira',tipo:'MARCA',slug:'fabricante'});assert.ok(marca.children.some(c=>c.href==='./pagina.html?slug=fabricante'));
 }finally{global.document=original}
});
test('material sem WhatsApp mantém opção de orçamento',()=>{
 const original=global.document;global.document={createElement:tag=>new Element(tag)};
 try{const result=card({id:'material',tipoVenda:'MATERIAL',slug:'material',titulo:'MDF',descricao:'Painel'});const actions=result.children.find(c=>c.className==='offer-actions');assert.equal(actions.children.length,1);assert.match(actions.children[0].href,/material=material/)}finally{global.document=original}
});
