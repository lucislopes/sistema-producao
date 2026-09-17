import test from "node:test"
import assert from "node:assert/strict"
import { consultarCapacidadeDiaria } from "../src/utils/capacidadeDiaria.js"

function banco(config) {
  const consultas = []
  return {
    consultas,
    configuracaoEmpresa: { findFirst: async () => config },
    pedido: { count: async ({ where }) => {
      consultas.push(where)
      return where.responsavelFrete === "EMPRESA" ? 3 : 4
    } },
    planoCorte: { aggregate: async ({ where }) => {
      consultas.push(where.pedido)
      return { _sum: { quantidadeChapas: 85 } }
    } }
  }
}

test("capacidade separa modalidades e usa os mesmos critérios da programação", async () => {
  const db = banco({ limiteFretesEmpresaDia: 4, limiteFretesClienteDia: 4, limiteChapasDia: 90 })
  const resultado = await consultarCapacidadeDiaria(db, "2026-09-18")
  assert.deepEqual(resultado.freteEmpresa, { limite: 4, utilizado: 3, disponivel: 1, excedente: 0 })
  assert.deepEqual(resultado.freteCliente, { limite: 4, utilizado: 4, disponivel: 0, excedente: 0 })
  assert.deepEqual(resultado.chapas, { limite: 90, utilizado: 85, disponivel: 5, excedente: 0 })
  for (const where of db.consultas) {
    assert.equal(where.status.not, "CANCELADO")
    assert.equal(where.dataEntrega.gte.toISOString(), "2026-09-18T00:00:00.000Z")
    assert.equal(where.dataEntrega.lt.toISOString(), "2026-09-19T00:00:00.000Z")
  }
  assert.equal(db.consultas[0].tipoEntrega, "ENTREGA_EMPRESA")
  assert.equal(db.consultas[2].tipoPedido, "COM_PRODUCAO")
})

test("distingue limite desativado, zero e ocupação acima do limite", async () => {
  const resultado = await consultarCapacidadeDiaria(banco({ limiteFretesEmpresaDia: null, limiteFretesClienteDia: 0, limiteChapasDia: 80 }), "2026-09-18")
  assert.equal(resultado.freteEmpresa.disponivel, null)
  assert.equal(resultado.freteCliente.disponivel, 0)
  assert.equal(resultado.chapas.excedente, 5)
  assert.equal(resultado.chapas.disponivel, 0)
  assert.equal((await consultarCapacidadeDiaria(banco(null), "2026-09-18")).chapas.limite, null)
})

test("rejeita datas inválidas antes de consultar o banco", async () => {
  for (const data of [undefined, "", "2026-02-30", "2026-13-01", "18/09/2026", ["2026-09-18"]]) {
    await assert.rejects(consultarCapacidadeDiaria({}, data), error => error.statusCode === 400)
  }
})
