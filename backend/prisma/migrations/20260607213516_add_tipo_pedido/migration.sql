-- CreateEnum
CREATE TYPE "public"."TipoPedido" AS ENUM ('COM_PRODUCAO', 'DIRETO_ENTREGA');

-- AlterTable
ALTER TABLE "public"."Pedido" ADD COLUMN     "tipoPedido" "public"."TipoPedido" NOT NULL DEFAULT 'COM_PRODUCAO';
