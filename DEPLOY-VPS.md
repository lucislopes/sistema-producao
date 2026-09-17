# Implantação segura na VPS

## Limites diários de fretes e chapas

Esta atualização requer a migration `20260915120000_limites_diarios`. Após o backup e o build das imagens, aplique antes de iniciar o novo backend:

```bash
docker compose run --rm backend npx prisma migrate deploy
docker compose up -d
```

Em **Configurações → Limites diários**, somente ADMIN pode salvar os limites de fretes da loja, fretes do cliente e chapas. Os valores iniciais são vazios (sem bloqueio); zero bloqueia novos agendamentos. A contagem usa a data prevista de entrega, inclui entregues e exclui cancelados. Chapas consideram apenas planos de pedidos com produção, como o relatório de programação. Datas são obrigatórias quando existe limite aplicável. Os limites também valem para administradores.

Pedidos e planos são validados dentro de transações com lock compartilhado no PostgreSQL. Alterações sem aumento de ocupação e reduções continuam permitidas quando um limite é reduzido abaixo da ocupação existente. A Programação de Chapas mostra o limite salvo; sua edição fica em Configurações. Pedidos Entregues permite filtrar por frete da loja, do cliente ou retirada, e exibe a modalidade na tabela e no CSV.

Testes: `npm test` no backend; para testar também o banco local, `RUN_DB_TESTS=1 node --test test/limitesDiarios.integration.test.js`. Os testes de banco revertem os dados criados.

Pedidos, Planos de Corte e Plano + Serviços exibem um informativo de capacidade pela data prevista de entrega, com limite, total salvo e saldo disponível. A consulta autenticada `GET /pedidos/capacidade-diaria?data=AAAA-MM-DD` retorna apenas totais e limites, sem dados de clientes. O painel atualiza ao trocar a data, recarregar os registros ou usar “Atualizar disponibilidade”; alterações ainda não salvas não entram na contagem. O bloqueio permanece no salvamento.

## Acompanhamento público de pedidos

A página `/acompanhar` permite consultar com o número exibido do pedido (interno ou manual externo) e os cinco primeiros dígitos do CPF/CNPJ cadastrado. O detalhe interno oferece “Copiar link de acompanhamento”; o link identifica o pedido e também exige o documento. Cadastros sem documento completo não liberam a consulta.

Esta funcionalidade não altera o schema, não requer migration e executa apenas `findMany`/`findUnique`. O POST `/api/acompanhamento/consultar` transporta o prefixo no corpo, fora da URL; não cria nem atualiza registros. Não registrar corpos dessa rota no proxy ou em ferramentas de monitoramento.

O retorno contém número, situação, previsão, modalidade de recebimento e o histórico completo: todos os tipos de evento, descrições originais, datas e nome do usuário responsável, incluindo planos, serviços, exclusões, frete e expedição. Não há filtro ou resumo das descrições; informações registradas nelas ficam visíveis ao cliente após a conferência do documento. Da relação de usuário, apenas o nome do funcionário é consultado, sem credenciais. Credenciais de e-mail e envio de mensagens não fazem parte desta etapa.

Após backup, publique as imagens de frontend/backend pelo procedimento abaixo, preservando o PostgreSQL e seu volume. Configure `CORS_ORIGINS=https://biomadeira.cooperagestacao.com.br` no ambiente existente. Confira o acesso HTTPS a `/acompanhar`, a consulta válida, documento incorreto e o link copiado em janela anônima.

O limite é de 15 consultas por 15 minutos por IP e identificador consultado, armazenado em memória e reiniciado junto com o backend. Para múltiplas instâncias, aplicar também limite compartilhado no proxy. O proxy deve encaminhar o IP real de forma confiável e impedir acesso externo direto ao backend; validar isso na VPS para evitar que clientes compartilhem o mesmo limite. Não foi alterada a topologia de rede nesta implementação.

O acompanhamento público não possui migration. Os limites diários descritos no início deste documento exigem a migration indicada.

## Backup antes de atualizar

O ponto de restauração do código é o tag `backup-pre-melhorias-2026-08-28`, no commit `651468f`.

Faça também um backup lógico do PostgreSQL antes de qualquer atualização operacional:

```bash
mkdir -p backups
docker compose exec -T postgres pg_dump -U postgres -d sistema_producao -Fc > backups/sistema_producao_$(date +%Y%m%d_%H%M%S).dump
```

Confirme que o arquivo foi criado e tem tamanho maior que zero antes de prosseguir.

## Variáveis do servidor

Mantenha um arquivo `.env` na VPS, fora do Git:

```env
JWT_SECRET=mantenha_a_mesma_chave_que_ja_esta_em_uso
CORS_ORIGINS=https://seu-dominio.com
```

Não troque `JWT_SECRET` durante uma atualização normal. Trocá-la encerra as sessões atuais, embora não altere usuários ou senhas.

## Atualização

```bash
git pull --ff-only
docker compose build frontend backend
docker compose run --rm backend npx prisma migrate status
docker compose run --rm backend npx prisma migrate deploy
docker compose up -d
docker compose ps
docker compose logs --tail=100 backend frontend
```

Execute as etapas separadamente e confira o resultado. O comando `migrate status` pode retornar código de saída diferente de zero quando há migrations pendentes. Para esta atualização, confira se a pendência é `20260915120000_limites_diarios`. Se houver falhas anteriores ou outras migrations inesperadas, investigue antes de aplicar. Se o build ou `migrate deploy` falhar, não prossiga para `up -d`.

O build do backend já executa `prisma generate`. A migration nova adiciona três colunas opcionais em `ConfiguracaoEmpresa` e uma restrição contra valores negativos, sem excluir registros. Os limites começam desativados e são configurados pelo administrador após a atualização.

Não use `docker compose down -v`, `prisma migrate reset` ou `prisma db push` na VPS.

## Retorno ao estado anterior

```bash
git checkout backup-pre-melhorias-2026-08-28
docker compose build frontend backend
docker compose up -d
```

Esse retorno troca somente o código e as imagens; o volume do banco permanece intacto.
