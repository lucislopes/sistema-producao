import test from "node:test"
import assert from "node:assert/strict"
import { consolidarModoTV } from "../src/utils/modoTV.js"

function servico({ id, status, pedidoStatus, entrega, plano = "p1", chapas = 10, operadorId = null, dataFim = null }) {
  return {
    id, status, operadorId, dataFim,
    tipoServico: { nome: "Corte" },
    operador: operadorId ? { nome: "Operador" } : null,
    plano: {
      id: plano, numeroPlano: plano, quantidadeChapas: chapas,
      pedido: { id: `pedido-${plano}`, numeroPedido: 1, origemPedido: "INTERNO", status: pedidoStatus, dataEntrega: entrega, cliente: { nome: "Cliente" } }
    }
  }
}

test("não duplica pedidos nem chapas quando um plano possui vários serviços", () => {
  const resultado = consolidarModoTV([
    servico({ id: "s1", status: "ABERTO", pedidoStatus: "EM_PRODUCAO", entrega: "2026-08-28", plano: "p1", chapas: 12 }),
    servico({ id: "s2", status: "INICIADO", pedidoStatus: "EM_PRODUCAO", entrega: "2026-08-28", plano: "p1", chapas: 12, operadorId: "o1" })
  ], { dataReferencia: new Date("2026-08-29") })

  assert.equal(resultado.resumo.pedidosProducao, 1)
  assert.equal(resultado.resumo.pedidosAtrasados, 1)
  assert.equal(resultado.resumo.chapasAtivas, 12)
  assert.equal(resultado.resumo.operadoresAtivos, 1)
})

test("prioriza atrasados e serviços iniciados na fila", () => {
  const resultado = consolidarModoTV([
    servico({ id: "futuro", status: "ABERTO", pedidoStatus: "EM_SEPARACAO", entrega: "2026-09-10", plano: "p3" }),
    servico({ id: "aberto", status: "ABERTO", pedidoStatus: "EM_PRODUCAO", entrega: "2026-08-28", plano: "p2" }),
    servico({ id: "iniciado", status: "INICIADO", pedidoStatus: "EM_PRODUCAO", entrega: "2026-08-28", plano: "p1", operadorId: "o1" })
  ], { dataReferencia: new Date("2026-08-29") })

  assert.deepEqual(resultado.fila.map((item) => item.id), ["iniciado", "aberto", "futuro"])
})

test("conta serviços concluídos apenas no dia atual", () => {
  const resultado = consolidarModoTV([
    servico({ id: "hoje", status: "CONCLUIDO", pedidoStatus: "PRONTO_ENTREGA", entrega: "2026-09-01", dataFim: "2026-08-29T18:00:00" }),
    servico({ id: "ontem", status: "CONCLUIDO", pedidoStatus: "PRONTO_ENTREGA", entrega: "2026-09-01", plano: "p2", dataFim: "2026-08-28T18:00:00" })
  ], { dataReferencia: new Date("2026-08-29T08:00:00") })
  assert.equal(resultado.resumo.concluidosHoje, 1)
  assert.equal(resultado.resumo.pedidosProntos, 2)
})

test("resume todos os pedidos ativos mesmo quando não possuem serviços", () => {
  const resultado = consolidarModoTV([], {
    dataReferencia: new Date("2026-08-29"),
    pedidosAtivos: [
      { id: "direto", status: "PRONTO_ENTREGA", dataEntrega: "2026-08-20" },
      { id: "aberto", status: "EM_SEPARACAO", dataEntrega: "2026-09-10" }
    ]
  })
  assert.equal(resultado.resumo.pedidosProntos, 1)
  assert.equal(resultado.resumo.pedidosSeparacao, 1)
  assert.equal(resultado.resumo.pedidosAtrasados, 1)
})
