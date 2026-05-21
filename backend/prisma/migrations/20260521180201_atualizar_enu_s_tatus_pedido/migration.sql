-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."StatusPedido" ADD VALUE 'PENDENTE_PECA';
ALTER TYPE "public"."StatusPedido" ADD VALUE 'AGUARDANDO_EXTERNO';
ALTER TYPE "public"."StatusPedido" ADD VALUE 'PRONTO_ENTREGA';
ALTER TYPE "public"."StatusPedido" ADD VALUE 'SAIU_ENTREGA';
