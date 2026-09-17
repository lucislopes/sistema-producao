import test from "node:test"
import assert from "node:assert/strict"
import "dotenv/config"
import { prisma } from "../src/lib/prisma.js"
import { consultarCapacidadeDiaria } from "../src/utils/capacidadeDiaria.js"
import { bloquearAgenda, validarLimitesPedido, validarLimitesPlano, salvarPedidoComLimites } from "../src/utils/limitesDiarios.js"

const habilitado = process.env.RUN_DB_TESTS === "1"

test("PostgreSQL: limites reais e alterações atômicas, com rollback dos dados de teste", { skip: !habilitado }, async () => {
  const rollback = new Error("ROLLBACK_TESTE")
  try {
    await assert.rejects(prisma.$transaction(async tx => {
      await bloquearAgenda(tx)
      const config = await tx.configuracaoEmpresa.findFirst()
      const limites = { limiteFretesEmpresaDia: 4, limiteFretesClienteDia: 4, limiteChapasDia: 90 }
      if (config) await tx.configuracaoEmpresa.updateMany({ data: limites })
      else await tx.configuracaoEmpresa.create({ data: { nome: "Teste rollback", ...limites } })
      const cliente = await tx.cliente.create({ data: { nome: "Teste rollback" } })
      const vendedor = await tx.funcionario.create({ data: { nome: "Teste rollback", funcao: "VENDEDOR" } })
      const data = { clienteId: cliente.id, vendedorId: vendedor.id, tipoPedido: "COM_PRODUCAO", dataEntrega: new Date("2099-11-24T03:00:00Z"), tipoEntrega: "ENTREGA_EMPRESA", responsavelFrete: "EMPRESA", status: "ABERTO" }
      // Encaminha as gravações para a transação que será revertida ao final.
      const db = { $transaction: callback => callback(tx) }
      const pedidos = []
      for (let i = 0; i < 4; i++) pedidos.push(await salvarPedidoComLimites(db, "create", { data }))
      await assert.rejects(salvarPedidoComLimites(db, "create", { data }), /4 registrados, limite 4/)
      assert.equal(await tx.pedido.count({ where: { clienteId: cliente.id } }), 4)
      const clienteFrete = await salvarPedidoComLimites(db, "create", { data: { ...data, responsavelFrete: "CLIENTE" } })
      await salvarPedidoComLimites(db, "update", { where: { id: pedidos[0].id }, data: { observacoes: "Edição sem nova vaga" } })
      await tx.planoCorte.create({ data: { pedidoId: pedidos[0].id, numeroPlano: "teste", quantidadeChapas: 80 } })
      await validarLimitesPlano(tx, clienteFrete.id, 10)
      await assert.rejects(validarLimitesPlano(tx, clienteFrete.id, 11), /Limite de chapas/)
      await tx.planoCorte.create({ data: { pedidoId: clienteFrete.id, numeroPlano: "teste", quantidadeChapas: 10 } })
      const capacidade = await consultarCapacidadeDiaria(tx, "2099-11-24")
      assert.equal(capacidade.freteEmpresa.disponivel, 0)
      assert.equal(capacidade.freteCliente.disponivel, 3)
      assert.equal(capacidade.chapas.utilizado, 90)
      assert.equal(capacidade.chapas.disponivel, 0)
      await assert.rejects(validarLimitesPedido(tx, { ...data, tipoEntrega: "CLIENTE_RETIRA" }), /Limite de chapas/)
      throw rollback
    }, { isolationLevel: "ReadCommitted", timeout: 15000 }), error => error === rollback)
  } finally {
    await prisma.$disconnect()
  }
})

test("PostgreSQL: lock serializa duas transações concorrentes", { skip: !habilitado }, async () => {
  const eventos = []
  let liberarPrimeira
  let confirmarLock
  const primeiraLiberada = new Promise(resolve => { liberarPrimeira = resolve })
  const primeiroLock = new Promise(resolve => { confirmarLock = resolve })
  try {
    const primeira = prisma.$transaction(async tx => {
      await bloquearAgenda(tx)
      eventos.push("primeira")
      confirmarLock()
      await primeiraLiberada
      eventos.push("liberada")
    })
    await primeiroLock
    const segunda = prisma.$transaction(async tx => {
      await bloquearAgenda(tx)
      eventos.push("segunda")
    })
    await new Promise(resolve => setTimeout(resolve, 100))
    assert.deepEqual(eventos, ["primeira"])
    liberarPrimeira()
    await Promise.all([primeira, segunda])
    assert.deepEqual(eventos, ["primeira", "liberada", "segunda"])
  } finally {
    liberarPrimeira?.()
    await prisma.$disconnect()
  }
})
