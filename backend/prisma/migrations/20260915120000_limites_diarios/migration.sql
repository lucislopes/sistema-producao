ALTER TABLE "ConfiguracaoEmpresa"
 ADD COLUMN "limiteFretesEmpresaDia" INTEGER,
 ADD COLUMN "limiteFretesClienteDia" INTEGER,
 ADD COLUMN "limiteChapasDia" INTEGER;
ALTER TABLE "ConfiguracaoEmpresa" ADD CONSTRAINT "limites_nao_negativos" CHECK ("limiteFretesEmpresaDia" >= 0 AND "limiteFretesClienteDia" >= 0 AND "limiteChapasDia" >= 0);
