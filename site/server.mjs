import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('./', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(pathname==='/empresa'||pathname.startsWith('/empresa/')){
      res.writeHead(302,{'Location':'http://localhost:5173'+pathname,'Cache-Control':'no-store'});res.end();return;
    }
    if ((pathname==='/api/auth/login'&&req.method==='POST')||(pathname==='/api/site-relatorios'&&req.method==='GET')) {
      let body='';let size=0;for await(const chunk of req){size+=chunk.length;if(size>4096){res.writeHead(413);res.end();return;}body+=chunk;}
      try{const url=new URL(req.url,'http://localhost');const response=await fetch(`http://127.0.0.1:3333${pathname.replace(/^\/api/,'')}${url.search}`,{method:req.method,headers:{'Content-Type':'application/json',...(req.headers.authorization?{Authorization:req.headers.authorization}:{}),'X-Forwarded-For':req.socket.remoteAddress},...(req.method==='POST'?{body}:{}),signal:AbortSignal.timeout(20000)});res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(await response.text());}catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Relatórios indisponíveis. Tente novamente.'}));}return;
    }
    if(/^\/api\/atendimento-site\/orcamentos\/[a-f0-9-]{36}\/anexos$/.test(pathname)&&req.method==='POST'){
      const chunks=[];let size=0;
      for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Envie um arquivo de até 5 MB.'}));return;}chunks.push(chunk);}
      try{const response=await fetch(`http://127.0.0.1:3333${pathname.replace(/^\/api/,'')}`,{method:'POST',headers:{'Content-Type':req.headers['content-type']||'application/octet-stream','X-Upload-Token':req.headers['x-upload-token']||'','X-File-Name':req.headers['x-file-name']||'arquivo','X-Forwarded-For':req.socket.remoteAddress},body:Buffer.concat(chunks),signal:AbortSignal.timeout(60000)});res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(await response.text());}catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Envio indisponível. Seu orçamento permanece registrado.'}));}return;
    }
    if (/^\/api\/atendimento-site\/(?:orcamentos|cliente\/(?:login|ativar|pedidos(?:\/[a-zA-Z0-9-]+(?:\/recomprar)?)?))$/.test(pathname) && ['GET','POST'].includes(req.method)) {
      let body='';let size=0;for await(const chunk of req){size+=chunk.length;if(size>40960){res.writeHead(413);res.end('Conteúdo acima do limite');return;}body+=chunk;}
      try{const url=new URL(req.url,'http://localhost');const response=await fetch(`http://127.0.0.1:3333${pathname.replace(/^\/api/,'')}${url.search}`,{method:req.method,headers:{'Content-Type':'application/json',...(req.headers.authorization?{Authorization:req.headers.authorization}:{}),'X-Forwarded-For':req.socket.remoteAddress},...(req.method==='POST'?{body}:{}),signal:AbortSignal.timeout(20000)});res.writeHead(response.status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(await response.text());}catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Atendimento indisponível. Tente novamente.'}));}return;
    }
    if (pathname === '/api/acompanhamento/consultar-site' && req.method === 'POST') {
      let body = ''; let size = 0;
      for await (const chunk of req) { size += chunk.length; if(size > 1024) { res.writeHead(413); res.end('Conteúdo acima do limite'); return; } body += chunk; }
      try {
        const response = await fetch('http://127.0.0.1:3333/acompanhamento/consultar-site', {method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':req.socket.remoteAddress},body,signal:AbortSignal.timeout(15000)});
        res.writeHead(response.status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(await response.text());
      } catch { res.writeHead(503,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'Consulta indisponível. Tente novamente mais tarde.'})); }
      return;
    }
    // Proxy local restrito ao único endpoint público necessário à prévia.
    if (/^\/api\/public\/(?:configuracao|produtos|categorias|banners|paginas|publicacoes)$/.test(pathname) && req.method === 'GET') {
      try {
        const response = await fetch(`http://127.0.0.1:3333${pathname.replace(/^\/api/,'')}`, { signal: AbortSignal.timeout(5000) });
        res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(await response.text());
      } catch {
        res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'API local indisponível' }));
      }
      return;
    }
    if (/^\/api\/uploads\/site\/(?:configuracao|produtos|categorias|banners|paginas|publicacoes)\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(pathname) && req.method === 'GET') {
      try {
        const response = await fetch(`http://127.0.0.1:3333${pathname.replace(/^\/api/,'')}`, {signal:AbortSignal.timeout(5000)});
        res.writeHead(response.status, {'Content-Type':response.headers.get('content-type') || 'application/octet-stream','X-Content-Type-Options':'nosniff'});
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch {res.writeHead(503);res.end('Imagem indisponível');}
      return;
    }
    const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !['index.html', 'styles.css', 'modernizacao.css', 'estudio.html', 'estudio.css', 'estudio.js', 'app.js', 'config.js', 'whatsapp.js', 'cliente.js', 'ativar-acesso.html', 'ativar-acesso.js','admin.html','admin.js','admin.css','marketing.js','ofertas.js','imagensCatalogo.js','pagina.html','pagina.js','redes.js'].includes(relative) && !relative.startsWith(`assets${path.sep}`)) {
      res.writeHead(404); res.end('Não encontrado'); return;
    }
    const content = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }); res.end(content);
  } catch { res.writeHead(404); res.end('Não encontrado'); }
}).listen(5180, '127.0.0.1', () => console.log('Ferramad: http://127.0.0.1:5180'));
