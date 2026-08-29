import test from "node:test"
import assert from "node:assert/strict"
import { limitarLogin, limparTentativasLogin, securityHeaders } from "../src/middlewares/security.middleware.js"

function criarResposta() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(nome, valor) {
      this.headers[nome] = valor
    },
    status(codigo) {
      this.statusCode = codigo
      return this
    },
    json(body) {
      this.body = body
      return this
    }
  }
}

test("securityHeaders adiciona proteções sem bloquear a requisição", () => {
  const res = criarResposta()
  let chamouNext = false

  securityHeaders({}, res, () => { chamouNext = true })

  assert.equal(chamouNext, true)
  assert.equal(res.headers["X-Content-Type-Options"], "nosniff")
  assert.equal(res.headers["X-Frame-Options"], "DENY")
})

test("limitarLogin bloqueia após dez tentativas e permite após limpeza", () => {
  const req = { ip: "ip-teste-isolado" }

  for (let tentativa = 0; tentativa < 10; tentativa += 1) {
    const res = criarResposta()
    let liberou = false
    limitarLogin(req, res, () => { liberou = true })
    assert.equal(liberou, true)
  }

  const bloqueada = criarResposta()
  limitarLogin(req, bloqueada, () => {})
  assert.equal(bloqueada.statusCode, 429)

  limparTentativasLogin(req)
  const liberada = criarResposta()
  let chamouNext = false
  limitarLogin(req, liberada, () => { chamouNext = true })
  assert.equal(chamouNext, true)
  limparTentativasLogin(req)
})
