# Implantação segura na VPS

## Acompanhamento público de pedidos

A página `/acompanhar` permite consultar com o número exibido do pedido (interno ou manual externo) e os cinco primeiros dígitos do CPF/CNPJ cadastrado. O detalhe interno oferece “Copiar link de acompanhamento”; o link identifica o pedido e também exige o documento. Cadastros sem documento completo não liberam a consulta.

Esta funcionalidade não altera o schema, não requer migration e executa apenas `findMany`/`findUnique`. O POST `/api/acompanhamento/consultar` transporta o prefixo no corpo, fora da URL; não cria nem atualiza registros. Não registrar corpos dessa rota no proxy ou em ferramentas de monitoramento.

O retorno contém número, situação, previsão, modalidade de recebimento e o histórico completo: todos os tipos de evento, descrições originais, datas e nome do usuário responsável, incluindo planos, serviços, exclusões, frete e expedição. Não há filtro ou resumo das descrições; informações registradas nelas ficam visíveis ao cliente após a conferência do documento. Da relação de usuário, apenas o nome do funcionário é consultado, sem credenciais. Credenciais de e-mail e envio de mensagens não fazem parte desta etapa.

Após backup, publique as imagens de frontend/backend pelo procedimento abaixo, preservando o PostgreSQL e seu volume. Configure `CORS_ORIGINS=https://biomadeira.cooperagestacao.com.br` no ambiente existente. Confira o acesso HTTPS a `/acompanhar`, a consulta válida, documento incorreto e o link copiado em janela anônima.

O limite é de 15 consultas por 15 minutos por IP e identificador consultado, armazenado em memória e reiniciado junto com o backend. Para múltiplas instâncias, aplicar também limite compartilhado no proxy. O proxy deve encaminhar o IP real de forma confiável e impedir acesso externo direto ao backend; validar isso na VPS para evitar que clientes compartilhem o mesmo limite. Não foi alterada a topologia de rede nesta implementação.

Estas alterações não possuem migration e não modificam registros existentes.

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
docker compose up -d
docker compose ps
docker compose logs --tail=100 backend frontend
```

Não use `docker compose down -v`, `prisma migrate reset` ou `prisma db push` na VPS.

## Retorno ao estado anterior

```bash
git checkout backup-pre-melhorias-2026-08-28
docker compose build frontend backend
docker compose up -d
```

Esse retorno troca somente o código e as imagens; o volume do banco permanece intacto.
