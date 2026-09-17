import test from "node:test"
import assert from "node:assert/strict"
import { prisma } from "../src/lib/prisma.js"
import { relatorioPedidosEntregues } from "../src/controllers/relatorioPedidosEntregues.controller.js"

function substituir(t, alvo, metodo, implementacao) {
  const original = alvo[metodo]
  alvo[metodo] = implementacao
  t.after(() => { alvo[metodo] = original })
}

test("inclui retiradas e os dois fretes e totaliza além da página", async (t) => {
  const registros = [
    { tipoEntrega: "CLIENTE_RETIRA", responsavelFrete: "CLIENTE" },
    { tipoEntrega: "ENTREGA_EMPRESA", responsavelFrete: "EMPRESA" },
    { tipoEntrega: "ENTREGA_EMPRESA", responsavelFrete: "CLIENTE" },
    { tipoEntrega: "ENTREGA_EMPRESA", responsavelFrete: null }
  ].map(pedido => ({ ...pedido, historicos: [], valorTotal: 10 }))
  substituir(t, prisma.pedido, "findMany", async (args) => {
    assert.equal(args.where.status, "ENTREGUE")
    assert.equal(args.where.tipoEntrega, undefined)
    if (args.select) {
      assert.equal(args.select.tipoEntrega, true)
      assert.equal(args.select.responsavelFrete, true)
      return registros
    }
    return registros.slice(0, 1)
  })
  substituir(t, prisma.pedido, "count", async () => registros.length)
  let resposta
  await relatorioPedidosEntregues({ query: { limit: 1 } }, { json: data => { resposta = data } })
  assert.equal(resposta.dados.length, 1)
  assert.equal(resposta.resumo.total, 4)
  for (const campo of ["clienteRetira", "freteLoja", "freteCliente", "freteNaoInformado"]) {
    assert.equal(resposta.resumo[campo], 1)
  }
  assert.equal(resposta.resumo.semRegistro, 4)
})

test("filtro de retirada não exige responsável de frete", async (t) => {
  substituir(t, prisma.pedido, "findMany", async ({ where }) => {
    assert.equal(where.tipoEntrega, "CLIENTE_RETIRA")
    assert.equal(where.responsavelFrete, undefined)
    return []
  })
  substituir(t, prisma.pedido, "count", async () => 0)
  await relatorioPedidosEntregues({ query: { responsavelFrete: "CLIENTE_RETIRA" } }, { json: data => data })
})

