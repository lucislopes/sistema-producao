import {linkOrcamentoWhatsApp} from './whatsapp.js';
export function resumoOferta(item){
 const titulo=String(item.titulo||'Oferta').trim().slice(0,150);
 const preco=item.preco!==null&&item.preco!==undefined&&item.preco!==''&&Number.isFinite(Number(item.preco))?` — preço anunciado: ${Number(item.preco).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`:'';
 return `Tenho interesse na oferta: ${titulo}${preco}${preco&&item.condicaoPagamento?` (${String(item.condicaoPagamento).slice(0,100)})`:''}.`;
}
export function contatoOferta(item,numero){return linkOrcamentoWhatsApp(numero,`Olá! ${resumoOferta(item)}\nPode confirmar a disponibilidade e as condições?`)}
export function incluirOferta(observacao,resumo,max=3000){
 resumo=String(resumo||'').trim().slice(0,250);const atual=String(observacao||'');
 if(!resumo||atual.split('\n').includes(resumo))return atual;
 const novo=atual+(atual?'\n':'')+resumo;return novo.length<=max?novo:null;
}
export function adicionarOfertaAoFormulario(form,resumo){
 const field=form.elements.observacao,novo=incluirOferta(field.value,resumo,field.maxLength>0?field.maxLength:3000);
 if(novo===null)return false;field.value=novo;form.dispatchEvent(new Event('input',{bubbles:true}));return true;
}

export function contatoProduto(item,numero){return linkOrcamentoWhatsApp(numero,`Olá! ${resumoOferta(item).replace('Tenho interesse na oferta:', 'Tenho interesse neste produto:')}\nPode confirmar o valor, a disponibilidade e as condições?`)}

export function resumoProduto(item){return resumoOferta(item).replace('Tenho interesse na oferta:','Tenho interesse neste produto:')}
