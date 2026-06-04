-- CreateEnum
CREATE TYPE "public"."FuncaoFuncionario" AS ENUM ('ADMIN', 'VENDEDOR', 'OPERADOR', 'VENDEDOR_OPERADOR');

-- CreateEnum
CREATE TYPE "public"."TipoEntrega" AS ENUM ('CLIENTE_RETIRA', 'ENTREGA_EMPRESA');

-- CreateEnum
CREATE TYPE "public"."ResponsavelFrete" AS ENUM ('CLIENTE', 'EMPRESA');

-- CreateEnum
CREATE TYPE "public"."StatusPedido" AS ENUM ('ABERTO', 'EM_SEPARACAO', 'EM_PRODUCAO', 'CONCLUIDO', 'PRONTO_ENTREGA', 'SAIU_ENTREGA', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."StatusServico" AS ENUM ('ABERTO', 'INICIADO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."TipoHistorico" AS ENUM ('PEDIDO_CRIADO', 'PEDIDO_ATUALIZADO', 'PLANO_CRIADO', 'PLANO_ATUALIZADO', 'PLANO_EXCLUIDO', 'SERVICO_CRIADO', 'SERVICO_ATUALIZADO', 'SERVICO_EXCLUIDO', 'SERVICO_ASSUMIDO', 'STATUS_SERVICO_ALTERADO', 'STATUS_PEDIDO_ALTERADO', 'EXPEDICAO_ATUALIZADA');

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

-- CreateTable
CREATE TABLE "public"."Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Funcionario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "funcao" "public"."FuncaoFuncionario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RotaEntrega" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorFrete" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RotaEntrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Pedido" (
    "id" TEXT NOT NULL,
    "numeroPedido" SERIAL NOT NULL,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataEntrega" TIMESTAMP(3),
    "tipoEntrega" "public"."TipoEntrega" NOT NULL,
    "responsavelFrete" "public"."ResponsavelFrete" NOT NULL,
    "rotaId" TEXT,
    "valorFrete" DECIMAL(10,2),
    "nomeRecebedor" TEXT,
    "contatoRecebedor" TEXT,
    "enderecoEntrega" TEXT,
    "status" "public"."StatusPedido" NOT NULL DEFAULT 'ABERTO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "valorTotal" DECIMAL(10,2),
    "numeroPedidoManual" TEXT,
    "origemPedido" TEXT NOT NULL DEFAULT 'INTERNO',

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlanoCorte" (
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
CREATE TABLE "public"."TipoServico" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "TipoServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServicoPlano" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "tipoServicoId" TEXT NOT NULL,
    "operadorId" TEXT,
    "status" "public"."StatusServico" NOT NULL DEFAULT 'ABERTO',
    "observacoes" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicoPlano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HistoricoPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" "public"."TipoHistorico" NOT NULL,
    "descricao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoPedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cliente_nome_idx" ON "public"."Cliente"("nome");

-- CreateIndex
CREATE INDEX "Cliente_documento_idx" ON "public"."Cliente"("documento");

-- CreateIndex
CREATE INDEX "Funcionario_nome_idx" ON "public"."Funcionario"("nome");

-- CreateIndex
CREATE INDEX "Funcionario_funcao_idx" ON "public"."Funcionario"("funcao");

-- CreateIndex
CREATE INDEX "Funcionario_ativo_idx" ON "public"."Funcionario"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "public"."Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_funcionarioId_key" ON "public"."Usuario"("funcionarioId");

-- CreateIndex
CREATE INDEX "RotaEntrega_nome_idx" ON "public"."RotaEntrega"("nome");

-- CreateIndex
CREATE INDEX "Pedido_numeroPedido_idx" ON "public"."Pedido"("numeroPedido");

-- CreateIndex
CREATE INDEX "Pedido_numeroPedidoManual_idx" ON "public"."Pedido"("numeroPedidoManual");

-- CreateIndex
CREATE INDEX "Pedido_origemPedido_idx" ON "public"."Pedido"("origemPedido");

-- CreateIndex
CREATE INDEX "Pedido_clienteId_idx" ON "public"."Pedido"("clienteId");

-- CreateIndex
CREATE INDEX "Pedido_vendedorId_idx" ON "public"."Pedido"("vendedorId");

-- CreateIndex
CREATE INDEX "Pedido_rotaId_idx" ON "public"."Pedido"("rotaId");

-- CreateIndex
CREATE INDEX "Pedido_status_idx" ON "public"."Pedido"("status");

-- CreateIndex
CREATE INDEX "Pedido_dataEntrega_idx" ON "public"."Pedido"("dataEntrega");

-- CreateIndex
CREATE INDEX "Pedido_createdAt_idx" ON "public"."Pedido"("createdAt");

-- CreateIndex
CREATE INDEX "Pedido_updatedAt_idx" ON "public"."Pedido"("updatedAt");

-- CreateIndex
CREATE INDEX "PlanoCorte_pedidoId_idx" ON "public"."PlanoCorte"("pedidoId");

-- CreateIndex
CREATE INDEX "PlanoCorte_numeroPlano_idx" ON "public"."PlanoCorte"("numeroPlano");

-- CreateIndex
CREATE INDEX "PlanoCorte_createdAt_idx" ON "public"."PlanoCorte"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TipoServico_nome_key" ON "public"."TipoServico"("nome");

-- CreateIndex
CREATE INDEX "ServicoPlano_planoId_idx" ON "public"."ServicoPlano"("planoId");

-- CreateIndex
CREATE INDEX "ServicoPlano_tipoServicoId_idx" ON "public"."ServicoPlano"("tipoServicoId");

-- CreateIndex
CREATE INDEX "ServicoPlano_operadorId_idx" ON "public"."ServicoPlano"("operadorId");

-- CreateIndex
CREATE INDEX "ServicoPlano_status_idx" ON "public"."ServicoPlano"("status");

-- CreateIndex
CREATE INDEX "ServicoPlano_dataInicio_idx" ON "public"."ServicoPlano"("dataInicio");

-- CreateIndex
CREATE INDEX "ServicoPlano_dataFim_idx" ON "public"."ServicoPlano"("dataFim");

-- CreateIndex
CREATE INDEX "ServicoPlano_createdAt_idx" ON "public"."ServicoPlano"("createdAt");

-- CreateIndex
CREATE INDEX "ServicoPlano_updatedAt_idx" ON "public"."ServicoPlano"("updatedAt");

-- CreateIndex
CREATE INDEX "HistoricoPedido_pedidoId_idx" ON "public"."HistoricoPedido"("pedidoId");

-- CreateIndex
CREATE INDEX "HistoricoPedido_usuarioId_idx" ON "public"."HistoricoPedido"("usuarioId");

-- CreateIndex
CREATE INDEX "HistoricoPedido_tipo_idx" ON "public"."HistoricoPedido"("tipo");

-- CreateIndex
CREATE INDEX "HistoricoPedido_createdAt_idx" ON "public"."HistoricoPedido"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "public"."Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "public"."RotaEntrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "public"."Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlanoCorte" ADD CONSTRAINT "PlanoCorte_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServicoPlano" ADD CONSTRAINT "ServicoPlano_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "public"."Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServicoPlano" ADD CONSTRAINT "ServicoPlano_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "public"."PlanoCorte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServicoPlano" ADD CONSTRAINT "ServicoPlano_tipoServicoId_fkey" FOREIGN KEY ("tipoServicoId") REFERENCES "public"."TipoServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoricoPedido" ADD CONSTRAINT "HistoricoPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoricoPedido" ADD CONSTRAINT "HistoricoPedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
