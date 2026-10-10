-- Somente adições. Não altera dados comerciais ou o fluxo de pedidos.
ALTER TABLE "ConfiguracaoSite" ADD COLUMN "conteudo" JSONB NOT NULL DEFAULT '{}', ADD COLUMN "imagemHomeUrl" TEXT;
CREATE TABLE "CategoriaSite" (
  "id" TEXT NOT NULL, "nome" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "descricao" TEXT, "imagemUrl" TEXT, "ativo" BOOLEAN NOT NULL DEFAULT false,
  "ordem" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CategoriaSite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CategoriaSite_slug_key" ON "CategoriaSite"("slug");
CREATE TABLE "ProdutoSite" (
  "id" TEXT NOT NULL, "nome" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "descricaoCurta" TEXT, "descricao" TEXT, "imagemPrincipalUrl" TEXT, "especificacao" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT false, "destaque" BOOLEAN NOT NULL DEFAULT false,
  "ordem" INTEGER NOT NULL DEFAULT 0, "categoriaId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProdutoSite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProdutoSite_slug_key" ON "ProdutoSite"("slug");
CREATE INDEX "ProdutoSite_categoriaId_idx" ON "ProdutoSite"("categoriaId");
CREATE INDEX "ProdutoSite_ativo_ordem_idx" ON "ProdutoSite"("ativo", "ordem");
ALTER TABLE "ProdutoSite" ADD CONSTRAINT "ProdutoSite_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "BannerSite" (
  "id" TEXT NOT NULL, "titulo" TEXT NOT NULL, "subtitulo" TEXT, "imagemUrl" TEXT,
  "link" TEXT, "textoBotao" TEXT, "ativo" BOOLEAN NOT NULL DEFAULT false,
  "ordem" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "BannerSite_pkey" PRIMARY KEY ("id")
);
