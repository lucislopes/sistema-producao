ALTER TABLE "Usuario" ADD COLUMN "permissoesSite" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "somenteSite" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "PublicacaoSite" (
 "id" TEXT PRIMARY KEY, "tipo" TEXT NOT NULL DEFAULT 'PROMOCAO', "titulo" TEXT NOT NULL, "descricao" TEXT NOT NULL,
 "imagemUrl" TEXT, "preco" DECIMAL(10,2), "precoAnterior" DECIMAL(10,2), "inicio" TIMESTAMP(3), "fim" TIMESTAMP(3),
 "status" TEXT NOT NULL DEFAULT 'RASCUNHO', "destaque" BOOLEAN NOT NULL DEFAULT false, "ordem" INTEGER NOT NULL DEFAULT 0,
 "arte" JSONB NOT NULL DEFAULT '{}', "instagramId" TEXT, "instagramContainer" TEXT, "instagramEstado" TEXT NOT NULL DEFAULT 'MANUAL',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "PublicacaoSite_status_inicio_fim_idx" ON "PublicacaoSite"("status", "inicio", "fim");
CREATE TABLE "PaginaSite" (
 "id" TEXT PRIMARY KEY, "slug" TEXT NOT NULL UNIQUE, "titulo" TEXT NOT NULL, "descricao" TEXT NOT NULL,
 "imagemUrl" TEXT, "link" TEXT, "tipo" TEXT NOT NULL DEFAULT 'SERVICO', "ativo" BOOLEAN NOT NULL DEFAULT false,
 "ordem" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "PaginaSite_tipo_ativo_ordem_idx" ON "PaginaSite"("tipo", "ativo", "ordem");
