# Evolução institucional

Painel: `/site/banners` (carrossel), `/site/paginas` (serviços/marcas/história/contato/localização), `/site/publicacoes` (promoções/editor), `/site/permissoes` (admin). Configuração por empresa continua em `/site/configuracao`; catálogo e textos existentes foram preservados.

Publicação no site: salve como PUBLICADO e defina início/fim. Antes do início aparece AGENDADO no painel, depois da validade EXPIRADO; rascunhos ficam privados. Destaque coloca a promoção na Home. A exclusão retira o registro, preservando a imagem. Artes usam as fotos enviadas, logo e cores configurados; selecione Feed ou Stories, baixe JPEG e copie legenda. Downloads manuais não armazenam novas cópias no servidor.

Permissões: cadastre login em Funcionários e autorize CONTEUDO e/ou PROMOCOES em Permissões de marketing. Marque **Somente site** para bloquear pedidos, produção, cadastros e relatórios na API e interface. ADMIN mantém suas permissões atuais. Nunca reutilize o login ADMIN para marketing.

## Implantação na VPS (quando autorizada)

Faça backup do PostgreSQL e volume `uploads_data`; preserve `.env` e os volumes existentes. Revise alterações e configure logo, contatos e URLs de cada instalação. Cada cliente deve ter seu próprio projeto Compose, banco, volumes e credenciais. Não execute `down -v`, reset ou `db push`.

```sh
docker compose exec -T postgres pg_dump -U postgres sistema_producao > backup-antes-site.sql
docker compose build backend frontend site
docker compose run --rm --no-deps backend npx prisma migrate deploy
docker compose up -d backend frontend site
# Opcional: cria páginas/banners com textos e fotos já configurados; não sobrescreve registros.
docker compose exec backend node scripts/inicializarSiteMarketing.js
```

Site usa porta 8080; sistema continua 5173. No proxy HTTPS da VPS direcione o domínio público ao site e o subdomínio do sistema ao frontend. Configure `siteUrl` e `sistemaUrl` no painel antes de trocar o domínio. Para levar as fotos desta prévia, envie-as pelo painel da instalação ou transfira os arquivos referenciados para o volume `uploads_data`; não substitua o banco de produção pelo banco local. Verifique login, orçamento, pedidos e `/api/public/configuracao` após implantar. Para várias instalações, adapte portas e retire nomes de containers fixos do Compose em cada cópia.

## Instagram oficial (opcional)

Exportação manual funciona sem conta externa. Configure somente no `.env` do servidor: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID`, `META_GRAPH_VERSION` (padrão v25.0), `SITE_PUBLIC_URL=https://seu-dominio`. Use Instagram Login com conta profissional autorizada e permissões `instagram_business_basic` e `instagram_business_content_publish`. Exigências de revisão/acesso e publicação de Stories dependem da conta e aprovação da Meta. Token nunca é enviado ao navegador. [Documentação oficial Meta](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/).

Na Área da Empresa → Promoções e anúncios → Editar, salve e use **Publicar no Feed** ou **Publicar nos Stories**. Cada formato tem envio independente e arte ajustada. O botão acompanha o processamento por até 20 segundos; se continuar pendente, use o mesmo botão para concluir. Sucesso exige ID real. Confirmação incerta bloqueia nova tentativa para evitar duplicatas. Registros antigos sem formato são preservados; crie outro anúncio para o novo fluxo.

**Conectar Instagram** abre OAuth oficial com `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `JWT_SECRET` e `SITE_PUBLIC_URL` HTTPS configurados. Registre a URL exata `https://seu-dominio/api/marketing-site/instagram/callback` no aplicativo Meta. Permissões: `instagram_business_basic` e `instagram_business_content_publish`; revisão/acesso dependem do aplicativo. Stories requer conta empresarial habilitada. Configure `INSTAGRAM_TOKEN_SECRET` estável: tokens ficam cifrados AES-GCM no banco, nunca no navegador. Sem essa variável, a cifra usa JWT_SECRET; trocar a chave exige reconectar. Expiração exige nova conexão. Token no ambiente permanece compatível como alternativa.

Callback valida assinatura, prazo, nonce de uso único e permissão vigente. Sem configuração, o botão orienta e não simula conexão. Agendamento é apenas do site. Feed envia legenda; Stories leva texto incorporado na arte.


Artes JPEG enviadas especificamente à Meta têm retenção de 30 dias e cota compartilhada das imagens. Imagens de conteúdo WebP permanecem. Anexos de orçamento mantêm retenção privada de 30 dias. Sem serviço pago obrigatório.

Validação local: `npm test --prefix backend`, `RUN_SITE_DB_TESTS=1 npm test` dentro de backend (somente PostgreSQL local), `npm run build --prefix frontend`, `node site/build.mjs`.

## Arquivos desta evolução

- Banco/API: `backend/prisma/schema.prisma`, `backend/prisma/migrations/20261007090000_site_publicacoes/migration.sql`, `backend/src/routes/{marketingSite,site}.routes.js`, `backend/src/utils/{siteMarketing,instagramSite,artesTemporarias,siteUpload}.js`, `backend/src/{server.js,middlewares/auth.middleware.js,controllers/auth.controller.js}`, `backend/scripts/inicializarSiteMarketing.js`.
- Painel: `frontend/src/pages/{MarketingSite,PermissoesSite,CatalogoSite,ConteudoSite}.jsx`, `frontend/src/utils/arteSite.js`, `frontend/src/{App.jsx,layouts/MainLayout.jsx,routes/PrivateRoute.jsx}`.
- Site: `site/{index.html,app.js,styles.css,marketing.js,pagina.html,pagina.js,build.mjs,server.mjs,Dockerfile,nginx.conf,IMPLANTACAO-EVOLUCAO.md}`. Configuração: `docker-compose.yml`, `.env.example`.
- Testes: `backend/test/{siteMarketing.test.js,siteMarketing.db.test.js,artesTemporarias.test.js}`.

Atualização Instagram: `backend/src/utils/instagramConexao.js`, `instagramSite.js`, `backend/src/routes/marketingSite.routes.js`, `backend/prisma/schema.prisma`, migração `20261007210000_instagram_feed_stories`, `frontend/src/pages/MarketingSite.jsx`, `.env.example`, `docker-compose.yml` e testes de conexão/envios. Após backup: build dos serviços, `docker compose run --rm backend npx prisma migrate deploy`, `docker compose up -d backend frontend site`.
