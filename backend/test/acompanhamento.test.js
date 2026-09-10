import test from "node:test"
import assert from "node:assert/strict"
import { consultaPublica, documentoConfere, resumoPublico, criarConsultaAcompanhamento, criarLimitadorConsulta } from "../src/utils/acompanhamento.js"

function resposta() {
  return { codigo: 200, headers: {}, setHeader(k, v) { this.headers[k] = v }, status(codigo) { this.codigo = codigo; return this }, json(body) { this.body = body; return this } }
}

test("aceita CPF/CNPJ formatados e zeros iniciais, rejeita documento ausente ou prefixo errado", () => {
  assert.equal(documentoConfere("012.345.678-90", "01234"), true)
  assert.equal(documentoConfere("01.234.567/0001-89", "01234"), true)
  for (const documento of [null, "", "01234", "112.345.678-90"]) assert.equal(documentoConfere(documento, "01234"), false)
  assert.equal(documentoConfere("012.345.678-90", "012"), false)
})

test("busca exata por número interno/manual e valida os tipos recebidos", () => {
  assert.deepEqual(consultaPublica({ numero: "#123", documento: "01234" }).OR, [
    { origemPedido: "EXTERNO", numeroPedidoManual: "123" }, { numeroPedido: 123, origemPedido: "INTERNO" }
  ])
  assert.equal(consultaPublica({ numero: {}, documento: "01234" }), null)
  assert.equal(consultaPublica({ numero: "123", documento: "123" }), null)
  assert.equal(consultaPublica({ pedidoId: "invalido", numero: "123", documento: "01234" }), null)
  assert.equal(consultaPublica({ numero: "999999999999", documento: "01234" }).OR.length, 1)
})

test("retorno público preserva todos os eventos e descrições sem expor cadastros ou credenciais", () => {
  const resultado = resumoPublico({ numeroPedido: 1, origemPedido: "INTERNO", status: "EM_PRODUCAO", cliente: { documento: "segredo" }, observacoes: "segredo", historicos: [
    { tipo: "PLANO_EXCLUIDO", descricao: "Plano excluído", usuario: { senha: "credencial", funcionario: { nome: "Ana" } } },
    { tipo: "STATUS_PEDIDO_ALTERADO", descricao: "Status alterado de ABERTO para EM_PRODUCAO", createdAt: "2026-09-09" },
    { tipo: "EXPEDICAO_ATUALIZADA", descricao: "Expedição: status alterado de SAIU_ENTREGA para ENTREGUE" },
    { tipo: "STATUS_SERVICO_ALTERADO", descricao: "Serviço segredo: status alterado de INICIADO para CONCLUIDO" },
    { tipo: "STATUS_PEDIDO_ALTERADO", descricao: "segredo" }
  ] })
  assert.equal(resultado.historico.length, 5)
  assert.equal(resultado.historico[0].usuario, "Ana")
  assert.equal(resultado.historico[0].tipo, "PLANO_EXCLUIDO")
  assert.equal(resultado.historico[2].descricao, "Expedição: status alterado de SAIU_ENTREGA para ENTREGUE")
  assert.equal(resultado.historico[3].descricao, "Serviço segredo: status alterado de INICIADO para CONCLUIDO")
  assert.equal(resultado.historico[4].descricao, "segredo")
  assert.equal(resultado.historico[4].usuario, null)
  assert.equal("cliente" in resultado, false)
  assert.equal("observacoes" in resultado, false)
  assert.equal(JSON.stringify(resultado).includes("credencial"), false)
})

test("não lê histórico antes da conferência e usa a mesma resposta para falhas", async () => {
  for (const candidatos of [[], [{ id: "a", cliente: { documento: "99999999999" } }], [{ id: "a", cliente: { documento: null } }]]) {
    const handler = criarConsultaAcompanhamento({ pedido: { findMany: async () => candidatos, findUnique: () => assert.fail("Consulta indevida") } })
    const res = resposta()
    await handler({ body: { numero: "123", documento: "01234" } }, res)
    assert.equal(res.codigo, 404)
    assert.equal(res.body.error, "Não foi possível localizar o pedido com os dados informados.")
  }
})

test("consulta correta usa somente findMany/findUnique e não devolve documento", async () => {
  const handler = criarConsultaAcompanhamento({ pedido: {
    findMany: async () => [{ id: "a", cliente: { documento: "01234567890" } }],
    findUnique: async ({ where, select }) => {
      assert.deepEqual(where, { id: "a" })
      assert.equal(select.historicos.where, undefined)
      assert.equal(select.historicos.take, undefined)
      assert.deepEqual(select.historicos.orderBy, { createdAt: "desc" })
      return { numeroPedido: 123, origemPedido: "INTERNO", status: "ABERTO", historicos: [] }
    }
  } })
  const res = resposta()
  await handler({ body: { numero: "123", documento: "01234" } }, res)
  assert.equal(res.codigo, 200)
  assert.equal(res.body.numero, "123")
  assert.equal(JSON.stringify(res.body).includes("01234"), false)
})

test("pedido ambíguo não libera histórico", async () => {
  const candidato = { id: "a", cliente: { documento: "01234567890" } }
  const handler = criarConsultaAcompanhamento({ pedido: { findMany: async () => [candidato, candidato], findUnique: () => assert.fail("Ambiguidade") } })
  const res = resposta()
  await handler({ body: { numero: "123", documento: "01234" } }, res)
  assert.equal(res.codigo, 404)
})

test("limita tentativas por IP e pedido, expira a janela e limita memória", () => {
  let tempo = 0
  const limitar = criarLimitadorConsulta({ agora: () => tempo, limite: 2 })
  const req = { ip: "1", body: { numero: "123", documento: "01234" } }
  let chamadas = 0
  limitar(req, resposta(), () => chamadas++)
  limitar(req, resposta(), () => chamadas++)
  const bloqueada = resposta()
  limitar({ ...req, ip: "2" }, bloqueada, () => assert.fail("Limite por pedido"))
  assert.equal(bloqueada.codigo, 429)
  tempo = 900001
  limitar(req, resposta(), () => chamadas++)
  assert.equal(chamadas, 3)
  const lotado = criarLimitadorConsulta({ capacidade: 1 })
  const res = resposta()
  lotado(req, res, () => assert.fail("Capacidade excedida"))
  assert.equal(res.codigo, 429)
})
