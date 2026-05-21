-- CreateEnum
CREATE TYPE "FuncaoFuncionario" AS ENUM ('ADMIN', 'VENDEDOR', 'OPERADOR');

-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('CLIENTE_RETIRA', 'ENTREGA_EMPRESA');

-- CreateEnum
CREATE TYPE "ResponsavelFrete" AS ENUM ('CLIENTE', 'EMPRESA');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('ABERTO', 'EM_PRODUCAO', 'PARCIAL', 'CONCLUIDO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusServico" AS ENUM ('ABERTO', 'INICIADO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "funcao" "FuncaoFuncionario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RotaEntrega" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorFrete" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RotaEntrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "numeroPedido" SERIAL NOT NULL,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataEntrega" TIMESTAMP(3),
    "tipoEntrega" "TipoEntrega" NOT NULL,
    "responsavelFrete" "ResponsavelFrete" NOT NULL,
    "rotaId" TEXT,
    "valorFrete" DECIMAL(10,2),
    "nomeRecebedor" TEXT,
    "contatoRecebedor" TEXT,
    "enderecoEntrega" TEXT,
    "status" "StatusPedido" NOT NULL DEFAULT 'ABERTO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoCorte" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "numeroPlano" TEXT NOT NULL,
    "quantidadeChapas" INTEGER NOT NULL DEFAULT 0,
    "medidaEncabecamento" TEXT,
    "compraExterna" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoCorte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoServico" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "TipoServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicoPlano" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "tipoServicoId" TEXT NOT NULL,
    "operadorId" TEXT,
    "status" "StatusServico" NOT NULL DEFAULT 'ABERTO',
    "observacoes" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicoPlano_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_funcionarioId_key" ON "Usuario"("funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoServico_nome_key" ON "TipoServico"("nome");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "RotaEntrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoCorte" ADD CONSTRAINT "PlanoCorte_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoPlano" ADD CONSTRAINT "ServicoPlano_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoCorte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoPlano" ADD CONSTRAINT "ServicoPlano_tipoServicoId_fkey" FOREIGN KEY ("tipoServicoId") REFERENCES "TipoServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoPlano" ADD CONSTRAINT "ServicoPlano_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
