/*
  Warnings:

  - You are about to drop the column `valorFrete` on the `Pedido` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Pedido" DROP COLUMN "valorFrete",
ADD COLUMN     "freteAlterado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "motivoAlteracaoFrete" TEXT,
ADD COLUMN     "valorFreteCobrado" DECIMAL(10,2),
ADD COLUMN     "valorFretePadrao" DECIMAL(10,2);
