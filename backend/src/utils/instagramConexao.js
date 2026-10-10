import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import jwt from 'jsonwebtoken';
export function configLogin(env=process.env){
  let redirect='';try{const u=new URL(env.SITE_PUBLIC_URL);if(u.protocol==='https:'&&!u.username&&!u.password)redirect=new URL('/api/marketing-site/instagram/callback',u.origin).href}catch{}
  return {appId:env.INSTAGRAM_APP_ID,secret:env.INSTAGRAM_APP_SECRET,redirect,pronto:!!(env.INSTAGRAM_APP_ID&&env.INSTAGRAM_APP_SECRET&&redirect&&env.JWT_SECRET)};
}
const chave=env=>createHash('sha256').update(env.INSTAGRAM_TOKEN_SECRET||env.JWT_SECRET||'').digest();
export function cifrarToken(token,env=process.env){if(!env.INSTAGRAM_TOKEN_SECRET&&!env.JWT_SECRET)throw new Error('Chave do servidor ausente.');const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',chave(env),iv);const body=Buffer.concat([c.update(token,'utf8'),c.final()]);return [iv.toString('base64'),body.toString('base64'),c.getAuthTag().toString('base64')].join('.');}
export function decifrarToken(value,env=process.env){const [iv,body,tag]=value.split('.');const d=createDecipheriv('aes-256-gcm',chave(env),Buffer.from(iv,'base64'));d.setAuthTag(Buffer.from(tag,'base64'));return Buffer.concat([d.update(Buffer.from(body,'base64')),d.final()]).toString('utf8');}
export function criarLogin(usuarioId,env=process.env){const c=configLogin(env);if(!c.pronto)throw Object.assign(new Error('A instalação ainda precisa configurar a conexão Instagram e um domínio HTTPS público.'),{status:409});const nonce=randomBytes(24).toString('hex'),state=jwt.sign({sub:usuarioId,nonce,purpose:'instagram-login'},env.JWT_SECRET,{expiresIn:'10m',audience:'instagram-login'});const u=new URL('https://www.instagram.com/oauth/authorize');for(const [k,v]of Object.entries({client_id:c.appId,redirect_uri:c.redirect,response_type:'code',scope:'instagram_business_basic,instagram_business_content_publish',state,enable_fb_login:'0',force_authentication:'1'}))u.searchParams.set(k,v);return {url:u.href,nonceHash:createHash('sha256').update(nonce).digest('hex')};}
export function verificarLogin(state,env=process.env){const p=jwt.verify(state,env.JWT_SECRET,{audience:'instagram-login',algorithms:['HS256']});if(p.purpose!=='instagram-login'||typeof p.sub!=='string'||typeof p.nonce!=='string')throw new Error('Autorização inválida.');return {usuarioId:p.sub,nonceHash:createHash('sha256').update(p.nonce).digest('hex')};}
export async function trocarCodigo(code,{env=process.env,fetcher=fetch}={}){
 const c=configLogin(env);if(!c.pronto||typeof code!=='string'||code.length>4096)throw new Error('Conexão inválida.');
 const response=await fetcher('https://api.instagram.com/oauth/access_token',{method:'POST',body:new URLSearchParams({client_id:c.appId,client_secret:c.secret,grant_type:'authorization_code',redirect_uri:c.redirect,code:code.replace(/#_$/,'')}),signal:AbortSignal.timeout(20000)});
 const short=await response.json();if(!response.ok||!short.access_token)throw new Error('O Instagram não autorizou a conexão.');
 const longUrl=new URL('https://graph.instagram.com/access_token');for(const [k,v]of Object.entries({grant_type:'ig_exchange_token',client_secret:c.secret,access_token:short.access_token}))longUrl.searchParams.set(k,v);
 const longRes=await fetcher(longUrl,{signal:AbortSignal.timeout(20000)}),long=await longRes.json();if(!longRes.ok||!long.access_token)throw new Error('Não foi possível concluir a conexão.');
 const profileRes=await fetcher(`https://graph.instagram.com/${env.META_GRAPH_VERSION||'v25.0'}/me?fields=user_id,username`,{headers:{Authorization:`Bearer ${long.access_token}`},signal:AbortSignal.timeout(20000)}),profile=await profileRes.json();
 const conta=String(profile.user_id||short.user_id||'');if(!profileRes.ok||!/^\d+$/.test(conta))throw new Error('Não foi possível identificar a conta profissional.');
 return {conta,username:profile.username||'',tokenCifrado:cifrarToken(long.access_token,env),expiraEm:new Date(Date.now()+Math.min(Number(long.expires_in)||5184000,5184000)*1000)};
}
