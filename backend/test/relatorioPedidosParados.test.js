import test from "node:test"
import assert from "node:assert/strict"
import { calcularDiasSemMudanca, classificarParalisacao, consolidarPedidosParados } from "../src/utils/relatorioPedidosParados.js"

test("calcula dias corridos sem mudança de status", () => {
  assert.equal(calcularDiasSemMudanca("2026-08-20T10:00:00", new Date("2026-08-29T18:00:00")), 9)
})

test("classifica níveis de atenção pelos dias", () => {
  assert.equal(classificarParalisacao(2), "RECENTE")
  assert.equal(classificarParalisacao(3), "ATENCAO")
  assert.equal(classificarParalisacao(7), "ALTO")
  assert.equal(classificarParalisacao(15), "CRITICO")
})

test("filtra pelo mínimo e ordena o maior tempo primeiro", () => {
  const resultado = consolidarPedidosParados([
    { id: "a", dataUltimaMudancaStatus: "2026-08-27" },
    { id: "b", dataUltimaMudancaStatus: "2026-08-10" },
    { id: "c", dataUltimaMudancaStatus: "2026-08-20" }
  ], { minimoDias: 3, dataReferencia: new Date("2026-08-29") })

  assert.deepEqual(resultado.dados.map((item) => item.id), ["b", "c"])
  assert.equal(resultado.resumo.critico, 1)
  assert.equal(resultado.resumo.alto, 1)
})
