# Área da Empresa

- Entrada pelo rodapé do site: **Área da Empresa**. Local: http://127.0.0.1:5180/empresa/login (redireciona para o React em localhost:5173).
- Use o e-mail e a senha existentes. O portal tem menu próprio; não precisa navegar pelo sistema operacional.
- Administradores: acesso completo. Em **Usuários e permissões**, autorize individualmente conteúdo, promoções ou **Relatórios gerenciais** (inclui valores e clientes). Nenhum funcionário recebeu acesso automaticamente.
- **Somente Área da Empresa** bloqueia módulos operacionais; indicadores exigem a permissão de relatórios. Cadastros de funcionários continuam no sistema.
- **Visão geral**: situação atual de todos os pedidos, atrasados e serviços em execução, atualização a cada minuto com a aba visível.
- **Relatórios**: filtros de datas/origem e pedidos paginados; gráficos dos últimos 24 meses, incluindo o mês atual parcial. Histórico usa datas de criação dos pedidos e conclusão registrada dos serviços. Não reconstrói situações antigas sem registros históricos.
- Cada gráfico permite abrir a tabela e baixar PDF com gráfico e todos os dados exibidos. O PDF é gerado no navegador, sem arquivos permanentes no servidor.
- Valor cadastrado de pedidos não é faturamento/recebimento. Cancelados são excluídos dos valores. Meses sem dados mostram zero.
- Site/marketing agora ficam em `/empresa/*`; endereços anteriores `/site/*` redirecionam. Configurações, uploads, autenticação e dados existentes foram reaproveitados.

## Implantação

Nenhuma migração nova nesta etapa. Mantenha as migrações anteriores aplicadas e faça backup antes de atualizar:

```sh
docker compose build backend frontend site
docker compose up -d backend frontend site
```

O Nginx do site encaminha `/empresa` e assets React ao serviço frontend; o domínio permanece configurado no proxy da VPS. A configuração **Endereço do sistema** deve apontar para a entrada operacional já existente; não substitua por um endereço local ao implantar. O site depende da saúde do frontend e backend. Nenhuma mudança foi feita na VPS.

Arquivos principais: `frontend/src/layouts/EmpresaLayout.jsx`, `frontend/src/pages/EmpresaDashboard.jsx`, `frontend/src/components/RelatorioEmpresaPeriodo.jsx`, `frontend/src/utils/graficoEmpresa.js`, `backend/src/routes/empresaIndicadores.routes.js`, `backend/src/utils/empresaIndicadores.js`. Integração em App, MainLayout, Login, PrivateRoute, API, permissões, auth, rotas de relatórios, servidor, index do site, Nginx e Compose.

Validação: testes unitários e integração PostgreSQL para 24 meses, somas reais, permissões, revogação e bloqueio operacional; builds React/site; PDF baixado e renderizado com tabela de 24 meses.

## Vitrine e análise executiva (07/10/2026)
- Área da Empresa → Produtos e equipamentos: escolha Materiais, Máquinas ou Ferramentas. Informe imagem, marca, condição, preço opcional e preço anterior. Ative para publicar; categoria inativa mantém oculto.
- Sem equipamentos cadastrados, o site oferece consulta por família, sem inventar estoque/preços.
- Visão executiva: filtros de 3/6/12/24 meses; selecione a métrica, alterne linha/barras, consulte valores pelo mouse/Tab e clique no mês para explorar pedidos. Comparação com período anterior completo; base zero não gera percentual.
- Relatórios: período/origem, ranking de clientes, produção, busca e situação dentro da página atual de 20 pedidos. PDF inclui gráfico e tabela; evolução inclui comparação disponível.
- Implantação: backup do banco antes da atualização. Migração aditiva `20261007180000_catalogo_vendas` preserva produtos existentes como MATERIAL.
```sh
docker compose build backend frontend site
docker compose run --rm backend npx prisma migrate deploy
docker compose up -d backend frontend site
```
- Validação do PostgreSQL local: `RUN_SITE_DB_TESTS=1 node --test --test-concurrency=1` em backend. Série evita que fixtures de outros testes alterem as contagens globais durante a conferência.

Ticket médio usa somente pedidos não cancelados com valor informado; cadastros sem valor não são tratados como vendas de R$ 0.

Arquivos desta evolução: backend/prisma/schema.prisma e migrations/20261007180000_catalogo_vendas; backend/src/utils/siteConteudo.js, empresaIndicadores.js; backend/src/routes/siteRelatorios.routes.js, empresaIndicadores.routes.js; frontend/src/pages/CatalogoSite.jsx, EmpresaDashboard.jsx, empresa-executiva.css; frontend/src/components/GraficoExecutivo.jsx, RelatorioEmpresaPeriodo.jsx; frontend/src/utils/analiseEmpresa.js, graficoEmpresa.js; site/index.html, app.js, styles.css; testes de catálogo e indicadores no backend e análise no frontend.

## Redes sociais
Área da Empresa → Configuração do site → Redes sociais da empresa. Preencha URLs completas de Instagram, Facebook, YouTube, LinkedIn, TikTok, X, Pinterest, Telegram e Threads; salve e recarregue o site. Campo vazio oculta a rede. WhatsApp usa o número já cadastrado. Ícones aparecem no topo/rodapé da Home e nas páginas institucionais, abrindo em nova aba. Isso configura links de perfis; a autorização de publicação no Instagram é separada.
Migração aditiva `20261008010000_redes_sociais_site` preserva o Instagram existente. Arquivos: schema/migração, backend/src/utils/configuracaoSite.js, frontend/src/pages/ConfiguracaoSite.jsx, site/redes.js, app.js, pagina.js, styles.css, build.mjs e server.mjs. Testes: backend/test/redesSociais.test.js.

Em Relatórios, a seção Comercial e operação reutiliza os relatórios do sistema: vendedores por cadastro, pontualidade por previsão de entrega e pedidos parados pela última alteração. Clique nas barras para filtrar, busque nos detalhes e exporte gráfico e detalhes em PDF. Exige RELATORIOS_EMPRESA. Não há migração adicional para esta integração.
