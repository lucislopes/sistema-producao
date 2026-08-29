import test from "node:test"
import assert from "node:assert/strict"
import { calcularDiasParaEntrega, classificarPrevisaoEntrega, consolidarCarteiraPedidos } from "../src/utils/relatorioCarteiraPedidos.js"

test("calcula dias para entrega por dia de calendário", () => {
  assert.equal(calcularDiasParaEntrega("2026-09-02T00:00:00", new Date("2026-08-29T20:00:00")), 4)
  assert.equal(calcularDiasParaEntrega(null), null)
})

test("classifica a urgência da previsão", () => {
  assert.equal(classificarPrevisaoEntrega(-1), "ATRASADO")
  assert.equal(classificarPrevisaoEntrega(0), "HOJE")
  assert.equal(classificarPrevisaoEntrega(7), "PROXIMOS_7_DIAS")
  assert.equal(classificarPrevisaoEntrega(8), "FUTURO")
  assert.equal(classificarPrevisaoEntrega(null), "SEM_PREVISAO")
})

test("consolida valores e ordena os pedidos mais urgentes primeiro", () => {
  const resultado = consolidarCarteiraPedidos([
    { id: "futuro", status: "ABERTO", valorTotal: "200", dataEntrega: "2026-09-20" },
    { id: "sem-data", status: "EM_PRODUCAO", valorTotal: 50, dataEntrega: null },
    { id: "atrasado", status: "EM_PRODUCAO", valorTotal: 100, dataEntrega: "2026-08-20" },
    { id: "proximo", status: "PRONTO_ENTREGA", valorTotal: 300, dataEntrega: "2026-09-02" }
  ], { dataReferencia: new Date("2026-08-29") })

  assert.deepEqual(resultado.dados.map((item) => item.id), ["atrasado", "proximo", "futuro", "sem-data"])
  assert.equal(resultado.resumo.valorCarteira, 650)
  assert.equal(resultado.resumo.pedidosAtrasados, 1)
  assert.equal(resultado.resumo.valorAtrasado, 100)
  assert.equal(resultado.resumo.proximosSeteDias, 1)
  assert.equal(resultado.resumo.semPrevisao, 1)
  assert.deepEqual(resultado.porStatus.find((item) => item.status === "EM_PRODUCAO"), { status: "EM_PRODUCAO", pedidos: 2, valor: 150 })
})
