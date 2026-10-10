# Revisão antes da publicação — 09/10/2026

## Alterações e correções

- Menu Relatórios retirado da Área da Empresa; /empresa/relatorios redireciona para /empresa. Visão executiva permanece no sistema.
- Fallback de Ver site usa a raiz em produção, em vez de localhost.
- Simulação do teste de marketing corrigida: filtros vazios não descartam todas as publicações.
- Integrações de banco devem executar em sequência: usam registros temporários e comparações com totais do banco. O script backend test:integration utiliza --test-concurrency=1. Habilitar RUN_SITE_DB_TESTS=1 e RUN_DB_TESTS=1 somente contra banco local de teste.

## Verificações executadas

- Backend: 142 testes aprovados, sem falhas nem testes ignorados, incluindo banco e HTTP local.
- Frontend: build aprovado, 12 testes aprovados, lint sem erros e com 96 avisos. Os avisos permanecem e não equivalem a validação de todos os comportamentos de tela.
- Site: build aprovado e 17 testes aprovados.
- Auditoria pública: seis APIs, 27 imagens locais, nenhuma falha; nove páginas e seis produtos retornados.
- Prisma: schema válido. git diff --check sem erros de whitespace.
- Navegador: menu sem Relatórios, endereço antigo redireciona e Visão geral abre sem erros de console.
- Proxy/empacotamento: arquivos do site incluídos no build; API e /empresa encaminhados; uploads persistem em volume no compose. O sistema operacional deve usar sua URL própria quando servido em domínio separado.

## Pendências para a VPS

- Migration local pendente: 20261008010000_origem_comercial. Não foi aplicada nesta revisão. Conferir migrations da VPS, fazer backup e executar prisma migrate deploy no ambiente de publicação.
- Confirmar siteUrl, sistemaUrl, SITE_PUBLIC_URL, CORS_ORIGINS e domínio reais. Valores localhost do ambiente de desenvolvimento não devem ser usados na publicação.
- Validar HTTPS, proxy reverso, cookies/autenticação e persistência dos uploads no servidor real. Docker/VPS não foram executados nesta revisão.
- A publicação de Instagram não foi enviada: testes usam respostas simuladas. Validar conexão real no momento apropriado.
- A geração do link Cortecloud continua responsabilidade da equipe; o site registra pedido de acesso e não gera o link automaticamente.
- Conferir conteúdo comercial final, disponibilidade e condições das promoções.

Nenhum deploy, mensagem externa ou publicação foi realizado. Esta revisão cobre testes automatizados, integrações locais, build e conferências de navegação; não certifica todos os fluxos da VPS sem verificá-la.
