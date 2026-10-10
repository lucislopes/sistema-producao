import { mkdir, copyFile, cp } from 'node:fs/promises';
const root = new URL('./', import.meta.url);
await mkdir(new URL('dist/', root), { recursive: true });
for (const name of ['index.html', 'styles.css', 'modernizacao.css', 'estudio.html', 'estudio.css', 'estudio.js', 'app.js', 'config.js', 'whatsapp.js', 'cliente.js', 'ativar-acesso.html', 'ativar-acesso.js','admin.html','admin.js','admin.css','marketing.js','ofertas.js','imagensCatalogo.js','pagina.html','pagina.js','redes.js']) {
  await copyFile(new URL(name, root), new URL(`dist/${name}`, root));
}
await cp(new URL('assets/', root), new URL('dist/assets/', root), { recursive: true });
console.log('Site estático gerado em site/dist.');
