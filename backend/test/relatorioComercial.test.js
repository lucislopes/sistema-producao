import test from "node:test"
import assert from "node:assert/strict"
import { consolidarRelatorioComercial } from "../src/utils/relatorioComercial.js"

const vendedor = { id: "v1", nome: "Ana" }

test("consolida vendas sem somar pedidos cancelados", () => {
  const resultado = consolidarRelatorioComercial([
    { vendedor, status: "ENTREGUE", valorTotal: 100, dataEntrega: "2026-08-10" },
    { vendedor, status: "CANCELADO", valorTotal: 500, dataEntrega: "2026-08-11" }
  ], new Date(2026, 7, 29))

  assert.equal(resultado.resumo.totalPedidos, 2)
  assert.equal(resultado.resumo.valorVendido, 100)
  assert.equal(resultado.resumo.ticketMedio, 100)
  assert.equal(resultado.dados[0].cancelados, 1)
})

test("identifica somente pedidos ativos vencidos como atrasados", () => {
  const resultado = consolidarRelatorioComercial([
    { vendedor, status: "EM_PRODUCAO", valorTotal: 200, dataEntrega: "2026-08-20" },
    { vendedor, status: "ENTREGUE", valorTotal: 300, dataEntrega: "2026-08-20" },
    { vendedor, status: "ABERTO", valorTotal: 50, dataEntrega: "2026-09-10" }
  ], new Date(2026, 7, 29))

  assert.equal(resultado.resumo.atrasados, 1)
  assert.equal(resultado.resumo.emAndamento, 2)
})

test("ordena vendedores pelo valor vendido", () => {
  const resultado = consolidarRelatorioComercial([
    { vendedor: { id: "v1", nome: "Ana" }, status: "ENTREGUE", valorTotal: 100 },
    { vendedor: { id: "v2", nome: "Bruno" }, status: "ENTREGUE", valorTotal: 250 }
  ])

  assert.equal(resultado.dados[0].vendedor, "Bruno")
})
