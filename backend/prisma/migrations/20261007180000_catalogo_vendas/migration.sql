ALTER TABLE "ProdutoSite" ADD COLUMN "tipoVenda" TEXT NOT NULL DEFAULT 'MATERIAL', ADD COLUMN "preco" DECIMAL(12,2), ADD COLUMN "precoAnterior" DECIMAL(12,2), ADD COLUMN "marca" TEXT, ADD COLUMN "condicao" TEXT;
ALTER TABLE "ProdutoSite" ADD CONSTRAINT "ProdutoSite_tipoVenda_check" CHECK ("tipoVenda" IN ('MATERIAL','MAQUINA','FERRAMENTA'));
ALTER TABLE "ProdutoSite" ADD CONSTRAINT "ProdutoSite_preco_check" CHECK (("preco" IS NULL OR "preco" >= 0) AND ("precoAnterior" IS NULL OR "precoAnterior" >= 0));
