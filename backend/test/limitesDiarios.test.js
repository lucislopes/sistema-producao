import test from "node:test"
import assert from "node:assert/strict"
import { normalizarLimites, validarLimitesPedido, validarLimitesPlano, salvarPedidoComLimites } from "../src/utils/limitesDiarios.js"

const pedido = { id: "p1", dataEntrega: new Date("2026-09-18T03:00:00Z"), status: "ABERTO", tipoPedido: "COM_PRODUCAO", tipoEntrega: "ENTREGA_EMPRESA", responsavelFrete: "EMPRESA" }

function banco(config = {}, { fretes = 0, chapas = 0, proprias = 0 } = {}) {
  const consultas = []
  return {
    consultas,
    configuracaoEmpresa: { findFirst: async () => config },
    pedido: {
      count: async args => { consultas.push(args); return fretes },
      findUnique: async () => pedido
    },
    planoCorte: { aggregate: async args => {
      consultas.push(args)
      return { _sum: { quantidadeChapas: args.where.pedido ? chapas : proprias } }
    } }
  }
}

test("limites opcionais, zero permitido, rejeita negativos, frações e tipos inválidos", () => {
  assert.deepEqual(normalizarLimites({ limiteChapasDia: "90", limiteFretesEmpresaDia: "", limiteFretesClienteDia: 0 }), { limiteChapasDia: 90, limiteFretesEmpresaDia: null, limiteFretesClienteDia: 0 })
  assert.deepEqual(normalizarLimites({ nome: "Empresa" }), {})
  for (const valor of [-1, 1.5, "abc", true, [], Infinity, " ", 2147483648]) {
    assert.throws(() => normalizarLimites({ limiteChapasDia: valor }))
  }
})

test("quarto frete permitido, quinto bloqueado; consulta separa responsável e exclui cancelados", async () => {
  await validarLimitesPedido(banco({ limiteFretesEmpresaDia: 4 }, { fretes: 3 }), pedido)
  const tx = banco({ limiteFretesEmpresaDia: 4 }, { fretes: 4 })
  await assert.rejects(validarLimitesPedido(tx, pedido), /4 registrados, limite 4/)
  assert.equal(tx.consultas[0].where.responsavelFrete, "EMPRESA")
  assert.equal(tx.consultas[0].where.status.not, "CANCELADO")
  assert.equal(tx.consultas[0].where.dataEntrega.gte.toISOString(), "2026-09-18T00:00:00.000Z")
  await validarLimitesPedido(tx, { ...pedido, responsavelFrete: "CLIENTE" })
  await validarLimitesPedido(tx, { ...pedido, tipoEntrega: "CLIENTE_RETIRA" })
  await assert.rejects(validarLimitesPedido(banco({ limiteFretesClienteDia: 0 }), { ...pedido, responsavelFrete: "CLIENTE" }), /do cliente/)
})

test("edição na mesma vaga não bloqueia, troca de dia/responsável e reativação validam", async () => {
  const tx = banco({ limiteFretesEmpresaDia: 0, limiteFretesClienteDia: 0 })
  await validarLimitesPedido(tx, pedido, pedido)
  await assert.rejects(validarLimitesPedido(tx, { ...pedido, dataEntrega: new Date("2026-09-19") }, pedido), /Limite de fretes/)
  await assert.rejects(validarLimitesPedido(tx, { ...pedido, responsavelFrete: "CLIENTE" }, pedido), /Limite de fretes/)
  await assert.rejects(validarLimitesPedido(tx, pedido, { ...pedido, status: "CANCELADO" }), /Limite de fretes/)
  await validarLimitesPedido(tx, { ...pedido, status: "CANCELADO" }, pedido)
})

test("chapas aceitam valor exato e bloqueiam excesso, pedido sem planos e reagendamento", async () => {
  const tx = banco({ limiteChapasDia: 90 }, { chapas: 80, proprias: 10 })
  await validarLimitesPedido(tx, pedido)
  await assert.rejects(validarLimitesPedido(tx, pedido, null, 11), /80 em outros pedidos \+ 11/)
  assert.equal(tx.consultas.at(-1).where.pedido.tipoPedido, "COM_PRODUCAO")
  assert.equal(tx.consultas.at(-1).where.pedido.id.not, "p1")
  await assert.rejects(validarLimitesPedido(banco({ limiteChapasDia: 90 }, { chapas: 90 }), { ...pedido, id: undefined }), /Limite de chapas/)
  await assert.rejects(validarLimitesPedido(tx, { ...pedido, dataEntrega: new Date("2026-09-19") }, pedido, 11), /Limite de chapas/)
  await validarLimitesPedido(tx, { ...pedido, tipoPedido: "DIRETO_ENTREGA" })
})

test("redução e alteração sem aumento continuam possíveis após baixar limite", async () => {
  const tx = banco({ limiteChapasDia: 20 }, { chapas: 90, proprias: 10 })
  await validarLimitesPedido(tx, pedido, pedido, 10)
  await validarLimitesPedido(tx, pedido, pedido, 9)
  await assert.rejects(validarLimitesPedido(tx, pedido, pedido, 11), /Limite de chapas/)
})

test("data obrigatória quando limite aplicável está ativo; nulo desativa", async () => {
  await assert.rejects(validarLimitesPedido(banco({ limiteChapasDia: 90 }), { ...pedido, dataEntrega: null }), /Informe a data/)
  await validarLimitesPedido(banco({ limiteChapasDia: null, limiteFretesEmpresaDia: null }), { ...pedido, dataEntrega: null })
})

test("plano considera soma dos outros planos e impede excesso", async () => {
  const tx = banco({ limiteChapasDia: 90 }, { chapas: 80, proprias: 5 })
  await validarLimitesPlano(tx, "p1", 5, "plano1")
  assert.equal(tx.consultas[0].where.id.not, "plano1")
  await assert.rejects(validarLimitesPlano(tx, "p1", 6, "plano1"), /Limite de chapas/)
  tx.pedido.findUnique = async () => ({ ...pedido, status: "CANCELADO" })
  await assert.rejects(validarLimitesPlano(tx, "p1", 1), /não permite/)
})

test("transação adquire lock antes de ler e não grava quando excede", async () => {
  const eventos = []
  const tx = banco({ limiteFretesEmpresaDia: 0 })
  tx.$queryRaw = async () => eventos.push("lock")
  tx.configuracaoEmpresa.findFirst = async () => { eventos.push("leitura"); return { limiteFretesEmpresaDia: 0 } }
  tx.pedido.create = async () => assert.fail("não deve gravar")
  const prisma = { $transaction: async (callback, options) => {
    assert.equal(options.isolationLevel, "ReadCommitted")
    return callback(tx)
  } }
  await assert.rejects(salvarPedidoComLimites(prisma, "create", { data: pedido }), /Limite de fretes/)
  assert.deepEqual(eventos, ["lock", "leitura"])
})
