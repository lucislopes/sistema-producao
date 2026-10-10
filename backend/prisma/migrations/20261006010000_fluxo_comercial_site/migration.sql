CREATE TABLE "OrcamentoSite" (
 "id" TEXT PRIMARY KEY, "protocolo" SERIAL UNIQUE NOT NULL, "chave" TEXT UNIQUE NOT NULL,
 "nome" TEXT NOT NULL, "telefone" TEXT NOT NULL, "email" TEXT, "documento" TEXT,
 "detalhes" JSONB NOT NULL, "status" TEXT NOT NULL DEFAULT 'NOVO', "responsavelId" TEXT,
 "notaInterna" TEXT, "proposta" TEXT, "valor" DECIMAL(10,2), "primeiroAtendimento" TIMESTAMP(3),
 "pedidoId" TEXT UNIQUE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "OrcamentoSite_status_createdAt_idx" ON "OrcamentoSite"("status","createdAt");
CREATE TABLE "AcessoClienteSite" (
 "id" TEXT PRIMARY KEY, "clienteId" TEXT UNIQUE NOT NULL REFERENCES "Cliente"("id") ON DELETE CASCADE,
 "senhaHash" TEXT, "conviteHash" TEXT UNIQUE, "conviteExpira" TIMESTAMP(3), "ativo" BOOLEAN NOT NULL DEFAULT true,
 "versao" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "AvisoPedidoSite" ("pedidoId" TEXT PRIMARY KEY, "avisadoEm" TIMESTAMP(3) NOT NULL, "usuarioId" TEXT NOT NULL);
