# Administração de conteúdo, catálogo e imagens — local

## Como usar

Rodada de melhorias locais: seis produtos fictícios cadastrados com IDs e slugs próprios (`exemplo-*`), três categorias e ilustrações WebP. O script `backend/src/scripts/catalogo-exemplo-local.js` só aceita banco local e não sobrescreve registros existentes. Faça a gestão em Produtos: editar, Retirar do site (desativação reversível), ou Adicionar para criar outro ID; não há posições fixas nem substituição obrigatória. Exemplos não são estoque real. Backup feito antes da inclusão.

Orçamento inclui lista de corte opcional, até 50 linhas: identificação da peça, material, comprimento/largura em mm (1–10000), quantidade (1–9999) e quatro lados de fita. Essas linhas entram na mensagem do WhatsApp; não geram pedido nem calculam aproveitamento de chapa. Com peças preenchidas, o texto livre do projeto é opcional. Acrescentados atalho de consulta na abertura e ações fixas em telas compactas.

Endereço, horário, orientações de retirada e link de localização são editados em Textos e Imagem; campos vazios não aparecem no site. Localização aceita somente HTTP/HTTPS. Configurações e Textos oferecem uma prévia resumida com as alterações ainda não salvas, catálogo atual e avisos de dados faltantes/produtos de exemplo. Não é um sistema separado de rascunhos: ao salvar, a configuração ativa é aplicada. Identidade continua editável pelo sistema, para cada instalação.

Entre com o ADMIN atual no sistema local. Em **Site / Marketing**:

1. **Configurações do Site:** nome/logo/contatos, cores, ativação e links.
2. **Textos e Imagem:** frases da página inicial, catálogo, serviços, passos de atendimento, sobre a empresa, orçamento, rodapé e metadados; imagem principal.
3. **Categorias:** nome, URL amigável, descrição, imagem, ordem e ativação.
4. **Produtos:** nome, URL amigável, categoria opcional, textos, especificação, imagem, destaque, ordem e ativação.
5. **Banners:** título, subtítulo, imagem, link opcional, texto do botão, ordem e ativação.

Salve e recarregue `http://127.0.0.1:5180`. Não é necessário novo build para editar conteúdo. O login permanece o mesmo; clientes externos ainda não têm login.

Para iniciar o catálogo, crie uma categoria ativa, depois um produto ativo vinculado a ela. Produtos sem categoria também podem ser publicados. Uma categoria inativa oculta seus produtos. Ordem menor vem primeiro. Para retirar um registro do site, desative-o; nesta etapa não há exclusão definitiva.

O catálogo real não é preenchido com os produtos de demonstração. Se a configuração pública estiver ativa e ainda não houver produtos, o site mostra um estado vazio. Exemplos aparecem somente na prévia local sem configuração ativa. Não há importação automática nem alteração dos produtos/pedidos internos.

O editor abre com os textos do exemplo preenchidos nos campos ainda sem personalização, usando o nome cadastrado da empresa. Textos já salvos são preservados. Esses padrões são compostos na leitura, sem preencher ou sobrescrever registros no banco. Com o site desativado, o editor exibe um aviso e a prévia local continua mostrando o exemplo; ative em Configurações do Site para visualizar o conteúdo salvo.

Textos são texto simples, não HTML. Quebras de linha são preservadas. Campos vazios voltam ao texto padrão do tema. Imagem principal vazia utiliza a foto ilustrativa do tema. Categorias possuem descrição/imagem disponíveis na API; a interface atual usa os nomes como filtros. Produtos oferecem descrição completa em “Mais informações”. Banners aparecem entre a abertura e o catálogo. Listas têm limite de 500 registros por consulta nesta etapa.

## Uploads

WhatsApp de atendimento é brasileiro: o painel mostra +55 fixo e solicita apenas DDD e número. A API acrescenta 55 aos números nacionais e aceita os já cadastrados com 55 ou +55, sem duplicar o prefixo. O endereço do WhatsApp utiliza somente dígitos.

- `POST /api/site/imagens/:grupo`, autenticado ADMIN; payload binário da imagem.
- PNG/JPG/WebP, até 5 MB. Verificação de assinatura compatível com MIME, nome UUID e destino fixo permitido.
- O navegador valida que consegue decodificar o arquivo antes de enviá-lo.
- Não aceita SVG ou nomes de arquivo fornecidos pelo usuário no caminho final.
- Limite de 30 envios por administrador a cada 15 minutos, em memória.
- Arquivos locais em `backend/uploads/site/{configuracao,produtos,categorias,banners}/`.
- Banco guarda URLs como `/api/uploads/site/produtos/UUID.webp`, sem BLOB/base64 para os novos envios. Logos antigas continuam compatíveis.
- Arquivos servidos somente nas pastas e extensões previstas, com `nosniff`. Novos uploads são decodificados, orientados e convertidos para WebP (qualidade 82), preservando transparência, sem guardar o original. Produtos/categorias até 1200 px; demais grupos até 1920 px, sem ampliar imagens pequenas. Rejeita animações e imagens acima de 40 megapixels. Arquivos existentes permanecem inalterados.
- Arquivo é enviado antes de salvar o formulário. Cancelar ou substituir pode deixar arquivo sem referência. Não há limpeza automática, para evitar remoção de uma imagem ainda utilizada. “Remover da publicação” retira a referência, sem excluir o arquivo.

`UPLOAD_DIR` é opcional no desenvolvimento. No Compose, é `/app/uploads`, com o novo volume persistente `uploads_data`. O `.dockerignore` exclui uploads, dependências locais e `.env` da imagem. A configuração existente do Nginx do sistema já encaminha `/api/`; a publicação futura do site precisará desse mesmo encaminhamento.

