-- Aditiva: não altera tabelas nem dados existentes.
CREATE TABLE "ConfiguracaoSite" (
    "id" TEXT NOT NULL DEFAULT 'principal',
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "corPrimaria" TEXT NOT NULL DEFAULT '#084f2b',
    "corDestaque" TEXT NOT NULL DEFAULT '#ffbd16',
    "whatsapp" TEXT,
    "instagramUrl" TEXT,
    "siteUrl" TEXT,
    "sistemaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConfiguracaoSite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ConfiguracaoSite_singleton" CHECK ("id" = 'principal')
);
