/*
  Warnings:

  - You are about to drop the column `logoPath` on the `ConfiguracaoEmpresa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ConfiguracaoEmpresa" DROP COLUMN "logoPath",
ADD COLUMN     "logoUrl" TEXT;
