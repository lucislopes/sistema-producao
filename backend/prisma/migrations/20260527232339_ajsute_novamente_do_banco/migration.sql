/*
  Warnings:

  - The values [PARCIAL,PENDENTE_PECA,AGUARDANDO_EXTERNO] on the enum `StatusPedido` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."StatusPedido_new" AS ENUM ('ABERTO', 'EM_SEPARACAO', 'EM_PRODUCAO', 'CONCLUIDO', 'PRONTO_ENTREGA', 'SAIU_ENTREGA', 'ENTREGUE', 'CANCELADO');
ALTER TABLE "public"."Pedido" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Pedido" ALTER COLUMN "status" TYPE "public"."StatusPedido_new" USING ("status"::text::"public"."StatusPedido_new");
ALTER TYPE "public"."StatusPedido" RENAME TO "StatusPedido_old";
ALTER TYPE "public"."StatusPedido_new" RENAME TO "StatusPedido";
DROP TYPE "public"."StatusPedido_old";
ALTER TABLE "public"."Pedido" ALTER COLUMN "status" SET DEFAULT 'ABERTO';
COMMIT;
