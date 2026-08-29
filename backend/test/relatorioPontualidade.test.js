import test from "node:test"
import assert from "node:assert/strict"
import { classificarEntrega, consolidarPontualidade } from "../src/utils/relatorioPontualidade.js"

test("classifica entrega antecipada ou na data como no prazo", () => {
  assert.equal(classificarEntrega({ dataEntrega: "2026-08-20", dataEntregaReal: "2026-08-19" }).situacao, "NO_PRAZO")
  assert.equal(classificarEntrega({ dataEntrega: "2026-08-20", dataEntregaReal: "2026-08-20" }).situacao, "NO_PRAZO")
})

test("calcula dias de atraso da entrega", () => {
  const resultado = classificarEntrega({ dataEntrega: "2026-08-20", dataEntregaReal: "2026-08-23" })
  assert.equal(resultado.situacao, "COM_ATRASO")
  assert.equal(resultado.diasDiferenca, 3)
})

test("não inventa pontualidade quando falta histórico ou previsão", () => {
  assert.equal(classificarEntrega({ dataEntrega: "2026-08-20" }).situacao, "SEM_REGISTRO_ENTREGA")
  assert.equal(classificarEntrega({ dataEntregaReal: "2026-08-20" }).situacao, "SEM_DATA_PREVISTA")
})

test("consolida percentual e média de atraso somente com entregas avaliáveis", () => {
  const resultado = consolidarPontualidade([
    { dataEntrega: "2026-08-20", dataEntregaReal: "2026-08-20" },
    { dataEntrega: "2026-08-20", dataEntregaReal: "2026-08-24" },
    { dataEntrega: "2026-08-20", dataEntregaReal: null }
  ])

  assert.equal(resultado.resumo.avaliados, 2)
  assert.equal(resultado.resumo.percentualNoPrazo, 50)
  assert.equal(resultado.resumo.mediaDiasAtraso, 4)
  assert.equal(resultado.resumo.semRegistro, 1)
})
