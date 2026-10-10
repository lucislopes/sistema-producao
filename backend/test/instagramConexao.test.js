import test from 'node:test';
import assert from 'node:assert/strict';
import {configLogin,criarLogin,verificarLogin,cifrarToken,decifrarToken,trocarCodigo} from '../src/utils/instagramConexao.js';
const env={INSTAGRAM_APP_ID:'123',INSTAGRAM_APP_SECRET:'app-test',JWT_SECRET:'jwt-test',INSTAGRAM_TOKEN_SECRET:'cipher-test',SITE_PUBLIC_URL:'https://empresa.example'};
test('conexão exige configuração HTTPS e state assinado, expirável e limitado ao fluxo Instagram',()=>{
 assert.equal(configLogin({}).pronto,false);assert.equal(configLogin({...env,SITE_PUBLIC_URL:'http://localhost'}).pronto,false);
 const a=criarLogin('usuario',env),b=criarLogin('usuario',env),url=new URL(a.url);
 assert.equal(url.hostname,'www.instagram.com');assert.equal(verificarLogin(url.searchParams.get('state'),env).usuarioId,'usuario');assert.equal(verificarLogin(url.searchParams.get('state'),env).nonceHash,a.nonceHash);assert.notEqual(a.nonceHash,b.nonceHash);
 assert.throws(()=>verificarLogin(url.searchParams.get('state')+'x',env));assert.equal(url.searchParams.get('redirect_uri'),'https://empresa.example/api/marketing-site/instagram/callback');assert.ok(!a.url.includes(env.INSTAGRAM_APP_SECRET));
});
test('token protegido com AES-GCM: não armazenado em claro, alteração e chave errada falham',()=>{
 const encrypted=cifrarToken('segredo-do-instagram',env);assert.ok(!encrypted.includes('segredo-do-instagram'));assert.equal(decifrarToken(encrypted,env),'segredo-do-instagram');assert.throws(()=>decifrarToken(encrypted,{JWT_SECRET:'outra-chave'}));
 const parts=encrypted.split('.');parts[1]='AA==';assert.throws(()=>decifrarToken(parts.join('.'),env));
});
test('troca oficial guarda token cifrado e perfil somente após respostas reais válidas',async()=>{
 let calls=0;const fetcher=async url=>{calls++;return {ok:true,json:async()=>String(url).includes('oauth/access_token')?{access_token:'short',user_id:'123'}:String(url).includes('/me?')?{user_id:'123',username:'empresa'}:{access_token:'long',expires_in:3600}}};
 const c=await trocarCodigo('code',{env,fetcher});assert.equal(c.username,'empresa');assert.equal(decifrarToken(c.tokenCifrado,env),'long');assert.equal(calls,3);
 await assert.rejects(trocarCodigo('code',{env,fetcher:async()=>({ok:false,json:async()=>({error:'sensitive'})})}),e=>!e.message.includes('sensitive'));
});
