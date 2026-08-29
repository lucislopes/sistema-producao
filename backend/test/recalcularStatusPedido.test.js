import test from "node:test"
import assert from "node:assert/strict"
import { determinarStatusPedido } from "../src/utils/recalcularStatusPedido.js"

test("mantém estados finais sem recalcular", () => {
  for (const status of ["SAIU_ENTREGA", "ENTREGUE", "CANCELADO"]) {
    assert.equal(determinarStatusPedido({ status }, [{ status: "ABERTO" }]), null)
  }
})

test("preserva pronto para entrega por padrão", () => {
  assert.equal(
    determinarStatusPedido({ status: "PRONTO_ENTREGA" }, [{ status: "ABERTO" }]),
    null
  )
})

test("permite reabrir pronto para entrega quando explicitamente autorizado", () => {
  assert.equal(
    determinarStatusPedido(
      { status: "PRONTO_ENTREGA" },
      [{ status: "ABERTO" }],
      { permitirReabrirExpedicao: true }
    ),
    "EM_PRODUCAO"
  )
})

test("pedido sem serviços fica em separação", () => {
  assert.equal(determinarStatusPedido({ status: "ABERTO" }, []), "EM_SEPARACAO")
})

test("pedido com serviço aberto ou iniciado fica em produção", () => {
  assert.equal(
    determinarStatusPedido({ status: "EM_SEPARACAO" }, [
      { status: "CONCLUIDO" },
      { status: "INICIADO" }
    ]),
    "EM_PRODUCAO"
  )
})

test("pedido só fica pronto quando todos os serviços estão concluídos", () => {
  assert.equal(
    determinarStatusPedido({ status: "EM_PRODUCAO" }, [
      { status: "CONCLUIDO" },
      { status: "CONCLUIDO" }
    ]),
    "PRONTO_ENTREGA"
  )
})
