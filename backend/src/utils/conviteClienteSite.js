export function enderecoClienteSite(base, convite, producao=process.env.NODE_ENV==='production') {
 if(!base&&producao)throw Object.assign(new Error('Configure o endereço público do site.'),{status:400});
 const site=new URL(base||'http://127.0.0.1:5180/');
 if(!['http:','https:'].includes(site.protocol))throw Object.assign(new Error('Configure um endereço válido do site.'),{status:400});
 site.search='';site.hash='';
 if(!site.pathname.endsWith('/'))site.pathname+='/';
 if(!convite){site.hash='area-cliente';return site.href;}
 if(!/^[a-f0-9]{64}$/.test(convite))throw new Error('Convite inválido.');
 const link=new URL('ativar-acesso.html',site);link.hash=convite;return link.href;
}
