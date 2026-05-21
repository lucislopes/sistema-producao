-- AlterTable
ALTER TABLE "public"."Cliente" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "public"."Pedido" ADD COLUMN     "valorTotal" DECIMAL(10,2);
