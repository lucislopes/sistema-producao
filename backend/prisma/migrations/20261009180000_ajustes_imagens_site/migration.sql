ALTER TABLE "ConfiguracaoSite" ADD COLUMN "ajustesImagens" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "CategoriaSite" ADD COLUMN "ajusteImagem" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ProdutoSite" ADD COLUMN "ajusteImagem" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "BannerSite" ADD COLUMN "ajusteImagem" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "PaginaSite" ADD COLUMN "ajusteImagem" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "PublicacaoSite" ADD COLUMN "ajusteImagem" JSONB NOT NULL DEFAULT '{}';
