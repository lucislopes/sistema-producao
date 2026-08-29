import test from "node:test"
import assert from "node:assert/strict"
import { montarConsultaPedidos } from "../src/utils/pedidosQuery.js"

test("aplica paginação padrão e limita o máximo a cem registros", () => {
  assert.deepEqual(montarConsultaPedidos({}), {
    page: 1,
    limit: 50,
    skip: 0,
    where: {}
  })

  const consulta = montarConsultaPedidos({ page: "3", limit: "500" })
  assert.equal(consulta.page, 3)
  assert.equal(consulta.limit, 100)
  assert.equal(consulta.skip, 200)
})

test("monta busca textual antes da paginação para encontrar clientes em qualquer página", () => {
  const consulta = montarConsultaPedidos({ busca: "  Jonas  ", page: "2", limit: "25" })

  assert.equal(consulta.skip, 25)
  assert.equal(consulta.where.OR.length, 3)
  assert.deepEqual(consulta.where.OR[1], {
    cliente: { nome: { contains: "Jonas", mode: "insensitive" } }
  })
})

test("inclui número interno quando a busca é numérica", () => {
  const consulta = montarConsultaPedidos({ busca: "#123" })
  assert.deepEqual(consulta.where.OR.at(-1), { numeroPedido: 123 })
})

test("combina status, vendedor, frete e intervalo inclusivo de datas", () => {
  const consulta = montarConsultaPedidos({
    status: "EM_PRODUCAO",
    vendedorId: "vendedor-1",
    frete: "ALTERADO",
    dataInicio: "2026-08-01",
    dataFim: "2026-08-31"
  })

  assert.equal(consulta.where.status, "EM_PRODUCAO")
  assert.equal(consulta.where.vendedorId, "vendedor-1")
  assert.equal(consulta.where.freteAlterado, true)
  assert.equal(consulta.where.dataEntrega.gte.toISOString(), "2026-08-01T00:00:00.000Z")
  assert.equal(consulta.where.dataEntrega.lt.toISOString(), "2026-09-01T00:00:00.000Z")
})
