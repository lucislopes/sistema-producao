/*
  Warnings:

  - The values [PAUSADO] on the enum `StatusServico` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."StatusServico_new" AS ENUM ('ABERTO', 'INICIADO', 'EM_SEPARACAO', 'CONCLUIDO', 'FINALIZADO', 'CANCELADO');
ALTER TABLE "public"."ServicoPlano" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."ServicoPlano" ALTER COLUMN "status" TYPE "public"."StatusServico_new" USING ("status"::text::"public"."StatusServico_new");
ALTER TYPE "public"."StatusServico" RENAME TO "StatusServico_old";
ALTER TYPE "public"."StatusServico_new" RENAME TO "StatusServico";
DROP TYPE "public"."StatusServico_old";
ALTER TABLE "public"."ServicoPlano" ALTER COLUMN "status" SET DEFAULT 'ABERTO';
COMMIT;
