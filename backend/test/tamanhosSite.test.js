import test from 'node:test';
import assert from 'node:assert/strict';
import {validarAjustesImagens} from '../src/utils/ajusteImagem.js';
import {aplicarTamanhosSite} from '../../site/config.js';

test('tamanhos opcionais preservam enquadramento e limites por dispositivo',()=>{
 const entrada={logoUrl:{modo:'contain',x:50,y:50},tamanhosSite:{logoDesktop:220,logoMobile:160,bannerDesktop:600,bannerMobile:400,fotosDesktop:320,fotosMobile:200}};
 assert.deepEqual(validarAjustesImagens(entrada),entrada);
 assert.deepEqual(validarAjustesImagens({logoUrl:entrada.logoUrl}),{logoUrl:entrada.logoUrl});
 for(const tamanhosSite of [null,[],{logoDesktop:900},{logoMobile:'190'},{bannerMobile:NaN},{fotosDesktop:250.5}])assert.throws(()=>validarAjustesImagens({tamanhosSite}),e=>e.status===400);
});
test('aplicação usa variáveis independentes e restaurar padrão remove os valores anteriores',()=>{
 const css=new Map(),classes=new Set();const root={style:{setProperty:(k,v)=>css.set(k,v),removeProperty:k=>css.delete(k)},classList:{toggle:(k,v)=>v?classes.add(k):classes.delete(k)}};
 aplicarTamanhosSite({logoDesktop:230,logoMobile:150,bannerMobile:400,fotosDesktop:300},root);
 assert.equal(css.get('--site-logo-desktop'),'230px');assert.equal(css.get('--site-logo-mobile'),'150px');assert.equal(css.get('--site-banner-mobile'),'400px');assert.equal(classes.has('site-fotos-personalizadas'),true);
 aplicarTamanhosSite({},root);assert.equal(css.size,0);assert.equal(classes.size,0);
});
