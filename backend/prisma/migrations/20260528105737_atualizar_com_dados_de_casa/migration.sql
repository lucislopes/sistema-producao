/*
  Warnings:

  - You are about to drop the column `numeroPedidoCliente` on the `Pedido` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Pedido" DROP COLUMN "numeroPedidoCliente",
ADD COLUMN     "numeroPedidoManual" TEXT,
ADD COLUMN     "origemPedido" TEXT NOT NULL DEFAULT 'INTERNO';
