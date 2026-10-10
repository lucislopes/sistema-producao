# Publicação Biomadeira preservando a produção

## Endereços propostos (aguardando escolha)

- Site público: https://biomadeira.cooperagestao.com.br/
- Sistema: https://sistema.biomadeira.cooperagestao.com.br/
- Gestão do site: https://biomadeira.cooperagestao.com.br/empresa
- Uma API e o banco de produção atual. Não criar outro PostgreSQL para substituir o atual.

## Antes de executar

Inspecionar VPS, pasta Git, commit atual, alterações locais, Compose efetivo, nome do projeto Compose, containers, volumes montados, PostgreSQL, histórico _prisma_migrations e proxy HTTPS. Não imprimir .env, tokens ou docker compose config completo em conversas.

Preservar nome do projeto Compose e o volume real montado em /var/lib/postgresql/data. Trocar o diretório ou nome do projeto pode criar volume vazio e aparentar perda da base. Identificar credenciais reais; não substituir por valores de exemplo do Compose.

## Sequência de publicação

1. Salvar commit/imagens da versão atual, configuração do proxy e .env em backup privado.
2. Criar dump do PostgreSQL com ferramenta da versão adequada, conferir que pg_restore consegue listar seu conteúdo e testar restauração em banco isolado. Salvar uploads em backup separado e copiar o backup para fora da VPS.
3. Preparar release Git sem arquivos temporários, dumps, .env, ZIPs de cópias ou screenshots privados.
4. Construir novas imagens enquanto o sistema atual continua funcionando. Conferir migrations pendentes no banco real e schema resultante. Usar prisma migrate deploy após backup, nunca reset/db push/seed para atualizar produção.
5. Atualizar backend e frontend sem recriar PostgreSQL nem remover volumes. Medir pedidos/clientes e conferir login, pedidos, produção, expedicão e relatórios contra a base atual.
6. Publicar o site em porta separada e conferir com hostname de teste antes de mudar a entrada principal.
7. Importar somente tabelas/conteúdo do site e arquivos referenciados, com estratégia de conflito e dry-run. Não restaurar o banco local completo sobre produção. Usuários, clientes e pedidos locais não são fonte para a VPS.
8. Configurar siteUrl/sistemaUrl/contatos e SITE_PUBLIC_URL/CORS_ORIGINS com domínios reais. Conferir links absolutos salvos em banners e páginas.
9. Criar DNS do subdomínio do sistema apontando para a VPS e emitir certificado. Ajustar proxy público: domínio principal para site (porta configurada, normalmente 8080), subdomínio para frontend atual (normalmente 5173). Validar nginx -t antes de reload.
10. Conferir HTTPS, autenticação separada por origem, API, upload, imagens, Cortecloud e WhatsApp. Avisar equipe que a URL de entrada do sistema mudou; preservar links antigos de pedidos se necessário.

## Retorno

Guardar proxy e imagens antigas antes da troca. Se necessário, voltar o domínio principal ao frontend e voltar imagens da aplicação. Como migrations novas são aditivas, evitar remover suas tabelas ao retornar o código. Restaurar dump de produção pode perder pedidos recebidos depois do backup: apenas usar como recuperação planejada, com parada e preservação dos dados posteriores.

Não executar docker compose down -v, volume rm, migrate reset ou seed em produção. Comandos concretos e caminhos dependem da inspeção da VPS; este plano não foi executado no servidor.
