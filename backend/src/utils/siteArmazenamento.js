import { mkdir, readFile, writeFile, rename, readdir, stat, statfs, rmdir } from 'node:fs/promises';
import path from 'node:path';
export const MIB = 1024 * 1024;
export const DEFAULT_QUOTA = 1024 * MIB;
export function erroEspaco(message, status = 409) { return Object.assign(new Error(message), { status }); }
// A trava no volume protege uploads e alterações de cota entre processos.
export async function comTrava(root, action) {
  await mkdir(root, { recursive: true });
  const lock = path.join(root, '.site-storage.lock');
  try { await mkdir(lock); } catch (error) {
    if (error.code === 'EEXIST') throw erroEspaco('Armazenamento ocupado. Tente novamente em alguns instantes.', 503);
    throw error;
  }
  try { return await action(); } finally { await rmdir(lock); }
}
async function tamanho(directory) {
  let total = 0, arquivos = 0;
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') return { total, arquivos }; throw e; }
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { const child = await tamanho(file); total += child.total; arquivos += child.arquivos; }
    else if (entry.isFile()) { total += (await stat(file)).size; arquivos++; }
  }
  return { total, arquivos };
}
export async function obterArmazenamento(root) {
  let cotaBytes = DEFAULT_QUOTA;
  try { cotaBytes = JSON.parse(await readFile(path.join(root, '.site-storage.json'), 'utf8')).cotaBytes; }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (!Number.isSafeInteger(cotaBytes) || cotaBytes < MIB) throw new Error('Configuração de armazenamento inválida.');
  const { total: usadoBytes, arquivos } = await tamanho(path.join(root, 'site'));
  return { cotaBytes, usadoBytes, arquivos, percentual: Math.round(usadoBytes / cotaBytes * 100), alerta: usadoBytes >= cotaBytes * .8, bloqueado: usadoBytes >= cotaBytes };
}
export async function salvarCota(root, cotaMB) {
  if (!Number.isInteger(cotaMB) || cotaMB < 1 || cotaMB > 102400) throw erroEspaco('Informe uma cota inteira entre 1 e 102400 MB.', 400);
  return comTrava(root, async () => {
    const atual = await obterArmazenamento(root);
    if (cotaMB * MIB < atual.usadoBytes) throw erroEspaco('A cota não pode ser menor que o espaço já utilizado.', 400);
    const temp = path.join(root, '.site-storage.json.tmp');
    await writeFile(temp, JSON.stringify({ cotaBytes: cotaMB * MIB }));
    await rename(temp, path.join(root, '.site-storage.json'));
    return obterArmazenamento(root);
  });
}
export async function verificarEspaco(root, bytes) {
  const info = await obterArmazenamento(root);
  if (info.usadoBytes + bytes > info.cotaBytes) throw erroEspaco('Cota de imagens atingida. Ajuste a cota em Configurações do Site.', 413);
  const disk = await statfs(root);
  if (Number(disk.bavail) * Number(disk.bsize) < bytes + 256 * MIB) throw erroEspaco('Disco com pouco espaço disponível. Contate o administrador.', 507);
}
