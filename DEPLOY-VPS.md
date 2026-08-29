# Implantação segura na VPS

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
