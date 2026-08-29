import test from "node:test"
import assert from "node:assert/strict"
import { calcularDiasSemComprar, consolidarRelatorioClientes } from "../src/utils/relatorioClientes.js"

const clienteA = { id: "a", nome: "Cliente A", telefone: "111" }
const clienteB = { id: "b", nome: "Cliente B", telefone: null }

test("calcula dias desde a última compra por dias de calendário", () => {
  assert.equal(calcularDiasSemComprar("2026-08-20T18:00:00", new Date("2026-08-29T08:00:00")), 9)
  assert.equal(calcularDiasSemComprar(null), null)
})

test("consolida compras sem somar pedidos cancelados ao faturamento", () => {
  const resultado = consolidarRelatorioClientes([
    { cliente: clienteA, status: "ENTREGUE", valorTotal: "100.50", dataEntrega: "2026-08-20" },
    { cliente: clienteA, status: "EM_PRODUCAO", valorTotal: 49.5, dataEntrega: "2026-08-28" },
    { cliente: clienteA, status: "CANCELADO", valorTotal: 999, dataEntrega: null },
    { cliente: clienteB, status: "ABERTO", valorTotal: null, dataEntrega: "2026-09-05" }
  ], {
    ultimosPedidos: { a: "2026-08-20", b: "2026-08-25" },
    dataReferencia: new Date("2026-08-29")
  })

  const a = resultado.dados.find((item) => item.clienteId === "a")
  assert.equal(a.totalPedidos, 3)
  assert.equal(a.pedidosValidos, 2)
  assert.equal(a.valorComprado, 150)
  assert.equal(a.ticketMedio, 75)
  assert.equal(a.cancelados, 1)
  assert.equal(a.ativos, 1)
  assert.equal(a.atrasadosAtuais, 1)
  assert.equal(resultado.resumo.valorTotal, 150)
})

test("filtra clientes pela inatividade e ordena por valor comprado", () => {
  const resultado = consolidarRelatorioClientes([
    { cliente: clienteA, status: "ENTREGUE", valorTotal: 100, dataEntrega: null },
    { cliente: clienteB, status: "ENTREGUE", valorTotal: 300, dataEntrega: null }
  ], {
    ultimosPedidos: { a: "2026-06-01", b: "2026-08-20" },
    minimoDiasSemComprar: 30,
    dataReferencia: new Date("2026-08-29")
  })

  assert.deepEqual(resultado.dados.map((item) => item.clienteId), ["a"])
})
