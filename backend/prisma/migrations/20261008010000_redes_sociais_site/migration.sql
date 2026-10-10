ALTER TABLE "ConfiguracaoSite" ADD COLUMN "redesSociais" JSONB NOT NULL DEFAULT '{}';
UPDATE "ConfiguracaoSite" SET "redesSociais" = jsonb_build_object('instagram', "instagramUrl") WHERE "instagramUrl" IS NOT NULL AND "instagramUrl" <> '';
