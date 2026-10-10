# Configuração pelo Sistema-Produção — validação local

## O que foi entregue

- Tela `/site/configuracao` no frontend interno, ADMIN apenas, com menu **Site / Marketing → Configurações do Site**.
- Nome, logo, telefone e e-mail são os mesmos de `ConfiguracaoEmpresa`; editar também afeta os cabeçalhos existentes. Endereço, CNPJ e limites diários não são alterados por esta tela.
- Nova tabela singleton `ConfiguracaoSite`: ativação, cores, WhatsApp, Instagram e endereços do site/sistema, além das datas.
- Rotas backend `/site/configuracao` (GET/PUT com login ADMIN) e `/public/configuracao` (GET público com projeção explícita de campos).
- No navegador/proxy, URLs incluem `/api`, que o Nginx atual remove. O servidor da prévia em 5180 encaminha somente `GET /api/public/configuracao` ao backend local em 3333.
- O site usa configuração ao abrir; recarregue depois de salvar. Não exige outro build para alterar identidade/links.
- Em loopback, API indisponível ou site desativado preserva a prévia ilustrativa com aviso. Fora de loopback, falha da configuração ou desativação oculta a página comercial.
- Não há mudança de DNS, Nginx, Docker ou `.env` real. O domínio informado é `biomadeira.cooperagestao.com.br`; nenhum acesso remoto foi feito.

## Banco e revisão

SQL revisável: `backend/prisma/migrations/20261005120000_configuracao_site/migration.sql`.

A migration só cria uma tabela. O site começa desativado. Nome, logo e contatos não são copiados para outra tabela. Nenhum registro de empresa existente foi substituído. Foi criado backup lógico local antes de aplicar a migration; arquivos ficam em `backups/`, ignorado no Git.

Rollback de código pode manter a nova tabela sem afetar as versões anteriores. Não excluir a tabela para rollback comum. Nenhuma migration foi aplicada na VPS.

## Em outra cópia de desenvolvimento

Com PostgreSQL local configurado no `.env` existente do backend, sem exibir nem trocar os valores:

```powershell
cd C:\sistema-producao\backend
node src/scripts/backup-local.js
# Pare somente o backend local antes de generate se o Windows bloquear a DLL do Prisma.
npx prisma generate
npx prisma migrate status
# Confirme que somente a migration esperada está pendente.
npx prisma migrate deploy
npm run dev
```

O helper de backup aceita somente host local e usa pg_dump PostgreSQL 16. `PG_DUMP_PATH` é um override opcional do caminho do executável; não exige nova variável de ambiente da aplicação. Se falhar, não aplique a migration. `migrate status` retorna código diferente de zero se houver pendências esperadas; revisar a lista antes de continuar. Não usar reset ou recriar banco.

Em outros terminais:

```powershell
cd C:\sistema-producao\frontend
npm run dev
```

```powershell
cd C:\sistema-producao\site
npm run dev
```

## Como testar

1. Entre com seu ADMIN no sistema local (normalmente `http://localhost:5173`).
2. Abra **Site / Marketing → Configurações do Site**.
3. Revise nome/logo/contatos compartilhados; eles já vêm da instalação, sem substituir por Ferramad automaticamente.
4. Marque **Ativar configuração pública do site**.
5. Para teste, endereço do site `http://127.0.0.1:5180` e endereço do sistema `http://localhost:5173` (ajuste se a porta real diferir).
6. Salve e recarregue `http://127.0.0.1:5180`.
7. Confira nome, logo, cores e contatos, além do link **Acesso ao sistema** no rodapé. Campos vazios ocultam links e uma logo vazia mostra o nome, sem exibir a marca Ferramad de outra instalação.
8. Desative e recarregue: a prévia local avisa que usa conteúdo ilustrativo. O sistema interno permanece disponível.

## Verificações técnicas

```powershell
cd C:\sistema-producao\backend
npm test
$env:RUN_SITE_DB_TESTS='1'
node --test test/configuracaoSite.test.js test/configuracaoSite.integration.test.js
```

O teste de banco só aceita host local, usa transação e rollback integral, preservando os valores cadastrados. Verifica ativação/desativação, projeção pública e preservação de campos comerciais/limites.

```powershell
cd C:\sistema-producao\frontend
npm run build
npm test
cd C:\sistema-producao\site
npm run build
```

## Limites desta etapa

O catálogo continua demonstrativo. O formulário comercial apenas monta texto; não cria solicitações no banco. Logos seguem o cadastro atual em Data URL; o uploader persistente no filesystem ainda não foi implementado. Novos arquivos desta tela aceitam PNG/JPG/WebP, preservando logos legadas inalteradas. Não foi validado Docker em execução porque o daemon local está indisponível.

Ao publicar, preparar proxy `/api/public/` para o backend existente, junto dos arquivos estáticos, revisar limites de requisição e HTTPS. A configuração no painel controla links e identidade, não provisiona DNS ou certificados. O domínio atual continua preservado.
