/*
  Warnings:

  - A unique constraint covering the columns `[origemPedido,numeroPedidoManual]` on the table `Pedido` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pedido_origemPedido_numeroPedidoManual_key" ON "public"."Pedido"("origemPedido", "numeroPedidoManual");
