import test from "node:test"
import assert from "node:assert/strict"
import { consolidarAuditoriaCadastro, identificarInconsistencias } from "../src/utils/relatorioAuditoriaCadastro.js"

test("não exige dados de expedição quando o cliente retira", () => {
  const tipos = identificarInconsistencias({
    valorTotal: 100,
    dataEntrega: "2026-09-01",
    tipoEntrega: "CLIENTE_RETIRA",
    cliente: { telefone: "61999999999" }
  }).map((item) => item.tipo)
  assert.deepEqual(tipos, [])
})

test("identifica os campos obrigatórios ausentes na entrega da empresa", () => {
  const tipos = identificarInconsistencias({
    valorTotal: 0,
    dataEntrega: null,
    tipoEntrega: "ENTREGA_EMPRESA",
    rotaId: null,
    enderecoEntrega: " ",
    nomeRecebedor: null,
    contatoRecebedor: "",
    cliente: { telefone: null }
  }).map((item) => item.tipo)

  assert.deepEqual(tipos, ["SEM_VALOR", "SEM_DATA_ENTREGA", "ENTREGA_SEM_ROTA", "ENTREGA_SEM_ENDERECO", "ENTREGA_SEM_RECEBEDOR", "ENTREGA_SEM_CONTATO", "CLIENTE_SEM_TELEFONE"])
})

test("resume, filtra e prioriza pedidos críticos", () => {
  const resultado = consolidarAuditoriaCadastro([
    { id: "ok", valorTotal: 100, dataEntrega: "2026-09-01", tipoEntrega: "CLIENTE_RETIRA", cliente: { telefone: "1" } },
    { id: "info", valorTotal: 100, dataEntrega: "2026-09-01", tipoEntrega: "CLIENTE_RETIRA", cliente: { telefone: null } },
    { id: "critico", valorTotal: null, dataEntrega: "2026-09-01", tipoEntrega: "CLIENTE_RETIRA", cliente: { telefone: "1" } }
  ])

  assert.deepEqual(resultado.dados.map((item) => item.id), ["critico", "info"])
  assert.equal(resultado.resumo.pedidosAuditados, 3)
  assert.equal(resultado.resumo.pedidosComInconsistencia, 2)
  assert.equal(resultado.resumo.criticos, 1)
  assert.equal(resultado.resumo.semValor, 1)

  const filtrado = consolidarAuditoriaCadastro(resultado.dados, { tipo: "CLIENTE_SEM_TELEFONE" })
  assert.deepEqual(filtrado.dados.map((item) => item.id), ["info"])
})
