-- CreateTable
CREATE TABLE "public"."ConfiguracaoEmpresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cnpj" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoEmpresa_pkey" PRIMARY KEY ("id")
);
