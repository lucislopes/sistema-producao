-- CreateEnum
CREATE TYPE "public"."TipoHistorico" AS ENUM ('PEDIDO_CRIADO', 'PEDIDO_ATUALIZADO', 'PLANO_CRIADO', 'PLANO_ATUALIZADO', 'PLANO_EXCLUIDO', 'SERVICO_CRIADO', 'SERVICO_ATUALIZADO', 'SERVICO_EXCLUIDO', 'SERVICO_ASSUMIDO', 'STATUS_SERVICO_ALTERADO', 'STATUS_PEDIDO_ALTERADO', 'EXPEDICAO_ATUALIZADA');

-- CreateTable
CREATE TABLE "public"."HistoricoPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" "public"."TipoHistorico" NOT NULL,
    "descricao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoPedido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."HistoricoPedido" ADD CONSTRAINT "HistoricoPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoricoPedido" ADD CONSTRAINT "HistoricoPedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