### Cota e indicador

Em Configurações do Site, o ADMIN consulta e salva a cota de imagens em MB (1 MB = 1048576 bytes). Padrão: 1024 MB por instalação. O painel mostra bytes utilizados, quantidade de arquivos, aviso aos 80% e bloqueio aos 100%. O servidor também rejeita um envio que ultrapassaria a cota, mesmo antes de atingir 100%. Conta todos os arquivos em `uploads/site`, inclusive antigos e sem referência. Não conta banco, backups, imagens externas ou logos legadas em base64.

Configuração persistida em `UPLOAD_DIR/.site-storage.json`, incluída no backup do volume. Não requer migration. As rotas ADMIN `GET/PUT /site/armazenamento` consultam uso e atualizam a cota; não ficam disponíveis na API pública. A cota não pode ser menor que o uso atual. Em cada upload, também exige reserva de 256 MB livres no disco; isso é uma proteção adicional e não substitui o monitoramento da VPS.

Uma trava no volume serializa otimização/gravação e mudança da cota entre processos. Durante outro envio, retorna 503 para tentar novamente. Se o processo for encerrado abruptamente e deixar `.site-storage.lock`, confirme que não há upload/processo utilizando o volume antes de remover apenas essa pasta vazia. Biblioteca e limpeza de arquivos após 30 dias ficam para a etapa seguinte; não existe remoção automática nesta entrega.

## Banco

Migration aditiva: `backend/prisma/migrations/20261005200000_conteudo_catalogo_site/migration.sql`:

- `ConfiguracaoSite`: adiciona JSON `conteudo`, vazio por padrão, e `imagemHomeUrl` opcional.
- Cria `CategoriaSite`, `ProdutoSite`, `BannerSite` e índices de slug e consulta.
- Produtos se relacionam apenas com categorias do site; nenhuma regra de pedidos/produção é alterada.
- Registros novos começam inativos.

Aplicada apenas no PostgreSQL local, após backup. SQL disponível no arquivo para revisão. Não há alterações em dados reais da VPS. Rollback de código pode manter tabelas e campos novos; não remover tabelas ou restaurar banco para voltar apenas o código.

## APIs

No backend, o prefixo `/api` é removido pelo proxy:

- Admin: `GET/PUT /site/conteudo`, `GET/POST /site/{produtos,categorias,banners}`, `PUT /site/{tipo}/:id`.
- Público: `GET /public/{configuracao,produtos,categorias,banners}`, somente com site ativo, projeção explícita e filtro de publicação.
- As rotas administrativas reutilizam JWT e perfil ADMIN atuais. As rotas novas têm limites de payload próprios; não alteram os limites de rotas antigas.

## Validação

Builds do frontend interno e do site, schema Prisma, geração do client, migration local e configuração sintática do Compose verificados. Docker em execução continua não validado por ausência do daemon local.

Suíte backend/frontend e testes específicos de validação, publicação, URL, upload, preservação de dados e rollback:

```powershell
cd C:\sistema-producao\backend
npm test
$env:RUN_SITE_DB_TESTS='1'
node --test test/siteConteudo.test.js test/siteUpload.test.js test/siteConteudo.integration.test.js test/configuracaoSite.test.js test/configuracaoSite.integration.test.js
```

Também foi conferido no navegador o envio de imagem, salvamento de frase e leitura no site. Conteúdo temporário de teste foi retirado ao concluir.

## Backups e futura publicação

Backup lógico local em `backups/`, ignorado no Git. Para repetir: `node src/scripts/backup-local.js` dentro de `backend/`. Confira o retorno antes de aplicar migrations.

Além do dump do banco e da versão do código, incluir os uploads no backup. No Compose futuro, pode-se exportar sem instalar outro container:

```bash
mkdir -p backups
docker compose exec -T backend tar -C /app/uploads -czf - . > backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz
```

Esse exemplo só se aplica ao Compose com o volume `/app/uploads` desta alteração. Antes de atualizar uma VPS com arquivos prévios em outro local, conferir e copiar os arquivos para o volume persistente; montar um volume novo pode ocultar os arquivos do caminho anterior. Não usar `down -v`. Nenhum comando de publicação foi executado.

## Próximo módulo

### Consulta de pedidos no site

Menu Consultar pedido (`#consultar-pedido`): número do pedido + CPF/CNPJ completo. Usa `POST /api/acompanhamento/consultar-site` com limite de tentativas, documento fora da URL e resposta sem cache. Exibe situação, previsão, tipo de recebimento e histórico, sem documento, valores ou nome do funcionário. A rota antiga com cinco dígitos continua compatível. O proxy local encaminha somente essa rota POST, até 1 KB; a futura publicação depende do encaminhamento `/api/` ao mesmo backend. A consulta não exige login nem grava pedidos. Verificados busca não encontrada no navegador e testes de correspondência completa e compatibilidade.

O formulário abre o WhatsApp cadastrado com nome, telefone, e-mail opcional, produtos/quantidades e detalhes do projeto. O cliente confirma o envio no WhatsApp; abrir a conversa não confirma entrega. Mantém um link para reabrir e opção de copiar caso o navegador bloqueie a nova aba. Sem número disponível, mostra aviso e permite somente copiar. É necessário ativar a configuração pública e cadastrar WhatsApp com país e DDD em Configurações do Site. Nenhum número de exemplo é usado como destinatário.

Recebimento de solicitações no banco e fila comercial no painel ficam para a próxima etapa; não grava orçamentos ou gera pedidos. Promoções com validade e Área do Cliente também ficam para etapas seguintes.
