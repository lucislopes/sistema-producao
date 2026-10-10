// Backup apenas do banco local antes de migrations. Não imprime credenciais.
import dotenv from 'dotenv';
import { mkdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
dotenv.config({ quiet: true });
const connection = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname)) throw new Error('Este script aceita somente banco local.');
const dir = path.resolve('../backups');
await mkdir(dir, { recursive: true });
const file = path.join(dir, `pre-configuracao-site-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`);
const dump = process.env.PG_DUMP_PATH || 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe';
const result = spawnSync(dump, ['-h', connection.hostname, '-p', connection.port || '5432', '-U', decodeURIComponent(connection.username), '-d', decodeURIComponent(connection.pathname.slice(1)), '-Fc', '-f', file], {
  env: { ...process.env, PGPASSWORD: decodeURIComponent(connection.password) }, encoding: 'utf8', windowsHide: true
});
if (result.error || result.status !== 0) throw new Error('Backup local falhou. Confira pg_dump e a conexão; migration não deve ser aplicada.');
if (!(await stat(file)).size) throw new Error('Backup vazio.');
console.log(`Backup local criado: ${file}`);
