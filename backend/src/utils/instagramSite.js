// Instagram Login: token e conta profissional ficam somente no servidor.
export function configuracaoInstagram(env=process.env){return {token:env.INSTAGRAM_ACCESS_TOKEN,conta:env.INSTAGRAM_ACCOUNT_ID,versao:env.META_GRAPH_VERSION||'v25.0',origem:env.SITE_PUBLIC_URL}}
export async function publicarInstagram({imagemUrl,legenda,formato='FEED',container}, {env=process.env,fetcher=fetch}={}) {
  const c=configuracaoInstagram(env);
  if(!c.token||!/^\d+$/.test(c.conta||'')||!/^v\d+\.\d+$/.test(c.versao))throw Object.assign(new Error('Configure a conta profissional e as credenciais Meta. A exportação manual continua disponível.'),{status:409});
  const origem=new URL(c.origem||'http://localhost');const imagem=container?null:new URL(imagemUrl,origem);
  if(!container&&(origem.protocol!=='https:'||imagem.origin!==origem.origin||!/^\/api\/uploads\/site\/banners\/[a-f0-9-]{36}\.jpg$/.test(imagem.pathname)))throw Object.assign(new Error('A Meta precisa da arte JPEG no domínio HTTPS público configurado.'),{status:400});
  async function api(path,data){const response=await fetcher(`https://graph.instagram.com/${c.versao}/${path}`,{method:data?'POST':'GET',headers:{Authorization:`Bearer ${c.token}`},...(data?{body:new URLSearchParams(data)}:{}),signal:AbortSignal.timeout(20000)});const result=await response.json();if(!response.ok||result.error)throw Object.assign(new Error('A Meta recusou a operação. Confira permissões, token e mídia na conta profissional.'),{status:502});return result;}
  if(!container){const criado=await api(`${c.conta}/media`,{image_url:imagem.href,...(formato==='STORIES'?{media_type:'STORIES'}:{caption:legenda})});if(!criado.id)throw new Error('A Meta não retornou o identificador da mídia.');return {estado:'PROCESSANDO',container:criado.id};}
  const situacao=await api(`${container}?fields=status_code`);
  if(situacao.status_code==='IN_PROGRESS')return {estado:'PROCESSANDO',container};
  if(situacao.status_code!=='FINISHED')throw Object.assign(new Error('A mídia não está pronta na Meta. Confira o processamento antes de tentar novamente.'),{status:409});
  const publicado=await api(`${c.conta}/media_publish`,{creation_id:container});if(!publicado.id)throw new Error('A Meta não confirmou a publicação.');return {estado:'PUBLICADO',id:publicado.id,container};
}
