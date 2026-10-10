CREATE TABLE "AnexoOrcamentoSite" (
 "id" TEXT NOT NULL PRIMARY KEY, "orcamentoId" TEXT NOT NULL,
 "nome" TEXT NOT NULL, "mime" TEXT NOT NULL, "bytes" INTEGER NOT NULL,
 "hash" TEXT NOT NULL, "arquivo" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "expiraEm" TIMESTAMP(3) NOT NULL, "removidoEm" TIMESTAMP(3),
 CONSTRAINT "AnexoOrcamentoSite_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "OrcamentoSite"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AnexoOrcamentoSite_orcamentoId_hash_key" ON "AnexoOrcamentoSite"("orcamentoId", "hash");
CREATE INDEX "AnexoOrcamentoSite_removidoEm_expiraEm_idx" ON "AnexoOrcamentoSite"("removidoEm", "expiraEm");
